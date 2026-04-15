import express from "express"
import { 
 registerUser,
 loginUser,
 searchAlumni,
 getAllAlumni,
 registerOldAlumni,
    getProfile,
    updateProfile,
    sendOtp,
    verifyOtp,
    resetPassword,
    sendPhoneOtp,
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

// ─── Forgot Password ─────────────────────────────────────────────────────────
router.post("/forgot-password/send-otp", sendOtp)             // Email OTP
router.post("/forgot-password/send-phone-otp", sendPhoneOtp)  // SMS OTP
router.post("/forgot-password/verify-otp", verifyOtp)
router.post("/forgot-password/reset", resetPassword)


export default router