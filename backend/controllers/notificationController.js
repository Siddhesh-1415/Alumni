import Notification from "../models/Notification.js"

// GET all notifications for logged-in user (unread first, then read, newest first)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ read: 1, createdAt: -1 })
      .limit(50)

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    })

    res.json({ notifications, unreadCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// MARK a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.json({ notification })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// MARK ALL notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    )

    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE a single notification
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    })

    res.json({ message: "Notification deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE ALL (clear all) notifications for the user
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id })
    res.json({ message: "All notifications cleared" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Internal helper: create a notification and emit it via socket if the user is online
export const createAndEmitNotification = async ({
  io,
  recipient,        // ObjectId of the user to notify
  type,             // "job_application" | "event_registration" | "new_message"
  message,
  jobId,
  eventId,
  senderId,
  meta = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      message,
      jobId,
      eventId,
      senderId,
      meta,
      read: false
    })

    // Emit to user's private room: "user:<userId>"
    if (io) {
      io.to(`user:${recipient.toString()}`).emit("notification", {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        jobId: notification.jobId,
        eventId: notification.eventId,
        senderId: notification.senderId,
        meta: notification.meta,
        read: notification.read,
        createdAt: notification.createdAt
      })
    }

    return notification
  } catch (error) {
    console.error("Failed to create notification:", error.message)
  }
}
