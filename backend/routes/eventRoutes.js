import express from "express"
import { createEvent, getEvents } from "../controllers/eventController.js"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

// admin create event
router.post("/", protect, authorizeRoles("admin"), createEvent)

// all users view events
router.get("/", protect, getEvents)

export default router
