// Centralized configuration for the application
const config = {
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',

  // API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      registerAlumni: '/api/auth/register-old-alumni',
      alumni: '/api/auth/alumni',
      searchAlumni: '/api/auth/search-alumni',
      profile: '/api/auth/profile',
      forgotPasswordSendOtp: '/api/auth/forgot-password/send-otp',
      forgotPasswordSendPhoneOtp: '/api/auth/forgot-password/send-phone-otp',
      forgotPasswordVerifyOtp: '/api/auth/forgot-password/verify-otp',
      forgotPasswordReset: '/api/auth/forgot-password/reset',
    },
    admin: {
      stats: '/api/admin/stats',
      users: '/api/admin/users',
      uploadStudents: '/api/csv/upload-allowed-users', // ← new CSV endpoint
      allowedUsers: '/api/csv/allowed-users',
      searchUsers: '/api/admin/search-users',
      landingFeatures: '/api/admin/landing-features',
    },
    jobs: '/api/jobs',
    events: '/api/events',
    public: {
      stats: '/api/public/stats',
      features: '/api/public/features',
    },
    messages: {
      conversations: '/api/messages/conversations',
      send: '/api/messages/send',
      recentActivity: '/api/messages/recent-activity',
    },
    notifications: {
      base: '/api/notifications',
      readAll: '/api/notifications/read-all',
      read: (id) => `/api/notifications/${id}/read`,
      delete: (id) => `/api/notifications/${id}`,
      clear: '/api/notifications/clear',
    },
    chatbot: {
      message: '/api/chatbot/message',
      history: '/api/chatbot/history',
      clearHistory: '/api/chatbot/history',
      settings: '/api/chatbot/settings',
      adminSettings: '/api/admin/chatbot-settings',
    },
  },

  // Dynamic limits and settings
  limits: {
    maxMessageLength: parseInt(process.env.REACT_APP_MAX_MESSAGE_LENGTH) || 1000,
    maxFileSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    typingTimeout: parseInt(process.env.REACT_APP_TYPING_TIMEOUT) || 3000,
    messageBatchSize: parseInt(process.env.REACT_APP_MESSAGE_BATCH_SIZE) || 50,
  },

  // UI settings
  ui: {
    itemsPerPage: parseInt(process.env.REACT_APP_ITEMS_PER_PAGE) || 10,
    debounceDelay: parseInt(process.env.REACT_APP_DEBOUNCE_DELAY) || 300,
  }
}

export default config