import React from 'react';
import { getAllUsers } from '../../lib/db';

export default async function Page() {
  // Server component: query DB on the server at request time
  const users = await getAllUsers();

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
