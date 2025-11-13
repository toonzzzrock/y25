"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NotificationVariant = "success" | "error" | "info";

type FormErrors = {
  gameName?: string;
  updateTitle?: string;
  updateDescription?: string;
  fileName?: string;
  versionFiles?: string;
};

interface EditGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payload: {
    id: number;
    title: string;
    patchNumber: string;
    linkToFile: string;
    updateTitle: string;
    updateDescription: string;
  }) => void;
  game: {
    id: number;
    title: string;
    description: string | null;
  } | null;
  showNotification: (message: string, type: NotificationVariant) => void;
}

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: "#2a2a2a",
  borderRadius: "12px",
  padding: "2rem",
  maxWidth: "720px",
  width: "95vw",
  maxHeight: "90vh",
  overflowY: "auto",
  border: "2px solid #ff5722",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#e6e0db",
  fontSize: "0.9rem",
  marginBottom: "0.5rem",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  backgroundColor: "#1a1a1a",
  border: "1px solid #444",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "1rem",
};

const requiredAsteriskStyle: React.CSSProperties = {
  color: "#ff6b6b",
  marginLeft: "0.25rem",
};

const errorTextStyle: React.CSSProperties = {
  color: "#ff6b6b",
  fontSize: "0.8rem",
  marginTop: "0.35rem",
  fontWeight: 500,
};

function sanitizeFolderName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizeFileName(value: string): string {
  const trimmed = value.trim().replace(/\\/g, "/");
  const segments = trimmed.split("/").filter(Boolean);
  return segments.join("/");
}

