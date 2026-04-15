import mongoose from "mongoose"

const chatbotSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  welcomeMessage: {
    type: String,
    default: "👋 Hi! I'm AlumniBot, your AI assistant. I can help you with alumni search, job listings, events, and account questions. How can I assist you today?"
  },
  botName: {
    type: String,
    default: "AlumniBot"
  },
  maxHistoryLength: {
    type: Number,
    default: 50
  },
  useAI: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true })

export default mongoose.model("ChatbotSettings", chatbotSettingsSchema)
