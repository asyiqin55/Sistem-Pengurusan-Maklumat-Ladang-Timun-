'use client';

import { Inter } from 'next/font/google';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Pages that don't require authentication
const publicPages = ['/login', '/temp-password-update'];

function RootLayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (!loading) {
      // If user is not authenticated and trying to access protected route
      if (!user && !isPublicPage) {
        router.push('/login');
      }
      // If user is authenticated and trying to access login/register
      if (user && isPublicPage) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isPublicPage, router]);

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Show login/register pages without sidebar
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-[#F5F7F2]">
        {children}
      </div>
    );
  }

  // Show protected pages with sidebar
  return (
    <div className="flex min-h-screen bg-[#F5F7F2]">
      <Sidebar />
      <div className="flex-1 pl-64">
        {children}
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <RootLayoutContent>
            {children}
          </RootLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
