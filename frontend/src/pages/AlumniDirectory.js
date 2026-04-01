import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FiSearch, FiMessageSquare, FiMapPin, FiBriefcase, FiLoader, FiRefreshCw } from 'react-icons/fi'
import UserAvatar from '../components/UserAvatar'
import axios from 'axios'
import config from '../config/config'

const AlumniDirectory = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagingUserId, setMessagingUserId] = useState(null)

  useEffect(() => {
    fetchAlumni()
  }, [])

  const fetchAlumni = async (searchQuery = '') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      let url = `${config.apiBaseUrl}${config.endpoints.auth.alumni}`
      if (searchQuery) {
        url = `${config.apiBaseUrl}${config.endpoints.auth.searchAlumni}?query=${encodeURIComponent(searchQuery)}`
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAlumni(response.data)
    } catch (error) {
      console.error('Error fetching alumni:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchAlumni(searchTerm)
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchAlumni()
  }

  const handleMessage = (person) => {
    setMessagingUserId(person._id)
    navigate('/chat', { state: { preSelectedUser: person } })
  }

  const filteredAlumni = alumni.filter((person) => {
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = !searchLower || (person.name && person.name.toLowerCase().includes(searchLower)) ||
      (person.company && person.company.toLowerCase().includes(searchLower))
    const matchesBranch = !branchFilter || person.branch === branchFilter
    const matchesLocation = !locationFilter || person.location === locationFilter
    return matchesSearch && matchesBranch && matchesLocation
  })

  const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology']
  const locations = [...new Set(alumni.map(person => person.location).filter(Boolean))]

  const AlumniCard = ({ person }) => (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Header Background */}
      <div className="h-20 bg-gradient-to-r from-blue-400 to-blue-600"></div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="flex justify-center -mt-10 mb-3">
          <UserAvatar name={person.name || 'A'} imageUrl={person.profileImage} size="w-20 h-20" fontSize="text-3xl" className="border-4 border-white shadow-sm" />
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 text-center">{person.name || 'N/A'}</h3>

        {/* Position */}
        <div className="flex items-center justify-center space-x-1 text-blue-600 text-sm mt-1">
          <FiBriefcase size={16} />
          <span>{person.job_role || 'N/A'}</span>
        </div>

        {/* Company */}
        <p className="text-gray-600 text-sm text-center mt-1">{person.company || 'N/A'}</p>

        {/* Location */}
        <div className="flex items-center justify-center space-x-1 text-gray-600 text-sm mt-2">
          <FiMapPin size={16} />
          <span>{person.location || 'N/A'}</span>
        </div>

        {/* Message Button */}
        <button 
          onClick={() => handleMessage(person)}
          disabled={messagingUserId === person._id}
          className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {messagingUserId === person._id ? (
            <>
              <FiLoader size={18} className="animate-spin" />
              <span>Messaging...</span>
            </>
          ) : (
            <>
              <FiMessageSquare size={18} />
              <span>Message</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4"></div>
      <div className="flex justify-center mb-3">
        <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
      <div className="h-10 bg-gray-300 rounded"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="lg:ml-64">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="p-4 md:p-8 mt-16 lg:mt-0">
          {/* Header with Refresh Button */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumni Directory</h1>
              <p className="text-gray-600">Connect with professionals from your college</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name or company
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="e.g., Google, Rajesh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-16 top-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
                  >
                    {loading ? (
                      <>
                        <FiLoader size={14} className="animate-spin" />
                      </>
                    ) : (
                      <span>Search</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setBranchFilter('')
                      setLocationFilter('')
                      handleRefresh()
                    }}
                    disabled={loading}
                    className="absolute right-2 top-2 bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'Clearing...' : 'Clear'}
                  </button>
                </div>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by branch
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-gray-600">
              Found <span className="font-semibold">{filteredAlumni.length}</span> alumni{filteredAlumni.length !== 1 ? '' : ''}
            </p>
          </div>

          {/* Alumni Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredAlumni.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlumni.map((person) => (
                <AlumniCard key={person._id} person={person} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No alumni found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlumniDirectory
