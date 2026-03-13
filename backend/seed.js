import mongoose from "mongoose"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import User from "./models/User.js"

dotenv.config()

mongoose.connect(process.env.MONGO_URI)

const createAdmin = async () => {

 try{

 const hashedPassword = await bcrypt.hash("admin123",10)

 const admin = new User({
  college_id:"ADMIN001",
  name:"Super Admin",
  email:"admin@alumni.com",
  password:hashedPassword,
  role:"admin"
 })

 await admin.save()

 console.log("Admin created successfully")
 process.exit()

 }catch(error){

 console.log(error)
 process.exit()

 }

}

createAdmin()