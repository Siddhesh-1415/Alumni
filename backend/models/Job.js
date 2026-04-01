import mongoose from "mongoose"

const jobSchema = new mongoose.Schema({

 company:{
  type:String,
  required:true,
  trim:true
 },

 role:{
  type:String,
  required:true
 },

 description:{
  type:String,
  required:true
 },

 salary:{
  type:String,
 },

 location:{
  type:String,
  required:true
 },

 posted_by:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User"
 },

 applications:{
  type:[mongoose.Schema.Types.ObjectId],
  ref:"User",
  default:[]
 }

},{timestamps:true})

export default mongoose.model("Job", jobSchema)