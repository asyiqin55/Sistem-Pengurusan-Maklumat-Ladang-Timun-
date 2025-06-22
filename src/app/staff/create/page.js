'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateStaffPage() {
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [formData, setFormData] = useState({
    userId: '', // New field for linking to user account
    name: '',
    idNumber: '',
    gender: '',
    email: '',
    phone: '',
    position: 'Staff', // Hidden field, always "Staff"
    salary: '',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  // Fetch users without staff records on component mount
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        console.log('[CREATE STAFF PAGE] Fetching users without staff records');
        const response = await authenticatedFetch('/api/staff?action=users-without-staff');
        
        if (!response.ok) {
          throw new Error('Gagal mengambil senarai pengguna');
        }
        
        const users = await response.json();
        console.log('[CREATE STAFF PAGE] Available users fetched:', { count: users.length });
        setAvailableUsers(users);
      } catch (err) {
        console.error('[CREATE STAFF PAGE] Error fetching users:', err);
        setError('Gagal mengambil senarai pengguna: ' + err.message);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAvailableUsers();
  }, [authenticatedFetch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-fill email when user is selected
    if (name === 'userId' && value) {
      const selectedUser = availableUsers.find(user => user.id === parseInt(value));
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          email: selectedUser.email
        }));
      }
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // User selection validation
    if (!formData.userId) {
      errors.userId = 'Sila pilih pengguna dari senarai';
    }
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Nama penuh diperlukan';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nama mesti sekurang-kurangnya 2 aksara';
    }
    
    // IC Number validation (Malaysian IC format)
    if (!formData.idNumber.trim()) {
      errors.idNumber = 'Nombor kad pengenalan diperlukan';
    } else {
      const icPattern = /^\d{6}[\s-]?\d{2}[\s-]?\d{4}$/;
      if (!icPattern.test(formData.idNumber.replace(/\s/g, ''))) {
        errors.idNumber = 'Format nombor IC tidak sah (contoh: 900101-01-1234)';
      }
    }
    
    // Gender validation
    if (!formData.gender) {
      errors.gender = 'Sila pilih jantina';
    }
    
    // Email validation (auto-filled, but still validate)
    if (!formData.email.trim()) {
      errors.email = 'Alamat email diperlukan';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        errors.email = 'Format email tidak sah';
      }
    }
    
    // Phone validation (Malaysian phone format)
    if (!formData.phone.trim()) {
      errors.phone = 'Nombor telefon diperlukan';
    } else {
      const phonePattern = /^(\+?6?01[0-9][\s-]?\d{3}[\s-]?\d{4}|\+?6?0[2-9][\s-]?\d{3}[\s-]?\d{4})$/;
      if (!phonePattern.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Format nombor telefon tidak sah (contoh: 013-1234567)';
      }
    }
    
    // Position is automatically set to "Staff"
    
    // Salary validation
    if (!formData.salary || formData.salary <= 0) {
      errors.salary = 'Gaji mesti lebih besar daripada 0';
    } else if (parseFloat(formData.salary) > 100000) {
      errors.salary = 'Gaji tidak boleh melebihi RM 100,000';
    }
    
    // Join date validation
    if (!formData.joinDate) {
      errors.joinDate = 'Tarikh mula kerja diperlukan';
    } else {
      const joinDate = new Date(formData.joinDate);
      const today = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(today.getFullYear() + 1);
      
      if (joinDate > oneYearFromNow) {
        errors.joinDate = 'Tarikh mula kerja tidak boleh lebih dari 1 tahun dari sekarang';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[CREATE STAFF PAGE] Starting handleSubmit:', {
      userId: formData.userId,
      name: formData.name,
      position: formData.position,
      email: formData.email
    });
    
    // Validate form before submission
    if (!validateForm()) {
      console.log('[CREATE STAFF PAGE] Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('[CREATE STAFF PAGE] Making create staff API request');
      
      const response = await authenticatedFetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          action: 'create-staff-with-user'
        }),
      });

      console.log('[CREATE STAFF PAGE] Create staff response:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CREATE STAFF PAGE] Create staff failed:', errorData);
        throw new Error(errorData.error || `Gagal mencipta staf baru: Status ${response.status}`);
      }

      const createdStaff = await response.json();
      console.log('[CREATE STAFF PAGE] Staff created successfully:', {
        staffId: createdStaff.id,
        name: createdStaff.name
      });

      setSuccess(true);
      console.log('[CREATE STAFF PAGE] Redirecting to staff list...');
      // On successful creation, redirect to the staff list page after a brief delay
      setTimeout(() => {
        router.push('/staff');
      }, 2000);

    } catch (err) {
      console.error('[CREATE STAFF PAGE] Error in handleSubmit:', {
        message: err.message
      });
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      console.log('[CREATE STAFF PAGE] handleSubmit completed');
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Kembali"
          >
            <ArrowLeft className="h-5 w-5 text-neutral" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">
              Tambah Staf Baru
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Ralat: {error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 border border-green-300 rounded-md flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Staf berjaya dicipta! Mengalihkan ke senarai staf...</span>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Information Note */}
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Nota:</strong> Pilih pengguna yang telah mempunyai akaun login untuk mengaitkan rekod kakitangan. 
                    ID Staf akan dijana secara automatik.
                  </p>
                </div>
              </div>

              {/* User Selection */}
              <div className="md:col-span-2">
                <label htmlFor="userId" className="block text-sm font-medium text-neutral-dark mb-2">
                  Pilih Pengguna <span className="text-error">*</span>
                </label>
                {loadingUsers ? (
                  <div className="input-field bg-gray-50 text-gray-500">
                    Memuat pengguna...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-700">
                      Tiada pengguna yang tersedia. Semua pengguna staf/pekerja sudah mempunyai rekod kakitangan.
                      <br />
                      <a href="/admin/users/add" className="text-primary hover:underline">
                        Cipta akaun pengguna baru di sini
                      </a>
                    </p>
                  </div>
                ) : (
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className={`input-field ${fieldErrors.userId ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">-- Pilih Pengguna --</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.userId && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.userId}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-dark mb-2">
                  Nama Penuh <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input-field ${fieldErrors.name ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  required
                  placeholder="Masukkan nama penuh"
                />
                {fieldErrors.name && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.name}
                  </div>
                )}
              </div>

              {/* IC Number */}
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-neutral-dark mb-2">
                  Nombor Kad Pengenalan <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className={`input-field ${fieldErrors.idNumber ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  required
                  placeholder="900101-01-1234"
                />
                {fieldErrors.idNumber && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.idNumber}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-neutral-dark mb-2">
                  Jantina <span className="text-error">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`input-field ${fieldErrors.gender ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">-- Pilih Jantina --</option>
                  <option value="Lelaki">Lelaki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                {fieldErrors.gender && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.gender}
                  </div>
                )}
              </div>

              {/* Email (auto-filled) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-dark mb-2">
                  Alamat Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-field bg-gray-50 ${fieldErrors.email ? 'border-red-500' : ''}`}
                  disabled={true}
                  required
                  placeholder="Email akan diisi automatik"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email diambil daripada akaun pengguna yang dipilih
                </p>
                {fieldErrors.email && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-dark mb-2">
                  Nombor Telefon <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`input-field ${fieldErrors.phone ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  required
                  placeholder="013-1234567"
                />
                {fieldErrors.phone && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.phone}
                  </div>
                )}
              </div>

              {/* Position is hidden and automatically set to "Staff" */}

              {/* Salary */}
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-neutral-dark mb-2">
                  Gaji Bulanan (RM) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className={`input-field ${fieldErrors.salary ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  required
                  min="0"
                  max="100000"
                  step="0.01"
                  placeholder="0.00"
                />
                {fieldErrors.salary && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.salary}
                  </div>
                )}
              </div>

              {/* Join Date */}
              <div>
                <label htmlFor="joinDate" className="block text-sm font-medium text-neutral-dark mb-2">
                  Tarikh Mula Kerja <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  id="joinDate"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                  className={`input-field ${fieldErrors.joinDate ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  required
                />
                {fieldErrors.joinDate && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.joinDate}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-neutral-dark mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || availableUsers.length === 0}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Staf'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

