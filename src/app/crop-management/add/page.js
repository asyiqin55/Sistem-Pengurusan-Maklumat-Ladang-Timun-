'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
// import CropForm from '@/components/CropForm'; // Using relative path instead
import CropForm from '../../../components/CropForm'; 

export default function AddCropPage() {
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal menambah plot: Status ${response.status}`);
      }

      // On successful creation, redirect to the crop management list
      router.push('/crop-management');
      // Optionally show a success message (e.g., using a toast library)

    } catch (err) {
      console.error("Error adding crop:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Leaf className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">
            Tambah Plot Tanaman Baru
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        <div className="card">
          <CropForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </div>
      </div>
    </main>
  );
} 