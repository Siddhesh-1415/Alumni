import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({

 title:{
  type:String,
  required:true,
  trim:true
 },

 description:{
  type:String,
  required:true
 },

 date:{
  type:Date,
  required:true
 },

 location:{
  type:String,
  required:true
 },

 created_by:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User"
 },

 registrations:{
  type:[mongoose.Schema.Types.ObjectId],
  ref:"User",
  default:[]
 }

},{timestamps:true})

export default mongoose.model("Event", eventSchema)