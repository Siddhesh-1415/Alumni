import Event from "../models/Event.js"
import { createAndEmitNotification } from "./notificationController.js"

// CREATE EVENT
export const createEvent = async (req,res)=>{
 try{

 const {title,description,date,location} = req.body

 const event = await Event.create({
  title,
  description,
  date,
  location,
  created_by:req.user._id
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

 const { search } = req.query

 let query = {}

 if(search){
  query = {
   $or: [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { location: { $regex: search, $options: 'i' } }
   ]
  }
 }

 const events = await Event.find(query).populate("created_by","name email").populate("registrations","name email").sort({date:1})

 res.json(events)

 }catch(error){
  res.status(500).json({message:error.message})
 }
}


// REGISTER FOR EVENT
export const registerForEvent = async (req,res)=>{
 try{

 const event = await Event.findById(req.params.id).populate("created_by","name email")

 if(!event){
  return res.status(404).json({message:"Event not found"})
 }

 // Check if user already registered
 if(event.registrations.includes(req.user._id)){
  return res.status(400).json({message:"You have already registered for this event"})
 }

 event.registrations.push(req.user._id)
 await event.save()

 // Emit + persist notification to event creator
 const io = req.app.get('io')
 await createAndEmitNotification({
  io,
  recipient: event.created_by._id,
  type: 'event_registration',
  message: `${req.user.name} registered for your event: ${event.title}`,
  eventId: event._id,
  senderId: req.user._id,
  meta: {
   eventTitle: event.title,
   registrant: {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email
   }
  }
 })

 res.json({message:"Registration successful"})

 }catch(error){
  res.status(500).json({message:error.message})
 }
}

// UPDATE EVENT
export const updateEvent = async (req,res)=>{
 try{

 const event = await Event.findByIdAndUpdate(
  req.params.id,
  req.body,
  {new:true}
 )

 if(!event){
  return res.status(404).json({message:"Event not found"})
 }

 res.json({message:"Event updated successfully", event})

 }catch(error){
  res.status(500).json({message:error.message})
 }
}

// GET EVENT REGISTRANTS
export const getEventRegistrants = async (req,res)=>{
 try{

 const event = await Event.findById(req.params.id).populate("created_by","_id").populate("registrations","name email role createdAt")

 if(!event){
  return res.status(404).json({message:"Event not found"})
 }

 // Check if user is the event creator
 if(event.created_by._id.toString() !== req.user._id.toString()){
  return res.status(403).json({message:"Unauthorized"})
 }

 res.json({
  eventId: event._id,
  eventTitle: event.title,
  location: event.location,
  date: event.date,
  totalRegistrants: event.registrations.length,
  registrants: event.registrations
 })

 }catch(error){
  res.status(500).json({message:error.message})
 }
}