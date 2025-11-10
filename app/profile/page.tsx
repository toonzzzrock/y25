"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import "../home.css";

interface UserProfile {
  username: string;
  email: string;
  dob?: string;
  sex?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const { isLoading } = useProtectedRoute();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      // Set user profile from session data
      setUserProfile({
        username: user.username,
        email: user.email || "Not provided",
      });
      setLoading(false);
    }
  }, [isLoading, user]);

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
      <header className="home-header">
        <Link href="/home" className="logo" style={{ textDecoration: 'none' }}>
          <span className="logo-y25">Y25</span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/profile" className="profile-active-link">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="12" r="5" fill="currentColor" />
            <path d="M6 26C6 21 10 18 16 18C22 18 26 21 26 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '2rem',
          color: '#fff'
        }}>
          {/* Profile Header */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#ff6600',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {userProfile?.username?.[0]?.toUpperCase()}
            </div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
              {userProfile?.username}
            </h1>
            <p style={{ color: '#999', margin: 0 }}>Player Profile</p>
          </div>

          {/* Profile Info */}
          <div style={{
            display: 'grid',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Email */}
            <div style={{
              backgroundColor: '#2a2a2a',
              padding: '1.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #ff6600'
            }}>
              <p style={{ color: '#999', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Email Address
              </p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                {userProfile?.email}
              </p>
            </div>

            {/* Username */}
            <div style={{
              backgroundColor: '#2a2a2a',
              padding: '1.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #ff6600'
            }}>
              <p style={{ color: '#999', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Username
              </p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                {userProfile?.username}
              </p>
            </div>

            {/* Member Since */}
            <div style={{
              backgroundColor: '#2a2a2a',
              padding: '1.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #ff6600'
            }}>
              <p style={{ color: '#999', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Member Since
              </p>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexDirection: 'column'
          }}>
            <button
              onClick={() => router.push('/home')}
              style={{
                backgroundColor: '#ff6600',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff5500'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
            >
              Back to Home
            </button>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#333',
                color: '#fff',
                border: '2px solid #ff6600',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6600';
                e.currentTarget.style.color = '#1a1a1a';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
                e.currentTarget.style.color = '#fff';
              }}
            >
              Logout
            </button>
          </div>
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
            backgroundColor: notification.type === 'error' ? "#f44336" : "#4caf50",
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
