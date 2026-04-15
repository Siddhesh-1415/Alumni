import csv from "csv-parser"
import { PassThrough } from "stream"
import AlumniData from "../models/AlumniData.js"

/**
 * POST /api/admin/upload-csv
 *
 * Accepts a multipart CSV file upload, parses it with csv-parser,
 * and upserts rows into the `allowed_users` MongoDB collection.
 *
 * Query param:  ?clearFirst=true  → wipes the collection before inserting
 *
 * Required CSV columns: uid, college_id, email
 * Optional columns:     name, and any extra fields (stored in `extra`)
 */
export const uploadAlumniDatasCSV = async (req, res) => {
  try {
    // ── 1. Validate file presence & type ──────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." })
    }

    if (
      req.file.mimetype !== "text/csv" &&
      !req.file.originalname.toLowerCase().endsWith(".csv")
    ) {
      return res.status(400).json({ message: "Only CSV files are allowed." })
    }

    // ── 2. Optionally clear old data ──────────────────────────────────────
    const clearFirst = req.query.clearFirst === "true"
    if (clearFirst) {
      await AlumniData.deleteMany({})
    }

    // ── 3. Parse CSV from buffer ───────────────────────────────────────────
    const rows = await parseCSVBuffer(req.file.buffer)

    if (rows.length === 0) {
      return res.status(400).json({ message: "CSV file is empty or has no data rows." })
    }

    // ── 4. Upsert each row ────────────────────────────────────────────────
    let insertedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +1 for header, +1 for human-readable index

      try {
        // Validate required fields
        const {  uid: UID_No_,name, college_id,passout_year,branch, email } = row

        if (!UID_No_ || !college_id || !email) {
          skippedCount++
          errors.push({
            row: rowNumber,
            data: row,
            error: "Missing required fields: uid, college_id, email",
          })
          continue
        }

        // Build document
        const doc = {
          UID_No_: UID_No_.trim(),
          college_id: college_id.trim(),
          email: email.trim().toLowerCase(),
          name: name ? name.trim() : "",
          passout_year: passout_year.trim(),
          branch: branch.trim(),  

        }
  
        // Use $setOnInsert to detect new vs existing documents
        const existing = await AlumniData.findOne({ UID_No_: doc.UID_No_ })

        await AlumniData.findOneAndUpdate(
          { UID_No_: doc.UID_No_ },
          { $set: doc },
          { upsert: true, new: true }
        )

        existing ? updatedCount++ : insertedCount++
      } catch (err) {
        skippedCount++
        errors.push({
          row: rowNumber,
          error: err.message,
        })
      }
    }

    // ── 5. Respond ────────────────────────────────────────────────────────
    return res.status(200).json({
      message: "CSV upload completed.",
      summary: {
        total: rows.length,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        clearedBeforeInsert: clearFirst,
      },
      errors: errors.slice(0, 20), // cap error list
    })
  } catch (err) {
    console.error("CSV upload error:", err)
    return res.status(500).json({ message: "Server error: " + err.message })
  }
}

/**
 * GET /api/admin/allowed-users
 *
 * Returns all documents in the allowed_users collection (paginated).
 */
export const getAlumniDatas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      AlumniData.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      AlumniData.countDocuments(),
    ])

    return res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/**
 * DELETE /api/admin/allowed-users
 *
 * Clears the entire allowed_users collection.
 */
export const clearAlumniDatas = async (req, res) => {
  try {
    const result = await AlumniData.deleteMany({})
    return res.json({
      message: "Allowed users collection cleared.",
      deletedCount: result.deletedCount,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helper: parse a CSV buffer into an array of plain objects
// ────────────────────────────────────────────────────────────────────────────
function parseCSVBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = []

    // Use PassThrough so csv-parser gets a proper readable binary stream
    const pass = new PassThrough()

    pass
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(), // strip BOM / whitespace from headers
          skipEmptyLines: true,
        })
      )
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err))

    pass.end(buffer)
  })
}
