import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: ["job_application", "event_registration", "new_message"],
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // Optional references for navigation
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Extra metadata (job title, event title, applicant name, etc.)
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  read: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

// Index for fast unread queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

export default mongoose.model("Notification", notificationSchema)
