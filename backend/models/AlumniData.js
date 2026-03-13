import mongoose from "mongoose"

const alumniDataSchema = new mongoose.Schema({

    name:{
 type:String,
 required:true
},

 college_id:String,

 name:String,

 email:String,

 branch:String,

 passout_year:Number,

 UID_No_:String


})

export default mongoose.model("AlumniData", alumniDataSchema)