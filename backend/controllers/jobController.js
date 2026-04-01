import Job from "../models/Job.js"
import { createAndEmitNotification } from "./notificationController.js"

// CREATE JOB

export const createJob = async (req,res)=>{

 try{

 const {company,role,description,salary,location} = req.body

 const job = await Job.create({
  company,
  role,
  description,
  salary,
  location,
  posted_by:req.user._id
 })

 res.status(201).json(job)

 }catch(error){
  res.status(500).json({message:error.message})
 }

}


// GET ALL JOBS

export const getJobs = async (req,res)=>{

 try{

 const jobs = await Job.find().populate("posted_by","name email").populate("applications","name email")

 res.json(jobs)

 }catch(error){
  res.status(500).json({message:error.message})
 }

}

// GET SINGLE JOB
export const getJobById = async (req,res)=>{
 try{

 const job = await Job.findById(req.params.id)

 if(!job){
  return res.status(404).json({message:"Job not found"})
 }

 res.json(job)

 }catch(error){
  res.status(500).json({message:error.message})
 }
}


// UPDATE JOB
export const updateJob = async (req,res)=>{
 try{

 const job = await Job.findByIdAndUpdate(
  req.params.id,
  req.body,
  {new:true}
 )

 res.json(job)

 }catch(error){
  res.status(500).json({message:error.message})
 }
}


// DELETE JOB
export const deleteJob = async (req,res)=>{
 try{

 await Job.findByIdAndDelete(req.params.id)

 res.json({message:"Job deleted"})

 }catch(error){
  res.status(500).json({message:error.message})
 }
}


// APPLY TO JOB
export const applyToJob = async (req,res)=>{
 try{

 const job = await Job.findById(req.params.id).populate("posted_by","name email").populate("applications","name email role")

 if(!job){
  return res.status(404).json({message:"Job not found"})
 }

 // Check if user already applied
 if(job.applications.some(app => app._id.toString() === req.user._id.toString())){
  return res.status(400).json({message:"You have already applied to this job"})
 }

 job.applications.push(req.user._id)
 await job.save()

 // Refresh to get updated applicants list
 const updatedJob = await Job.findById(req.params.id).populate("applications","name email role")

 // Emit + persist notification to job poster
 const io = req.app.get('io')
 await createAndEmitNotification({
  io,
  recipient: job.posted_by._id,
  type: 'job_application',
  message: `${req.user.name} applied for your job: ${job.role}`,
  jobId: job._id,
  senderId: req.user._id,
  meta: {
   jobTitle: job.role,
   totalApplicants: updatedJob.applications.length,
   newApplicant: {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email
   }
  }
 })

 res.json({message:"Application submitted successfully"})

 }catch(error){
  res.status(500).json({message:error.message})
 }
}

// GET JOB APPLICANTS
export const getJobApplicants = async (req,res)=>{
 try{

 const job = await Job.findById(req.params.id).populate("posted_by","_id").populate("applications","name email role createdAt")

 if(!job){
  return res.status(404).json({message:"Job not found"})
 }

 // Check if user is the job poster
 if(job.posted_by._id.toString() !== req.user._id.toString()){
  return res.status(403).json({message:"Unauthorized"})
 }

 res.json({
  jobId: job._id,
  jobTitle: job.role,
  company: job.company,
  totalApplicants: job.applications.length,
  applicants: job.applications
 })

 }catch(error){
  res.status(500).json({message:error.message})
 }
}