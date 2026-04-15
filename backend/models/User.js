import mongoose from "mongoose"

const userSchema = new mongoose.Schema({

uid:{
  type:String,
  unique:true,
  required:true,
  trim:true
},

college_id:{
  type:String,
  unique:true,
  sparse:true
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

 name:{
  type:String
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

profile_pic:String,

phone: { type: String, default: null, sparse: true },

resetOtp: { type: String, default: null },

resetOtpExpiry: { type: Date, default: null }


},
{timestamps:true})

export default mongoose.model("User", userSchema)