import ChatSession from "../models/ChatSession.js"
import ChatbotSettings from "../models/ChatbotSettings.js"
import User from "../models/User.js"
import Job from "../models/Job.js"
import Event from "../models/Event.js"
import detectIntent from "../utils/intentDetector.js"

// ─── OpenAI lazy initializer ─────────────────────────────────────────────────
let openaiClient = null
const getOpenAI = async () => {
  if (!openaiClient) {
    try {
      const { default: OpenAI } = await import("openai")
      openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    } catch {
      return null
    }
  }
  return openaiClient
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrCreateSession = async (userId) => {
  let session = await ChatSession.findOne({ user: userId })
  if (!session) {
    session = await ChatSession.create({ user: userId, messages: [] })
  }
  return session
}

const getSettings = async () => {
  let settings = await ChatbotSettings.findOne()
  if (!settings) {
    settings = await ChatbotSettings.create({})
  }
  return settings
}

// ─── Rule-based responses ─────────────────────────────────────────────────────

const RULE_RESPONSES = {
  greeting: () =>
    "👋 Hello! I'm **AlumniBot**, your smart assistant for the Alumni Portal.\n\nI can help you with:\n• 🔍 **Alumni Search** — find fellow alumni by name, company, or branch\n• 💼 **Job Listings** — explore current openings posted by alumni\n• 📅 **Events** — see upcoming seminars, workshops & reunions\n• 🔑 **Account Help** — login, registration, and profile questions\n\nWhat would you like to know?",

  account_help: () =>
    "🔑 **Account Help**\n\nHere are common account actions:\n\n• **Forgot Password?** → Go to Login page → click *Forgot Password* → enter email/phone → enter OTP → reset\n• **Register?** → You need to be in the university records (CSV upload by admin)\n• **Update Profile?** → Navigate to your Profile page after logging in\n• **Logout?** → Click your avatar in the top-right corner\n\nNeed more specific help? Just ask!",

  general: () =>
    "ℹ️ **About the Alumni Portal**\n\nThis platform connects students, alumni, and the institution. Key features:\n\n• 👥 Alumni directory with search & filters\n• 💼 Job board posted by alumni & admin\n• 📅 Events & reunions management\n• 💬 Real-time messaging between alumni\n• 🔔 Notifications for updates\n\nWhat would you like to explore?",
}

const jobsResponse = async () => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("posted_by", "name company")
    if (!jobs.length) {
      return "💼 No job listings are currently available. Check back soon – alumni post new opportunities regularly!"
    }
    let msg = `💼 **Latest Job Listings** (${jobs.length} found)\n\n`
    jobs.forEach((j, i) => {
      msg += `**${i + 1}. ${j.role}** at *${j.company}*\n`
      msg += `   📍 ${j.location}${j.salary ? `  |  💰 ${j.salary}` : ""}\n`
      if (j.posted_by?.name) msg += `   👤 Posted by: ${j.posted_by.name}\n`
      msg += "\n"
    })
    msg += "👉 Visit the **Jobs** page to see all listings and apply!"
    return msg
  } catch {
    return "💼 Unable to fetch job listings right now. Please visit the Jobs page directly."
  }
}

const eventsResponse = async () => {
  try {
    const now = new Date()
    const events = await Event.find({ date: { $gte: now } })
      .sort({ date: 1 })
      .limit(5)
    if (!events.length) {
      return "📅 No upcoming events at the moment. Stay tuned – new events are added regularly by the admin!"
    }
    let msg = `📅 **Upcoming Events** (${events.length} found)\n\n`
    events.forEach((e, i) => {
      const dateStr = new Date(e.date).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      })
      msg += `**${i + 1}. ${e.title}**\n`
      msg += `   📍 ${e.location}  |  🗓️ ${dateStr}\n`
      if (e.description) msg += `   ${e.description.slice(0, 80)}${e.description.length > 80 ? "..." : ""}\n`
      msg += "\n"
    })
    msg += "👉 Visit the **Events** page to register!"
    return msg
  } catch {
    return "📅 Unable to fetch events right now. Please visit the Events page directly."
  }
}

