import express from "express"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"
import {
  uploadStudentsExcel,
  getAllUsers,
  getAdminStats,
  deleteUser,
  updateUserRole,
  searchUsers,
} from "../controllers/adminController.js"
import {
  getAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  toggleFeature,
} from "../controllers/landingFeatureController.js"
import {
  getAdminChatbotSettings,
  updateChatbotSettings,
} from "../controllers/chatbotController.js"
import multer from "multer"

const router = express.Router()

// Multer setup for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true)
    } else {
      cb(new Error("Only Excel files are allowed"), false)
    }
  },
})

// ✅ Upload students from Excel (admin only)
router.post(
  "/upload-students",
  protect,
  authorizeRoles("admin"),
  upload.single("file"),
  uploadStudentsExcel
)

// ✅ Get all users with pagination (admin only)
router.get("/users", protect, authorizeRoles("admin"), getAllUsers)

// ✅ Get admin statistics (admin only)
router.get("/stats", protect, authorizeRoles("admin"), getAdminStats)

// ✅ Delete user (admin only)
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser)

// ✅ Update user role (admin only)
router.put("/users/:id/role", protect, authorizeRoles("admin"), updateUserRole)

// ✅ Search users (admin only)
router.get("/search-users", protect, authorizeRoles("admin"), searchUsers)

// ── Landing Page Features (admin CRUD) ─────────────────────────────────────
router.get("/landing-features", protect, authorizeRoles("admin"), getAllFeatures)
router.post("/landing-features", protect, authorizeRoles("admin"), createFeature)
router.put("/landing-features/:id", protect, authorizeRoles("admin"), updateFeature)
router.delete("/landing-features/:id", protect, authorizeRoles("admin"), deleteFeature)
router.patch("/landing-features/:id/toggle", protect, authorizeRoles("admin"), toggleFeature)

// ── Chatbot Settings (admin) ────────────────────────────────────────────────
router.get("/chatbot-settings", protect, authorizeRoles("admin"), getAdminChatbotSettings)
router.put("/chatbot-settings", protect, authorizeRoles("admin"), updateChatbotSettings)

export default router
