import express from "express"
import protect from "../middleware/authMiddleware.js"
import {
  handleMessage,
  getChatHistory,
  clearChatHistory,
  getPublicSettings,
} from "../controllers/chatbotController.js"

const router = express.Router()

// Public — frontend needs this to know if bot is enabled before auth
router.get("/settings", getPublicSettings)

// Protected — all chatbot interactions require login
router.post("/message", protect, handleMessage)
router.get("/history", protect, getChatHistory)
router.delete("/history", protect, clearChatHistory)

export default router
