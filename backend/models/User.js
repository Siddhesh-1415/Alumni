import mongoose from "mongoose"

const userSchema = new mongoose.Schema({

college_id:{
  type:String,
  unique:true,
  sparse:true
},

 name:{
  type:String,
  required:true
 },

 email:{
  type:String,
  required:true,
  unique:true,
  lowercase:true,
  trim:true
},

 password:{
  type:String,
  required:true
},

 role:{
  type:String,
  enum:["student","alumni","admin"],
  default:"student"
 },

 branch:String,

 passout_year:Number,

 company:String,

 job_role:String,

 location:String,

linkedin:String,

bio:String,

profile_pic:String



},
{timestamps:true})

export default mongoose.model("User", userSchema)