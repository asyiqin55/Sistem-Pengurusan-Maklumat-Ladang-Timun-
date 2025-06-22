'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to format date for input type="date"
const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date for input:", date, e);
    return '';
  }
};

export default function StaffForm({ initialData = {}, onSubmit, isSubmitting, isEdit = false }) {
  const { authenticatedFetch } = useAuth();
  const [formData, setFormData] = useState({
    selectedStaffId: initialData.id || '',
    username: initialData.username || '',
    email: initialData.email || '',
    password: '',
    role: initialData.role || 'staff',
    status: initialData.status || 'active',
    // Staff display data (read-only)
    staffId: initialData.staffId || '',
    name: initialData.name || '',
    idNumber: initialData.idNumber || '',
    gender: initialData.gender || 'Lelaki',
    phone: initialData.phone || '',
    position: initialData.position || '',
    salary: initialData.salary || '',
    joinDate: formatDateForInput(initialData.joinDate) || '',
  });

  const [availableStaff, setAvailableStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffData, setSelectedStaffData] = useState(null);

  // Fetch available staff when component mounts (for add mode)
  useEffect(() => {
    if (!isEdit && authenticatedFetch) {
      fetchAvailableStaff();
    }
  }, [isEdit, authenticatedFetch]);

  // Update form if initialData changes (for edit mode after fetch)
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData(prev => ({
        ...prev,
        selectedStaffId: initialData.id || '',
        username: initialData.username || '',
        email: initialData.email || '',
        role: initialData.role || 'staff',
        status: initialData.status || 'active',
        // Staff display data
        staffId: initialData.staffId || '',
        name: initialData.name || '',
        idNumber: initialData.idNumber || '',
        gender: initialData.gender || 'Lelaki',
        phone: initialData.phone || '',
        position: initialData.position || '',
        salary: initialData.salary || '',
        joinDate: formatDateForInput(initialData.joinDate) || '',
      }));
    }
  }, [initialData, isEdit]);

  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await authenticatedFetch('/api/admin/unassigned-staff');
      if (response.ok) {
        const staff = await response.json();
        setAvailableStaff(staff);
      } else {
        console.error('Failed to fetch unassigned staff');
      }
    } catch (error) {
      console.error('Error fetching unassigned staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'selectedStaffId') {
      // Handle staff selection
      const selectedStaff = availableStaff.find(staff => staff.id.toString() === value);
      if (selectedStaff) {
        setSelectedStaffData(selectedStaff);
        setFormData(prev => ({
          ...prev,
          selectedStaffId: value,
          email: selectedStaff.email,
          // Update display fields
          staffId: selectedStaff.staffId,
          name: selectedStaff.name,
          idNumber: selectedStaff.idNumber,
          gender: selectedStaff.gender,
          phone: selectedStaff.phone,
          position: selectedStaff.position,
          salary: selectedStaff.salary,
          joinDate: formatDateForInput(selectedStaff.joinDate),
        }));
      } else {
        setSelectedStaffData(null);
        setFormData(prev => ({
          ...prev,
          selectedStaffId: '',
          email: '',
          staffId: '',
          name: '',
          idNumber: '',
          gender: 'Lelaki',
          phone: '',
          position: '',
          salary: '',
          joinDate: '',
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      selectedStaffId: formData.selectedStaffId,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      status: formData.status,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEdit && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pilih Staf</h3>
          
          <div>
            <label htmlFor="selectedStaffId" className="label">
              ID Staf <span className="text-red-500">*</span>
            </label>
            {loadingStaff ? (
              <div className="input-field flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="ml-2">Memuatkan senarai staf...</span>
              </div>
            ) : (
              <select
                id="selectedStaffId"
                name="selectedStaffId"
                required
                className="input-field"
                value={formData.selectedStaffId}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">-- Pilih Staf untuk Beri Akaun Login --</option>
                {availableStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.staffId} - {staff.name} ({staff.position})
                  </option>
                ))}
              </select>
            )}
            {availableStaff.length === 0 && !loadingStaff && (
              <p className="text-sm text-orange-600 mt-1">
                Tiada staf yang tersedia untuk diberikan akaun login. 
                Semua staf sudah mempunyai akaun atau tiada rekod staf.
              </p>
            )}
          </div>
          
          {availableStaff.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Pilih staf yang sedia ada untuk diberikan akaun login sistem. 
                Hanya staf yang belum mempunyai akaun akan dipaparkan.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedStaffData && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Maklumat Staf</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">ID Staf</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.staffId} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">Nama Penuh</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.name} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">No. IC</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.idNumber} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">Jantina</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.gender} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.phone} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">Jawatan</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.position} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">Gaji (RM)</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.salary} 
                disabled 
                readOnly 
              />
            </div>
            <div>
              <label className="label">Tarikh Mula Kerja</label>
              <input 
                className="input-field bg-gray-50" 
                value={formData.joinDate} 
                disabled 
                readOnly 
              />
            </div>
          </div>
        </div>
      )}

      {(selectedStaffData || isEdit) && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Akaun Login</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="label">
                Nama Pengguna <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                value={formData.username}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Masukkan nama pengguna"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Email akan diambil dari data staf"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Kata Laluan <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required={!isEdit}
                className="input-field"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={isEdit ? "Kosongkan jika tidak mahu tukar" : "Masukkan kata laluan"}
              />
            </div>
            
            <div>
              <label htmlFor="role" className="label">
                Peranan <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                className="input-field"
                value={formData.role}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="staff">Staff</option>
                <option value="worker">Pekerja</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="status" className="label">
                Status Akaun <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                required
                className="input-field"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        <button 
          type="button" 
          onClick={() => window.history.back()}
          className="btn-secondary" 
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button 
          type="submit" 
          className="btn-primary"
          disabled={isSubmitting || (!selectedStaffData && !isEdit)}
        >
          {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Kemaskini Akaun' : 'Cipta Akaun Login')}
        </button>
      </div>
    </form>
  );
} 