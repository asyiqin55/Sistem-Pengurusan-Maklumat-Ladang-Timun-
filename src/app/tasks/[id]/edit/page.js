'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ClipboardList, ArrowLeft, Upload, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';

export default function EditTask() {
  const router = useRouter();
  const params = useParams();
  const { user, authenticatedFetch } = useAuth();
  const taskId = params.id;
  
  const [formData, setFormData] = useState({
    taskId: '',
    name: '',
    description: '',
    userId: '',
    cropId: '',
    startDate: '',
    endDate: '',
    status: 'belum selesai',
    priority: 'medium',
    notes: '',
    attachments: []
  });
  
  const [originalTask, setOriginalTask] = useState(null);
  const [presetTasks, setPresetTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignableCrops, setAssignableCrops] = useState([]);
  const [selectedPresetTask, setSelectedPresetTask] = useState('');
  
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingCrops, setIsLoadingCrops] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is admin - redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/tasks');
      return;
    }
  }, [user, router]);

  // Fetch task data
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !user) return;
      
      try {
        setIsLoadingTask(true);
        const response = await authenticatedFetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Gagal mendapatkan data tugasan');
        }
        
        const tasks = await response.json();
        const task = tasks.find(t => t.id.toString() === taskId);
        
        if (!task) {
          throw new Error('Tugasan tidak ditemui');
        }
        
        setOriginalTask(task);
        
        // Format dates for input fields
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          return new Date(dateString).toISOString().split('T')[0];
        };
        
        setFormData({
          taskId: task.taskId || '',
          name: task.name || '',
          description: task.description || '',
          userId: task.assignedTo?.id?.toString() || '',
          cropId: task.crop?.id?.toString() || '',
          startDate: formatDateForInput(task.startDate),
          endDate: formatDateForInput(task.endDate),
          status: task.status || 'belum selesai',
          priority: task.priority || 'medium',
          notes: task.notes || '',
          attachments: []
        });
        
      } catch (err) {
        console.error('Error fetching task:', err);
        setError(err.message);
      } finally {
        setIsLoadingTask(false);
      }
    };

    fetchTask();
  }, [taskId, user, authenticatedFetch]);

  // Fetch preset tasks, users, and crops
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch preset tasks
        setIsLoadingPresets(true);
        const presetsResponse = await authenticatedFetch('/api/preset-tasks');
        if (presetsResponse.ok) {
          const presetsData = await presetsResponse.json();
          setPresetTasks(presetsData);
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
        }
      } catch (error) {
        console.error('Error fetching assignable users:', error);
      } finally {
        setIsLoadingUsers(false);
      }

      try {
        // Fetch assignable crops
        setIsLoadingCrops(true);
        const cropsResponse = await authenticatedFetch('/api/crops/assignable');
        if (cropsResponse.ok) {
          const cropsData = await cropsResponse.json();
          setAssignableCrops(cropsData);
        }
      } catch (error) {
        console.error('Error fetching assignable crops:', error);
      } finally {
        setIsLoadingCrops(false);
      }
    };

    fetchData();
  }, [user, authenticatedFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        id: parseInt(taskId),
        taskId: formData.taskId,
        name: formData.name,
        description: formData.description,
        userId: parseInt(formData.userId),
        cropId: formData.cropId ? parseInt(formData.cropId) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes,
        attachments: formData.attachments
      };

      const response = await authenticatedFetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal mengemaskini tugasan: Status ${response.status}`);
      }

      router.push('/tasks');

    } catch (err) {
      console.error("Error updating task:", err);
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
      // Reset to original values
      if (originalTask) {
        setFormData(prev => ({
          ...prev,
          name: originalTask.name || '',
          description: originalTask.description || ''
        }));
      }
    } else {
      // Find the selected preset task and auto-fill the form
      const selectedPreset = presetTasks.find(task => task.id.toString() === presetTaskId);
      if (selectedPreset) {
        setFormData(prev => ({
          ...prev,
          name: selectedPreset.name,
          description: selectedPreset.description
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Show loading screen if still loading task data
  if (isLoadingTask) {
    return (
      <main className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span className="text-neutral">Memuat data tugasan...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show error if task not found or access denied
  if (error && !originalTask) {
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
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">Ralat</span>
            </div>
            <p className="text-red-600">{error}</p>
            <Link href="/tasks" className="btn-secondary mt-4 inline-block">
              Kembali ke Senarai Tugasan
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            Kemaskini Tugasan
          </h1>
          {originalTask && (
            <p className="text-neutral mt-2">
              Mengemaskini: {originalTask.taskId} - {originalTask.name}
            </p>
          )}
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
                  ID Tugasan
                </label>
                <input
                  type="text"
                  name="taskId"
                  value={formData.taskId}
                  onChange={handleChange}
                  className="input-field"
                  required
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
                    {isLoadingPresets ? 'Loading preset tasks...' : '-- Pilih Preset Untuk Ganti --'}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isLoadingUsers || isSubmitting}
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
                  name="cropId"
                  value={formData.cropId}
                  onChange={handleChange}
                  className="input-field"
                  disabled={isLoadingCrops || isSubmitting}
                >
                  <option value="">
                    {isLoadingCrops ? 'Memuatkan plot...' : 'Pilih plot (atau biarkan kosong untuk tugasan umum)'}
                  </option>
                  {assignableCrops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.displayName}
                    </option>
                  ))}
                </select>
                {isLoadingCrops && (
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
                  disabled={isSubmitting}
                >
                  <option value="belum selesai">Belum Selesai</option>
                  <option value="sedang dijalankan">Sedang Dijalankan</option>
                  <option value="selesai">Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
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
                  disabled={isSubmitting}
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

              <div className="col-span-full">
                <label className="block text-sm font-medium text-neutral mb-1">
                  Attachments
                </label>
                <div className="mt-1">
                  <div className="border-2 border-dashed border-neutral/30 rounded-lg p-6">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-neutral mb-2" />
                      <p className="text-sm text-neutral mb-1">
                        Drag and drop files here, or click to select files
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="file-upload"
                        className="btn-secondary cursor-pointer"
                      >
                        Select Files
                      </label>
                    </div>
                  </div>
                  {formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-neutral">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-error hover:opacity-80"
                            disabled={isSubmitting}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/tasks">
                <button type="button" className="btn-secondary" disabled={isSubmitting}>
                  Batal
                </button>
              </Link>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}