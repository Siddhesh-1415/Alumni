import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import {
  FiUsers,
  FiUploadCloud,
  FiTrash2,
  FiSearch,
  FiEdit2,
  FiX,
  FiLoader,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
} from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

const AdminDashboard = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const [activeTab, setActiveTab] = useState('upload') // 'upload', 'users', 'stats'
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [editingUserId, setEditingUserId] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const token = localStorage.getItem('authToken')

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  // Fetch users when tab changes or search/filter changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1)
    }
  }, [activeTab, selectedRole])

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}${config.endpoints.admin.stats}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [token])

  const fetchUsers = async (page = 1) => {
    setLoadingUsers(true)
    try {
      let url = `${config.apiBaseUrl}${config.endpoints.admin.users}?page=${page}&limit=${config.ui.itemsPerPage}`
      if (selectedRole !== 'all') {
        url = `${config.apiBaseUrl}${config.endpoints.admin.searchUsers}?role=${selectedRole}`
      } else if (searchTerm) {
        url = `${config.apiBaseUrl}${config.endpoints.admin.searchUsers}?query=${searchTerm}`
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUsers(response.data.users || response.data)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${config.apiBaseUrl}${config.endpoints.admin.uploadStudents}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadResult(response.data)
      fetchStats() // Refresh stats after upload
    } catch (error) {
      setUploadResult({
        message: error.response?.data?.message || 'Upload failed',
        success: false,
      })
    } finally {
      setUploading(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await axios.delete(`${config.apiBaseUrl}${config.endpoints.admin.users}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUsers(users.filter((u) => u._id !== userId))
      fetchStats()
    } catch (error) {
      alert('Error deleting user: ' + error.response?.data?.message)
    }
  }

  const handleUpdateRole = async (userId) => {
    try {
      await axios.put(
        `${config.apiBaseUrl}${config.endpoints.admin.users}/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)))
      setEditingUserId(null)
      setNewRole('')
      fetchStats()
    } catch (error) {
      alert('Error updating role: ' + error.response?.data?.message)
    }
  }

  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    if (term.trim()) {
      fetchUsersBySearch(term)
    } else {
      setCurrentPage(1)
      fetchUsers(1)
    }
  }

  const fetchUsersBySearch = async (query) => {
    setLoadingUsers(true)
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}${config.endpoints.admin.searchUsers}?query=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUsers(response.data)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'uid,college_id,email,password,name\n2022010001,CS001,student1@email.com,password123,John Doe'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_template.csv'
    a.click()
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="lg:ml-64">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="p-4 md:p-8 mt-16 lg:mt-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage students, users, and system data</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiBarChart2 className="inline mr-2" size={20} />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiUploadCloud className="inline mr-2" size={20} />
              Upload Students
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiUsers className="inline mr-2" size={20} />
              User Management
            </button>
          </div>

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div>
              {loadingStats ? (
                <div className="text-center py-8">
                  <FiLoader className="animate-spin mx-auto mb-2" size={32} />
                  <p className="text-gray-600">Loading statistics...</p>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard icon={FiUsers} title="Total Users" value={stats.stats.totalUsers} color="bg-blue-600" />
                  <StatCard icon={FiUsers} title="Students" value={stats.stats.studentCount} color="bg-green-600" />
                  <StatCard icon={FiUsers} title="Alumni" value={stats.stats.alumniCount} color="bg-purple-600" />
                  <StatCard icon={FiUsers} title="Admins" value={stats.stats.adminCount} color="bg-orange-600" />
                </div>
              ) : null}

              {/* Recent Registrations */}
              {stats?.recentUsers && stats.recentUsers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Registrations</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentUsers.map((u) => (
                          <tr key={u._id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">{u.name || 'N/A'}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                u.role === 'student' ? 'bg-blue-100 text-blue-700' : 
                                u.role === 'alumni' ? 'bg-purple-100 text-purple-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bulk Upload Students</h2>

              {/* Instructions */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Upload Instructions:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Excel file (.xlsx or .csv) with columns: uid, college_id, email, password, name</li>
                  <li>• Duplicate entries (same uid, email, or college_id) will be skipped</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>
                    <button
                      onClick={downloadTemplate}
                      className="text-blue-600 hover:underline font-semibold inline flex items-center gap-1"
                    >
                      <FiDownload size={16} />
                      Download Template
                    </button>
                  </li>
                </ul>
              </div>

              {/* Upload Area */}
              <div className="mb-8">
                <label className="relative block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <FiUploadCloud size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">Excel or CSV files up to 5MB</p>
                </label>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`rounded-lg p-6 ${uploadResult.success !== false ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start gap-4">
                    {uploadResult.success !== false ? (
                      <FiCheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                    ) : (
                      <FiAlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${uploadResult.success !== false ? 'text-green-900' : 'text-red-900'}`}>
                        {uploadResult.message}
                      </h3>
                      {uploadResult.successCount !== undefined && (
                        <div className={`text-sm space-y-1 ${uploadResult.success !== false ? 'text-green-800' : 'text-red-800'}`}>
                          <p>✓ Successfully added: {uploadResult.successCount} students</p>
                          <p>⊘ Skipped (duplicates): {uploadResult.skipCount} students</p>
                          {uploadResult.errorCount > 0 && (
                            <>
                              <p>✗ Errors: {uploadResult.errorCount} students</p>
                              {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <div className="mt-2 text-xs">
                                  <p className="font-semibold">First few errors:</p>
                                  {uploadResult.errors.map((err, idx) => (
                                    <p key={idx}>Row {err.row}: {err.error}</p>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div>
              {/* Search and Filter */}
              <div className="mb-6 bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search by name, email, uid, college_id..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="alumni">Alumni</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <FiLoader className="animate-spin mx-auto mb-2" size={32} />
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">UID</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Joined</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-3">{u.name || 'N/A'}</td>
                            <td className="px-6 py-3">{u.email}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{u.uid}</td>
                            <td className="px-6 py-3">
                              {editingUserId === u._id ? (
                                <div className="flex gap-2">
                                  <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Select Role</option>
                                    <option value="student">Student</option>
                                    <option value="alumni">Alumni</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button
                                    onClick={() => handleUpdateRole(u._id)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  u.role === 'student' ? 'bg-blue-100 text-blue-700' :
                                  u.role === 'alumni' ? 'bg-purple-100 text-purple-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {u.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingUserId(u._id)
                                    setNewRole(u.role)
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit role"
                                >
                                  <FiEdit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete user"
                                >
                                  <FiTrash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
