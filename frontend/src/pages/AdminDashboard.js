import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import {
  FiUsers,
  FiUploadCloud,
  FiTrash2,
  FiSearch,
  FiEdit2,
  FiLoader,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiLayout,
  FiPlus,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiMessageSquare,
  FiToggleLeft,
  FiToggleRight,
  FiCpu,
} from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

const AdminDashboard = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const [activeTab, setActiveTab] = useState('upload') // 'upload', 'users', 'stats', 'features'
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
  const [clearFirst, setClearFirst] = useState(false)

  // ── Landing Features state ──────────────────────────────────────────────────
  const [landingFeatures, setLandingFeatures] = useState([])
  const [featuresLoading, setFeaturesLoading] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null) // feature being edited
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [newFeature, setNewFeature] = useState({
    icon: 'FiStar', title: '', description: '', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    route: '/login', buttonLabel: 'Explore', order: 99, enabled: true,
  })
  const [savingFeature, setSavingFeature] = useState(false)

  // ── Chatbot Settings state ───────────────────────────────────────────
  const [chatbotSettings, setChatbotSettings] = useState(null)
  const [chatbotLoading, setChatbotLoading] = useState(false)
  const [chatbotSaving, setChatbotSaving] = useState(false)
  const [chatbotMsg, setChatbotMsg] = useState(null) // { type: 'success'|'error', text }

  const token = localStorage.getItem('authToken')

 

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

  const fetchUsers = useCallback(async (page = 1) => {
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
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }, [token, selectedRole, searchTerm])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate CSV on the client side before sending
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadResult({ message: 'Only CSV (.csv) files are accepted.', success: false })
      e.target.value = ''
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${config.apiBaseUrl}${config.endpoints.admin.uploadStudents}${
        clearFirst ? '?clearFirst=true' : ''
      }`

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadResult(response.data)
      fetchStats()
    } catch (error) {
      setUploadResult({
        message: error.response?.data?.message || 'Upload failed. Please check the file format.',
        success: false,
      })
    } finally {
      setUploading(false)
      e.target.value = ''
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
      //setCurrentPage(1)
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
    const csv = 'uid,college_id,email,name\n2022010001,CS001,student1@example.com,John Doe\n2022010002,CS002,jane@example.com,Jane Smith'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'allowed_users_template.csv'
    a.click()
  }

  // ── Landing Features handlers ────────────────────────────────────────────────
  const fetchLandingFeatures = async () => {
    setFeaturesLoading(true)
    try {
      const res = await axios.get(
        `${config.apiBaseUrl}${config.endpoints.admin.landingFeatures}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLandingFeatures(res.data)
    } catch (err) {
      console.error('Error fetching landing features:', err)
    } finally {
      setFeaturesLoading(false)
    }
  }

  const handleToggleFeature = async (id) => {
    try {
      const res = await axios.patch(
        `${config.apiBaseUrl}${config.endpoints.admin.landingFeatures}/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLandingFeatures(prev => prev.map(f => f._id === id ? res.data : f))
    } catch (err) {
      alert('Error toggling feature: ' + err.response?.data?.message)
    }
  }

  const handleDeleteFeature = async (id) => {
    if (!window.confirm('Delete this feature card from the landing page?')) return
    try {
      await axios.delete(
        `${config.apiBaseUrl}${config.endpoints.admin.landingFeatures}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLandingFeatures(prev => prev.filter(f => f._id !== id))
    } catch (err) {
      alert('Error deleting feature: ' + err.response?.data?.message)
    }
  }

  const handleSaveFeature = async () => {
    if (!editingFeature?.title || !editingFeature?.description) {
      alert('Title and description are required.')
      return
    }
    setSavingFeature(true)
    try {
      const res = await axios.put(
        `${config.apiBaseUrl}${config.endpoints.admin.landingFeatures}/${editingFeature._id}`,
        editingFeature,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLandingFeatures(prev => prev.map(f => f._id === editingFeature._id ? res.data : f))
      setEditingFeature(null)
    } catch (err) {
      alert('Error saving feature: ' + err.response?.data?.message)
    } finally {
      setSavingFeature(false)
    }
  }

  const handleAddFeature = async () => {
    if (!newFeature.title || !newFeature.description) {
      alert('Title and description are required.')
      return
    }
    setSavingFeature(true)
    try {
      const res = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.admin.landingFeatures}`,
        newFeature,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLandingFeatures(prev => [...prev, res.data])
      setShowAddFeature(false)
      setNewFeature({ icon: 'FiStar', title: '', description: '', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', route: '/login', buttonLabel: 'Explore', order: 99, enabled: true })
    } catch (err) {
      alert('Error adding feature: ' + err.response?.data?.message)
    } finally {
      setSavingFeature(false)
    }
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

  // ── Chatbot settings helpers ─────────────────────────────────────────
  const fetchChatbotSettings = async () => {
    setChatbotLoading(true)
    try {
      const res = await axios.get(
        `${config.apiBaseUrl}${config.endpoints.chatbot.adminSettings}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setChatbotSettings(res.data.settings)
    } catch (err) {
      console.error('Error fetching chatbot settings:', err)
    } finally {
      setChatbotLoading(false)
    }
  }

  const saveChatbotSettings = async () => {
    if (!chatbotSettings) return
    setChatbotSaving(true)
    setChatbotMsg(null)
    try {
      await axios.put(
        `${config.apiBaseUrl}${config.endpoints.chatbot.adminSettings}`,
        chatbotSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setChatbotMsg({ type: 'success', text: '✅ Chatbot settings saved successfully!' })
    } catch (err) {
      setChatbotMsg({ type: 'error', text: '❌ Failed to save: ' + (err.response?.data?.message || err.message) })
    } finally {
      setChatbotSaving(false)
      setTimeout(() => setChatbotMsg(null), 3500)
    }
  }
 // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Fetch users when tab changes or search/filter changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1)
    }
    if (activeTab === 'features') {
      fetchLandingFeatures()
    }
    if (activeTab === 'chatbot') {
      fetchChatbotSettings()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedRole, fetchUsers])
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
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'features'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiLayout className="inline mr-2" size={20} />
              Landing Features
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'chatbot'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiMessageSquare className="inline mr-2" size={20} />
              Chatbot
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

          {/* Landing Features Tab */}
          {activeTab === 'features' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Landing Page Features</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage the feature cards shown on the public landing page.</p>
                </div>
                <button
                  onClick={() => setShowAddFeature(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <FiPlus size={18} /> Add Feature
                </button>
              </div>

              {/* Add Feature Form */}
              {showAddFeature && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><FiPlus /> New Feature Card</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
                      <input value={newFeature.title} onChange={e => setNewFeature(p => ({...p, title: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Feature title" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Button Label</label>
                      <input value={newFeature.buttonLabel} onChange={e => setNewFeature(p => ({...p, buttonLabel: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Explore" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Icon Name</label>
                      <input value={newFeature.icon} onChange={e => setNewFeature(p => ({...p, icon: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="FiUsers" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Route</label>
                      <input value={newFeature.route} onChange={e => setNewFeature(p => ({...p, route: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="/login" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
                      <textarea value={newFeature.description} onChange={e => setNewFeature(p => ({...p, description: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Feature description..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 block mb-1">Gradient CSS Class</label>
                      <input value={newFeature.gradient} onChange={e => setNewFeature(p => ({...p, gradient: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleAddFeature} disabled={savingFeature}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60">
                      {savingFeature ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />} Save Feature
                    </button>
                    <button onClick={() => setShowAddFeature(false)}
                      className="inline-flex items-center gap-2 border border-gray-300 px-5 py-2 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50">
                      <FiX size={16} /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {featuresLoading ? (
                <div className="text-center py-12">
                  <FiLoader className="animate-spin mx-auto text-blue-600" size={32} />
                  <p className="text-gray-500 mt-2">Loading features...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {landingFeatures.map((feature) => (
                    <div key={feature._id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                      feature.enabled ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'
                    }`}>
                      {editingFeature?._id === feature._id ? (
                        /* ─ Edit Mode ─ */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Title</label>
                              <input value={editingFeature.title}
                                onChange={e => setEditingFeature(p => ({...p, title: e.target.value}))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Button Label</label>
                              <input value={editingFeature.buttonLabel}
                                onChange={e => setEditingFeature(p => ({...p, buttonLabel: e.target.value}))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Icon (e.g. FiUsers)</label>
                              <input value={editingFeature.icon}
                                onChange={e => setEditingFeature(p => ({...p, icon: e.target.value}))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Route</label>
                              <input value={editingFeature.route}
                                onChange={e => setEditingFeature(p => ({...p, route: e.target.value}))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                              <textarea value={editingFeature.description}
                                onChange={e => setEditingFeature(p => ({...p, description: e.target.value}))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-xs font-semibold text-gray-600 block mb-1">Gradient CSS Class</label>
                              <input value={editingFeature.gradient}
                                onChange={e => setEditingFeature(p => ({...p, gradient: e.target.value}))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleSaveFeature} disabled={savingFeature}
                              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60">
                              {savingFeature ? <FiLoader className="animate-spin" size={15} /> : <FiSave size={15} />} Save
                            </button>
                            <button onClick={() => setEditingFeature(null)}
                              className="inline-flex items-center gap-2 border border-gray-300 px-5 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                              <FiX size={15} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ─ View Mode ─ */
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${feature.gradient} shadow`}>
                            <span className="text-white text-xs font-bold">{feature.icon?.replace('Fi','')?.slice(0,3)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-800">{feature.title}</h3>
                              {!feature.enabled && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Hidden</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{feature.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{feature.icon}</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{feature.route}</span>
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{feature.buttonLabel}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleToggleFeature(feature._id)}
                              title={feature.enabled ? 'Hide from landing page' : 'Show on landing page'}
                              className={`p-2 rounded-lg transition-colors ${
                                feature.enabled
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              {feature.enabled ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                            </button>
                            <button
                              onClick={() => setEditingFeature({...feature})}
                              className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                              title="Edit feature"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteFeature(feature._id)}
                              className="p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                              title="Delete feature"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {landingFeatures.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                      <FiLayout size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No features yet. Click "Add Feature" to create one.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bulk Upload Allowed Users (CSV)</h2>

              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Upload Instructions:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• CSV file (.csv) with required columns: <strong>uid, college_id, email</strong></li>
                  <li>• Optional columns: name, and any additional fields</li>
                  <li>• Duplicate entries (by uid) are automatically updated, not duplicated</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>
                    <button
                      onClick={downloadTemplate}
                      className="text-blue-600 hover:underline font-semibold inline flex items-center gap-1 mt-1"
                    >
                      <FiDownload size={16} />
                      Download CSV Template
                    </button>
                  </li>
                </ul>
              </div>

              {/* Clear-first toggle */}
              <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="clearFirst"
                  checked={clearFirst}
                  onChange={(e) => setClearFirst(e.target.checked)}
                  className="w-4 h-4 accent-yellow-600 cursor-pointer"
                />
                <label htmlFor="clearFirst" className="text-yellow-800 text-sm font-medium cursor-pointer">
                  ⚠️ Clear existing allowed users before uploading new data
                  <span className="block text-yellow-600 text-xs mt-0.5">This will delete all current entries and replace them with the new CSV data.</span>
                </label>
              </div>

              {/* Upload Area */}
              <div className="mb-8">
                <label className="relative block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <FiUploadCloud size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    {uploading ? 'Uploading & processing...' : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-gray-500">CSV files only (.csv) — up to 10MB</p>
                </label>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`rounded-lg p-6 ${
                  uploadResult.success === false
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-start gap-4">
                    {uploadResult.success === false ? (
                      <FiAlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                    ) : (
                      <FiCheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-3 ${
                        uploadResult.success === false ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {uploadResult.message}
                      </h3>

                      {/* New summary shape from /api/csv/upload-allowed-users */}
                      {uploadResult.summary && (
                        <div className="text-sm space-y-1 text-green-800">
                          <p>📄 Total rows in CSV: <strong>{uploadResult.summary.total}</strong></p>
                          <p>✅ New entries inserted: <strong>{uploadResult.summary.inserted}</strong></p>
                          <p>🔄 Existing entries updated: <strong>{uploadResult.summary.updated}</strong></p>
                          <p>⊘ Skipped (invalid rows): <strong>{uploadResult.summary.skipped}</strong></p>
                          {uploadResult.summary.clearedBeforeInsert && (
                            <p className="text-yellow-700">🗑️ Collection was cleared before this upload.</p>
                          )}
                        </div>
                      )}

                      {/* Error details */}
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-3 text-xs bg-red-100 rounded p-3">
                          <p className="font-semibold text-red-800 mb-1">Row errors:</p>
                          {uploadResult.errors.map((err, idx) => (
                            <p key={idx} className="text-red-700">Row {err.row}: {err.error}</p>
                          ))}
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

          {/* Chatbot Settings Tab */}
          {activeTab === 'chatbot' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Chatbot Settings</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure the AI chatbot behavior and availability for all users.</p>
                </div>
              </div>

              {chatbotLoading ? (
                <div className="text-center py-16">
                  <FiLoader className="animate-spin mx-auto text-indigo-500" size={36} />
                  <p className="text-gray-500 mt-3">Loading chatbot settings...</p>
                </div>
              ) : chatbotSettings ? (
                <div className="space-y-6">

                  {/* Status feedback */}
                  {chatbotMsg && (
                    <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                      chatbotMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {chatbotMsg.text}
                    </div>
                  )}

                  {/* Toggle Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Enable/Disable Bot */}
                    <div className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                      chatbotSettings.enabled ? 'border-indigo-200 shadow-md' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${ chatbotSettings.enabled ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                            <FiMessageSquare size={22} className={chatbotSettings.enabled ? 'text-indigo-600' : 'text-gray-400'} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">Chatbot Active</p>
                            <p className="text-sm text-gray-500 mt-0.5">Show/hide the chat widget for all users</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setChatbotSettings(p => ({ ...p, enabled: !p.enabled }))}
                          className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                            chatbotSettings.enabled ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                          title={chatbotSettings.enabled ? 'Disable chatbot' : 'Enable chatbot'}
                        >
                          {chatbotSettings.enabled
                            ? <FiToggleRight size={38} />
                            : <FiToggleLeft size={38} />}
                        </button>
                      </div>
                      <div className={`mt-4 px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                        chatbotSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${ chatbotSettings.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {chatbotSettings.enabled ? 'Chatbot is LIVE for all users' : 'Chatbot is DISABLED'}
                      </div>
                    </div>

                    {/* Enable/Disable AI */}
                    <div className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                      chatbotSettings.useAI ? 'border-purple-200 shadow-md' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${ chatbotSettings.useAI ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            <FiCpu size={22} className={chatbotSettings.useAI ? 'text-purple-600' : 'text-gray-400'} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">AI Responses (OpenAI)</p>
                            <p className="text-sm text-gray-500 mt-0.5">Use GPT for unmatched queries (requires API key)</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setChatbotSettings(p => ({ ...p, useAI: !p.useAI }))}
                          className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                            chatbotSettings.useAI ? 'text-purple-600' : 'text-gray-400'
                          }`}
                          title={chatbotSettings.useAI ? 'Disable AI' : 'Enable AI'}
                        >
                          {chatbotSettings.useAI
                            ? <FiToggleRight size={38} />
                            : <FiToggleLeft size={38} />}
                        </button>
                      </div>
                      <div className={`mt-4 px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                        chatbotSettings.useAI ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${ chatbotSettings.useAI ? 'bg-purple-500' : 'bg-gray-400'}`} />
                        {chatbotSettings.useAI ? 'OpenAI GPT enabled' : 'Rule-based only'}
                      </div>
                    </div>
                  </div>

                  {/* Text settings */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <FiMessageSquare size={18} className="text-indigo-500" />
                      Appearance & Messages
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bot Name</label>
                        <input
                          type="text"
                          value={chatbotSettings.botName || ''}
                          onChange={e => setChatbotSettings(p => ({ ...p, botName: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                          placeholder="AlumniBot"
                        />
                        <p className="text-xs text-gray-400 mt-1">Display name in the chat widget header</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max History Length</label>
                        <input
                          type="number"
                          min={10} max={200}
                          value={chatbotSettings.maxHistoryLength || 50}
                          onChange={e => setChatbotSettings(p => ({ ...p, maxHistoryLength: parseInt(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                        />
                        <p className="text-xs text-gray-400 mt-1">Number of messages to keep per user session</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Welcome Message</label>
                      <textarea
                        value={chatbotSettings.welcomeMessage || ''}
                        onChange={e => setChatbotSettings(p => ({ ...p, welcomeMessage: e.target.value }))}
                        rows={4}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none"
                        placeholder="Hi! I'm AlumniBot, your AI assistant..."
                      />
                      <p className="text-xs text-gray-400 mt-1">Supports **bold** markdown. Shown to users when they open the chat for the first time.</p>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={saveChatbotSettings}
                      disabled={chatbotSaving}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60"
                    >
                      {chatbotSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                      {chatbotSaving ? 'Saving...' : 'Save Chatbot Settings'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                  <FiMessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Could not load chatbot settings. Please refresh.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
