import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import { FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiLoader, FiUser as FiUserGroup } from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

const EventRegistrantsPage = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [eventDetails, setEventDetails] = useState(null)
  const [registrants, setRegistrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistrant, setSelectedRegistrant] = useState(null)

  const appConfig = useMemo(() => config, [])

  useEffect(() => {
    fetchEventRegistrants()
  }, [eventId])

  const fetchEventRegistrants = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        `${appConfig.apiBaseUrl}/api/events/${eventId}/registrants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setEventDetails(response.data)
      setRegistrants(response.data.registrants || [])
    } catch (error) {
      console.error('Error fetching registrants:', error)
      if (error.response?.status === 403) {
        alert('You do not have permission to view this event\'s registrants')
      }
    } finally {
      setLoading(false)
    }
  }

  const RegistrantCard = ({ registrant }) => (
    <div
      onClick={() => setSelectedRegistrant(selectedRegistrant?.email === registrant.email ? null : registrant)}
      className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border-l-4 ${
        selectedRegistrant?.email === registrant.email
          ? 'border-l-purple-600 bg-purple-50'
          : 'border-l-gray-200 hover:border-l-purple-400'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <UserAvatar name={registrant.name} imageUrl={registrant.profileImage} />
            <div>
              <h3 className="font-bold text-gray-900">{registrant.name}</h3>
              <p className="text-sm text-gray-600">{registrant.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full capitalize">
              {registrant.role}
            </span>
          </div>
        </div>
      </div>

      {selectedRegistrant?.email === registrant.email && (
        <div className="mt-4 pt-4 border-t border-purple-100">
          <div className="text-sm text-gray-600 space-y-2">
            <p><span className="font-semibold text-gray-800">Email:</span> {registrant.email}</p>
            <p><span className="font-semibold text-gray-800">Role:</span> <span className="capitalize">{registrant.role}</span></p>
            {registrant.createdAt && (
              <p><span className="font-semibold text-gray-800">Registered on:</span> {new Date(registrant.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}
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
            <button
              onClick={() => navigate('/events')}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium mb-4 transition-colors"
            >
              <FiArrowLeft size={20} />
              <span>Back to Events</span>
            </button>

            {eventDetails ? (
              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventDetails.eventTitle}</h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FiCalendar size={16} className="text-purple-500" />
                        <span>{new Date(eventDetails.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiMapPin size={16} className="text-red-500" />
                        <span>{eventDetails.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 px-6 py-4 rounded-lg text-center md:text-right border border-purple-100">
                    <div className="flex items-center justify-center md:justify-end space-x-2 text-purple-600 text-3xl font-bold">
                      <FiUsers size={28} />
                      <span>{eventDetails.totalRegistrants}</span>
                    </div>
                    <p className="text-sm text-purple-800 font-medium mt-1">Total Registrants</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Registrants List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FiLoader size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading registrants...</p>
              </div>
            </div>
          ) : registrants.length > 0 ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Registrants ({registrants.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registrants.map((registrant) => (
                  <RegistrantCard key={registrant._id || registrant.email} registrant={registrant} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-100">
              <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Registrants Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">Nobody has registered for this event yet. Check back closer to the event date!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventRegistrantsPage
