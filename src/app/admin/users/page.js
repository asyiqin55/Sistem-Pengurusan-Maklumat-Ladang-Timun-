'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, UserPlus, Search, Edit2, XCircle, CheckCircle, Power, Filter, AlertCircle, Shield, Clock, User, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import UserForm from '@/components/UserForm';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isToggling, setIsToggling] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Advanced filtering and sorting
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter (username, email, staff name, staff ID)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.staff && user.staff.name.toLowerCase().includes(search)) ||
        (user.staff && user.staff.staffId.toLowerCase().includes(search))
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Sort the results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'staffName') {
        aValue = a.staff?.name || '';
        bValue = b.staff?.name || '';
      } else if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      } else if (sortBy === 'lastLogin') {
        aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
        bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
      } else {
        aValue = String(a[sortBy] || '').toLowerCase();
        bValue = String(b[sortBy] || '').toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
            console.log('[ADMIN USERS] Starting fetchUsers...');
            setLoading(true);
            setError('');
            
            try {
              console.log('[ADMIN USERS] Making API request to /api/admin/users');
              const response = await authenticatedFetch('/api/admin/users');
              
              console.log('[ADMIN USERS] API response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: {
                  contentType: response.headers.get('content-type')
                }
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error('[ADMIN USERS] API error response:', errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              console.log('[ADMIN USERS] Users data received:', {
                totalUsers: data.length,
                userSample: data.length > 0 ? {
                  id: data[0].id,
                  username: data[0].username,
                  role: data[0].role,
                  status: data[0].status,
                  hasStaff: !!data[0].staff
                } : null
              });
              
              setUsers(data);
              setFilteredUsers(data);
              console.log('[ADMIN USERS] Users state updated successfully');
              
            } catch (err) {
              console.error('[ADMIN USERS] Error in fetchUsers:', {
                message: err.message,
                stack: err.stack,
                name: err.name
              });
              setError(err.message || 'Gagal memuat data pengguna. Sila cuba lagi.');
            } finally {
              setLoading(false);
              console.log('[ADMIN USERS] fetchUsers completed');
            }
          };
;

  const handleToggleStatus = async (userId, currentStatus) => {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const action = newStatus === 'active' ? 'aktifkan' : 'nyahaktif';
            const userToToggle = users.find(u => u.id === userId);
            
            console.log('[ADMIN USERS] Starting handleToggleStatus:', {
              userId,
              currentStatus,
              newStatus,
              action,
              userToToggle: userToToggle ? {
                id: userToToggle.id,
                username: userToToggle.username,
                role: userToToggle.role
              } : null
            });
            
            if (!window.confirm(`Adakah anda pasti mahu ${action} pengguna ${userToToggle?.username}?`)) {
              console.log('[ADMIN USERS] User cancelled toggle status action');
              return;
            }
        
            setIsToggling(userId);
            setError('');
        
            try {
              console.log('[ADMIN USERS] Making toggle status API request:', {
                endpoint: `/api/admin/users/${userId}/toggle-status`,
                method: 'PATCH'
              });
              
              const response = await authenticatedFetch(`/api/admin/users/${userId}/toggle-status`, {
                method: 'PATCH',
              });
        
              console.log('[ADMIN USERS] Toggle status response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
              });
        
              if (!response.ok) {
                const errorData = await response.json();
                console.error('[ADMIN USERS] Toggle status error:', errorData);
                throw new Error(errorData.error || `Gagal ${action} pengguna: Status ${response.status}`);
              }
        
              const updatedUser = await response.json();
              console.log('[ADMIN USERS] User status updated successfully:', {
                userId: updatedUser.id,
                newStatus: updatedUser.status
              });
              
              setUsers(currentUsers => 
                currentUsers.map(u => u.id === userId ? { ...u, status: updatedUser.status } : u)
              );
              console.log('[ADMIN USERS] Local users state updated');
              
            } catch (err) {
              console.error('[ADMIN USERS] Error in handleToggleStatus:', {
                message: err.message,
                stack: err.stack
              });
              setError(err.message);
            } finally {
              setIsToggling(null);
              console.log('[ADMIN USERS] handleToggleStatus completed');
            }
          };
;

  const handleEditClick = (user) => {
    setEditModal({ isOpen: true, user });
  };

  const handleEditSubmit = async (formData) => {
    console.log('[ADMIN USERS] Starting handleEditSubmit:', {
      userId: editModal.user?.id,
      formData: {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        hasStaffData: !!formData.staffData,
        hasSelectedStaffId: !!formData.selectedStaffId
      }
    });
    
    setIsSubmitting(true);
    setError('');

    try {
      console.log('[ADMIN USERS] Making edit user API request:', {
        endpoint: `/api/admin/users/${editModal.user.id}`,
        method: 'PUT'
      });
      
      const response = await authenticatedFetch(`/api/admin/users/${editModal.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('[ADMIN USERS] Edit user response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ADMIN USERS] Edit user error:', errorData);
        throw new Error(errorData.error || `Gagal mengemaskini pengguna: Status ${response.status}`);
      }

      const updatedUser = await response.json();
      console.log('[ADMIN USERS] User updated successfully:', {
        userId: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role
      });

      console.log('[ADMIN USERS] Refreshing users list...');
      await fetchUsers();
      setEditModal({ isOpen: false, user: null });
      console.log('[ADMIN USERS] Edit modal closed');
      
    } catch (err) {
      console.error('[ADMIN USERS] Error in handleEditSubmit:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      console.log('[ADMIN USERS] handleEditSubmit completed');
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Pengurusan Pengguna & Sistem
          </h1>
          <button 
            onClick={() => router.push('/admin/users/add')}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            Tambah Pengguna Baru
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-error border border-red-300 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Ralat: {error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Jumlah Pengguna</p>
                <p className="text-2xl font-bold text-blue-700">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Pengguna Aktif</p>
                <p className="text-2xl font-bold text-green-700">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Admin</p>
                <p className="text-2xl font-bold text-red-700">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Cari pengguna, email, nama staf atau ID staf..."
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">Semua Peranan</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="worker">Pekerja</option>
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
                
                <div className="flex gap-2">
                  <select 
                    className="input-field flex-1"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="username">Susun: Nama Pengguna</option>
                    <option value="email">Susun: Email</option>
                    <option value="role">Susun: Peranan</option>
                    <option value="staffName">Susun: Nama Staf</option>
                    <option value="createdAt">Susun: Tarikh Cipta</option>
                    <option value="lastLogin">Susun: Login Terakhir</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    title={sortOrder === 'asc' ? 'Menaik' : 'Menurun'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                      setStatusFilter('');
                      setSortBy('username');
                      setSortOrder('asc');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            {loading && filteredUsers.length === 0 ? (
              <p className="text-center py-10">Memuatkan data pengguna...</p>
            ) : !loading && filteredUsers.length === 0 && !error ? (
              <p className="text-center py-10 text-neutral">
                {users.length === 0 ? 'Tiada data pengguna ditemui.' : 'Tiada hasil carian ditemui.'}
              </p>
            ) : (
              <table className="w-full min-w-[1100px]">
                <thead className="bg-primary/5 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Pengguna</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Peranan & Status</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Maklumat Kakitangan</th>
                    <th className="text-left py-3 px-4 text-primary font-semibold text-sm">Aktiviti</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold text-sm">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-primary/5 cursor-pointer ${isToggling === user.id ? 'opacity-50' : ''}`}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetails(true);
                        }}>
                      <td className="py-4 px-4 text-sm text-neutral-dark">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            user.role === 'admin' ? 'bg-red-100' :
                            user.role === 'staff' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            <span className={`text-sm font-bold ${
                              user.role === 'admin' ? 'text-red-700' :
                              user.role === 'staff' ? 'text-blue-700' :
                              'text-green-700'
                            }`}>
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                                {user.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'worker' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 
                             user.role === 'staff' ? 'Staff' : 
                             user.role === 'worker' ? 'Pekerja' : user.role}
                          </span>
                          <div>
                            {user.status === 'active' ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-700 font-medium">Aktif</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">Tidak Aktif</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-dark">
                        {user.staff ? (
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{user.staff.name}</div>
                            <div className="text-xs text-gray-600">{user.staff.position}</div>
                            <div className="text-xs text-gray-500 font-mono">{user.staff.staffId}</div>
                            {user.staff.phone && user.staff.phone !== 'Not Provided' && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                <span>{user.staff.phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm italic">Tiada maklumat kakitangan</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>Cipta: {new Date(user.createdAt).toLocaleDateString('ms-MY')}</span>
                          </div>
                          {user.lastLogin && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <User className="h-3 w-3" />
                              <span>Login: {new Date(user.lastLogin).toLocaleDateString('ms-MY')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Kemaskini Pengguna"
                            disabled={isToggling === user.id}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(user.id, user.status);
                            }}
                            className={`p-2 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 ${
                              user.status === 'active' ? 'text-error hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'active' ? 'Nyahaktif Pengguna' : 'Aktifkan Pengguna'}
                            disabled={isToggling === user.id}
                          >
                            {isToggling === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <Power className="h-4 w-4" />
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

        {/* Edit Modal */}
        <Modal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, user: null })}
          title="Kemaskini Pengguna"
          size="lg"
        >
          {editModal.user && (
            <UserForm
              initialData={editModal.user}
              onSubmit={handleEditSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </Modal>
        
        {/* User Details Modal */}
        {showDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-primary">Maklumat Pengguna</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      selectedUser.role === 'admin' ? 'bg-red-100' :
                      selectedUser.role === 'staff' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      <span className={`text-2xl font-bold ${
                        selectedUser.role === 'admin' ? 'text-red-700' :
                        selectedUser.role === 'staff' ? 'text-blue-700' :
                        'text-green-700'
                      }`}>
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedUser.username}</h3>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                          selectedUser.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedUser.role === 'admin' ? 'Admin' : 
                           selectedUser.role === 'staff' ? 'Staff' : 'Pekerja'}
                        </span>
                        {selectedUser.status === 'active' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Tidak Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary border-b pb-2">Maklumat Akaun</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nama Pengguna</label>
                          <p className="font-medium">{selectedUser.username}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p>
                            <a href={`mailto:${selectedUser.email}`} className="text-primary hover:underline">
                              {selectedUser.email}
                            </a>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Peranan</label>
                          <p>{selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'staff' ? 'Staff' : 'Pekerja'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <p>{selectedUser.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tarikh Cipta</label>
                          <p>{new Date(selectedUser.createdAt).toLocaleDateString('ms-MY', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                        {selectedUser.lastLogin && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Login Terakhir</label>
                            <p>{new Date(selectedUser.lastLogin).toLocaleDateString('ms-MY', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary border-b pb-2">Maklumat Kakitangan</h4>
                      {selectedUser.staff ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Nama Penuh</label>
                            <p className="font-medium">{selectedUser.staff.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">ID Staf</label>
                            <p className="font-mono">{selectedUser.staff.staffId}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Jawatan</label>
                            <p>{selectedUser.staff.position}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email Kakitangan</label>
                            <p>
                              <a href={`mailto:${selectedUser.staff.email}`} className="text-primary hover:underline">
                                {selectedUser.staff.email}
                              </a>
                            </p>
                          </div>
                          {selectedUser.staff.phone && selectedUser.staff.phone !== 'Not Provided' && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Telefon</label>
                              <p>{selectedUser.staff.phone}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-500">Gaji</label>
                            <p className="text-green-700 font-semibold">
                              RM {parseFloat(selectedUser.staff.salary || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status Kakitangan</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedUser.staff.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedUser.staff.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Tarikh Masuk Kerja</label>
                            <p>{new Date(selectedUser.staff.joinDate).toLocaleDateString('ms-MY')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">
                          Pengguna ini tidak mempunyai maklumat kakitangan.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleEditClick(selectedUser);
                      }}
                      className="btn-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                      Kemaskini
                    </button>
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        handleToggleStatus(selectedUser.id, selectedUser.status);
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedUser.status === 'active' 
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Power className="h-4 w-4" />
                      {selectedUser.status === 'active' ? 'Nyahaktif' : 'Aktifkan'}
                    </button>
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