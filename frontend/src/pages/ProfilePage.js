import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FiEdit2, FiLinkedin, FiBriefcase, FiMapPin, FiMail, FiPhone } from 'react-icons/fi'
import UserAvatar from '../components/UserAvatar'
import axios from 'axios'
import config from '../config/config'

const ProfilePage = ({ user, setUser, setIsAuthenticated, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(user || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUser(response.data.user)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="lg:ml-64">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="p-4 md:p-8 mt-16 lg:mt-0 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={18} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {isEditing ? (
            // Edit Form
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Cannot change)
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Passout Year (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passout Year
                  </label>
                  <input
                    type="number"
                    name="passout_year"
                    value={formData.passout_year || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ''}
                    onChange={handleChange}
                    placeholder="e.g., Google, Microsoft"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Job Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Role
                  </label>
                  <input
                    type="text"
                    name="job_role"
                    value={formData.job_role || ''}
                    onChange={handleChange}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    placeholder="e.g., Bangalore, India"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData(user)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            // View Profile
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Profile Header */}
              <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800"></div>

              <div className="px-6 pb-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16 mb-6">
                  <UserAvatar name={user?.name || 'U'} imageUrl={user?.profileImage} size="w-32 h-32" fontSize="text-5xl" className="border-4 border-white shadow-md z-10" />
                  <div className="mt-4 md:mt-0">
                    <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
                    <p className="text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiMail className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Email</p>
                      <p className="font-semibold text-gray-900">{user?.email}</p>
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiBriefcase className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Branch</p>
                      <p className="font-semibold text-gray-900">{user?.branch || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiBriefcase className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Company</p>
                      <p className="font-semibold text-gray-900">{user?.company || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Job Role */}
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <FiBriefcase className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Job Role</p>
                      <p className="font-semibold text-gray-900">{user?.job_role || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <FiMapPin className="text-red-600" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Location</p>
                      <p className="font-semibold text-gray-900">{user?.location || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiLinkedin className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">LinkedIn</p>
                      {user?.linkedin ? (
                        <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">
                          View Profile
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {user?.bio && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-700">{user.bio}</p>
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

export default ProfilePage
