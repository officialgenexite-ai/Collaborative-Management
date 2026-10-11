/**
 * Centralized logger utility
 * Logs only essential information to console
 */

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const logger = {
  // Startup and critical information
  info: (message, data = '') => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data);
    }
  },

  // Error logging (always shown)
  error: (message, error = '') => {
    console.error(`❌ ${message}`, error);
  },

  // Debug information (only in development)
  debug: (message, data = '') => {
    if (isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, data);
    }
  },

  // Warning messages
  warn: (message, data = '') => {
    console.warn(`⚠️  ${message}`, data);
  },

  // Success messages
  success: (message, data = '') => {
    if (isDevelopment) {
      console.log(`🎉 ${message}`, data);
    }
  }
};

module.exports = logger;
