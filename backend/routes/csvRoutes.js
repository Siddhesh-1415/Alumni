import express from "express"
import multer from "multer"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"
import {
  uploadAlumniDatasCSV,
  getAlumniDatas,
  clearAlumniDatas,
} from "../controllers/csvController.js"

const router = express.Router()

// ── Multer – store CSV in memory (no disk I/O needed) ────────────────────────
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const isCSV =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" || // some OS sends this for .csv
      file.originalname.toLowerCase().endsWith(".csv")

    if (isCSV) {
      cb(null, true)
    } else {
      cb(new Error("Only CSV files (.csv) are allowed."), false)
    }
  },
})

// ── Routes (all admin-only) ───────────────────────────────────────────────────

/**
 * POST /api/csv/upload-allowed-users
 * Body: multipart form-data, field name = "file"
 * Query: ?clearFirst=true  (optional – wipes collection before insert)
 */
router.post(
  "/upload-allowed-users",
  protect,
  authorizeRoles("admin"),
  csvUpload.single("file"),
  uploadAlumniDatasCSV
)

/**
 * GET /api/csv/allowed-users
 * Query: ?page=1&limit=20
 */
router.get(
  "/allowed-users",
  protect,
  authorizeRoles("admin"),
 getAlumniDatas
)

/**
 * DELETE /api/csv/allowed-users
 * Clears the entire allowed_users collection.
 */
router.delete(
  "/allowed-users",
  protect,
  authorizeRoles("admin"),
  clearAlumniDatas
)

export default router
