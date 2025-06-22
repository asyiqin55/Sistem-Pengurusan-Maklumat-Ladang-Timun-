'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Leaf,
  Users,
  ClipboardList,
  FileText,
  LogOut,
  Settings,
  UserPlus
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: 'Papan Pemuka',
      icon: Home,
      href: '/dashboard',
      roles: ['admin', 'staff'] // Available to both admin and staff
    },
    {
      name: 'Pengurusan Tanaman',
      icon: Leaf,
      href: '/crop-management',
      roles: ['admin', 'staff'] // Available to both, but actions will be restricted
    },
    {
      name: 'Staf',
      icon: Users,
      href: '/staff',
      roles: ['admin'] // Admin only
    },
    {
      name: 'Pengurusan Pengguna',
      icon: UserPlus,
      href: '/admin/users',
      roles: ['admin'] // Admin only
    },
    {
      name: 'Tugas',
      icon: ClipboardList,
      href: '/tasks',
      roles: ['admin', 'staff'] // Available to both, but filtered for staff
    },
    {
      name: 'Tugas Preset',
      icon: Settings,
      href: '/preset-tasks',
      roles: ['admin'] // Admin only
    },
    {
      name: 'Kehadiran',
      icon: ClipboardList,
      href: '/attendance',
      roles: ['admin'] // Admin only
    },
    {
      name: 'Laporan',
      icon: FileText,
      href: '/reports',
      roles: ['admin'] // Admin only
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        await logout();
        router.push('/login');
      }
    } catch (error) {
      console.error('Log keluar gagal:', error);
    }
  };

  return (
    <div className="h-screen bg-white border-r border-gray-200 w-64 fixed">
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-[#2D5A27]"
          >
            <Leaf className="h-6 w-6" />
            <span className="font-bold text-xl">TIMUN</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      active 
                        ? 'bg-[#2D5A27] text-white' 
                        : 'text-[#607D8B] hover:bg-[#F5F7F2] hover:text-[#2D5A27]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg w-full text-[#D32F2F] hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Log Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
} 