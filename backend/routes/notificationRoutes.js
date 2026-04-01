import express from "express"
import protect from "../middleware/authMiddleware.js"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notificationController.js"

const router = express.Router()

// GET  /api/notifications          - fetch all notifications for logged-in user
router.get("/", protect, getNotifications)

// PUT  /api/notifications/read-all - mark all as read
router.put("/read-all", protect, markAllAsRead)

// PUT  /api/notifications/:id/read - mark single as read
router.put("/:id/read", protect, markAsRead)

// DELETE /api/notifications/clear  - clear all
router.delete("/clear", protect, clearAllNotifications)

// DELETE /api/notifications/:id    - delete single
router.delete("/:id", protect, deleteNotification)

export default router
