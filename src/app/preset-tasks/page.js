'use client';

import { useState, useEffect } from 'react';
import { Plus, ClipboardList, Search, Edit2, XCircle, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PresetTasks() {
  const { user, authenticatedFetch } = useAuth();
  const [presetTasks, setPresetTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchPresetTasks();
    }
  }, [user]);

  // Enhanced filtering logic for preset tasks
  useEffect(() => {
    let filtered = presetTasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [presetTasks, searchTerm]);

  const fetchPresetTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/preset-tasks');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const fetchedTasks = await response.json();
      setPresetTasks(fetchedTasks);
      setFilteredTasks(fetchedTasks);
    } catch (err) {
      console.error("Error fetching preset tasks:", err);
      setError(err.message || 'Gagal memuatkan data tugas preset. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Nama dan deskripsi adalah wajib.');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch('/api/preset-tasks', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newTask = await response.json();
      setPresetTasks(prev => [newTask, ...prev]);
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
      setSuccess('Tugas preset berjaya ditambah!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error creating preset task:", err);
      setError(err.message);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Nama dan deskripsi adalah wajib.');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch(`/api/preset-tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const updatedTask = await response.json();
      setPresetTasks(prev => prev.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ));
      setEditingTask(null);
      setFormData({ name: '', description: '' });
      setSuccess('Tugas preset berjaya dikemaskini!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating preset task:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam tugas preset "${task.name}"?`)) {
      return;
    }
    setIsDeleting(task.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch(`/api/preset-tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        setPresetTasks(prev => prev.filter(t => t.id !== task.id));
        setSuccess('Tugas preset berjaya dipadam!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal memadam: Status ${response.status}`);
      }
    } catch (err) {
      console.error("Error deleting preset task:", err);
      setError(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description
    });
    setShowAddForm(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({ name: '', description: '' });
    setError(null);
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setFormData({ name: '', description: '' });
    setError(null);
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Pengurusan Tugas Preset
          </h1>
          {user?.role === 'admin' && (
            <button 
              onClick={() => {
                setShowAddForm(true);
                setEditingTask(null);
                setFormData({ name: '', description: '' });
                setError(null);
              }}
              className="btn-primary"
              disabled={showAddForm || editingTask}
            >
              <Plus className="h-5 w-5" />
              Tambah Tugas Preset
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 border border-green-300 rounded-md">
            {success}
          </div>
        )}

        {/* Statistics Card */}
        {user && presetTasks.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">Ringkasan Tugas Preset</h3>
                <p className="text-sm text-neutral">Jumlah tugas preset yang tersedia</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{presetTasks.length}</div>
                <div className="text-sm text-neutral">Tugas Preset</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        {presetTasks.length > 0 && (
          <div className="card mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Cari tugas preset mengikut nama atau deskripsi..."
                    className="input-field pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-secondary whitespace-nowrap"
                >
                  Kosongkan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Add Form */}
        {user?.role === 'admin' && showAddForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Tambah Tugas Preset Baru</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Tugas *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Masukkan nama tugas preset"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows="3"
                  placeholder="Masukkan deskripsi tugas preset"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  <Save className="h-4 w-4" />
                  Simpan
                </button>
                <button 
                  type="button" 
                  onClick={cancelAdd}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {user?.role === 'admin' && editingTask && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-primary mb-4">
              Kemaskini Tugas Preset: {editingTask.taskId}
            </h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Tugas *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Masukkan nama tugas preset"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows="3"
                  placeholder="Masukkan deskripsi tugas preset"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  <Save className="h-4 w-4" />
                  Kemaskini
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks Table */}
        <div className="card">
          <div className="overflow-x-auto">
            {loading && filteredTasks.length === 0 && presetTasks.length === 0 ? (
              <p className="text-center py-10">Memuatkan data tugas preset...</p>
            ) : !loading && filteredTasks.length === 0 && !error ? (
              <p className="text-center py-10 text-neutral">
                {presetTasks.length === 0 ? 'Tiada tugas preset ditemui.' : 'Tiada tugas preset yang sepadan dengan carian.'}
              </p>
            ) : (
              <table className="w-full min-w-[700px]">
                <thead className="bg-primary/5 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">ID Tugas</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Nama</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Deskripsi</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className={`hover:bg-primary/5 ${isDeleting === task.id ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap font-mono">
                        {task.taskId}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark font-medium">
                        {task.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark">
                        <div className="max-w-md">
                          {task.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          {user?.role === 'admin' ? (
                            <>
                              <button 
                                onClick={() => startEdit(task)}
                                className="p-1 text-primary hover:bg-gray-100 rounded-full"
                                title="Kemaskini Tugas Preset"
                                disabled={isDeleting === task.id || showAddForm || editingTask}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(task)}
                                className="p-1 text-red-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
                                title="Padam Tugas Preset"
                                disabled={isDeleting === task.id || showAddForm || editingTask}
                              >
                                {isDeleting === task.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-neutral px-2 py-1 bg-gray-100 rounded">
                              Lihat Sahaja
                            </span>
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