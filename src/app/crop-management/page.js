'use client';

import { useState, useEffect } from 'react';
import { Plus, Leaf, Edit2, XCircle, Eye, Search, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function CropManagement() {
  const router = useRouter();
  const { user, authenticatedFetch } = useAuth();
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cropStats, setCropStats] = useState({ total: 0, active: 0, harvest: 0, completed: 0, failed: 0 });

  useEffect(() => {
    fetchCrops();
  }, []);

  // Enhanced filtering logic for crops
  useEffect(() => {
    let filtered = crops;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(crop => 
        crop.plotId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.cropType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.assignedUsername?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(crop => crop.status === statusFilter);
    }

    setFilteredCrops(filtered);
  }, [crops, searchTerm, statusFilter]);

  const fetchCrops = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/crops');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mendapatkan data tanaman');
      }
      const data = await response.json();
      setCrops(data);
      setFilteredCrops(data);
      
      // Calculate crop statistics
      const stats = {
        total: data.length,
        active: data.filter(crop => crop.status === 'Ditanam' || crop.status === 'Sedang Tumbuh').length,
        harvest: data.filter(crop => crop.status === 'Penuaian').length,
        completed: data.filter(crop => crop.status === 'Selesai').length,
        failed: data.filter(crop => crop.status === 'Gagal').length
      };
      setCropStats(stats);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Adakah anda pasti mahu memadamkan plot tanaman ini?')) {
      return;
    }

    setIsDeleting(id);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/crops/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        setCrops(currentCrops => currentCrops.filter(crop => crop.id !== id));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal memadam: Status ${response.status}`);
      }

    } catch (err) {
      console.error('Ralat memadamkan tanaman:', err);
      setError(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

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

  if (loading && crops.length === 0) {
    return (
      <main className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          Memuatkan Data Plot...
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <Leaf className="h-8 w-8" />
            Pengurusan Tanaman
          </h1>
          {user?.role === 'admin' && (
            <button 
              onClick={() => router.push('/crop-management/add')}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Tambah Plot Baru
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        {/* Crop Statistics Cards - Show for both admin and staff */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Jumlah</p>
                  <p className="text-2xl font-bold text-primary">{cropStats.total}</p>
                </div>
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Aktif</p>
                  <p className="text-2xl font-bold text-green-600">{cropStats.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Penuaian</p>
                  <p className="text-2xl font-bold text-yellow-600">{cropStats.harvest}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Selesai</p>
                  <p className="text-2xl font-bold text-blue-600">{cropStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Gagal</p>
                  <p className="text-2xl font-bold text-red-600">{cropStats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral h-5 w-5" />
                <input
                  type="text"
                  placeholder="Cari plot mengikut ID, status, jenis tanaman, atau pekerja..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select 
              className="input-field max-w-[200px]" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Ditanam">Ditanam</option>
              <option value="Sedang Tumbuh">Sedang Tumbuh</option>
              <option value="Penuaian">Penuaian</option>
              <option value="Selesai">Selesai</option>
              <option value="Gagal">Gagal</option>
            </select>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
                className="btn-secondary whitespace-nowrap"
              >
                Kosongkan
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            {loading && filteredCrops.length === 0 && crops.length === 0 ? (
              <p className="text-center py-10">Memuatkan data plot...</p>
            ) : !loading && filteredCrops.length === 0 && !error ? (
              <p className="text-center py-10 text-neutral">
                {crops.length === 0 ? 'Tiada data plot tanaman ditemui.' : 'Tiada plot yang sepadan dengan carian.'}
              </p>
            ) : (
              <table className="w-full min-w-[900px]">
                <thead className="bg-primary/5 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">ID Plot</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Saiz Plot</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Tarikh Penanaman</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Hasil Dijangka</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Hasil Sebenar</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCrops.map((crop) => (
                    <tr key={crop.id} className={`hover:bg-primary/5 ${isDeleting === crop.id ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 text-sm text-neutral-dark font-medium whitespace-nowrap">{crop.plotId}</td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">{crop.plotSize}</td>
                      <td className="py-3 px-4 text-sm whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          crop.status === 'Aktif' ? 'bg-green-100 text-green-800' :
                          crop.status === 'Penuaian' ? 'bg-yellow-100 text-yellow-800' :
                          crop.status === 'Selesai' ? 'bg-blue-100 text-blue-800' :
                          crop.status === 'Gagal' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {crop.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        {formatDate(crop.plantingDate)}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">{crop.expectedYield || '-'}</td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">{crop.actualYield || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => router.push(`/crop-management/plot/${crop.id}`)}
                            className="p-1 text-primary hover:bg-gray-100 rounded-full"
                            title="Lihat Butiran Plot"
                            disabled={isDeleting === crop.id}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <>
                              <button 
                                onClick={() => router.push(`/crop-management/edit/${crop.id}`)}
                                className="p-1 text-primary hover:bg-gray-100 rounded-full"
                                title="Kemaskini Plot"
                                disabled={isDeleting === crop.id}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(crop.id)}
                                className="p-1 text-error hover:bg-gray-100 rounded-full disabled:opacity-50"
                                title="Padam Plot"
                                disabled={isDeleting === crop.id}
                              >
                                {isDeleting === crop.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-error"></div>
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 