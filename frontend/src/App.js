import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import AlumniDirectory from './pages/AlumniDirectory'
import JobsPage from './pages/JobsPage'
import JobApplicantsPage from './pages/JobApplicantsPage'
import EventsPage from './pages/EventsPage'
import EventRegistrantsPage from './pages/EventRegistrantsPage'
import ChatPage from './pages/ChatPage'
import LandingPage from './pages/LandingPage'
import ChatBot from './components/ChatBot'
import './styles/index.css'
import io from 'socket.io-client'
import config from './config/config'

const API = config.apiBaseUrl

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const socket = useRef(null)

  // ─── Auth init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  // ─── Fetch persisted notifications from backend ──────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return
    try {
      const res = await fetch(`${API}${config.endpoints.notifications.base}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [])

  // ─── Mark single notification as read ────────────────────────────────────────
  const markAsRead = useCallback(async (notifId) => {
    const token = localStorage.getItem('authToken')
    try {
      await fetch(`${API}${config.endpoints.notifications.read(notifId)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev =>
        prev.map(n => n._id === notifId ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  // ─── Mark all as read ────────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    try {
      await fetch(`${API}${config.endpoints.notifications.readAll}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [])

  // ─── Delete single notification ───────────────────────────────────────────────
  const deleteNotification = useCallback(async (notifId) => {
    const token = localStorage.getItem('authToken')
    try {
      await fetch(`${API}${config.endpoints.notifications.delete(notifId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.filter(n => n._id !== notifId))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }, [])

  // ─── Clear all notifications ──────────────────────────────────────────────────
  const clearAllNotifications = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    try {
      await fetch(`${API}${config.endpoints.notifications.clear}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications([])
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }, [])

  // ─── Socket + initial fetch when authenticated ────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications()

      if (!socket.current) {
        socket.current = io(config.socketUrl)
        socket.current.emit('user_online', user._id)

        // Unified notification event from backend
        socket.current.on('notification', (notif) => {
          setNotifications(prev => {
            // Avoid duplicates (e.g. rapid reconnects)
            if (prev.some(n => n._id === notif._id)) return prev
            return [notif, ...prev]
          })

          // Browser push notification
          if (Notification.permission === 'granted') {
            new Notification('Alumni Portal', {
              body: notif.message,
              icon: '/favicon.ico'
            })
          }
        })
      }

      // Request browser notification permission
      if (Notification && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect()
        socket.current = null
      }
    }
  }, [isAuthenticated, user, fetchNotifications])

  const notificationProps = {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading Alumni Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'} /> :
            <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'} /> :
            <ForgotPasswordPage />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'} /> :
            <RegisterPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ?
            (user?.role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Dashboard user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} />) :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            isAuthenticated && user?.role === 'admin' ? <AdminDashboard user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <ProfilePage user={user} setUser={setUser} setIsAuthenticated={setIsAuthenticated} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/alumni"
          element={
            isAuthenticated ? <AlumniDirectory user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/jobs"
          element={
            isAuthenticated ? <JobsPage user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/jobs/:jobId/applicants"
          element={
            isAuthenticated ? <JobApplicantsPage user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/events"
          element={
            isAuthenticated ? <EventsPage user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/events/:eventId/registrants"
          element={
            isAuthenticated ? <EventRegistrantsPage user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated && (user?.role === 'alumni' || user?.role === 'admin' || user?.role === 'student') ?
            <ChatPage user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} {...notificationProps} /> :
            <Navigate to="/login" />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ?
            (user?.role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/dashboard" />) :
            <LandingPage />
          }
        />
      </Routes>

      {/* ─── Global Floating ChatBot widget ─────────────────────────────── */}
      <ChatBot user={user} isAuthenticated={isAuthenticated} />
    </Router>
  )
}

export default App
