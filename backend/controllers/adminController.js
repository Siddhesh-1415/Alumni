import User from "../models/User.js"
import bcrypt from "bcrypt"
import xlsx from "xlsx"

// Upload students from Excel
export const uploadStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return res
        .status(400)
        .json({ message: "Excel file is empty or invalid format" })
    }

    // Process each row
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +1 for header, +1 for human-readable

      try {
        // Validate required fields
        if (!row.uid || !row.college_id || !row.email || !row.password) {
          errorCount++
          errors.push({
            row: rowNumber,
            error: "Missing required fields (uid, college_id, email, password)",
          })
          continue
        }

        // Check if user already exists
        const userExists = await User.findOne({
          $or: [{ uid: row.uid }, { email: row.email }, { college_id: row.college_id }],
        })

        if (userExists) {
          skipCount++
          continue
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(row.password, salt)

        // Create user
        await User.create({
          uid: row.uid,
          college_id: row.college_id,
          email: row.email,
          password: hashedPassword,
          name: row.name || "",
          role: "student",
        })

        successCount++
      } catch (error) {
        errorCount++
        errors.push({
          row: rowNumber,
          error: error.message,
        })
      }
    }

    res.json({
      message: "Excel upload completed",
      successCount,
      skipCount,
      errorCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      total: data.length,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page || 1
    const limit = req.query.limit || 10
    const skip = (page - 1) * limit

    const users = await User.find()
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await User.countDocuments()

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get admin statistics
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const studentCount = await User.countDocuments({ role: "student" })
    const alumniCount = await User.countDocuments({ role: "alumni" })
    const adminCount = await User.countDocuments({ role: "admin" })

    // Get recent registrations
    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      stats: {
        totalUsers,
        studentCount,
        alumniCount,
        adminCount,
      },
      recentUsers,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Prevent deleting the last admin
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!["student", "alumni", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User role updated successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query, role } = req.query

    let filter = {}

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { uid: { $regex: query, $options: "i" } },
        { college_id: { $regex: query, $options: "i" } },
      ]
    }

    if (role && ["student", "alumni", "admin"].includes(role)) {
      filter.role = role
    }

    const users = await User.find(filter).select("-password").limit(20)

    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
