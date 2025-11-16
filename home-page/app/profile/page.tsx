"use client";
import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import "../home.css";

interface UserProfile {
  username: string;
  email: string;
  dateOfBirth?: string | null;
  sex?: string | null;
  createdAt?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
}

interface ProfileFormState {
  email: string;
  dateOfBirth: string;
  sex: string;
}

interface PlaytimeEntry {
  gameId: number;
  gameName: string | null;
  playSeconds: number;
}

interface PlaytimeSummary {
  totalSeconds: number;
  topGames: PlaytimeEntry[];
}

export default function ProfilePage() {
  const { isLoading } = useProtectedRoute();
  const { user, logout, checkSession } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>({ email: '', dateOfBirth: '', sex: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [playStats, setPlayStats] = useState<PlaytimeSummary | null>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateImagePreview = useCallback((url: string | null, isBlob = false) => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }

    if (isBlob && url) {
      imagePreviewUrlRef.current = url;
    }

    setImagePreview(url);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  const memberSinceLabel = useMemo(() => {
    if (!userProfile?.createdAt) {
      return 'Unknown';
    }

    try {
      return new Date(userProfile.createdAt).toLocaleDateString();
    } catch {
      return userProfile.createdAt;
    }
  }, [userProfile?.createdAt]);

  const dateOfBirthLabel = useMemo(() => {
    if (!userProfile?.dateOfBirth) {
      return 'Not provided';
    }

    const raw = typeof userProfile.dateOfBirth === 'string'
      ? userProfile.dateOfBirth
      : String(userProfile.dateOfBirth);

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      try {
        return new Date(`${raw}T00:00:00`).toLocaleDateString();
      } catch {
        return raw;
      }
    }

    try {
      return new Date(raw).toLocaleDateString();
    } catch {
      return raw;
    }
  }, [userProfile?.dateOfBirth]);

  const genderLabel = useMemo(() => {
    return userProfile?.sex || 'Not provided';
  }, [userProfile?.sex]);

  const formatPlayDuration = useCallback((seconds: number | null | undefined) => {
    const numeric = typeof seconds === 'number' && Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    if (numeric <= 0) {
      return '0m';
    }

    const hours = Math.floor(numeric / 3600);
    const minutes = Math.floor((numeric % 3600) / 60);
    const remainingSeconds = numeric % 60;

    const parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (parts.length === 0 && remainingSeconds > 0) {
      parts.push(`${remainingSeconds}s`);
    }

    return parts.join(' ');
  }, []);

  const formattedTopPlayGames = useMemo(() => {
    if (!playStats) {
      return [] as Array<PlaytimeEntry & { displayName: string }>;
    }

    return playStats.topGames.map((entry) => {
      const rawName = typeof entry.gameName === 'string' ? entry.gameName.trim() : '';
      const displayName = rawName.length > 0
        ? rawName
        : entry.gameId > 0
        ? `Game #${entry.gameId}`
        : 'Unknown game';

      return {
        ...entry,
        displayName,
      };
    });
  }, [playStats]);

  const totalPlaytimeLabel = useMemo(() => {
    return formatPlayDuration(playStats?.totalSeconds ?? 0);
  }, [formatPlayDuration, playStats?.totalSeconds]);

  const hasPlayActivity = useMemo(() => {
    if (!playStats) {
      return false;
    }
    return playStats.topGames.some((entry) => entry.playSeconds > 0);
  }, [playStats]);

  useEffect(() => {

            {playStats && (
              <div
                style={{
                  background: '#241411',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 122, 43, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.35rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>Lifetime playtime</span>
                  <div style={{ fontSize: '1.75rem', color: '#fff', fontWeight: 700 }}>{totalPlaytimeLabel}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>Top games by playtime</span>
                  {formattedTopPlayGames.length > 0 && hasPlayActivity ? (
                    formattedTopPlayGames.map((entry, index) => (
                      <div
                        key={`${entry.gameId || 'game'}-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          padding: '0.85rem 1rem',
                          background: 'rgba(12, 6, 5, 0.55)',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 122, 43, 0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <span
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ff7a2b, #ff4500)',
                              color: '#120806',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                            }}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{entry.displayName}</div>
                            {entry.gameId > 0 && (
                              <div style={{ color: 'rgba(255, 184, 139, 0.7)', fontSize: '0.75rem' }}>Game ID {entry.gameId}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ color: '#ffb88b', fontWeight: 600 }}>{formatPlayDuration(entry.playSeconds)}</div>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: 'rgba(255, 184, 139, 0.7)' }}>
                      Playtime tracking has not been recorded for this account yet.
                    </p>
                  )}
                </div>
              </div>
            )}
    if (isLoading) {
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      setPlayStats(null);
      try {
        const response = await fetch('/api/users/profile', {
          signal: controller.signal,
          credentials: 'include',
        });
        const data = await response.json();

        if (response.ok && data.profile) {
          const profileData = data.profile as UserProfile;
          setUserProfile({
            ...profileData,
            avatarUrl: profileData.avatarUrl ?? null,
            description: profileData.description ?? '',
          });
          const nextPlayStats: PlaytimeSummary = (() => {
            const rawStats = data.playStats;
            const totalSecondsRaw = typeof rawStats?.totalSeconds === 'number'
              ? rawStats.totalSeconds
              : Number(rawStats?.totalSeconds ?? 0);
            const topGamesRaw = Array.isArray(rawStats?.topGames) ? rawStats.topGames : [];

            const sanitizedTopGames: PlaytimeEntry[] = topGamesRaw.map((entry: any) => {
              const rawGameId = Number(entry?.gameId ?? entry?.game_id ?? 0);
              const rawSeconds = Number(entry?.playSeconds ?? entry?.play_seconds ?? 0);

              return {
                gameId: Number.isFinite(rawGameId) && rawGameId > 0 ? rawGameId : 0,
                gameName:
                  typeof entry?.gameName === 'string'
                    ? entry.gameName
                    : typeof entry?.game_name === 'string'
                    ? entry.game_name
                    : null,
                playSeconds: Number.isFinite(rawSeconds) && rawSeconds > 0 ? rawSeconds : 0,
              };
            });

            const sanitizedTotalSeconds = Number.isFinite(totalSecondsRaw) && totalSecondsRaw > 0
              ? totalSecondsRaw
              : 0;

            return {
              totalSeconds: sanitizedTotalSeconds,
              topGames: sanitizedTopGames,
            };
          })();
          setPlayStats(nextPlayStats);
        } else if (user) {
          setUserProfile({
            username: user.username,
            email: user.email || 'Not provided',
            avatarUrl: null,
            description: '',
          });
          setPlayStats({ totalSeconds: 0, topGames: [] });
        } else {
          setNotification({ message: data.error || 'Failed to load profile', type: 'error' });
          setPlayStats({ totalSeconds: 0, topGames: [] });
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Profile load error:', error);
        if (user) {
          setUserProfile({
            username: user.username,
            email: user.email || 'Not provided',
            avatarUrl: null,
            description: '',
          });
          setPlayStats({ totalSeconds: 0, topGames: [] });
        }
        setNotification({ message: 'Failed to load profile', type: 'error' });
        if (!user) {
          setPlayStats({ totalSeconds: 0, topGames: [] });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      controller.abort();
    };
  }, [isLoading, user]);

  useEffect(() => {
    updateImagePreview(userProfile?.avatarUrl ?? null);
    setDescriptionDraft(userProfile?.description ?? '');
    setSelectedImage(null);
  }, [userProfile?.avatarUrl, userProfile?.description, updateImagePreview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setNotification({ message: 'Please select an image file (PNG, JPEG, or WEBP)', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ message: 'Profile image is too large (limit 5MB)', type: 'error' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    updateImagePreview(previewUrl, true);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    updateImagePreview(userProfile?.avatarUrl ?? null);
  };

  const handleImageClick = () => {
    if (!isEditing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const avatarLetter = userProfile?.username?.charAt(0)?.toUpperCase() || '?';

  const startEditing = () => {
    if (!userProfile) {
      return;
    }

    setFormState({
      email: userProfile.email || '',
      dateOfBirth: userProfile.dateOfBirth ? String(userProfile.dateOfBirth).slice(0, 10) : '',
      sex: userProfile.sex || '',
    });
    setDescriptionDraft(userProfile.description ?? '');
    setSelectedImage(null);
    updateImagePreview(userProfile.avatarUrl ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormState({ email: '', dateOfBirth: '', sex: '' });
    setDescriptionDraft(userProfile?.description ?? '');
    setSelectedImage(null);
    updateImagePreview(userProfile?.avatarUrl ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFieldChange = (field: keyof ProfileFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userProfile || isSaving) {
      return;
    }

    const payload: Record<string, string> = {};

    const trimmedEmail = formState.email.trim();
    if (trimmedEmail && trimmedEmail !== (userProfile.email || '')) {
      payload.email = trimmedEmail;
    }

    const originalDob = userProfile.dateOfBirth ? String(userProfile.dateOfBirth).slice(0, 10) : '';
    if (formState.dateOfBirth && formState.dateOfBirth !== originalDob) {
      payload.dateOfBirth = formState.dateOfBirth;
    }

    const originalSex = userProfile.sex || '';
    if (formState.sex && formState.sex !== originalSex) {
      payload.sex = formState.sex;
    }

    const descriptionChanged = descriptionDraft !== (userProfile.description ?? '');
    const hasImageChange = Boolean(selectedImage);

    if (Object.keys(payload).length === 0 && !descriptionChanged && !hasImageChange) {
      setNotification({ message: 'No changes to save', type: 'info' });
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      let latestProfile: UserProfile | null = userProfile;

      if (Object.keys(payload).length > 0) {
        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data?.profile) {
          throw new Error(data?.error || 'Failed to update profile');
        }

        latestProfile = data.profile as UserProfile;
        setUserProfile(latestProfile);

        try {
          await checkSession();
        } catch (sessionError) {
          console.warn('Session refresh after profile update failed:', sessionError);
        }
      }

      if (descriptionChanged || hasImageChange) {
        const formData = new FormData();
        if (descriptionChanged) {
          formData.append('description', descriptionDraft);
        }
        if (hasImageChange && selectedImage) {
          formData.append('profileImage', selectedImage);
        }

        const response = await fetch('/api/users/profile/content', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to update profile appearance');
        }

        const nextAvatar = data?.avatarUrl ?? latestProfile?.avatarUrl ?? null;
        const nextDescription = data?.description ?? latestProfile?.description ?? '';

        setUserProfile((previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            avatarUrl: nextAvatar,
            description: nextDescription,
          };
        });

        updateImagePreview(nextAvatar ?? null);
        latestProfile = latestProfile
          ? { ...latestProfile, avatarUrl: nextAvatar, description: nextDescription }
          : latestProfile;
      }

      if (latestProfile) {
        setFormState({
          email: latestProfile.email || '',
          dateOfBirth: latestProfile.dateOfBirth ? String(latestProfile.dateOfBirth).slice(0, 10) : '',
          sex: latestProfile.sex || '',
        });
        setDescriptionDraft(latestProfile.description ?? '');
        updateImagePreview(latestProfile.avatarUrl ?? null);
      }

      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setNotification({ message: 'Profile updated successfully', type: 'success' });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setNotification({ message: error?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const dobInputValue = formState.dateOfBirth || '';
  if (isLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      setNotification({ message: "Logged out successfully", type: "success" });
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      setNotification({ message: "Failed to logout", type: "error" });
    }
  };

  return (
    <>
      <Header hideUserIcon={true} />

      <main
        style={{
          minHeight: 'calc(100vh - 80px)',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3.5rem clamp(1.5rem, 5vw, 4rem)',
          background: 'radial-gradient(circle at top, rgba(255, 122, 43, 0.25) 0%, rgba(12, 6, 5, 0.95) 55%, #050202 100%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 'min(1500px, calc(100vw - 64px))',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '3rem',
            background: 'rgba(18, 10, 9, 0.92)',
            borderRadius: '18px',
            padding: '3rem clamp(1.75rem, 4vw, 3.5rem)',
            border: '1px solid rgba(255, 122, 43, 0.25)',
            boxShadow: '0 24px 55px rgba(0, 0, 0, 0.45)',
          }}
        >
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
            <div
              style={{
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1.1rem',
                paddingTop: '0.25rem',
              }}
            >
              {!isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #ff7a2b, #ff4500)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '0.6rem 1.4rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(255, 90, 0, 0.28)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Edit profile
                </button>
              )}

              <div
                onClick={handleImageClick}
                onKeyDown={(event) => {
                  if (!isEditing) {
                    return;
                  }
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleImageClick();
                  }
                }}
                role={isEditing ? 'button' : undefined}
                aria-label={isEditing ? 'Select new profile image' : undefined}
                tabIndex={isEditing ? 0 : -1}
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 122, 43, 0.4)',
                  background: imagePreview ? '#120806' : 'linear-gradient(135deg, #ff7a2b, #ff4500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 24px rgba(255, 90, 0, 0.35)',
                  cursor: isEditing ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={`${userProfile?.username || 'Player'} avatar`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = '/images/placeholder.svg';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#0b0402' }}>{avatarLetter}</span>
                )}
                {isEditing && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '0.35rem 0.5rem',
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Click to change
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                id="profile-image-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              {isEditing && selectedImage && (
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 122, 43, 0.35)',
                    color: '#ffb88b',
                    borderRadius: '999px',
                    padding: '0.4rem 1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Remove {selectedImage.name}
                </button>
              )}

              {isEditing && (
                <p style={{ margin: '0.25rem 0 0', color: 'rgba(255, 184, 139, 0.75)', fontSize: '0.75rem' }}>
                  Accepts PNG, JPEG, or WEBP up to 5MB. Changes apply after you save.
                </p>
              )}

              <div style={{ maxWidth: '420px', width: '100%' }}>
                <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '2.2rem', color: '#fff' }}>{userProfile?.username}</h1>
                <p style={{ margin: 0, color: '#ffb88b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  Player Profile
                </p>
                {isEditing ? (
                  <textarea
                    value={descriptionDraft}
                    onChange={(event) => setDescriptionDraft(event.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      marginTop: '0.9rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 122, 43, 0.35)',
                      background: '#140b08',
                      padding: '0.9rem 1rem',
                      color: '#fff',
                      fontSize: '0.95rem',
                      resize: 'vertical',
                    }}
                    maxLength={4000}
                    placeholder="Tell other players about yourself, your favourite games, or achievements."
                  />
                ) : (
                  <p style={{ marginTop: '0.9rem', color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {userProfile?.description && userProfile.description.trim().length > 0
                      ? userProfile.description
                      : 'This player has not added a description yet.'}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                background: '#241411',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 122, 43, 0.25)',
                display: 'grid',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>Member since</span>
                <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{memberSinceLabel}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>Primary email</span>
                <div style={{ fontSize: '1.15rem', color: '#fff', wordBreak: 'break-word' }}>{userProfile?.email || 'Not provided'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {user?.role === 'publisher' && (
                <button
                  type="button"
                  onClick={() => router.push('/publisher')}
                  style={{
                    background: '#2f1c17',
                    color: '#ffb88b',
                    border: '1px solid rgba(255, 122, 43, 0.45)',
                    borderRadius: '10px',
                    padding: '0.85rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, background 0.2s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px)';
                    event.currentTarget.style.background = '#ff7a2b';
                    event.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                    event.currentTarget.style.background = '#2f1c17';
                    event.currentTarget.style.color = '#ffb88b';
                  }}
                >
                  Publisher dashboard
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push('/home')}
                style={{
                  background: 'linear-gradient(135deg, #ff7a2b, #ff4500)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 12px 20px rgba(255, 90, 0, 0.3)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Back to home
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 122, 43, 0.6)',
                  color: '#ffb88b',
                  borderRadius: '10px',
                  padding: '0.85rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = 'rgba(255, 122, 43, 0.1)';
                  event.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = 'transparent';
                  event.currentTarget.style.color = '#ffb88b';
                }}
              >
                Logout
              </button>
            </div>
          </section>

          <section
            style={{
              background: '#241411',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid rgba(255, 122, 43, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              justifyContent: 'center',
            }}
          >
            {isEditing ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem' }}>Edit details</h2>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'rgba(255, 184, 139, 0.8)', fontSize: '0.9rem' }}>
                    Update your contact information, personal fields, and avatar.
                  </p>
                </div>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    color: '#ffb88b',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Email address
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleFieldChange('email', event.target.value)}
                    required
                    style={{
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 122, 43, 0.35)',
                      background: '#140b08',
                      padding: '0.9rem 1rem',
                      color: '#fff',
                      fontSize: '1rem',
                    }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    color: '#ffb88b',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Date of birth
                  <input
                    type="date"
                    value={dobInputValue}
                    onChange={(event) => handleFieldChange('dateOfBirth', event.target.value)}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 122, 43, 0.35)',
                      background: '#140b08',
                      padding: '0.9rem 1rem',
                      color: '#fff',
                      fontSize: '1rem',
                    }}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    color: '#ffb88b',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Gender
                  <select
                    value={formState.sex}
                    onChange={(event) => handleFieldChange('sex', event.target.value)}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 122, 43, 0.35)',
                      background: '#140b08',
                      padding: '0.9rem 1rem',
                      color: '#fff',
                      fontSize: '1rem',
                      appearance: 'none',
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 122, 43, 0.4)',
                      color: '#ffb88b',
                      borderRadius: '999px',
                      padding: '0.6rem 1.4rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #ff7a2b, #ff4500)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '999px',
                      padding: '0.6rem 1.6rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minWidth: '120px',
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem' }}>Gameplay activity</h2>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'rgba(255, 184, 139, 0.8)', fontSize: '0.9rem', maxWidth: '480px' }}>
                    Lifetime playtime and your most-played games are summarized below. Launch a few sessions to start building your stats.
                  </p>
                </div>

                <div
                  style={{
                    background: '#1c0f0c',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 122, 43, 0.25)',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.35rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>Lifetime playtime</span>
                    <div style={{ fontSize: '1.9rem', color: '#fff', fontWeight: 700 }}>{totalPlaytimeLabel}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>Top games</span>
                    {playStats && formattedTopPlayGames.length > 0 && hasPlayActivity ? (
                      formattedTopPlayGames.map((entry, index) => (
                        <div
                          key={`${entry.gameId || 'game'}-${index}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            padding: '0.85rem 1rem',
                            background: 'rgba(12, 6, 5, 0.55)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 122, 43, 0.15)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                            <span
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ff7a2b, #ff4500)',
                                color: '#120806',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                              }}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 600 }}>{entry.displayName}</div>
                              {entry.gameId > 0 && (
                                <div style={{ color: 'rgba(255, 184, 139, 0.7)', fontSize: '0.75rem' }}>Game ID {entry.gameId}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ color: '#ffb88b', fontWeight: 600 }}>{formatPlayDuration(entry.playSeconds)}</div>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, color: 'rgba(255, 184, 139, 0.7)' }}>
                        Playtime tracking has not been recorded for this account yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "1rem 1.5rem",
            borderRadius: 8,
            backgroundColor:
              notification.type === 'error'
                ? "#f44336"
                : notification.type === 'info'
                ? "#ff9800"
                : "#4caf50",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}
