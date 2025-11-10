'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook to protect routes - redirects unauthenticated users to login
 * Use this in pages that require authentication
 * 
 * @returns Object with isLoading state
 * 
 * Example:
 * export default function ProtectedPage() {
 *   const { isLoading } = useProtectedRoute();
 *   if (isLoading) return <div>Loading...</div>;
 *   // Rest of your page
 * }
 */
export function useProtectedRoute() {
  const router = useRouter();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    // Only check after auth context is loaded
    if (!loading && !authenticated) {
      // Redirect to login page if not authenticated
      router.push('/');
    }
  }, [authenticated, loading, router]);

  // Return loading state so component can show loading screen if needed
  return { isLoading: loading };
}
