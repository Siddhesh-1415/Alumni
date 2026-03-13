// messageSocket.js - Socket.IO Client Service for React/Vue

import io from "socket.io-client"

let socket = null

export const initializeSocket = (userId) => {
  socket = io("http://localhost:5000", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  })

  socket.on("connect", () => {
    console.log("✅ Connected to chat server")
    // Notify server that user is online
    socket.emit("user_online", userId)
  })

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from chat server")
  })

  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })

  return socket
}

// Send a message
export const sendMessage = (senderId, receiverId, message) => {
  if (!socket) return
  
  socket.emit("send_message", {
    senderId,
    receiverId,
    message
  })
}

// Receive messages in real-time
export const onMessageReceived = (callback) => {
  if (!socket) return
  socket.on("receive_message", callback)
}

// Listen for delivery status
export const onMessageSent = (callback) => {
  if (!socket) return
  socket.on("message_sent", callback)
}

// Mark message as read
export const markMessageAsRead = (messageId, userId) => {
  if (!socket) return
  socket.emit("mark_as_read", { messageId, userId })
}

// Listen for read status
export const onMessageRead = (callback) => {
  if (!socket) return
  socket.on("message_read", callback)
}

// Typing indicator - send when user starts typing
export const startTyping = (senderId, receiverId) => {
  if (!socket) return
  socket.emit("typing", { senderId, receiverId })
}

// Stop typing indicator
export const stopTyping = (senderId, receiverId) => {
  if (!socket) return
  socket.emit("stop_typing", { senderId, receiverId })
}

// Listen to typing indicator
export const onUserTyping = (callback) => {
  if (!socket) return
  socket.on("user_typing", callback)
}

// Listen to stop typing
export const onUserStopTyping = (callback) => {
  if (!socket) return
  socket.on("user_stop_typing", callback)
}

// Get online users
export const getOnlineUsers = () => {
  if (!socket) return
  socket.emit("get_online_users")
}

// Listen for online users list
export const onOnlineUsers = (callback) => {
  if (!socket) return
  socket.on("online_users", callback)
}

// Listen for user status (online/offline)
export const onUserStatus = (callback) => {
  if (!socket) return
  socket.on("user_status", callback)
}

// Disconnect from socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
