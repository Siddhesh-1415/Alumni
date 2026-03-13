import express from "express"
import { createJob, getJobs, getJobById, updateJob, deleteJob } from "../controllers/jobController.js"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

// create job
router.post("/", protect, authorizeRoles("alumni","admin"), createJob)

// get all jobs
router.get("/", protect, getJobs)

// get single job
router.get("/:id", protect, getJobById)

// update job
router.put("/:id", protect, authorizeRoles("alumni","admin"), updateJob)

// delete job
router.delete("/:id", protect, authorizeRoles("admin"), deleteJob)

export default router