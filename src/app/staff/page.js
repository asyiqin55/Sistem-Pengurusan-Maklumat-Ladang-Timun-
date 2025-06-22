'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Search, Edit2, XCircle, UserPlus, CheckCircle, AlertCircle, Filter, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Staff() {
  const router = useRouter();
  const { authenticatedFetch } = useAuth();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  // Advanced filtering and sorting
  useEffect(() => {
    let filtered = [...staff];

    // Filter by search term (name, staff ID, email, phone, IC number)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(search) ||
        person.staffId.toLowerCase().includes(search) ||
        person.email.toLowerCase().includes(search) ||
        (person.phone && person.phone.toLowerCase().includes(search)) ||
        person.idNumber.toLowerCase().includes(search)
      );
    }

    // Filter by gender
    if (genderFilter) {
      filtered = filtered.filter(person => person.gender === genderFilter);
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(person => person.status === statusFilter);
    }

    // Filter by position
    if (positionFilter) {
      filtered = filtered.filter(person => person.position === positionFilter);
    }

    // Sort the results
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'salary') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortBy === 'joinDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredStaff(filtered);
  }, [staff, searchTerm, genderFilter, statusFilter, positionFilter, sortBy, sortOrder]);

  const fetchStaff = async () => {
    console.log('[STAFF PAGE] Starting fetchStaff...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('[STAFF PAGE] Making API request to /api/staff');
      const response = await authenticatedFetch('/api/staff');
      
      console.log('[STAFF PAGE] API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type')
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[STAFF PAGE] API error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const fetchedStaff = await response.json();
      console.log('[STAFF PAGE] Staff data received:', {
        totalStaff: fetchedStaff.length,
        staffSample: fetchedStaff.length > 0 ? {
          id: fetchedStaff[0].id,
          staffId: fetchedStaff[0].staffId,
          name: fetchedStaff[0].name,
          position: fetchedStaff[0].position,
          hasUserAccount: fetchedStaff[0].hasUserAccount
        } : null
      });
      
      setStaff(fetchedStaff);
      setFilteredStaff(fetchedStaff);
      console.log('[STAFF PAGE] Staff state updated successfully');
      
    } catch (err) {
      console.error('[STAFF PAGE] Error in fetchStaff:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Gagal memuatkan data staf. Sila cuba lagi.');
    } finally {
      setLoading(false);
      console.log('[STAFF PAGE] fetchStaff completed');
    }
  };

  const handleDelete = async (id) => {
    console.log('[STAFF PAGE] Starting handleDelete:', { staffId: id });
    
    if (!window.confirm('Adakah anda pasti mahu memadam staf ini?')) {
      console.log('[STAFF PAGE] User cancelled delete operation');
      return;
    }
    
    setIsDeleting(id);
    setError(null);

    try {
      console.log('[STAFF PAGE] Making delete API request:', {
        endpoint: `/api/staff/${id}`,
        method: 'DELETE'
      });
      
      const response = await authenticatedFetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      console.log('[STAFF PAGE] Delete response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.status === 204) {
        console.log('[STAFF PAGE] Staff deleted successfully, updating local state');
        setStaff(currentStaff => currentStaff.filter(person => person.id !== id));
        console.log('[STAFF PAGE] Local staff state updated');
      } else {
        const errorData = await response.json();
        console.error('[STAFF PAGE] Delete failed:', errorData);
        throw new Error(errorData.error || `Gagal memadam: Status ${response.status}`);
      }
    } catch (err) {
      console.error('[STAFF PAGE] Error in handleDelete:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message);
    } finally {
      setIsDeleting(null);
      console.log('[STAFF PAGE] handleDelete completed');
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <Users className="h-8 w-8" />
            Pengurusan Staf
          </h1>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/staff/create')}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Tambah Staf Baru
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md">
            Ralat: {error}
          </div>
        )}

        <div className="card mb-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Cari staf mengikut nama, ID, email, telefon atau IC..."
                    className="input-field pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white text-primary border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                Tapis
              </button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <select 
                  className="input-field"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="">Semua Jantina</option>
                  <option value="Lelaki">Lelaki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                
                <select 
                  className="input-field"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
                
                <select 
                  className="input-field"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                >
                  <option value="">Semua Jawatan</option>
                  {[...new Set(staff.map(s => s.position))].map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
                
                <div className="flex gap-2">
                  <select 
                    className="input-field flex-1"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Susun: Nama</option>
                    <option value="staffId">Susun: ID</option>
                    <option value="position">Susun: Jawatan</option>
                    <option value="salary">Susun: Gaji</option>
                    <option value="joinDate">Susun: Tarikh Masuk</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    title={sortOrder === 'asc' ? 'Menaik' : 'Menurun'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            {loading && staff.length === 0 ? (
              <p className="text-center py-10">Memuatkan data staf...</p>
            ) : !loading && staff.length === 0 && !error ? (
              <p className="text-center py-10 text-neutral">Tiada data staf ditemui.</p>
            ) : !loading && filteredStaff.length === 0 && (searchTerm || genderFilter) ? (
              <p className="text-center py-10 text-neutral">Tiada staf yang sepadan dengan carian.</p>
            ) : (
              <table className="w-full min-w-[900px]">
                <thead className="bg-primary/5 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">ID Staf</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Nama</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Jawatan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Hubungan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Gaji</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Status</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Akaun</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStaff.map((person) => (
                    <tr key={person.id} className={`hover:bg-primary/5 cursor-pointer ${isDeleting === person.id ? 'opacity-50' : ''}`}
                        onClick={() => {
                          setSelectedStaff(person);
                          setShowDetails(true);
                        }}>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap font-mono">
                        {person.staffId}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-xs">
                              {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{person.name}</div>
                            <div className="text-xs text-gray-500">{person.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {person.position}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-500">📧</span>
                            <a href={`mailto:${person.email}`} className="text-primary hover:underline truncate max-w-[150px]">
                              {person.email}
                            </a>
                          </div>
                          {person.phone && person.phone !== 'Not Provided' && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="truncate">{person.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-dark whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-700">
                            RM {parseFloat(person.salary || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          person.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {person.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {person.hasUserAccount ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              {person.user?.username}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Tiada akaun</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => router.push(`/staff/edit/${person.id}`)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Kemaskini Staf"
                            disabled={isDeleting === person.id}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {!person.hasUserAccount && (
                            <button 
                              onClick={() => router.push(`/admin/users/add?staffId=${person.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Cipta Akaun Login"
                              disabled={isDeleting === person.id}
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(person.id);
                            }}
                            className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Padam Staf"
                            disabled={isDeleting === person.id}
                          >
                            {isDeleting === person.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-error"></div>
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Staff Details Modal */}
        {showDetails && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-primary">Maklumat Staf</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-xl">
                        {selectedStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedStaff.name}</h3>
                      <p className="text-gray-600">{selectedStaff.position}</p>
                      <p className="text-sm text-gray-500">ID: {selectedStaff.staffId}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary border-b pb-2">Maklumat Peribadi</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nombor Kad Pengenalan</label>
                          <p className="font-mono">{selectedStaff.idNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Jantina</label>
                          <p>{selectedStaff.gender}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p>
                            <a href={`mailto:${selectedStaff.email}`} className="text-primary hover:underline">
                              {selectedStaff.email}
                            </a>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Telefon</label>
                          <p>{selectedStaff.phone || 'Tidak dinyatakan'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary border-b pb-2">Maklumat Pekerjaan</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Jawatan</label>
                          <p>{selectedStaff.position}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gaji</label>
                          <p className="text-green-700 font-semibold">
                            RM {parseFloat(selectedStaff.salary || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedStaff.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedStaff.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tarikh Masuk</label>
                          <p>{new Date(selectedStaff.joinDate).toLocaleDateString('ms-MY')}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Akaun Pengguna</label>
                          {selectedStaff.hasUserAccount ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-700 font-medium">
                                {selectedStaff.user?.username} ({selectedStaff.user?.role})
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">Tiada akaun pengguna</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        router.push(`/staff/edit/${selectedStaff.id}`);
                      }}
                      className="btn-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                      Kemaskini
                    </button>
                    {!selectedStaff.hasUserAccount && (
                      <button
                        onClick={() => {
                          setShowDetails(false);
                          router.push(`/admin/users/add?staffId=${selectedStaff.id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Cipta Akaun
                      </button>
                    )}
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 