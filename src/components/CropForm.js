'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

export default function CropForm({ initialData = {}, onSubmit, isSubmitting }) {
  const { authenticatedFetch } = useAuth();
  const [formData, setFormData] = useState({
    plotId: initialData.plotId || '',
    length: initialData.length || '',
    width: initialData.width || '',
    expectedHarvestDate: formatDateForInput(initialData.expectedHarvestDate) || '',
    status: initialData.status || 'Aktif', // Default status
    plantingDate: formatDateForInput(initialData.plantingDate) || '',
    expectedYield: initialData.expectedYield || '',
    actualYield: initialData.actualYield || '',
    userId: initialData.userId || '', // Assuming userId might be needed
    notes: initialData.notes || ''
  });

  const [calculatedSize, setCalculatedSize] = useState('');
  const [plotIdError, setPlotIdError] = useState('');
  const [isCheckingPlotId, setIsCheckingPlotId] = useState(false);
  const [existingPlotIds, setExistingPlotIds] = useState([]);

  // Fetch existing plot IDs on component mount
  useEffect(() => {
    const fetchExistingPlotIds = async () => {
      try {
        const response = await authenticatedFetch('/api/crops');
        if (response.ok) {
          const crops = await response.json();
          const plotIds = crops.map(crop => crop.plotId);
          setExistingPlotIds(plotIds);
        }
      } catch (error) {
        console.error('Error fetching existing plot IDs:', error);
      }
    };

    fetchExistingPlotIds();
  }, [authenticatedFetch]);

  // If initialData changes (e.g., for edit form after fetch), update the form
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && initialData.id) {
      setFormData({
        plotId: initialData.plotId || '',
        length: initialData.length || '',
        width: initialData.width || '',
        expectedHarvestDate: formatDateForInput(initialData.expectedHarvestDate) || '',
        status: initialData.status || 'Aktif',
        plantingDate: formatDateForInput(initialData.plantingDate) || '',
        expectedYield: initialData.expectedYield || '',
        actualYield: initialData.actualYield || '',
        userId: initialData.userId || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  // Validate plotId for duplicates
  useEffect(() => {
    if (formData.plotId.trim() === '') {
      setPlotIdError('');
      return;
    }

    // Skip validation if this is an edit form with the same plotId
    if (initialData.id && initialData.plotId === formData.plotId) {
      setPlotIdError('');
      return;
    }

    setIsCheckingPlotId(true);
    
    // Check if plotId already exists
    if (existingPlotIds.includes(formData.plotId)) {
      setPlotIdError('ID Plot sudah wujud. Sila gunakan ID yang lain.');
    } else {
      setPlotIdError('');
    }
    
    setIsCheckingPlotId(false);
  }, [formData.plotId, existingPlotIds, initialData.id, initialData.plotId]);

  // Calculate plot size automatically from length and width
  useEffect(() => {
    const length = parseFloat(formData.length) || 0;
    const width = parseFloat(formData.width) || 0;
    if (length > 0 && width > 0) {
      const area = (length * width).toFixed(2);
      setCalculatedSize(`${area} m² (${formData.length}m x ${formData.width}m)`);
    } else {
      setCalculatedSize('');
    }
  }, [formData.length, formData.width]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent submission if there's a plotId validation error
    if (plotIdError) {
      return;
    }
    
    onSubmit(formData);
  };

  // You might fetch users here to populate the assigned user dropdown
  // const [users, setUsers] = useState([]);
  // useEffect(() => { fetchUsers().then(setUsers); }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="plotId" className="label">ID Plot</label>
          <input
            id="plotId"
            name="plotId"
            type="text"
            required
            className={`input-field ${plotIdError ? 'border-red-500 bg-red-50' : ''}`}
            value={formData.plotId}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {isCheckingPlotId && (
            <p className="text-sm text-blue-600 mt-1">Memeriksa ketersediaan ID Plot...</p>
          )}
          {plotIdError && (
            <p className="text-sm text-red-600 mt-1">{plotIdError}</p>
          )}
          {formData.plotId && !plotIdError && !isCheckingPlotId && (
            <p className="text-sm text-green-600 mt-1">ID Plot tersedia</p>
          )}
        </div>
        <div>
          <label htmlFor="status" className="label">Status Plot</label>
          <select
            id="status"
            name="status"
            required
            className="input-field"
            value={formData.status}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="Aktif">Aktif</option>
            <option value="Penuaian">Penuaian</option>
            <option value="Selesai">Selesai</option>
            <option value="Gagal">Gagal</option>
          </select>
        </div>
        <div>
          <label htmlFor="length" className="label">Panjang (meter)</label>
          <input
            id="length"
            name="length"
            type="number"
            required
            className="input-field"
            value={formData.length}
            onChange={handleChange}
            disabled={isSubmitting}
            step="0.1"
          />
        </div>
        <div>
          <label htmlFor="width" className="label">Lebar (meter)</label>
          <input
            id="width"
            name="width"
            type="number"
            required
            className="input-field"
            value={formData.width}
            onChange={handleChange}
            disabled={isSubmitting}
            step="0.1"
          />
        </div>
        <div className="col-span-full">
          <label htmlFor="plotSize" className="label">Saiz Plot (Dikira Secara Automatik)</label>
          <input
            id="plotSize"
            name="plotSize"
            type="text"
            className="input-field bg-gray-100"
            value={calculatedSize}
            readOnly
          />
        </div>
        <div>
          <label htmlFor="plantingDate" className="label">Tarikh Penanaman</label>
          <input
            id="plantingDate"
            name="plantingDate"
            type="date"
            required
            className="input-field"
            value={formData.plantingDate}
            onChange={handleChange}
            disabled={isSubmitting}
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
        </div>
        <div>
          <label htmlFor="expectedHarvestDate" className="label">Jangkaan Tarikh Tuai</label>
          <input
            id="expectedHarvestDate"
            name="expectedHarvestDate"
            type="date"
            className="input-field"
            value={formData.expectedHarvestDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="expectedYield" className="label">Hasil Dijangka (cth: 5 tan)</label>
          <input
            id="expectedYield"
            name="expectedYield"
            type="text"
            className="input-field"
            value={formData.expectedYield}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="actualYield" className="label">Hasil Sebenar (cth: 4.8 tan)</label>
          <input
            id="actualYield"
            name="actualYield"
            type="text"
            className="input-field"
            value={formData.actualYield}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
         {/* Optional: Assigned User - Requires fetching users */}
         {/* <div>
          <label htmlFor="userId" className="label">Pekerja Bertugas (Pilihan)</label>
          <select
            id="userId"
            name="userId"
            className="input-field"
            value={formData.userId}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="">-- Tiada --</option>
            {/* {users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))} * /}
          </select>
        </div> */} 
      </div>

      <div>
        <label htmlFor="notes" className="label">Nota (Pilihan)</label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          className="input-field"
          value={formData.notes}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-4">
        <button 
          type="button" 
          onClick={() => window.history.back()} // Simple back navigation
          className="btn-secondary" 
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button 
          type="submit" 
          className="btn-primary"
          disabled={isSubmitting || plotIdError || isCheckingPlotId}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Plot'}
        </button>
      </div>
    </form>
  );
} 