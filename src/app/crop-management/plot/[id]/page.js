'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Leaf } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import PlotView from '../../../../components/PlotView';

export default function PlotDetails({ params }) {
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const response = await authenticatedFetch(`/api/crops/${params.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal mendapatkan data plot');
        }
        const data = await response.json();
        setCrop(data);
      } catch (err) {
        console.error('Error fetching crop details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCrop();
  }, [params.id, authenticatedFetch]);

  if (loading) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-center py-10">Memuatkan data plot...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
          <Link 
            href="/crop-management"
            className="text-primary hover:opacity-80 flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali ke Pengurusan Tanaman
          </Link>
        </div>
      </main>
    );
  }

  if (!crop) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-neutral">Plot tidak ditemui.</p>
          <Link 
            href="/crop-management"
            className="text-primary hover:opacity-80 flex items-center gap-2 justify-center mt-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali ke Pengurusan Tanaman
          </Link>
        </div>
      </main>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ms-MY', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/crop-management"
            className="text-primary hover:opacity-80 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali ke Pengurusan Tanaman
          </Link>
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <Leaf className="h-8 w-8" />
            Butiran Plot {crop.plotId}
          </h1>
        </div>

        <div className="grid gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-primary mb-4">Maklumat Plot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-neutral font-medium">Status</p>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                  crop.status === 'Aktif' ? 'bg-green-100 text-green-800' :
                  crop.status === 'Penuaian' ? 'bg-yellow-100 text-yellow-800' :
                  crop.status === 'Selesai' ? 'bg-blue-100 text-blue-800' :
                  crop.status === 'Gagal' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {crop.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-neutral font-medium">Tarikh Penanaman</p>
                <p className="text-neutral-dark">{formatDate(crop.plantingDate)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral font-medium">Jangkaan Tarikh Tuai</p>
                <p className="text-neutral-dark">{formatDate(crop.expectedHarvestDate)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral font-medium">Saiz Plot</p>
                <p className="text-neutral-dark">{crop.plotSize}</p>
              </div>
              <div>
                <p className="text-sm text-neutral font-medium">Hasil Dijangka</p>
                <p className="text-neutral-dark">{crop.expectedYield || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral font-medium">Hasil Sebenar</p>
                <p className="text-neutral-dark">{crop.actualYield || '-'}</p>
              </div>
              {crop.assignedUsername && (
                <div>
                  <p className="text-sm text-neutral font-medium">Pekerja Bertugas</p>
                  <p className="text-neutral-dark">{crop.assignedUsername}</p>
                </div>
              )}
              {crop.notes && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-neutral font-medium">Nota</p>
                  <p className="text-neutral-dark">{crop.notes}</p>
                </div>
              )}
            </div>
          </div>

          <PlotView plotSize={crop.plotSize} status={crop.status} />
        </div>
      </div>
    </main>
  );
} 