const alumniSearchResponse = async (message) => {
  try {
    // Try to extract a search term from the user's message
    const cleaned = message
      .replace(/find|search|look\s?up|who\s?is|show\s?me|tell\s?me\s?about|alumni|alum|graduate?/gi, "")
      .replace(/\b(from|in|at|of|the|a|an)\b/gi, "")
      .trim()

    const query = cleaned.length > 2 ? cleaned : null

    if (!query) {
      return "🔍 **Alumni Search**\n\nI can search alumni by name, company, or branch.\n\nPlease tell me who you're looking for — e.g.:\n• *\"Find alumni at Google\"*\n• *\"Search alumni from Computer Science\"*\n• *\"Who is Rahul Sharma?\"*\n\nOr visit the **Alumni Directory** page for advanced filters."
    }

    const users = await User.find({
      role: { $in: ["alumni", "student"] },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
        { branch: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
      ],
    })
      .select("name company job_role branch passout_year location linkedin role")
      .limit(5)

    if (!users.length) {
      return `🔍 No alumni found matching **"${query}"**.\n\nTry a different name, company, or branch, or visit the **Alumni Directory** for full search options.`
    }

    let msg = `🔍 **Alumni matching "${query}"** (${users.length} result${users.length !== 1 ? "s" : ""})\n\n`
    users.forEach((u, i) => {
      msg += `**${i + 1}. ${u.name || "Unknown"}** — *${u.role}*\n`
      if (u.company) msg += `   🏢 ${u.company}${u.job_role ? ` — ${u.job_role}` : ""}\n`
      if (u.branch) msg += `   🎓 ${u.branch}${u.passout_year ? ` (${u.passout_year})` : ""}\n`
      if (u.location) msg += `   📍 ${u.location}\n`
      msg += "\n"
    })
    msg += "👉 For more results, visit the **Alumni Directory** page."
    return msg
  } catch {
    return "🔍 Unable to search alumni right now. Please use the Alumni Directory page directly."
  }
}

// ─── AI fallback via OpenAI ───────────────────────────────────────────────────

const getAIResponse = async (messages, userMessage, intent) => {
  const ai = await getOpenAI()
  if (!ai || !process.env.OPENAI_API_KEY) return null

  const systemPrompt = `You are AlumniBot, the friendly and knowledgeable AI assistant for an Alumni Portal web application.
You help users with: alumni directory search, job listings, upcoming events, account/login issues, and general platform questions.
Keep responses concise, friendly, and formatted with markdown (bold, bullets).
If asked about specific data (like job listings or events), gently mention that they can visit the relevant page for full details.
If you don't know something, politely say so and suggest contacting the admin.
Current user's detected intent: ${intent}`

  // Use last 6 message pairs for context (to stay within token budget)
  const contextMessages = messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  try {
    const completion = await ai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...contextMessages,
        { role: "user", content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.7,
    })
    return completion.choices?.[0]?.message?.content?.trim() || null
  } catch (err) {
    console.error("OpenAI error:", err?.message)
    return null
  }
}

// ─── Fallback response ────────────────────────────────────────────────────────

const FALLBACK =
  "🤔 I'm not sure I understood that. I can help you with:\n\n• 🔍 **Alumni Search** — *\"find alumni at Google\"*\n• 💼 **Job Listings** — *\"show me jobs\"*\n• 📅 **Events** — *\"upcoming events\"*\n• 🔑 **Account Help** — *\"forgot password\"*\n\nTry rephrasing your question or type **help** for more options!"

// ─── Controller ───────────────────────────────────────────────────────────────

