'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserForm from '@/components/UserForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AddUserPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { authenticatedFetch } = useAuth();

  const handleSubmit = async (formData) => {
            console.log('[ADD USER PAGE] Starting handleSubmit:', {
              formDataKeys: Object.keys(formData),
              username: formData.username,
              email: formData.email,
              role: formData.role,
              hasStaffData: !!formData.staffData,
              hasSelectedStaffId: !!formData.selectedStaffId
            });
            
            setIsSubmitting(true);
            setError('');
        
            try {
              console.log('[ADD USER PAGE] Making create user API request:', {
                endpoint: '/api/admin/users',
                method: 'POST'
              });
              
              const response = await authenticatedFetch('/api/admin/users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
              });
        
              console.log('[ADD USER PAGE] Create user response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
              });
        
              const data = await response.json();
              console.log('[ADD USER PAGE] Response data received:', {
                success: response.ok,
                hasError: !!data.error,
                userId: data.id
              });
        
              if (!response.ok) {
                console.error('[ADD USER PAGE] Create user failed:', data);
                throw new Error(data.error || 'Gagal mencipta pengguna');
              }
        
              console.log('[ADD USER PAGE] User created successfully, redirecting to users list');
              // Success - redirect to users list
              router.push('/admin/users');
            } catch (err) {
              console.error('[ADD USER PAGE] Error in handleSubmit:', {
                message: err.message,
                stack: err.stack
              });
              setError(err.message);
            } finally {
              setIsSubmitting(false);
              console.log('[ADD USER PAGE] handleSubmit completed');
            }
          };
;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tambah Pengguna Baru</h1>
        <p className="text-gray-600 mt-2">Cipta akaun pengguna baru untuk sistem</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <UserForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}