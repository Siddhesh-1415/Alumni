import express from "express"
import { createEvent, getEvents, registerForEvent, updateEvent, getEventRegistrants } from "../controllers/eventController.js"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

// admin, alumni, or student create event (safest: prevents any 403 for valid session and recent UI state)
router.post("/", protect, authorizeRoles("student","admin","alumni"), createEvent)

// all users view events
router.get("/", protect, getEvents)

// register for event
router.post("/:id/register", protect, registerForEvent)

// admin or alumni update event
router.put("/:id", protect, authorizeRoles("admin","alumni"), updateEvent)

// get event registrants
router.get("/:id/registrants", protect, getEventRegistrants)

export default router
