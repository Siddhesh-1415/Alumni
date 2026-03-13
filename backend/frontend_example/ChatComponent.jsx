// ChatComponent.jsx - React Example

import React, { useState, useEffect, useRef } from 'react'
import {
  initializeSocket,
  sendMessage,
  onMessageReceived,
  onMessageSent,
  markMessageAsRead,
  onMessageRead,
  startTyping,
  stopTyping,
  onUserTyping,
  onUserStopTyping,
  onUserStatus,
  disconnectSocket
} from './messageSocket'

const ChatComponent = ({ currentUserId, selectedUserId }) => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const typingTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    initializeSocket(currentUserId)

    // Load initial messages from database
    fetchMessages()

    // Listen for incoming messages
    onMessageReceived((message) => {
      setMessages(prev => [...prev, message])
      // Auto-mark as read
      markMessageAsRead(message._id, currentUserId)
    })

    // Listen for online status updates
    onUserStatus((data) => {
      setOnlineUsers(data.activeUsers)
    })

    // Listen to typing indicator
    onUserTyping(({ userId }) => {
      if (userId === selectedUserId) {
        setIsTyping(true)
      }
    })

    // Listen to stop typing
    onUserStopTyping(({ userId }) => {
      if (userId === selectedUserId) {
        setIsTyping(false)
      }
    })

    return () => {
      disconnectSocket()
    }
  }, [currentUserId])

  // Fetch messages from database
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(
        `/api/messages/${selectedUserId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle send message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    sendMessage(currentUserId, selectedUserId, inputValue)
    setInputValue('')
    stopTyping(currentUserId, selectedUserId)
  }

  // Handle typing
  const handleTyping = (e) => {
    setInputValue(e.target.value)

    // Emit typing indicator
    startTyping(currentUserId, selectedUserId)

    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current)

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentUserId, selectedUserId)
    }, 2000)
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{selectedUserId}</h3>
        <span className={`status ${onlineUsers.includes(selectedUserId) ? 'online' : 'offline'}`}>
          {onlineUsers.includes(selectedUserId) ? '🟢 Online' : '⚪ Offline'}
        </span>
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message ${msg.sender === currentUserId ? 'sent' : 'received'}`}
          >
            <div className="message-content">{msg.message}</div>
            <div className="message-time">
              {new Date(msg.createdAt).toLocaleTimeString()}
              {msg.sender === currentUserId && (
                <span className="read-status">{msg.read ? '✓✓' : '✓'}</span>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  )
}

export default ChatComponent
