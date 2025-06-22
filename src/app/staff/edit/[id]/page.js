'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import StaffForm from '../../../../components/StaffForm'; // Correct relative path

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get staff ID from route parameters
  const { user, authenticatedFetch } = useAuth();

  const [initialData, setInitialData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Early return for non-admin users
  if (user && user.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    if (id && user && authenticatedFetch) {
      const fetchStaffData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await authenticatedFetch(`/api/staff/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Gagal mendapatkan data staf: Status ${response.status}`);
          }
          const data = await response.json();
          setInitialData(data);
        } catch (err) {
          console.error("Error fetching staff data:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchStaffData();
    }
  }, [id, user, authenticatedFetch]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal mengemaskini staf: Status ${response.status}`);
      }

      // On successful update, redirect to the staff list
      router.push('/staff');
       // Optionally show a success message

    } catch (err) {
      console.error("Error updating staff:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
         <div className="mb-6">
          <Link 
            href="/staff"
            className="text-primary hover:opacity-80 flex items-center gap-1 mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Senarai Staf
          </Link>
           <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">
              Kemaskini Maklumat Staf
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        <div className="card">
          {loading ? (
            <p className="text-center py-10">Memuatkan data staf...</p>
          ) : initialData ? (
            <StaffForm 
              initialData={initialData}
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
              isEdit={true} // Indicate this is the Edit form
            />
          ) : (
            <p className="text-center py-10 text-error">Data staf tidak ditemui.</p>
          )}
        </div>
      </div>
    </main>
  );
} 