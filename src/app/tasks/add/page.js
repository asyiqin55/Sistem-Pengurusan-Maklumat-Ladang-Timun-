'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

export default function AddTask() {
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  
  const [formData, setFormData] = useState({
    taskId: '',
    name: '',
    description: '',
    userId: '',
    plotId: '',
    startDate: '',
    endDate: '',
    status: 'belum selesai',
    priority: 'medium',
    notes: ''
  });
  
  const [presetTasks, setPresetTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignablePlots, setAssignablePlots] = useState([]);
  const [selectedPresetTask, setSelectedPresetTask] = useState('');
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [originalFormData, setOriginalFormData] = useState({ name: '', description: '' });

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch preset tasks
        setIsLoadingPresets(true);
        const presetsResponse = await authenticatedFetch('/api/preset-tasks');
        if (presetsResponse.ok) {
          const presetsData = await presetsResponse.json();
          setPresetTasks(presetsData);
        } else {
          console.error('Failed to fetch preset tasks');
        }
      } catch (error) {
        console.error('Error fetching preset tasks:', error);
      } finally {
        setIsLoadingPresets(false);
      }

      try {
        // Fetch assignable users
        setIsLoadingUsers(true);
        const usersResponse = await authenticatedFetch('/api/users/assignable');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setAssignableUsers(usersData);
        } else {
          console.error('Failed to fetch assignable users');
        }
      } catch (error) {
        console.error('Error fetching assignable users:', error);
      } finally {
        setIsLoadingUsers(false);
      }

      try {
        // Fetch assignable plots
        setIsLoadingPlots(true);
        const plotsResponse = await authenticatedFetch('/api/plots/assignable');
        if (plotsResponse.ok) {
          const plotsData = await plotsResponse.json();
          setAssignablePlots(plotsData);
        } else {
          console.error('Failed to fetch assignable plots');
        }
      } catch (error) {
        console.error('Error fetching assignable plots:', error);
      } finally {
        setIsLoadingPlots(false);
      }
    };

    fetchData();
  }, [authenticatedFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Generate taskId if not provided
      let taskId = formData.taskId;
      if (!taskId) {
        // Auto-generate task ID based on timestamp
        const now = new Date();
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        taskId = `TSK${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${randomSuffix}`;
      }

      const submitData = {
        ...formData,
        taskId,
        userId: parseInt(formData.userId),
        cropId: formData.plotId ? parseInt(formData.plotId) : null,
        attachments: []
      };

      const response = await authenticatedFetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal menambah tugasan: Status ${response.status}`);
      }

      router.push('/tasks');

    } catch (err) {
      console.error("Error adding task:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePresetTaskChange = (e) => {
    const presetTaskId = e.target.value;
    setSelectedPresetTask(presetTaskId);
    
    if (presetTaskId === '') {
      // Clear fields when no preset is selected
      setFormData(prev => ({
        ...prev,
        name: originalFormData.name,
        description: originalFormData.description
      }));
    } else {
      // Find the selected preset task and auto-fill the form
      const selectedPreset = presetTasks.find(task => task.id.toString() === presetTaskId);
      if (selectedPreset) {
        // Store original values if not already stored
        if (originalFormData.name === '' && originalFormData.description === '') {
          setOriginalFormData({
            name: formData.name,
            description: formData.description
          });
        }
        
        setFormData(prev => ({
          ...prev,
          name: selectedPreset.name,
          description: selectedPreset.description
        }));
      }
    }
  };



  return (
    <main className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/tasks"
            className="text-primary hover:opacity-80 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali ke Tugasan
          </Link>
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Tambah Tugasan Baru
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  ID Tugasan (Pilihan)
                </label>
                <input
                  type="text"
                  name="taskId"
                  value={formData.taskId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Biarkan kosong untuk jana secara automatik"
                  disabled={isSubmitting}
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-neutral mb-1">
                  Tugas Preset (Pilihan)
                </label>
                <select
                  value={selectedPresetTask}
                  onChange={handlePresetTaskChange}
                  className="input-field"
                  disabled={isLoadingPresets}
                >
                  <option value="">
                    {isLoadingPresets ? 'Loading preset tasks...' : '-- Select a Preset Task --'}
                  </option>
                  {presetTasks.map((preset) => (
                    <option key={preset.id} value={preset.id.toString()}>
                      {preset.taskId} - {preset.name}
                    </option>
                  ))}
                </select>
                {isLoadingPresets && (
                  <p className="text-sm text-neutral/70 mt-1">Loading available preset tasks...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Nama Tugasan
                  {selectedPresetTask && (
                    <span className="text-xs text-primary ml-2">(Diisi automatik dari preset)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-field ${selectedPresetTask ? 'bg-primary/5 border-primary/30' : ''}`}
                  required
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-neutral mb-1">
                  Penerangan
                  {selectedPresetTask && (
                    <span className="text-xs text-primary ml-2">(Diisi automatik dari preset)</span>
                  )}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`input-field ${selectedPresetTask ? 'bg-primary/5 border-primary/30' : ''}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Ditugaskan Kepada
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={isLoadingUsers}
                >
                  <option value="">
                    {isLoadingUsers ? 'Memuatkan pekerja...' : 'Pilih pekerja'}
                  </option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} ({user.role === 'staff' ? 'Staf' : 'Pekerja'})
                    </option>
                  ))}
                </select>
                {isLoadingUsers && (
                  <p className="text-sm text-neutral/70 mt-1">Memuatkan senarai pekerja...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Plot Berkaitan (Pilihan)
                </label>
                <select
                  name="plotId"
                  value={formData.plotId}
                  onChange={handleChange}
                  className="input-field"
                  disabled={isLoadingPlots}
                >
                  <option value="">
                    {isLoadingPlots ? 'Memuatkan plot...' : 'Pilih plot (atau biarkan kosong untuk tugasan umum)'}
                  </option>
                  {assignablePlots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.plotId} - {plot.cropType || 'Timun'}
                    </option>
                  ))}
                </select>
                {isLoadingPlots && (
                  <p className="text-sm text-neutral/70 mt-1">Memuatkan senarai plot...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="belum selesai">Belum Selesai</option>
                  <option value="sedang dijalankan">Sedang Dijalankan</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Keutamaan
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sederhana</option>
                  <option value="high">Tinggi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Tarikh Mula
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral mb-1">
                  Tarikh Akhir
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-neutral mb-1">
                  Nota (Pilihan)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="input-field"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/tasks">
                <button type="button" className="btn-secondary" disabled={isSubmitting}>
                  Batal
                </button>
              </Link>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tugasan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 