import User from "../models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import AlumniData from "../models/AlumniData.js"


// REGISTER USER

export const registerUser = async (req,res)=>{

 try{

 const {college_id,name,email,password,branch,passout_year
} = req.body

 // CHECK EXCEL DATA RECORD
const record = await AlumniData.findOne({
  college_id,
  name,
  branch,
  passout_year
})
 if(!record){
  return res.status(400).json({
   message:"College record not found. Cannot register"
  })
 }

const userExists = await User.findOne({
 $or:[
  {college_id},
  {email}
 ]
})

 if(userExists){
  return res.status(400).json({message:"User already exists"})
 }

 const salt = await bcrypt.genSalt(10)
 const hashedPassword = await bcrypt.hash(password,salt)

const currentYear = new Date().getFullYear()

const year = Number(passout_year)

let role

if(year < currentYear){
 role = "alumni"
}else{
 role = "student"
}

 const user = await User.create({
  college_id,
  name,
  email,
  password:hashedPassword,
  branch,
  passout_year,
  role
 })

res.status(201).json({
 message:"User registered successfully",
 user:{
  id:user._id,
  name:user.name,
  email:user.email,
  role:user.role
 }
})
 }catch(error){
  res.status(500).json({message:error.message})
 }

}


// LOGIN USER

export const loginUser = async (req,res)=>{

 try{

const {email,password} = req.body

const user = await User.findOne({
 email
})

 if(!user){
  return res.status(404).json({message:"User not found"})
 }

 const isMatch = await bcrypt.compare(password,user.password)

 if(!isMatch){
  return res.status(401).json({message:"Invalid credentials"})
 }

 const token = jwt.sign(
  {id:user._id},
  process.env.JWT_SECRET,
  {expiresIn:"7d"}
 )

 res.json({
  token,
  user
 })

 }catch(error){
  res.status(500).json({message:error.message})
 }


}

export const searchAlumni = async (req,res)=>{
 try{

  const {name, branch, UID_No_} = req.body

  const alumni = await AlumniData.findOne({
    name,
    // passout_year,
    branch,
    UID_No_
  })

  if(!alumni){
   return res.status(404).json({message:"Record not found"})
  }

  res.json(alumni)

 }catch(error){
  res.status(500).json({message:error.message})
 }
}

export const registerOldAlumni = async (req,res)=>{

 try{

 const {name,email,password,branch,aadhar_no,passout_year} = req.body

 // CHECK ALUMNI DATABASE

 const record = await AlumniData.findOne({
  name,
  UID_No_:aadhar_no

 })

 if(!record){
  return res.status(404).json({
   message:"Alumni record not found"
  })
 }

 // CHECK USER ALREADY EXISTS

 const userExists = await User.findOne({email})

 if(userExists){
  return res.status(400).json({
   message:"User already registered"
  })
 }

 // HASH PASSWORD

 const salt = await bcrypt.genSalt(10)
 const hashedPassword = await bcrypt.hash(password,salt)

 // CREATE ACCOUNT

 const user = await User.create({
  name,
  email,
  password:hashedPassword,
  branch,
  passout_year,
  role:"alumni"
 })

 res.status(201).json({
  message:"Old alumni registered successfully",
  user:{
   id:user._id,
   name:user.name,
   email:user.email,
   role:user.role
  }
 })

 }catch(error){
  res.status(500).json({message:error.message})
 }

}


// GET PROFILE
export const getProfile = async (req, res) => {

 try {

  const user = await User.findById(req.user._id).select("-password")

  if (!user) {
   return res.status(404).json({ message: "User not found" })
  }

  res.json(user)

 } catch (error) {
  res.status(500).json({ message: error.message })
 }

}

// UPDATE PROFILE
export const updateProfile = async (req, res) => {

 try {

  const { name, bio, linkedin, company, job_role, location, profile_pic } = req.body

  const user = await User.findByIdAndUpdate(
   req.user._id,
   {
    name: name || req.user.name,
    bio: bio || req.user.bio,
    linkedin: linkedin || req.user.linkedin,
    company: company || req.user.company,
    job_role: job_role || req.user.job_role,
    location: location || req.user.location,
    profile_pic: profile_pic || req.user.profile_pic
   },
   { new: true }
  ).select("-password")

  if (!user) {
   return res.status(404).json({ message: "User not found" })
  }

  res.json({
   message: "Profile updated successfully",
   user
  })

 } catch (error) {
  res.status(500).json({ message: error.message })
 }

}