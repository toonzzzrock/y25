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
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const imagePreviewUrlRef = useRef<string | null>(null);

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

  const descriptionChanged = descriptionDraft !== (userProfile?.description ?? '');
  const hasImageChange = Boolean(selectedImage);
  const appearanceDirty = descriptionChanged || hasImageChange;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
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
        } else if (user) {
          setUserProfile({
            username: user.username,
            email: user.email || 'Not provided',
            avatarUrl: null,
            description: '',
          });
        } else {
          setNotification({ message: data.error || 'Failed to load profile', type: 'error' });
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
        }
        setNotification({ message: 'Failed to load profile', type: 'error' });
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

    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    updateImagePreview(previewUrl, true);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    updateImagePreview(userProfile?.avatarUrl ?? null);
  };

  const resetAppearanceChanges = () => {
    setDescriptionDraft(userProfile?.description ?? '');
    clearSelectedImage();
  };

  const handleAppearanceSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userProfile) {
      setNotification({ message: 'Profile not loaded yet', type: 'error' });
      return;
    }

    const descriptionChanged = descriptionDraft !== (userProfile.description ?? '');
    const hasImageChange = Boolean(selectedImage);

    if (!descriptionChanged && !hasImageChange) {
      setNotification({ message: 'No appearance changes to save', type: 'info' });
      return;
    }

    const formData = new FormData();

    if (hasImageChange && selectedImage) {
      formData.append('profileImage', selectedImage);
    }

    if (descriptionChanged) {
      formData.append('description', descriptionDraft);
    }

    setIsSavingAppearance(true);

    try {
      const response = await fetch('/api/users/profile/content', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update profile appearance');
      }

      const nextAvatar = data?.avatarUrl ?? userProfile.avatarUrl ?? null;
      const nextDescription = data?.description ?? userProfile.description ?? '';

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
      setSelectedImage(null);
      setDescriptionDraft(nextDescription);
      setNotification({ message: 'Profile appearance updated', type: 'success' });
    } catch (error: any) {
      console.error('Profile appearance update error:', error);
      setNotification({ message: error?.message || 'Failed to update profile appearance', type: 'error' });
    } finally {
      setIsSavingAppearance(false);
    }
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
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormState({ email: '', dateOfBirth: '', sex: '' });
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

    if (Object.keys(payload).length === 0) {
      setNotification({ message: 'No changes to save', type: 'info' });
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
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

      setUserProfile(data.profile as UserProfile);
      setNotification({ message: 'Profile updated successfully', type: 'success' });
      setIsEditing(false);
      setFormState({
        email: data.profile.email || '',
        dateOfBirth: data.profile.dateOfBirth ? String(data.profile.dateOfBirth).slice(0, 10) : '',
        sex: data.profile.sex || '',
      });

      try {
        await checkSession();
      } catch (sessionError) {
        console.warn('Session refresh after profile update failed:', sessionError);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setNotification({ message: error?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const dobInputValue = formState.dateOfBirth || '';
  const infoCardStyle = {
    background: 'rgba(12, 6, 5, 0.6)',
    border: '1px solid rgba(255, 122, 43, 0.15)',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  };

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
          padding: '3rem 1.5rem',
          background: 'radial-gradient(circle at top, rgba(255, 122, 43, 0.25) 0%, rgba(12, 6, 5, 0.95) 55%, #050202 100%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '980px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2.5rem',
            background: 'rgba(18, 10, 9, 0.92)',
            borderRadius: '18px',
            padding: '2.75rem',
            border: '1px solid rgba(255, 122, 43, 0.25)',
            boxShadow: '0 24px 55px rgba(0, 0, 0, 0.45)',
          }}
        >
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div
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
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={`${userProfile?.username || 'Player'} avatar`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#0b0402' }}>{avatarLetter}</span>
                )}
              </div>
              <div>
                <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '2.2rem', color: '#fff' }}>{userProfile?.username}</h1>
                <p style={{ margin: 0, color: '#ffb88b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  Player Profile
                </p>
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

            <div
              style={{
                background: '#241411',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 122, 43, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.8)' }}>About me</span>
              <div style={{ color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {userProfile?.description && userProfile.description.trim().length > 0
                  ? userProfile.description
                  : 'This player has not added a description yet.'}
              </div>
            </div>

            <form
              onSubmit={handleAppearanceSave}
              style={{
                background: '#241411',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 122, 43, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Customize appearance</h2>
                <p style={{ margin: '0.35rem 0 0', color: 'rgba(255, 184, 139, 0.8)', fontSize: '0.9rem' }}>
                  Update your avatar and share a short bio with the community.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="profile-image-input" style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#ffb88b' }}>
                  Profile image
                </label>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 122, 43, 0.35)',
                    background: '#140b08',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'rgba(255, 184, 139, 0.7)' }}>
                  PNG, JPEG, or WEBP up to 5MB.
                </span>
                {selectedImage && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#ffb88b', fontSize: '0.85rem' }}>
                    <span>Selected: {selectedImage.name}</span>
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'transparent',
                        border: '1px solid rgba(255, 122, 43, 0.35)',
                        color: '#ffb88b',
                        borderRadius: '999px',
                        padding: '0.35rem 0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#ffb88b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                Profile description
                <textarea
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  rows={5}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 122, 43, 0.35)',
                    background: '#140b08',
                    padding: '0.9rem 1rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                  }}
                  placeholder="Tell other players about yourself, your favourite games, or achievements."
                  maxLength={4000}
                />
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={resetAppearanceChanges}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 122, 43, 0.35)',
                    color: '#ffb88b',
                    borderRadius: '999px',
                    padding: '0.6rem 1.3rem',
                    fontWeight: 600,
                    cursor: appearanceDirty && !isSavingAppearance ? 'pointer' : 'not-allowed',
                    opacity: appearanceDirty ? 1 : 0.4,
                  }}
                  disabled={!appearanceDirty || isSavingAppearance}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  style={{
                    background: appearanceDirty ? 'linear-gradient(135deg, #ff7a2b, #ff4500)' : 'rgba(255, 122, 43, 0.35)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '0.6rem 1.6rem',
                    fontWeight: 600,
                    cursor: appearanceDirty && !isSavingAppearance ? 'pointer' : 'not-allowed',
                    minWidth: '140px',
                    opacity: appearanceDirty ? 1 : 0.6,
                  }}
                  disabled={!appearanceDirty || isSavingAppearance}
                >
                  {isSavingAppearance ? 'Saving…' : 'Save appearance'}
                </button>
              </div>
            </form>

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
            }}
          >
            {isEditing ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem' }}>Edit details</h2>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'rgba(255, 184, 139, 0.8)', fontSize: '0.9rem' }}>
                    Update your contact information so we can keep in touch.
                  </p>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#ffb88b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
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

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#ffb88b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
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

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#ffb88b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
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
              <>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem' }}>Profile details</h2>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'rgba(255, 184, 139, 0.8)', fontSize: '0.9rem' }}>
                    Review your saved information and make sure it stays current.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={infoCardStyle}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.75)' }}>Username</span>
                    <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{userProfile?.username}</strong>
                  </div>
                  <div style={infoCardStyle}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.75)' }}>Email address</span>
                    <strong style={{ fontSize: '1.05rem', color: '#fff', wordBreak: 'break-word' }}>{userProfile?.email || 'Not provided'}</strong>
                  </div>
                  <div style={infoCardStyle}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.75)' }}>Date of birth</span>
                    <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{dateOfBirthLabel}</strong>
                  </div>
                  <div style={infoCardStyle}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 184, 139, 0.75)' }}>Gender</span>
                    <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{genderLabel}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={startEditing}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 122, 43, 0.6)',
                      color: '#ffb88b',
                      borderRadius: '999px',
                      padding: '0.6rem 1.6rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Edit profile
                  </button>
                </div>
              </>
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
