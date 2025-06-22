'use client';

import { useState, useEffect } from 'react';
import { Plus, ClipboardList, Search, Edit2, XCircle, Filter, Download, Calendar, AlertTriangle, CheckCircle2, Clock, User, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function Tasks() {
  const router = useRouter();
  const { user, authenticatedFetch } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignableCrops, setAssignableCrops] = useState([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 });

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      setError(null);
      try {
        const response = await authenticatedFetch('/api/tasks');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const fetchedTasks = await response.json();
        setTasks(fetchedTasks);
        setFilteredTasks(fetchedTasks);
        
        // Calculate task statistics
        const stats = {
          total: fetchedTasks.length,
          completed: fetchedTasks.filter(t => t.status === 'selesai').length,
          pending: fetchedTasks.filter(t => t.status === 'belum selesai').length,
          inProgress: fetchedTasks.filter(t => t.status === 'sedang dijalankan').length,
          overdue: fetchedTasks.filter(t => {
            const endDate = new Date(t.endDate);
            const today = new Date();
            return endDate < today && t.status !== 'selesai';
          }).length
        };
        setTaskStats(stats);
        
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err.message || 'Gagal memuatkan data tugasan. Sila cuba lagi.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Fetch assignable users and crops for admin filters
  useEffect(() => {
    async function fetchFilterData() {
      if (user?.role !== 'admin') return;
      
      try {
        const [usersResponse, cropsResponse] = await Promise.all([
          authenticatedFetch('/api/users/assignable'),
          authenticatedFetch('/api/crops/assignable')
        ]);
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setAssignableUsers(usersData);
        }
        
        if (cropsResponse.ok) {
          const cropsData = await cropsResponse.json();
          setAssignableCrops(cropsData);
        }
      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    }

    fetchFilterData();
  }, [user, authenticatedFetch]);

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.taskId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.crop?.plotId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(task => task.assignedTo?.id?.toString() === userFilter);
    }

    // Crop filter
    if (cropFilter) {
      filtered = filtered.filter(task => task.crop?.id?.toString() === cropFilter);
    }

    // Date range filter
    if (dateRangeFilter.start) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.startDate);
        const startDate = new Date(dateRangeFilter.start);
        return taskDate >= startDate;
      });
    }
    if (dateRangeFilter.end) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.endDate);
        const endDate = new Date(dateRangeFilter.end);
        return taskDate <= endDate;
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, userFilter, cropFilter, dateRangeFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString; // Return original string if formatting fails
    }
  };

  // Updated status handling to match seed data and translate
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'selesai':
        return { text: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      case 'sedang dijalankan':
        return { text: 'Sedang Dijalankan', color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'belum selesai':
        return { text: 'Belum Selesai', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
      case 'dibatalkan':
        return { text: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { text: status || 'Tidak Diketahui', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const getPriorityInfo = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { text: 'Tinggi', color: 'bg-red-100 text-red-800' };
      case 'medium':
        return { text: 'Sederhana', color: 'bg-yellow-100 text-yellow-800' };
      case 'low':
        return { text: 'Rendah', color: 'bg-green-100 text-green-800' };
      default:
        return { text: priority || 'Sederhana', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const isTaskOverdue = (task) => {
    const endDate = new Date(task.endDate);
    const today = new Date();
    return endDate < today && task.status !== 'selesai';
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Adakah anda pasti mahu memadam tugasan ini?')) {
      return;
    }

    setIsDeleting(taskId);
    setError(null);

    try {
      const response = await authenticatedFetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal memadam: Status ${response.status}`);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const response = await authenticatedFetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(currentTasks => 
          currentTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengemaskini status');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err.message);
    }
  };

  // Handle task selection for bulk operations
  const handleTaskSelection = (taskId, isSelected) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedTasks.length === 0) return;
    
    if (!window.confirm(`Adakah anda pasti mahu mengemas kini status ${selectedTasks.length} tugasan kepada "${getStatusInfo(newStatus).text}"?`)) {
      return;
    }

    try {
      const updatePromises = selectedTasks.map(taskId => 
        authenticatedFetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: taskId,
            status: newStatus
          })
        })
      );

      const responses = await Promise.all(updatePromises);
      const updatedTasks = await Promise.all(
        responses.map(response => response.json())
      );

      // Update tasks in state
      setTasks(currentTasks => 
        currentTasks.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id);
          return updatedTask || task;
        })
      );

      setSelectedTasks([]);
    } catch (err) {
      console.error('Error bulk updating tasks:', err);
      setError('Gagal mengemaskini tugasan secara pukal.');
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setUserFilter('');
    setCropFilter('');
    setDateRangeFilter({ start: '', end: '' });
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Pengurusan Tugasan {/* Translated */}
          </h1>
          {user?.role === 'admin' && (
            <button 
              onClick={() => router.push('/tasks/add')}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Tambah Tugasan Baru
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        {/* Task Statistics Cards */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Jumlah</p>
                  <p className="text-2xl font-bold text-primary">{taskStats.total}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Selesai</p>
                  <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Sedang Jalan</p>
                  <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Tertunda</p>
                  <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Lewat</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="card mb-6">
          <div className="space-y-4">
            {/* Basic Search and Filter Row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Cari tugasan mengikut nama, ID, pekerja, atau penerangan..."
                    className="input-field pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select 
                className="input-field max-w-[160px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="sedang dijalankan">Sedang Dijalankan</option>
                <option value="belum selesai">Belum Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Tapisan Lanjutan
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && user?.role === 'admin' && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral mb-1">Keutamaan</label>
                    <select 
                      className="input-field"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="">Semua Keutamaan</option>
                      <option value="high">Tinggi</option>
                      <option value="medium">Sederhana</option>
                      <option value="low">Rendah</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral mb-1">Pekerja</label>
                    <select 
                      className="input-field"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                    >
                      <option value="">Semua Pekerja</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral mb-1">Plot</label>
                    <select 
                      className="input-field"
                      value={cropFilter}
                      onChange={(e) => setCropFilter(e.target.value)}
                    >
                      <option value="">Semua Plot</option>
                      {assignableCrops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.plotId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral mb-1">Tarikh Mula (Dari)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={dateRangeFilter.start}
                      onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral mb-1">Tarikh Mula (Hingga)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={dateRangeFilter.end}
                      onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearAllFilters}
                      className="btn-secondary w-full"
                    >
                      Padam Semua Tapisan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Operations Bar */}
        {user?.role === 'admin' && selectedTasks.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-primary">
                  {selectedTasks.length} tugasan dipilih
                </span>
                <button
                  onClick={() => setSelectedTasks([])}
                  className="text-sm text-neutral hover:text-primary"
                >
                  Nyahpilih semua
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral mr-2">Tukar status kepada:</span>
                <button
                  onClick={() => handleBulkStatusUpdate('belum selesai')}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  Belum Selesai
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('sedang dijalankan')}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  Sedang Dijalankan
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('selesai')}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="overflow-x-auto">
            {loading && filteredTasks.length === 0 ? (
              <p className="text-center py-10">Memuatkan data tugasan...</p>
            ) : !loading && filteredTasks.length === 0 && !error ? (
              <p className="text-center py-10 text-neutral">
                {searchTerm || statusFilter ? 'Tiada tugasan sepadan dengan carian.' : 'Tiada data tugasan ditemui.'}
              </p>
            ) : (
              <table className="w-full min-w-[1200px]">
                <thead className="bg-primary/5 border-b border-gray-200">
                  <tr>
                    {user?.role === 'admin' && (
                      <th className="text-center py-3 px-4 text-primary font-semibold text-sm w-12">
                        <input
                          type="checkbox"
                          checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                    )}
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">ID Tugasan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Nama Tugasan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Ditugaskan Kepada</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Plot Berkaitan</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Keutamaan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Tarikh Mula</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Tarikh Akhir</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Status</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => {
                    const statusInfo = getStatusInfo(task.status);
                    const priorityInfo = getPriorityInfo(task.priority);
                    const overdue = isTaskOverdue(task);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={task.id} className={`hover:bg-primary/5 ${isDeleting === task.id ? 'opacity-50' : ''} ${overdue ? 'bg-red-50' : ''}`}>
                        {user?.role === 'admin' && (
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task.id)}
                              onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm text-neutral-dark font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {task.taskId}
                            {overdue && <AlertTriangle className="h-4 w-4 text-red-500" title="Tugasan lewat" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-dark font-medium">
                          <div className="max-w-[200px] truncate" title={task.name}>
                            {task.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-neutral" />
                            {task.assignedTo?.username || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-neutral" />
                            {task.crop?.plotId || 'Umum'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.text}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">{formatDate(task.startDate)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                          <div className={overdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(task.endDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {(user?.role === 'staff' && task.userId === user.id) || user?.role === 'admin' ? (
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                              className="px-2 py-1 rounded-full text-xs font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={user?.role === 'staff' && task.userId !== user.id}
                            >
                              <option value="belum selesai">Belum Selesai</option>
                              <option value="sedang dijalankan">Sedang Dijalankan</option>
                              <option value="selesai">Selesai</option>
                              {user?.role === 'admin' && <option value="dibatalkan">Dibatalkan</option>}
                            </select>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <StatusIcon className="h-4 w-4" />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex justify-center gap-2">
                            {user?.role === 'admin' && (
                              <>
                                <button 
                                  onClick={() => router.push(`/tasks/${task.id}/edit`)}
                                  className="p-1 text-primary hover:bg-gray-100 rounded-full"
                                  title="Kemaskini"
                                  disabled={isDeleting === task.id}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(task.id)}
                                  className="p-1 text-error hover:bg-gray-100 rounded-full disabled:opacity-50"
                                  title="Padam"
                                  disabled={isDeleting === task.id}
                                >
                                  {isDeleting === task.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-error"></div>
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            )}
                            {user?.role === 'staff' && task.userId === user.id && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">
                                Tugasan Anda
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 