export default function EditGameModal({
  isOpen,
  onClose,
  onSuccess,
  game,
  showNotification,
}: EditGameModalProps) {
  const [gameName, setGameName] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [fileName, setFileName] = useState("index.html");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const versionFilesInputRef = useRef<HTMLInputElement | null>(null);
  const [versionFiles, setVersionFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen || !game) {
      return;
    }

    setGameName(game.title ?? "");
    setUpdateTitle("");
    setUpdateDescription("");
    setFileName("index.html");
    setSelectedFolder("");
    setVersionFiles([]);
    setFormErrors({});
    if (versionFilesInputRef.current) {
      versionFilesInputRef.current.value = "";
    }
  }, [isOpen, game?.id]);

  const linkPreview = useMemo(() => {
    if (!game || !selectedFolder || !fileName.trim()) {
      return "";
    }
    const folder = sanitizeFolderName(selectedFolder);
    const file = sanitizeFileName(fileName);
    if (!folder || !file) {
      return "";
    }
    return `/data/game/${game.id}/game_version/${folder}/${file}`;
  }, [game?.id, selectedFolder, fileName]);

  const uploadVersionFilesOnce = useCallback(async (): Promise<string | null> => {
    if (!game) {
      showNotification("Game context missing", "error");
      setFormErrors((previous) => ({
        ...previous,
        versionFiles: "Game context missing",
      }));
      return null;
    }
    if (versionFiles.length === 0) {
      showNotification("Choose a folder to upload for the new version", "error");
      setFormErrors((previous) => ({
        ...previous,
        versionFiles: "Select a folder to upload for this version",
      }));
      return null;
    }
    try {
      const formData = new FormData();
      versionFiles.forEach((file) => {
        const relativeName = (file as any).webkitRelativePath || file.name;
        formData.append("files", file, relativeName);
      });

      const response = await fetch(`/api/publisher/games/${game.id}/versions`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload version files");
      }

      const newFolder = typeof data?.folder === "string" ? data.folder : typeof data?.version === "string" ? data.version : "";
      if (!newFolder) {
        showNotification("Version uploaded but folder name was not returned", "info");
        setFormErrors((previous) => ({
          ...previous,
          versionFiles: "Version folder name missing. Please try again.",
        }));
        return null;
      }

      setSelectedFolder(newFolder);

      setVersionFiles([]);
      if (versionFilesInputRef.current) {
        versionFilesInputRef.current.value = "";
      }

      showNotification(data?.message || `New version ${newFolder} uploaded`, "success");
      setFormErrors((previous) => ({
        ...previous,
        versionFiles: undefined,
      }));

      return newFolder;
    } catch (error: any) {
      console.error("Version upload error:", error);
      showNotification(error?.message || "Failed to upload version files", "error");
      setFormErrors((previous) => ({
        ...previous,
        versionFiles: "Failed to upload version files",
      }));
      return null;
    }
  }, [game, showNotification, versionFiles, setFormErrors]);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setSelectedFolder("");
    setVersionFiles([]);
    setFormErrors({});
    if (versionFilesInputRef.current) {
      versionFilesInputRef.current.value = "";
    }
    onClose();
  }, [isSubmitting, onClose, setFormErrors]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!game) {
        showNotification("Game context missing", "error");
        return;
      }

      const name = gameName.trim();
      const title = updateTitle.trim();
      const detail = updateDescription.trim();
      const file = sanitizeFileName(fileName);

      const newErrors: FormErrors = {};

      if (!name) {
        newErrors.gameName = "Game name is required";
      }

      if (!title) {
        newErrors.updateTitle = "Update title is required";
      }

      if (!detail) {
        newErrors.updateDescription = "Update description is required";
      }

      if (!file) {
        newErrors.fileName = "Main file name is required";
      }

      if (versionFiles.length === 0 && !selectedFolder) {
        newErrors.versionFiles = "Select a folder to upload for this version";
      }

      const hasErrors = Object.values(newErrors).some(Boolean);
      if (hasErrors) {
        setFormErrors(newErrors);
        showNotification("Please fix the highlighted fields", "error");
        return;
      }

      setFormErrors({});

      setIsSubmitting(true);

      try {
        let folder = sanitizeFolderName(selectedFolder);

        if (!folder) {
          const uploadedFolder = await uploadVersionFilesOnce();
          if (!uploadedFolder) {
            setFormErrors((previous) => ({
              ...previous,
              versionFiles: "Unable to upload version files. Please try again.",
            }));
            setIsSubmitting(false);
            return;
          }
          folder = sanitizeFolderName(uploadedFolder);
        }

        if (!folder) {
          setFormErrors((previous) => ({
            ...previous,
            versionFiles: "Version folder could not be created",
          }));
          showNotification("Version upload failed. Please try again.", "error");
          setIsSubmitting(false);
          return;
        }

        const safeGameId = game.id;
        const fallbackLink = `/data/game/${safeGameId}/game_version/${folder}/${file}`;

        const response = await fetch(`/api/publisher/games/${safeGameId}/edit`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameName: name,
            updateTitle: title,
            updateDescription: detail,
            versionFolder: folder,
            linkFileName: file,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to update game");
        }

        const updatedTitle = data?.game?.title ?? name;
        const linkToFile: string = data?.update?.linkToFile ?? fallbackLink;

        showNotification(data?.message || "Game updated successfully", "success");
        onSuccess({
          id: safeGameId,
          title: updatedTitle,
          patchNumber: data?.update?.patchNumber ?? folder,
          linkToFile,
          updateTitle: data?.update?.title ?? title,
          updateDescription: data?.update?.detail ?? detail,
        });
        onClose();
      } catch (error: any) {
        console.error("Game edit error:", error);
        showNotification(error?.message || "Failed to update game", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      game,
      gameName,
      updateTitle,
      updateDescription,
      selectedFolder,
      versionFiles.length,
      fileName,
      showNotification,
      uploadVersionFilesOnce,
      onSuccess,
      onClose,
      setFormErrors,
    ]
  );

  const handleVersionFilesSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setVersionFiles([]);
      setFormErrors((previous) => ({
        ...previous,
        versionFiles: "Select a folder to upload for this version",
      }));
      return;
    }
    const fileArray = Array.from(files);
    setVersionFiles(fileArray);
    setSelectedFolder("");
    setFormErrors((previous) => ({
      ...previous,
      versionFiles: undefined,
    }));
    showNotification(`Selected ${fileArray.length} file(s) for new version`, "info");
  }, [showNotification, setFormErrors]);

  const clearVersionFiles = useCallback(() => {
    setVersionFiles([]);
    setSelectedFolder("");
    if (versionFilesInputRef.current) {
      versionFilesInputRef.current.value = "";
    }
    setFormErrors((previous) => ({
      ...previous,
      versionFiles: "Select a folder to upload for this version",
    }));
  }, [setFormErrors]);

  if (!isOpen || !game) {
    return null;
  }

  return (
    <div style={modalBackdropStyle}>
      <div style={modalCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            borderBottom: "2px solid #ff5722",
            paddingBottom: "1rem",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontSize: "1.5rem",
              margin: 0,
              fontWeight: 700,
            }}
          >
            EDIT GAME
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              padding: "0.5rem",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={labelStyle}>
              Game Name
              {(!gameName.trim() || formErrors.gameName) && (
                <span style={requiredAsteriskStyle}>*</span>
              )}
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(event) => {
                setGameName(event.target.value);
                setFormErrors((previous) => ({
                  ...previous,
                  gameName: undefined,
                }));
              }}
              placeholder="Enter game name"
              style={{
                ...inputStyle,
                border: formErrors.gameName ? "1px solid #ff6b6b" : "1px solid #444",
                backgroundColor: formErrors.gameName ? "rgba(255, 107, 107, 0.08)" : "#1a1a1a",
              }}
              disabled={isSubmitting}
            />
            {formErrors.gameName && <div style={errorTextStyle}>{formErrors.gameName}</div>}
          </div>

          <div>
            <label style={labelStyle}>
              Update Title
              {(!updateTitle.trim() || formErrors.updateTitle) && (
                <span style={requiredAsteriskStyle}>*</span>
              )}
            </label>
            <input
              type="text"
              value={updateTitle}
              onChange={(event) => {
                setUpdateTitle(event.target.value);
                setFormErrors((previous) => ({
                  ...previous,
                  updateTitle: undefined,
                }));
              }}
              placeholder="Update name or version"
              style={{
                ...inputStyle,
                border: formErrors.updateTitle ? "1px solid #ff6b6b" : "1px solid #444",
                backgroundColor: formErrors.updateTitle ? "rgba(255, 107, 107, 0.08)" : "#1a1a1a",
              }}
              disabled={isSubmitting}
            />
            {formErrors.updateTitle && <div style={errorTextStyle}>{formErrors.updateTitle}</div>}
          </div>

          <div>
            <label style={labelStyle}>
              Update Notes
              {(!updateDescription.trim() || formErrors.updateDescription) && (
                <span style={requiredAsteriskStyle}>*</span>
              )}
            </label>
            <textarea
              value={updateDescription}
              onChange={(event) => {
                setUpdateDescription(event.target.value);
                setFormErrors((previous) => ({
                  ...previous,
                  updateDescription: undefined,
                }));
              }}
              placeholder="Describe what is new in this update"
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical",
                border: formErrors.updateDescription ? "1px solid #ff6b6b" : "1px solid #444",
                backgroundColor: formErrors.updateDescription ? "rgba(255, 107, 107, 0.08)" : "#1a1a1a",
              }}
              disabled={isSubmitting}
            />
            {formErrors.updateDescription && <div style={errorTextStyle}>{formErrors.updateDescription}</div>}
          </div>

            <div>
              <label style={labelStyle}>
                Upload New Version Files
                {((versionFiles.length === 0 && !selectedFolder) || Boolean(formErrors.versionFiles)) && (
                  <span style={requiredAsteriskStyle}>*</span>
                )}
              </label>
              <input
                ref={versionFilesInputRef}
                type="file"
                multiple
                // @ts-ignore
                webkitdirectory=""
                directory=""
                onChange={handleVersionFilesSelect}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => versionFilesInputRef.current?.click()}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#444",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "1rem",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                    disabled={isSubmitting}
                  >
                    Choose Folder
                  </button>
                  <button
                    type="button"
                    onClick={clearVersionFiles}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: versionFiles.length === 0 && !selectedFolder ? "#555" : "#8b0000",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "1rem",
                      fontWeight: 600,
                      cursor: versionFiles.length === 0 && !selectedFolder ? "not-allowed" : "pointer",
                    }}
                    disabled={isSubmitting || (versionFiles.length === 0 && !selectedFolder)}
                  >
                    Remove
                  </button>
                </div>
                {versionFiles.length > 0 && (
                  <div style={{ color: "#bbb", fontSize: "0.9rem" }}>
                    {versionFiles.length} file(s) ready to upload
                  </div>
                )}
                {selectedFolder ? (
                  <div style={{ color: "#9be7a5", fontSize: "0.85rem" }}>
                    New version ready: {selectedFolder}
                  </div>
                ) : (
                  <div style={{ color: "rgba(255, 184, 139, 0.75)", fontSize: "0.85rem" }}>
                    Files upload when you press Upload. Only one new version is created per submission.
                  </div>
                )}
                {formErrors.versionFiles && <div style={errorTextStyle}>{formErrors.versionFiles}</div>}
              </div>
            </div>

          <div>
            <label style={labelStyle}>
              Main File Name
              {(!fileName.trim() || formErrors.fileName) && (
                <span style={requiredAsteriskStyle}>*</span>
              )}
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(event) => {
                setFileName(event.target.value);
                setFormErrors((previous) => ({
                  ...previous,
                  fileName: undefined,
                }));
              }}
              placeholder="index.html"
              style={{
                ...inputStyle,
                border: formErrors.fileName ? "1px solid #ff6b6b" : "1px solid #444",
                backgroundColor: formErrors.fileName ? "rgba(255, 107, 107, 0.08)" : "#1a1a1a",
              }}
              disabled={isSubmitting}
            />
            {linkPreview && (
              <div style={{ color: "#bbb", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                Final path: {linkPreview}
              </div>
            )}
            {formErrors.fileName && <div style={errorTextStyle}>{formErrors.fileName}</div>}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <button
              type="submit"
              disabled={
                isSubmitting
              }
              style={{
                flex: 1,
                padding: "1rem",
                backgroundColor: isSubmitting ? "#666" : "#ff5722",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: "1rem 2rem",
                backgroundColor: "#444",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
