'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Leaf, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import CropForm from '../../../../components/CropForm';

export default function EditCropPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { authenticatedFetch } = useAuth();

  const [initialData, setInitialData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchCropData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await authenticatedFetch(`/api/crops/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Gagal mendapatkan data plot: Status ${response.status}`);
          }
          const data = await response.json();
          setInitialData(data);
        } catch (err) {
          console.error("Error fetching crop data:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchCropData();
    }
  }, [id, authenticatedFetch]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/crops/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal mengemaskini plot: Status ${response.status}`);
      }

      router.push('/crop-management');

    } catch (err) {
      console.error("Error updating crop:", err);
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
            href="/crop-management"
            className="text-primary hover:opacity-80 flex items-center gap-1 mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Senarai Plot
          </Link>
           <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">
              Kemaskini Maklumat Plot
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
            <p className="text-center py-10">Memuatkan data plot...</p>
          ) : initialData ? (
            <CropForm 
              initialData={initialData}
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
            />
          ) : (
            // Should not happen if ID is valid and no fetch error, but good to handle
            <p className="text-center py-10 text-error">Data plot tidak ditemui.</p>
          )}
        </div>
      </div>
    </main>
  );
} 