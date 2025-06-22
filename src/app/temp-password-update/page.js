'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Key } from 'lucide-react';

export default function TempPasswordUpdatePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    userId: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/temp-password-update');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Gagal memuat data pengguna');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.userId) {
      setError('Sila pilih pengguna');
      setSubmitting(false);
      return;
    }

    if (!formData.newPassword) {
      setError('Sila masukkan kata laluan baru');
      setSubmitting(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Kata laluan mestilah sekurang-kurangnya 6 aksara');
      setSubmitting(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Kata laluan tidak sepadan');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/temp-password-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: formData.userId,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengemaskini kata laluan');
      }

      setSuccess(data.message);
      // Reset form
      setFormData({
        userId: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUser = users.find(user => user.id === parseInt(formData.userId));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F2]">
        <div className="text-lg">Memuat data pengguna...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#2D5A27] hover:opacity-80 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Log Masuk
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Key className="h-6 w-6 text-[#2D5A27]" />
              <h1 className="text-2xl font-bold text-gray-800">Kemaskini Kata Laluan Sementara</h1>
            </div>
            <p className="text-gray-600">
              Halaman ini adalah untuk kemaskini kata laluan pengguna secara sementara. 
              Sila pilih pengguna dan masukkan kata laluan baru.
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Pengguna
              </label>
              <select
                id="userId"
                name="userId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D5A27] focus:border-[#2D5A27] text-black"
                value={formData.userId}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="">-- Pilih Pengguna --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email}) - {user.role}
                    {user.staff && ` - ${user.staff.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Maklumat Pengguna Dipilih:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nama Pengguna:</span> {selectedUser.username}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedUser.email}
                  </div>
                  <div>
                    <span className="font-medium">Peranan:</span> {selectedUser.role}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedUser.status}
                  </div>
                  {selectedUser.staff && (
                    <>
                      <div>
                        <span className="font-medium">Nama Kakitangan:</span> {selectedUser.staff.name}
                      </div>
                      <div>
                        <span className="font-medium">ID Kakitangan:</span> {selectedUser.staff.staffId}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Laluan Baru
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D5A27] focus:border-[#2D5A27] text-black"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="Masukkan kata laluan baru (min. 6 aksara)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Sahkan Kata Laluan Baru
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2D5A27] focus:border-[#2D5A27] text-black"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Masukkan semula kata laluan baru"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link
                href="/login"
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                className="flex-1 bg-[#2D5A27] text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Mengemaskini...' : 'Kemaskini Kata Laluan'}
              </button>
            </div>
          </form>
        </div>

        {/* Warning Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ Amaran
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Halaman ini adalah untuk kemaskini kata laluan secara sementara sahaja. 
                  Kata laluan akan dienkripsi menggunakan bcrypt sebelum disimpan dalam pangkalan data. 
                  Pastikan anda memberitahu pengguna tentang kata laluan baru mereka.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}