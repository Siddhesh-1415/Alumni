import Message from "../models/Message.js"
import User from "../models/User.js"

// Store active users and their socket IDs
const activeUsers = new Map()

export const initializeMessageSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`)

    // User comes online
    socket.on("user_online", (userId) => {
      activeUsers.set(userId, socket.id)
      
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

        // Save message to database
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          message,
          read: false
        })

        // Fetch with populated references
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "name email profile_pic")
          .populate("receiver", "name email profile_pic")

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
