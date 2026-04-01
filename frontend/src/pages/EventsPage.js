import React, { useState, useEffect, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FiCalendar, FiMapPin, FiPlus, FiUsers, FiLoader, FiSearch } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config/config'

const EventsPage = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [registeringEventId, setRegisteringEventId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Dynamic configuration
  const appConfig = useMemo(() => config, [])

  useEffect(() => {
    fetchEvents()
  }, [searchTerm])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = searchTerm ? { search: searchTerm } : {}
      const response = await axios.get(`${appConfig.apiBaseUrl}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setEvents(response.data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

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

    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post(`${appConfig.apiBaseUrl}/api/events`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setEvents([response.data.event || response.data, ...events])
      setFormData({ title: '', description: '', date: '', location: '' })
      setShowCreateForm(false)
      alert('Event created successfully!')
    } catch (error) {
      console.error('Error creating event:', error)
      alert(error.response?.data?.message || 'Error creating event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterEvent = async (eventId) => {
    setRegisteringEventId(eventId)
    try {
      const token = localStorage.getItem('authToken')
      await axios.post(
        `${appConfig.apiBaseUrl}/api/events/${eventId}/register`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      alert('Registration successful!')
      // Refresh events to show updated registration status
      fetchEvents()
    } catch (error) {
      console.error('Error registering for event:', error)
      alert('Error registering for event. Please try again.')
    } finally {
      setRegisteringEventId(null)
    }
  }

  const EventCard = ({ event }) => {
    const eventDate = new Date(event.date)
    const isUpcoming = eventDate > new Date()
    const hasRegistered = event.registrations?.some(reg => reg._id === user._id)
    const isPostedByMe = event.created_by?._id === user._id || event.created_by === user._id

    return (
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        {/* Header Background */}
        <div className="h-20 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"></div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Date Badge */}
          <div className="flex justify-center -mt-10 mb-4">
            <div className="bg-purple-600 text-white rounded-lg px-4 py-2 text-center shadow-lg">
              <p className="text-sm font-semibold">{eventDate.toLocaleString('default', { month: 'short' })}</p>
              <p className="text-2xl font-bold">{eventDate.getDate()}</p>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

          {/* Location */}
          <div className="flex items-center space-x-2 text-gray-700 mb-4">
            <FiMapPin size={18} className="text-red-600 flex-shrink-0" />
            <span className="text-sm">{event.location}</span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isUpcoming
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isUpcoming ? 'Upcoming' : 'Past Event'}
            </span>
            {isPostedByMe ? (
              <button
                onClick={() => navigate(`/events/${event._id}/registrants`)}
                className="px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center space-x-2"
              >
                <FiUsers size={16} />
                <span>View Registrants ({event.registrations?.length || 0})</span>
              </button>
            ) : isUpcoming && (
              <button
                onClick={() => handleRegisterEvent(event._id)}
                disabled={registeringEventId === event._id || hasRegistered}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2 ${
                  hasRegistered 
                    ? 'bg-green-600 text-white cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                {registeringEventId === event._id ? (
                  <>
                    <FiLoader size={16} className="animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : hasRegistered ? (
                  <span>Registered</span>
                ) : (
                  <span>Register</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const canCreateEvent = ['admin','alumni'].includes(user?.role)
  const addEventLabel = user?.role === 'alumni' ? 'Add Event' : 'Create Event'
  const addEventHeading = user?.role === 'alumni' ? 'Add New Event' : 'Create New Event'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="lg:ml-64">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="p-4 md:p-8 mt-16 lg:mt-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
              <p className="text-gray-600 mt-1">Join networking sessions and workshops</p>
            </div>
            {canCreateEvent && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiPlus size={20} />
                <span>{showCreateForm ? 'Close Form' : addEventLabel}</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Create Event Form */}
          {showCreateForm && canCreateEvent && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{addEventHeading}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <input
                    type="text"
                    name="title"
                    placeholder="Event Title"
                    value={formData.title}
                    onChange={handleChange}
                    className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />

                  {/* Date */}
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />

                  {/* Location */}
                  <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={formData.location}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Description */}
                <textarea
                  name="description"
                  placeholder="Event Description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                ></textarea>

                {/* Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70"
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventsPage
