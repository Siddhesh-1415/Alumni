import express from "express"
import User from "../models/User.js"
import Job from "../models/Job.js"
import Event from "../models/Event.js"
import { getPublicFeatures } from "../controllers/landingFeatureController.js"

const router = express.Router()

/**
 * GET /api/public/stats
 * No auth required — used by the landing page
 * Returns live counts: alumni, students, jobs, events + recent jobs & events
 */
router.get("/stats", async (req, res) => {
  try {
    const [
      alumniCount,
      studentCount,
      jobCount,
      eventCount,
      recentJobs,
      recentEvents,
      latestAlumni,
    ] = await Promise.all([
      User.countDocuments({ role: "alumni" }),
      User.countDocuments({ role: "student" }),
      Job.countDocuments(),
      Event.countDocuments(),
      // 3 latest jobs
      Job.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select("role company location salary createdAt"),
      // 3 upcoming / latest events
      Event.find()
        .sort({ date: 1 })
        .limit(3)
        .select("title date location description"),
      // 5 latest alumni (for avatars)
      User.find({ role: "alumni" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name"),
    ])

    res.json({
      stats: {
        alumni: alumniCount,
        students: studentCount,
        total: alumniCount + studentCount,
        jobs: jobCount,
        events: eventCount,
      },
      recentJobs,
      recentEvents,
      latestAlumni,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * GET /api/public/features
 * No auth required — returns enabled landing page feature cards
 */
router.get("/features", getPublicFeatures)

export default router
