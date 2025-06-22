'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Clock, Users, Calendar, Search, Filter, Download, Eye } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [staffList, setStaffList] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    staffId: '',
    page: 1,
    limit: 25
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAttendanceData();
      fetchSummary();
    }
  }, [user, filters]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.staffId) params.append('staffId', filters.staffId);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/attendance?${params}`, {
        headers: {
          'Authorization': user.id.toString(),
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setAttendanceData(data.data);
      } else {
        setError(data.message || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Authorization': user.id.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate
        })
      });

      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
        setStaffList(data.staffList);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (record) => {
    if (record.punchOutTime) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Selesai
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Dalam Kerja
        </span>
      );
    }
  };

  if (user && user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Laporan Kehadiran
          </h1>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Eksport Data
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral text-sm">Jumlah Kehadiran</p>
                  <h3 className="text-2xl font-bold mt-1">{summary.totalAttendance}</h3>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral text-sm">Selesai Kerja</p>
                  <h3 className="text-2xl font-bold mt-1">{summary.completedAttendance}</h3>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral text-sm">Belum Keluar</p>
                  <h3 className="text-2xl font-bold mt-1">{summary.incompleteAttendance}</h3>
                </div>
                <Eye className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral text-sm">Purata Jam Kerja</p>
                  <h3 className="text-2xl font-bold mt-1">{summary.averageWorkingHours}j</h3>
                </div>
                <Calendar className="h-8 w-8 text-primary-light" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Tarikh Mula
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Tarikh Akhir
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Staf
              </label>
              <select
                value={filters.staffId}
                onChange={(e) => handleFilterChange('staffId', e.target.value)}
                className="input-field"
              >
                <option value="">Semua Staf</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.staffId})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, page: 1 }));
                  fetchAttendanceData();
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Cari
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        {/* Attendance Table */}
        <div className="card">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-neutral">Memuatkan data kehadiran...</p>
              </div>
            ) : attendanceData.length === 0 ? (
              <p className="text-center py-10 text-neutral">Tiada data kehadiran ditemui.</p>
            ) : (
              <table className="w-full min-w-[1000px]">
                <thead className="bg-primary/5 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Tarikh</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Staf</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Jawatan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Masa Masuk</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Masa Keluar</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Jam Kerja</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceData.map((record) => (
                    <tr key={record.id} className="hover:bg-primary/5">
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark font-medium">
                        <div>
                          <div className="font-medium">{record.staff.name}</div>
                          <div className="text-xs text-neutral">{record.staff.staffId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        {record.staff.position}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        {formatTime(record.punchInTime)}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        {record.punchOutTime ? formatTime(record.punchOutTime) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        {record.workingHours ? `${record.workingHours} jam` : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {getStatusBadge(record)}
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