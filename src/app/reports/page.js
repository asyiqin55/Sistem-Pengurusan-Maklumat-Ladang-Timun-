'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart2,
  Leaf,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

// Function to get date string N days ago (YYYY-MM-DD)
const getDateNDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export default function Reports() {
  const { user, authenticatedFetch } = useAuth();
  const [dateRange, setDateRange] = useState({ 
    start: getDateNDaysAgo(30), // Default to last 30 days
    end: new Date().toISOString().split('T')[0] // Default to today
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportData = async (start, end) => {
    console.log('[Reports] Starting fetchReportData with date range:', { start, end });
    console.log('[Reports] User context:', user);
    setLoading(true);
    setError(null);
    setReportData(null);
    
    try {
      // Fetch data from multiple endpoints
      console.log('[Reports] Making parallel API calls...');
      const [cropsResponse, staffResponse, tasksResponse] = await Promise.all([
        authenticatedFetch('/api/crops'),
        authenticatedFetch('/api/staff'),
        authenticatedFetch('/api/tasks')
      ]);

      console.log('[Reports] API responses received:', {
        cropsStatus: cropsResponse.status,
        staffStatus: staffResponse.status,
        tasksStatus: tasksResponse.status,
        cropsOk: cropsResponse.ok,
        staffOk: staffResponse.ok,
        tasksOk: tasksResponse.ok
      });

      const [crops, staff, tasks] = await Promise.all([
        cropsResponse.json(),
        staffResponse.json(),
        tasksResponse.json()
      ]);

      console.log('[Reports] Parsed data:', {
        cropsCount: crops?.length || 0,
        staffCount: staff?.length || 0,
        tasksCount: tasks?.length || 0,
        cropsData: crops,
        staffData: staff,
        tasksData: tasks
      });

      // Filter data by date range
      const startDate = new Date(start);
      const endDate = new Date(end);
      console.log('[Reports] Date filtering range:', { startDate, endDate });
      
      console.log('[Reports] Raw tasks before filtering:', tasks.map(task => ({
        id: task.id,
        taskId: task.taskId,
        name: task.name,
        status: task.status,
        startDate: task.startDate,
        endDate: task.endDate,
        priority: task.priority
      })));
      
      const filteredTasks = tasks.filter(task => {
        const taskDate = new Date(task.startDate);
        const isInRange = taskDate >= startDate && taskDate <= endDate;
        console.log('[Reports] Task date filtering:', {
          taskId: task.taskId,
          taskStartDate: task.startDate,
          parsedTaskDate: taskDate,
          isInRange
        });
        return isInRange;
      });
      
      console.log('[Reports] Filtered tasks count:', filteredTasks.length);

      const filteredCrops = crops.filter(crop => {
        const cropDate = new Date(crop.plantingDate);
        return cropDate >= startDate && cropDate <= endDate;
      });

      // Calculate metrics
      console.log('[Reports] Calculating metrics...');
      const taskStatuses = filteredTasks.map(task => task.status);
      console.log('[Reports] Filtered task statuses:', taskStatuses);
      console.log('[Reports] Unique filtered task statuses:', [...new Set(taskStatuses)]);
      
      const completedTasksInPeriod = filteredTasks.filter(t => t.status === 'selesai');
      const pendingTasksInPeriod = filteredTasks.filter(t => t.status === 'belum selesai' || t.status === 'sedang dijalankan');
      const overdueTasksInPeriod = filteredTasks.filter(t => {
        const endDate = new Date(t.endDate);
        const today = new Date();
        return endDate < today && t.status !== 'selesai';
      });
      
      console.log('[Reports] Task breakdown calculations:', {
        totalFiltered: filteredTasks.length,
        completed: completedTasksInPeriod.length,
        pending: pendingTasksInPeriod.length,
        overdue: overdueTasksInPeriod.length
      });
      
      const metrics = {
        totalCrops: crops.length,
        newCropsInPeriod: filteredCrops.length,
        activeCrops: crops.filter(c => c.status === 'Ditanam' || c.status === 'Sedang Tumbuh').length,
        totalStaff: staff.filter(s => s.status === 'active').length,
        totalTasks: filteredTasks.length,
        completedTasks: completedTasksInPeriod.length,
        pendingTasks: pendingTasksInPeriod.length,
        overdueTasks: overdueTasksInPeriod.length,
        taskCompletionRate: filteredTasks.length > 0 ? (completedTasksInPeriod.length / filteredTasks.length * 100) : 0
      };
      
      console.log('[Reports] Final metrics calculated:', metrics);

      // Calculate additional task analytics
      console.log('[Reports] Calculating task analytics by priority and status...');
      const taskPriorities = filteredTasks.map(task => task.priority);
      console.log('[Reports] Task priorities found:', taskPriorities);
      console.log('[Reports] Unique task priorities:', [...new Set(taskPriorities)]);
      
      const tasksByPriority = {
        high: filteredTasks.filter(t => t.priority === 'high').length,
        medium: filteredTasks.filter(t => t.priority === 'medium').length,
        low: filteredTasks.filter(t => t.priority === 'low').length
      };

      const tasksByStatus = {
        completed: filteredTasks.filter(t => t.status === 'selesai').length,
        inProgress: filteredTasks.filter(t => t.status === 'sedang dijalankan').length,
        pending: filteredTasks.filter(t => t.status === 'belum selesai').length,
        cancelled: filteredTasks.filter(t => t.status === 'dibatalkan').length
      };
      
      console.log('[Reports] Task analytics calculated:', {
        tasksByPriority,
        tasksByStatus
      });

      setReportData({
        metrics,
        crops: filteredCrops,
        tasks: filteredTasks,
        staff: staff.filter(s => s.status === 'active'),
        tasksByPriority,
        tasksByStatus
      });
      
    } catch (err) {
      console.error('[Reports] Error fetching report data:', err);
      console.error('[Reports] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Gagal memuatkan data laporan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReportData(dateRange.start, dateRange.end);
    }
  }, [user]);

  const handleDateChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
  };

  const handleApplyDateRange = () => {
    if (!dateRange.start || !dateRange.end) {
      setError("Sila pilih tarikh mula dan tarikh tamat.");
      return;
    }
    if (new Date(dateRange.start) > new Date(dateRange.end)) {
      setError("Tarikh mula tidak boleh selepas tarikh tamat.");
      return;
    }
    fetchReportData(dateRange.start, dateRange.end);
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
              <FileText className="h-10 w-10" />
              Laporan Ladang
            </h1>
            <p className="text-neutral mt-2">
              Analisis prestasi tanaman, tugasan dan staf untuk tempoh yang dipilih
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tarikh Mula
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tarikh Tamat
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="input-field"
              />
            </div>
            <button 
              onClick={handleApplyDateRange}
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memuatkan...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Jana Laporan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">Ralat</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Report Data */}
        {reportData && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral text-sm">Jumlah Tanaman</p>
                    <h3 className="text-2xl font-bold text-primary">{reportData.metrics.totalCrops}</h3>
                    <p className="text-sm text-green-600">
                      {reportData.metrics.activeCrops} aktif
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral text-sm">Jumlah Staf</p>
                    <h3 className="text-2xl font-bold text-primary">{reportData.metrics.totalStaff}</h3>
                    <p className="text-sm text-blue-600">Staf aktif</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral text-sm">Tugasan Selesai</p>
                    <h3 className="text-2xl font-bold text-primary">{reportData.metrics.completedTasks}</h3>
                    <p className="text-sm text-green-600">
                      {reportData.metrics.taskCompletionRate.toFixed(1)}% kadar kejayaan
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral text-sm">Tugasan Tertunda</p>
                    <h3 className="text-2xl font-bold text-primary">{reportData.metrics.pendingTasks}</h3>
                    <p className="text-sm text-yellow-600">Memerlukan perhatian</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral text-sm">Tugasan Lewat</p>
                    <h3 className="text-2xl font-bold text-primary">{reportData.metrics.overdueTasks}</h3>
                    <p className="text-sm text-red-600">Melepasi tarikh akhir</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Task Completion Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-primary mb-4">Prestasi Tugasan</h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-neutral">Selesai</span>
                      <span className="text-sm font-medium">{reportData.metrics.completedTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-green-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${reportData.metrics.taskCompletionRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral">Tertunda</span>
                      <span className="text-sm font-medium">{reportData.metrics.pendingTasks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crop Status Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-primary mb-4">Status Tanaman</h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {reportData.metrics.activeCrops}
                    </div>
                    <p className="text-neutral">Plot Aktif</p>
                    <div className="mt-4 text-sm text-neutral">
                      dari {reportData.metrics.totalCrops} jumlah plot
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Task Priority Breakdown */}
              <div className="card">
                <h3 className="text-lg font-semibold text-primary mb-4">Tugasan Mengikut Keutamaan</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Tinggi</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByPriority?.high || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${reportData.metrics.totalTasks > 0 ? (reportData.tasksByPriority?.high || 0) / reportData.metrics.totalTasks * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Sederhana</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByPriority?.medium || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${reportData.metrics.totalTasks > 0 ? (reportData.tasksByPriority?.medium || 0) / reportData.metrics.totalTasks * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Rendah</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByPriority?.low || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${reportData.metrics.totalTasks > 0 ? (reportData.tasksByPriority?.low || 0) / reportData.metrics.totalTasks * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Task Status Breakdown */}
              <div className="card">
                <h3 className="text-lg font-semibold text-primary mb-4">Tugasan Mengikut Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Selesai</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByStatus?.completed || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Sedang Dijalankan</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByStatus?.inProgress || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Belum Selesai</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByStatus?.pending || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Dibatalkan</span>
                    </div>
                    <span className="font-medium">{reportData.tasksByStatus?.cancelled || 0}</span>
                  </div>
                  
                  {reportData.metrics.overdueTasks > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">Tugasan Lewat</span>
                        </div>
                        <span className="font-medium text-red-600">{reportData.metrics.overdueTasks}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div className="card">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Muat Turun Laporan</h3>
                  <p className="text-neutral text-sm">
                    Laporan untuk tempoh {new Date(dateRange.start).toLocaleDateString('ms-MY')} - {new Date(dateRange.end).toLocaleDateString('ms-MY')}
                  </p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Muat Turun PDF
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span className="text-neutral">Menganalisis data...</span>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !reportData && !error && (
          <div className="card">
            <div className="text-center py-12">
              <BarChart2 className="h-12 w-12 text-neutral mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-neutral mb-2">Sila Jana Laporan</h3>
              <p className="text-neutral text-sm">Pilih julat tarikh dan tekan "Jana Laporan" untuk melihat analisis</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}