'use client';

import Link from 'next/link';

export default function DatabaseErrorPage() {
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
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ff6b6b' }}>
          🚨 Database Connection Error
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          The application cannot connect to the database. This is likely because MySQL is not running.
        </p>
        
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          textAlign: 'left',
          borderLeft: '4px solid #ff6b6b'
        }}>
          <h3 style={{ marginTop: 0, color: '#ff9999' }}>To fix this issue:</h3>
          <ol style={{ marginBottom: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>Start MySQL service: <code style={{ backgroundColor: '#1a1a1a', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>sudo service mysql start</code></li>
            <li style={{ marginBottom: '0.5rem' }}>Or use Docker: <code style={{ backgroundColor: '#1a1a1a', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>docker run -d -p 3306:3306 mysql:latest</code></li>
            <li>Verify MySQL is running on port 3306</li>
          </ol>
        </div>

        <Link
          href="/"
          style={{
            padding: '0.75rem 2rem',
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
          Try Again
        </Link>
      </div>
    </div>
  );
}
