import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiBell, FiSearch, FiLogOut, FiLoader,
  FiX, FiCheck, FiCheckSquare, FiTrash2,
  FiBriefcase, FiCalendar, FiMessageSquare
} from 'react-icons/fi'
import UserAvatar from './UserAvatar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeIcon = (type) => {
  if (type === 'job_application') return <FiBriefcase size={14} className="text-blue-500" />
  if (type === 'event_registration') return <FiCalendar size={14} className="text-green-500" />
  if (type === 'new_message') return <FiMessageSquare size={14} className="text-purple-500" />
  return <FiBell size={14} className="text-gray-400" />
}

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Component ────────────────────────────────────────────────────────────────

const Navbar = ({
  user,
  setIsAuthenticated,
  setUser,
  notifications = [],
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
}) => {
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const panelRef = useRef(null)
  const previousCount = useRef(notifications.length)

  const unreadCount = notifications.filter(n => !n.read).length

  // Bell animation when new notification arrives
  useEffect(() => {
    if (notifications.length > previousCount.current) {
      setIsAnimating(true)
      const t = setTimeout(() => setIsAnimating(false), 600)
      previousCount.current = notifications.length
      return () => clearTimeout(t)
    }
    previousCount.current = notifications.length
  }, [notifications.length])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead?.(notification._id)

    if (notification.type === 'job_application' && notification.jobId) {
      navigate(`/jobs/${notification.jobId}/applicants`)
      setShowNotifications(false)
    } else if (notification.type === 'event_registration' && notification.eventId) {
      navigate(`/events/${notification.eventId}/registrants`)
      setShowNotifications(false)
    } else if (notification.type === 'new_message') {
      navigate('/chat')
      setShowNotifications(false)
    }
  }

  const handleBellClick = () => {
    setShowNotifications(prev => !prev)
  }

  const getUserColors = (role) => {
    const schemes = {
      alumni: { text: 'text-blue-600', hover: 'hover:text-blue-700' },
      student: { text: 'text-green-600', hover: 'hover:text-green-700' },
      admin: { text: 'text-purple-600', hover: 'hover:text-purple-700' },
    }
    return schemes[role] || schemes.alumni
  }

  const userColors = getUserColors(user?.role)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      setIsAuthenticated(false)
      setUser(null)
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search alumni, jobs, events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center space-x-6">
          {user && (
            <>
              {/* ── Notification Bell ── */}
              <div className="relative" ref={panelRef}>
                <button
                  id="notification-bell-btn"
                  onClick={handleBellClick}
                  className="relative text-gray-600 hover:text-blue-600 transition-colors focus:outline-none"
                  aria-label="Toggle notifications"
                >
                  <FiBell
                    size={24}
                    className={isAnimating ? 'animate-bounce text-red-500' : 'transition-colors'}
                  />
                  {unreadCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ${isAnimating ? 'animate-ping' : ''}`}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* ── Notification Panel ── */}
                {showNotifications && (
                  <div
                    id="notification-panel"
                    className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{ maxHeight: '480px', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <FiBell size={16} className="text-gray-600" />
                        <span className="font-semibold text-sm text-gray-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            id="mark-all-read-btn"
                            onClick={markAllAsRead}
                            title="Mark all as read"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <FiCheckSquare size={16} />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            id="clear-all-notifications-btn"
                            onClick={clearAllNotifications}
                            title="Clear all"
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <FiBell size={36} className="text-gray-300 mb-3" />
                          <p className="text-sm font-medium text-gray-500">You're all caught up!</p>
                          <p className="text-xs text-gray-400 mt-1">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`group relative px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                              notif.read
                                ? 'bg-white hover:bg-gray-50'
                                : 'bg-blue-50 hover:bg-blue-100'
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Type icon */}
                              <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                                notif.type === 'job_application' ? 'bg-blue-100' :
                                notif.type === 'event_registration' ? 'bg-green-100' :
                                'bg-purple-100'
                              }`}>
                                {typeIcon(notif.type)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                  {notif.message}
                                </p>

                                {/* Job-specific: applicant count */}
                                {notif.type === 'job_application' && notif.meta?.totalApplicants > 0 && (
                                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                                    👥 {notif.meta.totalApplicants} total applicant{notif.meta.totalApplicants !== 1 ? 's' : ''}
                                  </p>
                                )}

                                {/* Message-specific: preview */}
                                {notif.type === 'new_message' && notif.meta?.preview && (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">"{notif.meta.preview}"</p>
                                )}

                                <p className="text-xs text-gray-400 mt-1">{relativeTime(notif.createdAt)}</p>
                              </div>

                              {/* Unread dot + actions */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                )}
                                <div className="hidden group-hover:flex gap-1">
                                  {!notif.read && (
                                    <button
                                      title="Mark as read"
                                      onClick={(e) => { e.stopPropagation(); markAsRead?.(notif._id) }}
                                      className="text-blue-400 hover:text-blue-600 transition-colors"
                                    >
                                      <FiCheck size={13} />
                                    </button>
                                  )}
                                  <button
                                    title="Delete"
                                    onClick={(e) => { e.stopPropagation(); deleteNotification?.(notif._id) }}
                                    className="text-red-300 hover:text-red-500 transition-colors"
                                  >
                                    <FiX size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── User Info + Logout ── */}
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
                </div>
                <UserAvatar name={user?.name} imageUrl={user?.profileImage} />
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`${userColors.text} ${userColors.hover} transition-colors ml-2 ${
                    isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={isLoggingOut ? 'Logging out...' : 'Logout'}
                >
                  {isLoggingOut ? (
                    <FiLoader size={20} className="animate-spin" />
                  ) : (
                    <FiLogOut size={20} />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar
