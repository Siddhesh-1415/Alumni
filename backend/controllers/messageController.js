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

 // Automatically mark messages from this user as read
 await Message.updateMany(
  { sender: userId, receiver: req.user._id, read: false },
  { $set: { read: true } }
 )

 const messages = await Message.find({
  $or:[
   {sender:req.user._id,receiver:userId},
   {sender:userId,receiver:req.user._id}
  ]
 }).sort({createdAt:1})

 res.json(messages)

 }catch(error){
  res.status(500).json({message:error.message})
 }

}

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name role email')
      .populate('receiver', 'name role email')
      .sort({ createdAt: -1 })

    const conversationsMap = new Map()

    messages.forEach((msg) => {
      const isSender = msg.sender._id.toString() === userId.toString()
      const partner = isSender ? msg.receiver : msg.sender
      const partnerId = partner._id.toString()

      const unread = (!msg.read && !isSender) ? 1 : 0

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          _id: partner._id,
          name: partner.name || partner.email || 'Unknown User',
          role: partner.role,
          email: partner.email,
          online: false,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unread
        })
      } else {
        // Since messages are sorted newest first, the existing entry already has the
        // LATEST message text and time. We only need to accumulate the unread count.
        const existing = conversationsMap.get(partnerId)
        existing.unread += unread
        conversationsMap.set(partnerId, existing)
      }
    })

    const conversations = Array.from(conversationsMap.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime)

    res.json(conversations)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
