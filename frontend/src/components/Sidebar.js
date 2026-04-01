import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  FiHome, FiUser, FiUsers, FiBriefcase, FiCalendar, 
  FiMessageSquare, FiLogOut, FiMenu, FiX, FiSettings 
} from 'react-icons/fi'
import UserAvatar from './UserAvatar'

const Sidebar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Build menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
      { name: 'My Profile', icon: FiUser, path: '/profile' },
      { name: 'Alumni Directory', icon: FiUsers, path: '/alumni' },
      { name: 'Jobs', icon: FiBriefcase, path: '/jobs' },
      { name: 'Events', icon: FiCalendar, path: '/events' },
      { name: 'Chat', icon: FiMessageSquare, path: '/chat' },
    ]

    if (user?.role === 'admin') {
      return [{ name: 'Admin Dashboard', icon: FiSettings, path: '/admin-dashboard' }]
    } else {
      // Students and alumni both get chat now
      return baseItems
    }
  }

  const menuItems = getMenuItems()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="font-bold text-blue-600 text-xl">Alumni Portal</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 hover:text-blue-600"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-600">
          <h1 className="text-2xl font-bold">Alumni Portal</h1>
          <p className="text-blue-200 text-sm mt-1">Professional Network</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-blue-600">
          <div className="flex items-center space-x-3">
            <UserAvatar name={user?.name || 'U'} imageUrl={user?.profileImage} size="w-10 h-10" />
            <div>
              <p className="font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-blue-200 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-white text-blue-700 font-semibold'
                    : 'text-blue-100 hover:bg-blue-600'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  )
}

export default Sidebar
