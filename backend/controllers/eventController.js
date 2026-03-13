import Event from "../models/Event.js"

// CREATE EVENT
export const createEvent = async (req,res)=>{
 try{

 const {title,description,date,location} = req.body

 const event = await Event.create({
  title,
  description,
  date,
  location,
  createdBy:req.user._id
 })

 res.status(201).json({
  message:"Event created successfully",
  event
 })

 }catch(error){
  res.status(500).json({message:error.message})
 }
}


// GET EVENTS
export const getEvents = async (req,res)=>{
 try{

 const events = await Event.find().sort({date:1})

 res.json(events)

 }catch(error){
  res.status(500).json({message:error.message})
 }
}