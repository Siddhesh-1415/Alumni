import mongoose from "mongoose"

/**
 * Stores the feature cards shown on the public landing page.
 * Admins can add, edit, reorder, enable/disable them from the dashboard.
 */
const landingFeatureSchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      required: true,
      default: "FiStar",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    gradient: {
      type: String,
      default: "bg-gradient-to-br from-blue-500 to-blue-700",
    },
    route: {
      type: String,
      default: "/login",
    },
    buttonLabel: {
      type: String,
      default: "Explore",
    },
    order: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model("LandingFeature", landingFeatureSchema)
