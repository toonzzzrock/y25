'use client';

import { useState } from 'react';
import styles from '../admin.module.css';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    sex: 'Male',
    role: 'developer',
    developerRole: 'Programmer',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.dob) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (formData.username.length > 20) {
      setMessage({ type: 'error', text: 'Username must be 20 characters or less' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          dob: formData.dob,
          sex: formData.sex,
          role: formData.role,
          developerRole: formData.developerRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          dob: '',
          sex: 'Male',
          role: 'developer',
          developerRole: 'Programmer',
        });
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Max 20 characters"
          maxLength={20}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="user@example.com"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm password"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Gender</label>
        <select
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Developer Role</label>
        <select
          name="developerRole"
          value={formData.developerRole}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #333',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="Programmer">Programmer</option>
          <option value="Designer">Designer</option>
          <option value="Tester">Tester</option>
        </select>
      </div>

      {message && (
        <div
          style={{
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#0a6e1a' : '#6e0a0a',
            color: message.type === 'success' ? '#0f0' : '#f00',
            fontSize: '12px',
          }}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '10px',
          backgroundColor: '#0066cc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Creating...' : 'Create Account'}
      </button>
    </form>
  );
}
