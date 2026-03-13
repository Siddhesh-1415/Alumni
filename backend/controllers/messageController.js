import Message from "../models/Message.js"

export const sendMessage = async(req,res)=>{

 try{

 const {receiver,message} = req.body

 const newMessage = await Message.create({
  sender:req.user._id,
  receiver,
  message
 })

 res.json(newMessage)

 }catch(error){
  res.status(500).json({message:error.message})
 }

}

export const getMessages = async(req,res)=>{

 try{

 const {userId} = req.params

 const messages = await Message.find({
  $or:[
   {sender:req.user._id,receiver:userId},
   {sender:userId,receiver:req.user._id}
  ]
 }).sort({created_at:1})

 res.json(messages)

 }catch(error){
  res.status(500).json({message:error.message})
 }

}