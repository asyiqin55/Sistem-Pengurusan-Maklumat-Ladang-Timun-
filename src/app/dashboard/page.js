'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Leaf,
  Users,
  ClipboardList,
  BarChart2,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { user, authenticatedFetch } = useAuth();
  
  // Attendance state
  const [attendanceStatus, setAttendanceStatus] = useState({
    loading: true,
    punchedIn: false,
    punchedOut: false,
    attendanceRecord: null,
    error: null
  });
  const [punchingIn, setPunchingIn] = useState(false);
  const [punchingOut, setPunchingOut] = useState(false);

  // Admin dashboard data states
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    stats: {
      activeCrops: 0,
      totalStaff: 0,
      pendingTasks: 0,
      completedTasks: 0
    },
    recentActivities: [],
    staffOverview: null,
    error: null
  });

  // Dynamic stats based on real data - different for admin vs staff
  const adminQuickStats = [
    {
      title: 'Tanaman Aktif',
      value: dashboardData.loading ? '...' : dashboardData.stats.activeCrops.toString(),
      trend: dashboardData.loading ? '...' : `${dashboardData.stats.activeCrops} plot aktif`,
      icon: Leaf,
      color: 'text-primary'
    },
    {
      title: 'Jumlah Staf',
      value: dashboardData.loading ? '...' : dashboardData.stats.totalStaff.toString(),
      trend: dashboardData.loading ? '...' : 'Ahli aktif',
      icon: Users,
      color: 'text-primary-light'
    },
    {
      title: 'Tugas Tertunda',
      value: dashboardData.loading ? '...' : dashboardData.stats.pendingTasks.toString(),
      trend: dashboardData.loading ? '...' : 'Tugasan belum selesai',
      icon: ClipboardList,
      color: 'text-warning'
    },
    {
      title: 'Tugas Selesai',
      value: dashboardData.loading ? '...' : dashboardData.stats.completedTasks.toString(),
      trend: dashboardData.loading ? '...' : '30 hari terakhir',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const staffQuickStats = [
    {
      title: 'Plot Aktif',
      value: dashboardData.loading ? '...' : dashboardData.stats.activeCrops.toString(),
      trend: dashboardData.loading ? '...' : 'Plot yang sedang ditanam',
      icon: Leaf,
      color: 'text-primary'
    },
    {
      title: 'Tugas Saya Tertunda',
      value: dashboardData.loading ? '...' : dashboardData.stats.pendingTasks.toString(),
      trend: dashboardData.loading ? '...' : 'Tugasan belum selesai',
      icon: ClipboardList,
      color: 'text-warning'
    },
    {
      title: 'Tugas Saya Selesai',
      value: dashboardData.loading ? '...' : dashboardData.stats.completedTasks.toString(),
      trend: dashboardData.loading ? '...' : 'Tugasan sudah selesai',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Tugas Lewat',
      value: dashboardData.loading ? '...' : (dashboardData.stats.overdueTasks || 0).toString(),
      trend: dashboardData.loading ? '...' : 'Tugasan yang lewat tarikh',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  const quickStats = user?.role === 'admin' ? adminQuickStats : staffQuickStats;

  // Admin-specific quick actions
  const adminQuickActions = [
    {
      title: 'Tambah Plot Tanaman',
      icon: Leaf,
      href: '/crop-management/add',
      color: 'bg-primary'
    },
    {
      title: 'Tugaskan Kerja',
      icon: ClipboardList,
      href: '/tasks/add',
      color: 'bg-blue-600'
    },
    {
      title: 'Kelola Staf',
      icon: Users,
      href: '/staff',
      color: 'bg-green-600'
    },
    {
      title: 'Lihat Laporan',
      icon: BarChart2,
      href: '/reports',
      color: 'bg-purple-600'
    }
  ];

  const staffQuickActions = [
    {
      title: 'Lihat Pengurusan Tanaman',
      icon: Leaf,
      href: '/crop-management',
      color: 'bg-primary'
    },
    {
      title: 'Lihat Tugasan Saya',
      icon: ClipboardList,
      href: '/tasks',
      color: 'bg-warning'
    }
  ];

  const quickActions = user?.role === 'admin' ? adminQuickActions : staffQuickActions;

  // Real-time recent activities from API data
  const recentActivities = dashboardData.recentActivities;

  // Fetch dashboard data based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'staff') {
        fetchStaffDashboardData();
      } else if (user.role === 'admin') {
        fetchAdminDashboardData();
      }
    }
  }, [user]);

  // Comprehensive staff dashboard data fetching (similar to admin but staff-focused)
  const fetchStaffDashboardData = async () => {
    try {
      console.log('[Dashboard] Starting fetchStaffDashboardData for user:', user);
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      setAttendanceStatus(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch data from multiple APIs in parallel for staff
      console.log('[Dashboard] Making parallel API calls for staff...');
      const [attendanceResponse, tasksResponse, cropsResponse] = await Promise.all([
        authenticatedFetch('/api/attendance'),
        authenticatedFetch('/api/tasks'), // Will be filtered server-side for staff
        authenticatedFetch('/api/crops')
      ]);

      console.log('[Dashboard] Staff API responses received:', {
        attendanceStatus: attendanceResponse.status,
        tasksStatus: tasksResponse.status,
        cropsStatus: cropsResponse.status,
        attendanceOk: attendanceResponse.ok,
        tasksOk: tasksResponse.ok,
        cropsOk: cropsResponse.ok
      });

      // Process attendance data
      let attendanceData = null;
      console.log('[DASHBOARD] Processing attendance response:', {
        ok: attendanceResponse.ok,
        status: attendanceResponse.status
      });
      if (attendanceResponse.ok) {
        attendanceData = await attendanceResponse.json();
        console.log('[DASHBOARD] Attendance data received:', attendanceData);
        if (attendanceData.success) {
          setAttendanceStatus({
            loading: false,
            punchedIn: attendanceData.punchedIn,
            punchedOut: attendanceData.punchedOut,
            attendanceRecord: attendanceData.attendance,
            error: null
          });
        }
      }

      // Process tasks and crops data
      const [myTasks, allCrops] = await Promise.all([
        tasksResponse.ok ? tasksResponse.json() : [],
        cropsResponse.ok ? cropsResponse.json() : []
      ]);

      console.log('[Dashboard] Staff parsed data:', {
        myTasksCount: myTasks?.length || 0,
        cropsCount: allCrops?.length || 0,
        myTasks: myTasks,
        allCrops: allCrops
      });

      // Calculate staff-specific statistics
      const myPendingTasks = myTasks.filter(task => task.status === 'belum selesai' || task.status === 'sedang dijalankan').length;
      const myCompletedTasks = myTasks.filter(task => task.status === 'selesai').length;
      const activeCrops = allCrops.filter(crop => crop.status === 'Ditanam' || crop.status === 'Sedang Tumbuh').length;
      const myOverdueTasks = myTasks.filter(task => {
        const endDate = new Date(task.endDate);
        const today = new Date();
        return endDate < today && task.status !== 'selesai';
      }).length;
      
      console.log('[Dashboard] Staff calculated statistics:', {
        myPendingTasks,
        myCompletedTasks,
        activeCrops,
        myOverdueTasks,
        totalMyTasks: myTasks.length
      });

      // Generate staff-specific recent activities
      const activities = [];
      
      // My recent task completions
      const myRecentCompletedTasks = myTasks
        .filter(task => task.status === 'selesai')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);
      
      myRecentCompletedTasks.forEach(task => {
        activities.push({
          type: 'task',
          message: `Saya selesaikan tugas: ${task.name}`,
          value: formatRelativeTime(task.updatedAt),
          time: formatRelativeTime(task.updatedAt)
        });
      });

      // Recent attendance if available
      if (attendanceData && attendanceData.attendance) {
        activities.push({
          type: 'attendance',
          message: 'Kehadiran hari ini',
          value: attendanceData.punchedIn ? 'Sudah punch in' : 'Belum punch in',
          time: attendanceData.attendance.punchInTime ? formatTime(attendanceData.attendance.punchInTime) : 'Belum'
        });
      }

      // Recent crops I might be working on
      const recentCrops = allCrops
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentCrops.forEach(crop => {
        activities.push({
          type: 'crop',
          message: `Plot aktif: ${crop.plotId}`,
          value: crop.status || 'Aktif',
          time: formatRelativeTime(crop.createdAt)
        });
      });

      setDashboardData({
        loading: false,
        stats: {
          activeCrops,
          totalStaff: 0, // Not relevant for staff
          pendingTasks: myPendingTasks,
          completedTasks: myCompletedTasks,
          overdueTasks: myOverdueTasks
        },
        recentActivities: activities.slice(0, 5),
        staffOverview: null,
        error: null
      });

    } catch (error) {
      console.error('[Dashboard] Error fetching staff dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
      setAttendanceStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch attendance status'
      }));
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      setAttendanceStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authenticatedFetch('/api/attendance', {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.success) {
        setAttendanceStatus({
          loading: false,
          punchedIn: data.punchedIn,
          punchedOut: data.punchedOut,
          attendanceRecord: data.attendance,
          error: null
        });
      } else {
        setAttendanceStatus(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Failed to fetch attendance status'
        }));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to connect to server'
      }));
    }
  };

  const handlePunchIn = async () => {
    try {
      console.log('[DASHBOARD] Starting punch in process for user:', {
        id: user?.id,
        username: user?.username,
        role: user?.role
      });
      setPunchingIn(true);
      
      const response = await authenticatedFetch('/api/attendance', {
        method: 'POST',
      });

      console.log('[DASHBOARD] Punch in response:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('[DASHBOARD] Punch in data:', data);
      
      if (data.success) {
        setAttendanceStatus({
          loading: false,
          punchedIn: true,
          punchedOut: false,
          attendanceRecord: data.attendance,
          error: null
        });
      } else {
        setAttendanceStatus(prev => ({
          ...prev,
          error: data.message || 'Failed to punch in'
        }));
      }
    } catch (error) {
      console.error('Error punching in:', error);
      setAttendanceStatus(prev => ({
        ...prev,
        error: 'Failed to connect to server'
      }));
    } finally {
      setPunchingIn(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      console.log('[DASHBOARD] Starting punch out process for user:', {
        id: user?.id,
        username: user?.username,
        role: user?.role
      });
      setPunchingOut(true);
      
      const response = await authenticatedFetch('/api/attendance', {
        method: 'PUT',
      });

      console.log('[DASHBOARD] Punch out response:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('[DASHBOARD] Punch out data:', data);
      
      if (data.success) {
        setAttendanceStatus(prev => ({
          ...prev,
          punchedOut: true,
          attendanceRecord: data.attendance,
          error: null
        }));
      } else {
        setAttendanceStatus(prev => ({
          ...prev,
          error: data.message || 'Failed to punch out'
        }));
      }
    } catch (error) {
      console.error('Error punching out:', error);
      setAttendanceStatus(prev => ({
        ...prev,
        error: 'Failed to connect to server'
      }));
    } finally {
      setPunchingOut(false);
    }
  };

  // Fetch comprehensive admin dashboard data
  const fetchAdminDashboardData = async () => {
    try {
      console.log('[Dashboard] Starting fetchAdminDashboardData for user:', user);
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch data from multiple APIs in parallel (removed analytics/sales)
      console.log('[Dashboard] Making parallel API calls...');
      const [cropsResponse, staffResponse, tasksResponse] = await Promise.all([
        authenticatedFetch('/api/crops'),
        authenticatedFetch('/api/staff'),
        authenticatedFetch('/api/tasks')
      ]);

      console.log('[Dashboard] API responses received:', {
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

      console.log('[Dashboard] Parsed data:', {
        cropsCount: crops?.length || 0,
        staffCount: staff?.length || 0,
        tasksCount: tasks?.length || 0,
        cropsData: crops,
        staffData: staff,
        tasksData: tasks
      });

      // Process the data
      console.log('[Dashboard] Processing task data...');
      const taskStatuses = tasks.map(task => task.status);
      console.log('[Dashboard] Task statuses found:', taskStatuses);
      console.log('[Dashboard] Unique task statuses:', [...new Set(taskStatuses)]);
      
      const activeCrops = crops.filter(crop => crop.status === 'Ditanam' || crop.status === 'Sedang Tumbuh').length;
      const totalStaff = staff.filter(s => s.status === 'active').length;
      const pendingTasks = tasks.filter(task => task.status === 'belum selesai' || task.status === 'sedang dijalankan').length;
      const completedTasks = tasks.filter(task => task.status === 'selesai').length;
      
      console.log('[Dashboard] Calculated statistics:', {
        activeCrops,
        totalStaff,
        pendingTasks,
        completedTasks,
        totalTasks: tasks.length
      });

      // Generate recent activities from the data
      const activities = [];
      
      // Recent completed tasks
      console.log('[Dashboard] Looking for recent completed tasks...');
      const completedTasksForActivities = tasks.filter(task => task.status === 'selesai');
      console.log('[Dashboard] Found completed tasks for activities:', completedTasksForActivities.length);
      
      const recentCompletedTasks = tasks
        .filter(task => task.status === 'selesai')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);
      
      console.log('[Dashboard] Recent completed tasks:', recentCompletedTasks);
      
      recentCompletedTasks.forEach(task => {
        activities.push({
          type: 'task',
          message: `Tugas selesai: ${task.name}`,
          value: task.assignedTo?.username || 'Staff',
          time: formatRelativeTime(task.updatedAt)
        });
      });

      // Recent crop plantings
      const recentCrops = crops
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentCrops.forEach(crop => {
        activities.push({
          type: 'crop',
          message: `Plot baru ditanam: ${crop.plotId}`,
          value: crop.cropType || 'Timun',
          time: formatRelativeTime(crop.createdAt)
        });
      });

      setDashboardData({
        loading: false,
        stats: {
          activeCrops,
          totalStaff,
          pendingTasks,
          completedTasks
        },
        recentActivities: activities.slice(0, 5),
        staffOverview: null, // Will be populated later
        error: null
      });

    } catch (error) {
      console.error('[Dashboard] Error fetching admin dashboard data:', error);
      console.error('[Dashboard] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Baru sahaja';
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return 'Semalam';
    return `${diffDays} hari yang lalu`;
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
              <Home className="h-8 w-8" />
              Selamat Datang, {user?.username || 'Tetamu'}
            </h1>
            <p className="text-neutral text-sm">
              Inilah yang berlaku di ladang anda hari ini
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('ms-MY', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Attendance Section for Staff */}
        {user?.role === 'staff' && (
          <div className="mb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold text-primary">Kehadiran Hari Ini</h2>
              </div>
              
              {attendanceStatus.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-neutral">Memuat status kehadiran...</span>
                </div>
              ) : attendanceStatus.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 font-medium">Ralat</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{attendanceStatus.error}</p>
                  <button
                    onClick={fetchAttendanceStatus}
                    className="btn-secondary mt-3 text-sm"
                  >
                    Cuba Lagi
                  </button>
                </div>
              ) : attendanceStatus.punchedIn ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700 font-medium">
                          {attendanceStatus.punchedOut ? 'Selesai Kerja' : 'Telah Hadir'}
                        </span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        Masuk: {formatTime(attendanceStatus.attendanceRecord.punchInTime)}
                        {attendanceStatus.attendanceRecord.punchOutTime && (
                          <span> | Keluar: {formatTime(attendanceStatus.attendanceRecord.punchOutTime)}</span>
                        )}
                        <br />
                        {formatDate(attendanceStatus.attendanceRecord.date)}
                      </p>
                      {attendanceStatus.attendanceRecord.punchOutTime && (
                        <p className="text-green-600 text-xs mt-1">
                          Jumlah jam kerja: {(() => {
                            const punchIn = new Date(attendanceStatus.attendanceRecord.punchInTime);
                            const punchOut = new Date(attendanceStatus.attendanceRecord.punchOutTime);
                            const hours = Math.round(((punchOut - punchIn) / (1000 * 60 * 60)) * 100) / 100;
                            return `${hours} jam`;
                          })()}
                        </p>
                      )}
                    </div>
                    {!attendanceStatus.punchedOut && (
                      <button
                        onClick={handlePunchOut}
                        disabled={punchingOut}
                        className="btn-secondary flex items-center gap-2"
                      >
                        {punchingOut ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            Sedang Keluar...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            Keluar Sekarang
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-700 font-medium">Belum Hadir</span>
                      </div>
                      <p className="text-yellow-600 text-sm mt-1">
                        Anda belum hadir untuk hari ini, {formatDate(new Date())}
                      </p>
                    </div>
                    <button
                      onClick={handlePunchIn}
                      disabled={punchingIn}
                      className="btn-primary flex items-center gap-2"
                    >
                      {punchingIn ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sedang Hadir...
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          Hadir Sekarang
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display for Dashboard Data */}
        {dashboardData.error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 font-medium">Ralat Memuat Data</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{dashboardData.error}</p>
              <button
                onClick={user?.role === 'admin' ? fetchAdminDashboardData : fetchStaffDashboardData}
                className="btn-secondary mt-3 text-sm"
              >
                Cuba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-neutral text-sm">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {dashboardData.loading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      stat.value
                    )}
                  </h3>
                  <p className="text-sm text-green-600 mt-1">
                    {dashboardData.loading ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                    ) : (
                      stat.trend
                    )}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-6 mb-6`}>
          {quickActions.map((action, index) => (
            <Link 
              key={index}
              href={action.href}
              className="card card-hover group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-primary group-hover:text-primary/80">
                    {action.title}
                  </h3>
                </div>
                <ArrowRight className="h-5 w-5 text-neutral group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Admin Staff Overview Section */}
        {user?.role === 'admin' && (
          <div className="mb-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gambaran Staff
                </h2>
                <Link href="/attendance" className="text-sm text-primary hover:underline">
                  Lihat Kehadiran
                </Link>
              </div>
              
              {dashboardData.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-gray-50 rounded-lg p-4">
                      <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                      <div className="animate-pulse bg-gray-200 h-6 w-1/2 rounded mb-1"></div>
                      <div className="animate-pulse bg-gray-200 h-3 w-full rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">Staff Aktif</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{dashboardData.stats.totalStaff}</p>
                    <p className="text-green-600 text-sm">Jumlah staff berdaftar</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-700 font-medium">Kehadiran Hari Ini</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">-</p>
                    <p className="text-blue-600 text-sm">Menunggu data kehadiran</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="text-yellow-700 font-medium">Tugasan Aktif</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">{dashboardData.stats.pendingTasks}</p>
                    <p className="text-yellow-600 text-sm">Tugasan belum selesai</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary">Aktiviti Terkini</h2>
              <Link href={user?.role === 'admin' ? '/tasks' : '/tasks'} className="text-sm text-primary hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="space-y-4">
              {dashboardData.loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                        <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded"></div>
                      </div>
                      <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'task' ? 'bg-blue-100' :
                      activity.type === 'crop' ? 'bg-green-100' :
                      'bg-yellow-100'
                    }`}>
                      {activity.type === 'task' ? (
                        <ClipboardList className="h-4 w-4 text-blue-600" />
                      ) : activity.type === 'crop' ? (
                        <Leaf className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-sm text-neutral">{activity.value}</p>
                    </div>
                    <span className="text-xs text-neutral">{activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Tiada aktiviti terkini</p>
                </div>
              )}
            </div>
          </div>

          {/* Task Performance Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary">Prestasi Tugasan</h2>
              <select className="input-field max-w-[150px] text-sm">
                <option value="monthly">Bulan Ini</option>
                <option value="weekly">Minggu Ini</option>
                <option value="yearly">Tahun Ini</option>
              </select>
            </div>
            <div className="h-[300px] bg-gray-50 rounded-lg flex items-center justify-center">
              {dashboardData.loading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <span className="text-sm text-neutral">Memuat data tugasan...</span>
                </div>
              ) : (
                <div className="w-full h-full p-4 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {dashboardData.stats.completedTasks}
                      </div>
                      <div className="text-sm text-neutral">Tugasan Selesai</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-warning mb-2">
                        {dashboardData.stats.pendingTasks}
                      </div>
                      <div className="text-sm text-neutral">Tugasan Tertunda</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-primary h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(dashboardData.stats.completedTasks / (dashboardData.stats.completedTasks + dashboardData.stats.pendingTasks)) * 100 || 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm text-neutral">
                      {Math.round((dashboardData.stats.completedTasks / (dashboardData.stats.completedTasks + dashboardData.stats.pendingTasks)) * 100 || 0)}% Kadar Penyelesaian
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 