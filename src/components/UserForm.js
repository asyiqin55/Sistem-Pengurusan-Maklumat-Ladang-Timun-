'use client';

import { useState } from 'react';



export default function UserForm({ initialData = {}, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    username: initialData.username || '',
    email: initialData.email || '',
    password: '',
    role: initialData.role || 'staff',
    status: initialData.status || 'active',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Maklumat Pengguna</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="username" className="label">Nama Pengguna</label>
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
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Masukkan alamat email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="label">Kata Laluan</label>
            <input
              id="password"
              name="password"
              type="password"
              required={!initialData.id}
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={initialData.id ? "Biarkan kosong untuk kekalkan kata laluan semasa" : "Masukkan kata laluan"}
            />
          </div>
          
          <div>
            <label htmlFor="role" className="label">Peranan</label>
            <select
              id="role"
              name="role"
              required
              className="input-field"
              value={formData.role}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="worker">Pekerja</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="label">Status</label>
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

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Nota Penting</h4>
              <p className="text-sm text-blue-700 mt-1">
                Akaun pengguna ini hanya untuk tujuan log masuk. Butiran kakitangan tambahan akan diuruskan di halaman Staff.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
        </button>
      </div>
    </form>
  );
}

