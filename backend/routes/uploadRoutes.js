import express from "express"
import upload from "../middleware/uploadMiddleware.js"
import { uploadExcel } from "../controllers/uploadController.js"

const router = express.Router()

// Handle both "file" and "files" field names for flexibility
router.post("/excel", upload.fields([
  { name: "files", maxCount: 10 },
  { name: "file", maxCount: 10 }
]), (req, res, next) => {
  // Combine both fields into req.files array for the controller
  const files = req.files?.files || []
  const singleFiles = req.files?.file || []
  req.files = [...files, ...singleFiles]
  next()
}, uploadExcel)

export default router
