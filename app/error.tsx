'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ff6b6b' }}>Something went wrong!</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '500px' }}>
        {error.message}
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2196f3',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
