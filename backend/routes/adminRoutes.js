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

export default router
