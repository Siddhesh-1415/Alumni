import Message from "../models/Message.js"
import User from "../models/User.js"
import { createAndEmitNotification } from "../controllers/notificationController.js"

// Store active users and their socket IDs
export const activeUsers = new Map()

// Dynamic configuration
const getSocketConfig = () => ({
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
})

export const initializeMessageSocket = (io) => {
  const config = getSocketConfig()

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`)

    // User comes online
    socket.on("user_online", (userId) => {
      activeUsers.set(userId, socket.id)

      // Join private notification room
      socket.join(`user:${userId}`)

      // Notify all users about online status
      io.emit("user_status", {
        userId,
        status: "online",
        activeUsers: Array.from(activeUsers.keys())
      })
      console.log(`👤 Online users: ${Array.from(activeUsers.keys()).join(", ")}`)
    })

    // Send message in real-time
    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, message } = data

        // Validate message length
        const maxLength = parseInt(process.env.MAX_MESSAGE_LENGTH) || 1000
        if (message.length > maxLength) {
          socket.emit("message_error", { error: `Message too long. Max ${maxLength} characters.` })
          return
        }

        // Save message to database
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          message,
          read: false
        })

        // Fetch with populated references
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "name email profile_pic role")
          .populate("receiver", "name email profile_pic role")

        // Send to receiver's socket if online
        const receiverSocket = activeUsers.get(receiverId)

        if (receiverSocket) {
          // Send directly to receiver
          io.to(receiverSocket).emit("receive_message", {
            _id: populatedMessage._id,
            sender: populatedMessage.sender,
            receiver: populatedMessage.receiver,
            message: populatedMessage.message,
            createdAt: populatedMessage.createdAt,
            read: populatedMessage.read
          })
        }

        // Create a persistent new_message notification for the receiver
        // (the receiver's chat UI will suppress it if they're actively viewing this conversation)
        await createAndEmitNotification({
          io,
          recipient: receiverId,
          type: 'new_message',
          message: `New message from ${populatedMessage.sender.name}`,
          senderId: populatedMessage.sender._id,
          meta: {
            senderName: populatedMessage.sender.name,
            preview: populatedMessage.message.substring(0, 60)
          }
        })

        // Send confirmation to sender
        socket.emit("message_sent", {
          _id: populatedMessage._id,
          status: receiverSocket ? "delivered" : "pending",
          createdAt: populatedMessage.createdAt
        })

        console.log(`📨 Message: ${senderId} → ${receiverId}`)
      } catch (error) {
        socket.emit("message_error", { error: error.message })
        console.error("Message error:", error)
      }
    })

    // Mark message as read
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageId, userId } = data

        const message = await Message.findByIdAndUpdate(
          messageId,
          { read: true },
          { new: true }
        )

        // Notify sender that message was read
        const senderSocket = activeUsers.get(message.sender.toString())
        if (senderSocket) {
          io.to(senderSocket).emit("message_read", {
            messageId,
            readBy: userId
          })
        }
      } catch (error) {
        console.error("Read status error:", error)
      }
    })

    // Typing indicator
    socket.on("typing", (data) => {
      const { senderId, receiverId } = data
      const receiverSocket = activeUsers.get(receiverId)

      if (receiverSocket) {
        io.to(receiverSocket).emit("user_typing", {
          userId: senderId
        })
      }
    })

    // Stop typing
    socket.on("stop_typing", (data) => {
      const { senderId, receiverId } = data
      const receiverSocket = activeUsers.get(receiverId)

      if (receiverSocket) {
        io.to(receiverSocket).emit("user_stop_typing", {
          userId: senderId
        })
      }
    })

    // Get online users
    socket.on("get_online_users", () => {
      socket.emit("online_users", Array.from(activeUsers.keys()))
    })

    // User goes offline
    socket.on("disconnect", () => {
      // Find and remove user from active users
      let offlineUserId = null
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId)
          offlineUserId = userId
          break
        }
      }

      if (offlineUserId) {
        io.emit("user_status", {
          userId: offlineUserId,
          status: "offline",
          activeUsers: Array.from(activeUsers.keys())
        })
        console.log(`👋 User offline: ${offlineUserId}`)
      }
    })

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })
  })
}
