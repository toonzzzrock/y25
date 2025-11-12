"use client";

import React, { useState, useCallback, useRef } from "react";

type NotificationVariant = "success" | "error" | "info";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showNotification: (message: string, type: NotificationVariant) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess, showNotification }: UploadModalProps) {
  const [gameName, setGameName] = useState("");
  const [description, setDescription] = useState("");
  const [linkToFilePath, setLinkToFilePath] = useState("index.html");
  const [gameProfile, setGameProfile] = useState<File | null>(null);
  const [gameFiles, setGameFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setGameName("");
    setDescription("");
    setLinkToFilePath("index.html");
    setGameProfile(null);
    setGameFiles([]);
    setIsUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    resetForm();
    onClose();
  }, [isUploading, resetForm, onClose]);

  const handleProfileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
      }
      setGameProfile(file);
      showNotification(`Selected: ${file.name}`, 'success');
    }
  }, [showNotification]);

  const handleFilesSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setGameFiles(fileArray);
      showNotification(`Selected ${fileArray.length} file(s)`, 'success');
    }
  }, [showNotification]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!gameName.trim()) {
      showNotification('Please enter a game name', 'error');
      return;
    }

    if (!gameProfile) {
      showNotification('Please select a game profile image', 'error');
      return;
    }

    if (gameFiles.length === 0) {
      showNotification('Please select at least one game file', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('gameName', gameName.trim());
      formData.append('description', description.trim());
      formData.append('linkToFilePath', linkToFilePath.trim());
      formData.append('gameProfile', gameProfile);
      
      gameFiles.forEach(file => {
        formData.append('gameFiles', file);
      });

      const response = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload game');
      }

      showNotification(data.message || 'Game uploaded successfully!', 'success');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Failed to upload game', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [gameName, description, linkToFilePath, gameProfile, gameFiles, showNotification, resetForm, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '2px solid #ff5722',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '2px solid #ff5722',
          paddingBottom: '1rem',
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: '1.5rem',
            margin: 0,
            fontWeight: 700,
          }}>
            UPLOAD NEW GAME
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '0.5rem',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              color: '#e6e0db',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              Game Name *
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
              }}
              disabled={isUploading}
            />
          </div>



          <div>
            <label style={{
              display: 'block',
              color: '#e6e0db',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              Game Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your game"
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
                resize: 'vertical',
              }}
              disabled={isUploading}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: '#e6e0db',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              Main File Path
            </label>
            <input
              type="text"
              value={linkToFilePath}
              onChange={(e) => setLinkToFilePath(e.target.value)}
              placeholder="index.html"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
              }}
              disabled={isUploading}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: '#e6e0db',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              Game Profile Image *
            </label>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileSelect}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#444',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
                disabled={isUploading}
              >
                Choose Image
              </button>
              {gameProfile && (
                <span style={{ color: '#4caf50', fontSize: '0.9rem' }}>
                  ✓ {gameProfile.name}
                </span>
              )}
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              color: '#e6e0db',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              Game Files *
            </label>
            <input
              ref={filesInputRef}
              type="file"
              multiple
              // @ts-ignore
              webkitdirectory=""
              directory=""
              onChange={handleFilesSelect}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => filesInputRef.current?.click()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#444',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  width: 'fit-content',
                }}
                disabled={isUploading}
              >
                Choose Folder
              </button>
              {gameFiles.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ color: '#4caf50', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    ✓ {gameFiles.length} file(s) selected
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            <button
              type="submit"
              disabled={isUploading}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: isUploading ? '#666' : '#ff5722',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {isUploading ? 'UPLOADING...' : 'SUBMIT'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#444',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
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