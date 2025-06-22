'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F7F2] flex">
      <div className="w-64">
        <Sidebar />
      </div>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-[#2D5A27]">Mengarahkan ke halaman log masuk...</div>
      </main>
    </div>
  );
}
