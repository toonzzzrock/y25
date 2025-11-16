'use client';

import React, { useEffect, useState } from 'react';
import { useProtectedRoute } from '@/lib/use-protected-route';

export default function Page() {
  const { isLoading } = useProtectedRoute();
  const [users, setUsers] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      (async () => {
        try {
          // For now, fetch users from API endpoint
          const response = await fetch('/api/users');
          if (response.ok) {
            const result = await response.json();
            setUsers(result.users || []);
          }
        } catch (error) {
          console.error('Failed to load users:', error);
        }
        setDbLoading(false);
      })();
    }
  }, [isLoading]);

  if (isLoading || dbLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        color: '#333',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {(!users || users.length === 0) ? (
        <p>No users found.</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border-collapse border">
            <thead>
              <tr>
                {Object.keys(users[0]).map((k) => (
                  <th key={k} className="border px-2 py-1 text-left bg-gray-100">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any, idx: number) => (
                <tr key={u.id ?? idx} className={idx % 2 ? 'bg-gray-50' : ''}>
                  {Object.keys(users[0]).map((k) => (
                    <td key={k} className="border px-2 py-1">{String(u[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
