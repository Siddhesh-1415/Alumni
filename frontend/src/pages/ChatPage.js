import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FiSearch, FiSend, FiPhone, FiVideo, FiInfo, FiLoader } from 'react-icons/fi'
import UserAvatar from '../components/UserAvatar'
import axios from 'axios'
import io from 'socket.io-client'
import config from '../config/config'

const ChatPage = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const [conversations, setConversations] = useState([])
  const [usersList, setUsersList] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const messageEndRef = useRef(null)
  const socket = useRef(null)
  const typingTimeoutRef = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // If navigated from Alumni Directory, pre-select the user
    if (location.state && location.state.preSelectedUser) {
      const p = location.state.preSelectedUser
      setSelectedChat({
        _id: p._id,
        name: p.name,
        online: false, // will update later when user fetch completes
        role: p.role || 'alumni',
      })
      // Clear the state so refreshing doesn't keep locking to this user
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  // Dynamic configuration
  const appConfig = useMemo(() => config, [])

  // Dynamic styling based on user role
  const getUserColors = (role) => {
    const colorSchemes = {
      alumni: {
        gradient: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-600',
        textColor: 'text-blue-100',
        hoverColor: 'hover:bg-blue-700',
      },
      student: {
        gradient: 'from-green-400 to-green-600',
        bgColor: 'bg-green-600',
        textColor: 'text-green-100',
        hoverColor: 'hover:bg-green-700',
      },
      admin: {
        gradient: 'from-purple-400 to-purple-600',
        bgColor: 'bg-purple-600',
        textColor: 'text-purple-100',
        hoverColor: 'hover:bg-purple-700',
      },
    }
    return colorSchemes[role] || colorSchemes.alumni
  }

  const userColors = useMemo(() => getUserColors(user?.role), [user?.role])

  // Dynamic timestamp formatting
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  useEffect(() => {
    // Initialize socket connection
    if (!socket.current) {
      socket.current = io(appConfig.socketUrl)
      socket.current.emit('user_online', user._id)

      // Listen for incoming messages
      socket.current.on('receive_message', (data) => {
        if (selectedChat && data.senderId === selectedChat._id) {
          // If the chat is open, silently fetch to pull the message and mark it as read in the DB
          fetchMessages(data.senderId)
        }

        // Update conversations list to refresh unread badges and snippets
        fetchConversations()
      })

      socket.current.on('user_status', (data) => {
        setOnlineUsers(new Set(data.activeUsers || []))
      })

      socket.current.on('user_typing', (data) => {
        if (selectedChat && data.userId === selectedChat._id) {
          setIsTyping(true)
        }
      })

      socket.current.on('user_stop_typing', (data) => {
        if (selectedChat && data.userId === selectedChat._id) {
          setIsTyping(false)
        }
      })
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect()
        socket.current = null
      }
    }
  }, [selectedChat, user._id, appConfig.socketUrl])

  // Fetch users and conversations on mount
  useEffect(() => {
    fetchUsers()
    fetchConversations()
  }, [])

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id)
    }
  }, [selectedChat])

  // Auto-scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${appConfig.apiBaseUrl}/api/auth/alumni`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // remove current user from list and add online status
      const otherUsers = (response.data || [])
        .filter((u) => u._id !== user._id)
        .map(u => ({ ...u, online: onlineUsers.has(u._id) }))
      setUsersList(otherUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsersList([])
    }
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${appConfig.apiBaseUrl}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const convs = (response.data || []).map(conv => ({
        ...conv,
        online: onlineUsers.has(conv._id),
        lastMessageTime: formatTimestamp(conv.lastMessageTime)
      }))
      setConversations(convs)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (recipientId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${appConfig.apiBaseUrl}/api/messages/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const formattedMessages = (response.data || []).map(msg => ({
        ...msg,
        text: msg.text || msg.message || '',
        sender: msg.sender,
        receiver: msg.receiver,
        timestamp: formatTimestamp(msg.createdAt || msg.timestamp),
      }))
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedChat || messageInput.length > appConfig.limits.maxMessageLength) return

    setSending(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post(`${appConfig.apiBaseUrl}/api/messages/send`, {
        receiver: selectedChat._id,
        message: messageInput.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const newMessage = {
        _id: response.data._id || Date.now().toString(),
        sender: user._id,
        text: messageInput.trim(),
        timestamp: formatTimestamp(new Date()),
        read: false,
      }

      setMessages(prev => [...prev, newMessage])
      setMessageInput('')

      // Update conversation
      setConversations(prev => prev.map(conv =>
        conv._id === selectedChat._id
          ? { ...conv, lastMessage: messageInput.trim(), lastMessageTime: formatTimestamp(new Date()) }
          : conv
      ))

      // Emit socket event
      if (socket.current) {
        socket.current.emit('send_message', {
          senderId: user._id,
          receiverId: selectedChat._id,
          message: messageInput.trim(),
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Could add toast notification here
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (socket.current && selectedChat) {
      socket.current.emit('typing', {
        senderId: user._id,
        receiverId: selectedChat._id,
      })

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping()
      }, appConfig.limits.typingTimeout)
    }
  }

  const handleStopTyping = () => {
    if (socket.current && selectedChat) {
      socket.current.emit('stop_typing', {
        senderId: user._id,
        receiverId: selectedChat._id,
      })
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = usersList.filter((u) =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMessages = messages.filter((msg) =>
    msg.text?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ConversationItem = ({ conversation, isActive, onClick }) => {
    const colors = getUserColors(conversation.role)

    return (
      <div
        onClick={onClick}
        className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <UserAvatar name={conversation.name || 'U'} imageUrl={conversation.profileImage} size="w-12 h-12" />
            {conversation.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">{conversation.name || 'User'}</h3>
              <span className="text-xs text-gray-500">{conversation.lastMessageTime || ''}</span>
            </div>
            <p className="text-gray-600 text-xs truncate mt-1">{conversation.lastMessage || 'No messages yet'}</p>
            {conversation.role && (
              <span className="text-xs text-gray-400 capitalize">{conversation.role}</span>
            )}
          </div>

          {/* Unread Badge */}
          {conversation.unread > 0 && (
            <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread}
            </div>
          )}
        </div>
      </div>
    )
  }

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isOwn
            ? `${userColors.bgColor} text-white rounded-br-none`
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="text-sm break-words">{message.text}</p>
        <p className={`text-xs mt-1 ${isOwn ? userColors.textColor : 'text-gray-500'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  )

  const SkeletonConversation = () => (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="flex space-x-3">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />

      <div className="lg:ml-64 flex-1 flex flex-col">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="flex-1 flex gap-4 p-4 md:p-8 mt-16 lg:mt-0 max-w-full overflow-hidden">
          {/* Left Panel - Conversations */}
          <div className="w-full md:w-80 flex flex-col bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search conversations, users, and messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SkeletonConversation key={i} />
                  ))}
                </>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    isActive={selectedChat?._id === conversation._id}
                    onClick={() => {
                      setSelectedChat(conversation)
                      fetchMessages(conversation._id)
                    }}
                  />
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((person) => (
                  <ConversationItem
                    key={person._id}
                    conversation={{
                      _id: person._id,
                      name: person.name,
                      online: person.online,
                      role: person.role,
                      lastMessage: '',
                      lastMessageTime: null,
                      unread: 0,
                    }}
                    isActive={selectedChat?._id === person._id}
                    onClick={() => {
                      setSelectedChat({
                        _id: person._id,
                        name: person.name,
                        online: person.online,
                        role: person.role,
                      })
                      fetchMessages(person._id)
                    }}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No contacts available yet</p>
                  <p className="text-xs mt-1">Start by searching for alumni or students</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="hidden md:flex flex-1 flex-col bg-white rounded-lg shadow overflow-hidden">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <UserAvatar name={selectedChat.name || 'U'} imageUrl={selectedChat.profileImage} />
                      {selectedChat.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedChat.name || 'User'}</h3>
                      <p className="text-xs text-gray-500">
                        {selectedChat.online ? 'Online' : 'Offline'} • {selectedChat.role || 'User'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voice Call"
                      disabled={!selectedChat.online}
                    >
                      <FiPhone size={20} className={`${selectedChat.online ? 'text-gray-600' : 'text-gray-400'}`} />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Video Call"
                      disabled={!selectedChat.online}
                    >
                      <FiVideo size={20} className={`${selectedChat.online ? 'text-gray-600' : 'text-gray-400'}`} />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="User Info"
                    >
                      <FiInfo size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {searchTerm ? (
                    // Show search results
                    filteredMessages.length > 0 ? (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} containing "{searchTerm}"
                          </p>
                        </div>
                        {filteredMessages.map((message) => (
                          <MessageBubble
                            key={message._id}
                            message={message}
                            isOwn={message.sender === user._id}
                          />
                        ))}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-gray-500 mb-2">No messages found containing "{searchTerm}"</p>
                          <p className="text-xs text-gray-400">Try a different search term</p>
                        </div>
                      </div>
                    )
                  ) : (
                    // Show all messages
                    messages.length > 0 ? (
                      messages.map((message) => (
                        <MessageBubble
                          key={message._id}
                          message={message}
                          isOwn={message.sender === user._id}
                        />
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-gray-500 mb-2">No messages yet. Start the conversation!</p>
                          <p className="text-xs text-gray-400">Say hello to {selectedChat.name}</p>
                        </div>
                      </div>
                    )
                  )}
                  {isTyping && !searchTerm && (
                    <div className="mb-4">
                      <div className="inline-flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value)
                        handleTyping()
                      }}
                      onBlur={handleStopTyping}
                      placeholder={`Type a message to ${selectedChat.name}...`}
                      maxLength={appConfig.limits.maxMessageLength}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageInput.trim() || messageInput.length > appConfig.limits.maxMessageLength}
                      className={`p-2 ${userColors.bgColor} text-white rounded-lg ${userColors.hoverColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {sending ? (
                        <FiLoader size={20} className="animate-spin" />
                      ) : (
                        <FiSend size={20} />
                      )}
                    </button>
                  </div>
                  {messageInput.length > appConfig.limits.maxMessageLength * 0.8 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {messageInput.length}/{appConfig.limits.maxMessageLength} characters
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">
                    {loading ? 'Loading conversations...' : 'Select a conversation to start chatting'}
                  </p>
                  {!loading && (
                    <p className="text-xs text-gray-400">Choose someone from the list or search for new contacts</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
