/**
 * Intent Detector — rule-based keyword/pattern matching
 * Returns one of: greeting | alumni_search | jobs | events | account_help | general | unknown
 */

const PATTERNS = {
  greeting: [
    /\b(hi|hello|hey|howdy|greetings|good\s?(morning|evening|afternoon)|what'?s\s?up|sup)\b/i
  ],
  alumni_search: [
    /\b(find|search|look\s?up|who\s?is|tell\s?me\s?about|show\s?me)\b.*\b(alumni|alum|graduate|grad|student)\b/i,
    /\b(alumni|alum|graduate|grad)\b.*\b(from|in|at|of)\b/i,
    /\b(directory|network|connections?|batch|passout|passed\s?out)\b/i,
    /\b(alumni|alum)\b/i
  ],
  jobs: [
    /\b(job|jobs|vacancy|vacancies|opening|openings|hiring|career|careers|position|role|opportunity|opportunities|internship|internships|placement)\b/i,
    /\b(apply|application|applied|applying)\b.*\b(job|position|role)\b/i,
    /\b(job|work|employment)\b.*\b(list|listing|available|latest|recent|new)\b/i
  ],
  events: [
    /\b(event|events|seminar|seminars|webinar|webinars|workshop|workshops|conference|conferences|meetup|meet-up|gathering|reunion|talk|session)\b/i,
    /\b(upcoming|scheduled|when\s+is|next)\b.*\b(event|program|session)\b/i,
    /\b(register|registration|attend|attending)\b.*\b(event|seminar|workshop)\b/i
  ],
  account_help: [
    /\b(password|forgot\s?password|reset\s?password|change\s?password)\b/i,
    /\b(login|log\s?in|sign\s?in|signin|can'?t\s?(login|access)|account\s?(issue|problem|help|locked|disabled))\b/i,
    /\b(register|registration|sign\s?up|signup|create\s?account|how\s?to\s?join)\b/i,
    /\b(profile|update\s?profile|edit\s?profile|my\s?account|my\s?details)\b/i,
    /\b(delete\s?account|deactivate|logout|log\s?out|sign\s?out)\b/i
  ],
  general: [
    /\b(help|support|assist|how\s?do\s?i|what\s?is|what\s?are|tell\s?me|explain|can\s?you)\b/i,
    /\b(about|information|info|details?|portal|platform|website|app)\b/i
  ]
}

/**
 * Detects the intent of a message.
 * @param {string} message - The user's message text
 * @returns {string} - One of the intent keys
 */
export function detectIntent(message) {
  if (!message || typeof message !== 'string') return 'unknown'

  const text = message.trim()

  for (const [intent, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return intent
      }
    }
  }

  return 'unknown'
}

export default detectIntent