// POST /api/chatbot/message
export const handleMessage = async (req, res) => {
  try {
    const { message } = req.body
    const userId = req.user._id

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" })
    }

    const trimmedMsg = message.trim().slice(0, 1000)

    // Check chatbot enabled
    const settings = await getSettings()
    if (!settings.enabled) {
      return res.json({
        success: true,
        reply: "🔧 The chatbot is currently disabled by the administrator. Please check back later.",
        intent: "unknown",
        disabled: true,
      })
    }

    // Detect intent
    const intent = detectIntent(trimmedMsg)

    // Get/create session
    const session = await getOrCreateSession(userId)

    // Enforce max history
    if (session.messages.length >= settings.maxHistoryLength * 2) {
      session.messages = session.messages.slice(-settings.maxHistoryLength)
    }

    // Save user message
    session.messages.push({ role: "user", content: trimmedMsg, intent })

    // Build reply
    let reply = ""
    let usedAI = false

    // Step 1: Try rule-based for structured intents
    if (RULE_RESPONSES[intent]) {
      reply = RULE_RESPONSES[intent]()
    } else if (intent === "jobs") {
      reply = await jobsResponse()
    } else if (intent === "events") {
      reply = await eventsResponse()
    } else if (intent === "alumni_search") {
      reply = await alumniSearchResponse(trimmedMsg)
    } else {
      // Step 2: Try AI if enabled and key is set
      if (settings.useAI && process.env.OPENAI_API_KEY) {
        const aiReply = await getAIResponse(session.messages, trimmedMsg, intent)
        if (aiReply) {
          reply = aiReply
          usedAI = true
        }
      }
      // Step 3: Fallback
      if (!reply) {
        reply = FALLBACK
      }
    }

    // Save bot reply
    session.messages.push({ role: "assistant", content: reply, intent })
    await session.save()

    res.json({
      success: true,
      reply,
      intent,
      usedAI,
      sessionId: session._id,
    })
  } catch (err) {
    console.error("Chatbot error:", err)
    res.status(500).json({
      success: false,
      message: "Chatbot encountered an error. Please try again.",
      reply: "⚠️ Something went wrong on my end. Please try again in a moment!",
    })
  }
}

// GET /api/chatbot/history
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id
    const session = await ChatSession.findOne({ user: userId })

    if (!session) {
      return res.json({ success: true, messages: [], sessionId: null })
    }

    res.json({
      success: true,
      messages: session.messages.slice(-100), // last 100 messages
      sessionId: session._id,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/chatbot/history
export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user._id
    await ChatSession.findOneAndUpdate(
      { user: userId },
      { messages: [], lastActivity: new Date() }
    )
    res.json({ success: true, message: "Chat history cleared" })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/chatbot/settings  (public — tells frontend if bot is enabled)
export const getPublicSettings = async (req, res) => {
  try {
    const settings = await getSettings()
    res.json({
      success: true,
      enabled: settings.enabled,
      welcomeMessage: settings.welcomeMessage,
      botName: settings.botName,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ─── ADMIN CONTROLLERS ────────────────────────────────────────────────────────

// GET /api/admin/chatbot-settings
export const getAdminChatbotSettings = async (req, res) => {
  try {
    const settings = await getSettings()
    res.json({ success: true, settings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /api/admin/chatbot-settings
export const updateChatbotSettings = async (req, res) => {
  try {
    const { enabled, welcomeMessage, botName, maxHistoryLength, useAI } = req.body
    let settings = await getSettings()

    if (typeof enabled === "boolean") settings.enabled = enabled
    if (welcomeMessage) settings.welcomeMessage = welcomeMessage
    if (botName) settings.botName = botName
    if (maxHistoryLength && !isNaN(maxHistoryLength)) settings.maxHistoryLength = parseInt(maxHistoryLength)
    if (typeof useAI === "boolean") settings.useAI = useAI
    settings.updatedBy = req.user._id

    await settings.save()
    res.json({ success: true, message: "Chatbot settings updated", settings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
