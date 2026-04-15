import LandingFeature from "../models/LandingFeature.js"

// Default features seeded on first load
const DEFAULT_FEATURES = [
  {
    icon: "FiUsers",
    title: "Alumni Directory",
    description: "Connect with alumni across industries and geographies. Search by batch, branch, or company.",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
    route: "/alumni",
    buttonLabel: "Browse Directory",
    order: 1,
    enabled: true,
  },
  {
    icon: "FiBriefcase",
    title: "Job Board",
    description: "Discover exclusive job postings shared by alumni. Apply directly and get referrals from your network.",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-700",
    route: "/jobs",
    buttonLabel: "View Jobs",
    order: 2,
    enabled: true,
  },
  {
    icon: "FiCalendar",
    title: "Events & Reunions",
    description: "Stay updated on college events, alumni meets, webinars, and reunions. Register with one click.",
    gradient: "bg-gradient-to-br from-violet-500 to-purple-700",
    route: "/events",
    buttonLabel: "See Events",
    order: 3,
    enabled: true,
  },
  {
    icon: "FiMessageCircle",
    title: "Real-Time Chat",
    description: "Message alumni directly. Build relationships and get mentorship from seniors in your field.",
    gradient: "bg-gradient-to-br from-orange-500 to-red-600",
    route: "/chat",
    buttonLabel: "Start Chatting",
    order: 4,
    enabled: true,
  },
  {
    icon: "FiAward",
    title: "Achievements",
    description: "Celebrate milestones together. Share your accomplishments and cheer for your batchmates' success.",
    gradient: "bg-gradient-to-br from-yellow-500 to-amber-600",
    route: "/dashboard",
    buttonLabel: "View Achievements",
    order: 5,
    enabled: true,
  },
  {
    icon: "FiShield",
    title: "Verified Network",
    description: "Every member is verified via college records. A trusted, spam-free environment for genuine connections.",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
    route: "/register",
    buttonLabel: "Join Now",
    order: 6,
    enabled: true,
  },
]

/**
 * GET /api/public/features
 * Public — no auth. Returns all enabled features sorted by order.
 */
export const getPublicFeatures = async (req, res) => {
  try {
    let features = await LandingFeature.find({ enabled: true }).sort({ order: 1 })

    // Seed defaults if DB is empty
    if (features.length === 0) {
      await LandingFeature.insertMany(DEFAULT_FEATURES)
      features = await LandingFeature.find({ enabled: true }).sort({ order: 1 })
    }

    res.json(features)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * GET /api/admin/landing-features
 * Admin — returns ALL features (enabled + disabled).
 */
export const getAllFeatures = async (req, res) => {
  try {
    let features = await LandingFeature.find().sort({ order: 1 })

    // Seed on first admin visit too
    if (features.length === 0) {
      await LandingFeature.insertMany(DEFAULT_FEATURES)
      features = await LandingFeature.find().sort({ order: 1 })
    }

    res.json(features)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/admin/landing-features
 * Admin — create a new feature card.
 */
export const createFeature = async (req, res) => {
  try {
    const { icon, title, description, gradient, route, buttonLabel, order, enabled } = req.body

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." })
    }

    const feature = await LandingFeature.create({
      icon: icon || "FiStar",
      title,
      description,
      gradient: gradient || "bg-gradient-to-br from-blue-500 to-blue-700",
      route: route || "/login",
      buttonLabel: buttonLabel || "Explore",
      order: order ?? 99,
      enabled: enabled !== undefined ? enabled : true,
    })

    res.status(201).json(feature)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * PUT /api/admin/landing-features/:id
 * Admin — update a feature card (any field).
 */
export const updateFeature = async (req, res) => {
  try {
    const feature = await LandingFeature.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!feature) return res.status(404).json({ message: "Feature not found." })

    res.json(feature)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * DELETE /api/admin/landing-features/:id
 * Admin — delete a feature card.
 */
export const deleteFeature = async (req, res) => {
  try {
    const feature = await LandingFeature.findByIdAndDelete(req.params.id)
    if (!feature) return res.status(404).json({ message: "Feature not found." })
    res.json({ message: "Feature deleted." })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * PATCH /api/admin/landing-features/:id/toggle
 * Admin — toggle enabled/disabled quickly.
 */
export const toggleFeature = async (req, res) => {
  try {
    const feature = await LandingFeature.findById(req.params.id)
    if (!feature) return res.status(404).json({ message: "Feature not found." })

    feature.enabled = !feature.enabled
    await feature.save()

    res.json(feature)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
