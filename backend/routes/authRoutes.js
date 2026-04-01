import express from "express"
import { 
 registerUser,
 loginUser,
 searchAlumni,
 getAllAlumni,
 registerOldAlumni,
    getProfile,
    updateProfile,
} from "../controllers/authController.js"
import protect from "../middleware/authMiddleware.js"

const router = express.Router()

// register with college ID
router.post("/register", registerUser)

// old alumni register
router.post("/register-old-alumni", registerOldAlumni)

// login
router.post("/login", loginUser)

// search alumni
router.get("/search-alumni", searchAlumni)

// get all alumni
router.get("/alumni", getAllAlumni)

// get profile (protected)
router.get("/profile", protect, getProfile)

// update profile (protected)
router.put("/profile", protect, updateProfile)


export default router