import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 4000
  },
  intent: {
    type: String,
    enum: ["alumni_search", "jobs", "events", "account_help", "general", "greeting", "unknown"],
    default: "unknown"
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

chatSessionSchema.pre('save', function (next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date()
  }
  next()
})

export default mongoose.model("ChatSession", chatSessionSchema)
