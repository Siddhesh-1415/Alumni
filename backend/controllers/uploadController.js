// import XLSX from "xlsx"
// import AlumniData from "../models/AlumniData.js"

// export const uploadExcel = async (req,res)=>{

//  try{

//  const workbook = XLSX.readFile(req.file.path)

//  const sheetName = workbook.SheetNames[0]
//     const range = {
//     s: { r: 5, c: 2 }, // Top-left: C6
//     e: { r: 62, c: 18 } // Bottom-right: S63
// };
//  const sheetData = XLSX.utils.sheet_to_json(
//   workbook.Sheets[sheetName],
//   { range:range }
//  )
//  console.log(sheetData)
 
// for(let i of sheetData){
// const data={

//  college_id:i['GR No.'],

//  name:i['Student Name'],

//  email:i['Email ID'],

//  branch:i['Class'],

//  passout_year:2026

// }
// await AlumniData.insertOne(data)

// }
 
//  res.json({
//   message:"Excel data uploaded successfully",
//   data:sheetData.length
//  })

//  }catch(error){

//   res.status(500).json({message:error.message})

//  }

// }

import XLSX from "xlsx"
import AlumniData from "../models/AlumniData.js"
import fs from "fs"

export const uploadExcel = async (req, res) => {
  try {
    // Validate that files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        message: "No files uploaded" 
      })
    }

    let totalRecords = 0
    const uploadResults = []

    // Process each uploaded file
    for (const file of req.files) {
      try {
        // Validate file type
        if (!file.originalname.endsWith(".xlsx") && !file.originalname.endsWith(".xls")) {
          uploadResults.push({
            filename: file.originalname,
            status: "failed",
            error: "Invalid file type. Only .xlsx and .xls files are supported"
          })
          continue
        }

        const workbook = XLSX.readFile(file.path)
        const sheetName = workbook.SheetNames[0]

        const range = {
          s: {r:5,c:2}, e: {r:62,c:18}
        }

        const sheetData = XLSX.utils.sheet_to_json(
          workbook.Sheets[sheetName],
          { range: range }
        )

        let fileRecords = 0

        for (let i of sheetData) {
          console.log(i)
          const data = {
            college_id: i['GR No.'],
            name: i['Student Name'],
            email: i['Email ID'],
            branch: i['Class'],
            UID_No_: i['UID No.'],
            passout_year: 2026
          }

          await AlumniData.create(data)
          fileRecords++
          totalRecords++
        }

        uploadResults.push({
          filename: file.originalname,
          status: "success",
          recordsInserted: fileRecords
        })

      } catch (fileError) {
        uploadResults.push({
          filename: file.originalname,
          status: "failed",
          error: fileError.message
        })
      } finally {
        // Clean up uploaded file
        fs.unlink(file.path, (err) => {
          if (err) console.error(`Failed to delete file: ${file.path}`)
        })
      }
    }

    res.json({
      message: "File upload process completed",
      totalRecordsInserted: totalRecords,
      filesProcessed: uploadResults.length,
      details: uploadResults
    })

  } catch (error) {
    res.status(500).json({ 
      message: "Server error during file upload",
      error: error.message 
    })
  }
}