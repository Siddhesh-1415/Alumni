import Job from "../models/Job.js"

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

 const jobs = await Job.find().populate("posted_by","name email")

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