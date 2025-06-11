// Environment configuration for production deployment
// Safe environment variable access with fallbacks

// Helper function to safely access environment variables
const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  return fallback;
};

// Helper function to check environment
const getNodeEnv = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.NODE_ENV || 'development';
  }
  return 'development';
};

export const config = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001/api'),
  FRONTEND_URL: getEnvVar('VITE_FRONTEND_URL', 'http://localhost:5173'),
  
  // Environment
  NODE_ENV: getNodeEnv(),
  
  // Production settings
  IS_PRODUCTION: getNodeEnv() === 'production',
  IS_DEVELOPMENT: getNodeEnv() === 'development',
  
  // Demo mode flag
  IS_DEMO: getEnvVar('VITE_DEMO_MODE', 'false') === 'true',
  
  // Feature flags
  FEATURES: {
    // Use mock API when explicitly enabled OR in development by default
    USE_MOCK_API: getEnvVar('VITE_USE_MOCK_API', 'true') === 'true',
    
    // Enable debug logging in development or when explicitly enabled
    DEBUG_LOGGING: getEnvVar('VITE_DEBUG', getNodeEnv() === 'development' ? 'true' : 'false') === 'true',
    
    // Enable error reporting in production
    ERROR_REPORTING: getNodeEnv() === 'production',
    
    // Enable analytics in production
    ANALYTICS: getNodeEnv() === 'production' && !!getEnvVar('VITE_ANALYTICS_ID'),
  },
  
  // App Configuration
  APP: {
    NAME: getEnvVar('VITE_APP_NAME', 'FlexBook'),
    VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    DESCRIPTION: 'Professional gym class booking system',
  },
  
  // External Services
  SERVICES: {
    ANALYTICS_ID: getEnvVar('VITE_ANALYTICS_ID'),
    SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN'),
  },
  
  // Database Configuration (for reference, used by backend)
  DATABASE: {
    HOST: getEnvVar('VITE_DB_HOST', 'localhost'),
    PORT: getEnvVar('VITE_DB_PORT', '5432'),
    NAME: getEnvVar('VITE_DB_NAME', 'flexbook'),
  },
  
  // Security Configuration
  SECURITY: {
    // JWT Configuration
    JWT_EXPIRES_IN: '24h',
    
    // CORS Configuration
    ALLOWED_ORIGINS: getNodeEnv() === 'production' 
      ? [getEnvVar('VITE_FRONTEND_URL')] 
      : ['http://localhost:3000', 'http://localhost:5173'],
  },
  
  // Business Logic Configuration
  BUSINESS: {
    // Booking Configuration
    MAX_ADVANCE_BOOKING_DAYS: 14,
    CANCELLATION_DEADLINE_HOURS: 24,
    MAX_CREDIT_LIMIT: -5,
    
    // Class Configuration
    DEFAULT_CLASS_CAPACITY: 20,
    
    // Pricing (for display and analytics)
    PRICING: {
      CONCESSION_PACKAGES: {
        SMALL: { classes: 5, price: 40 },
        MEDIUM: { classes: 10, price: 70 },
        LARGE: { classes: 20, price: 120 },
      },
      SINGLE_CLASS: 10,
      CONCESSION_VALUE: 8, // Used for revenue calculations
    },
    
    // Payment Information
    PAYMENT: {
      BANK_NAME: 'ANZ New Zealand',
      ACCOUNT_NAME: 'FlexGym Ltd',
      ACCOUNT_NUMBER: '01-0123-0123456-00',
      REFERENCE_INSTRUCTIONS: 'Please use your full name and email address as the payment reference',
      PROCESSING_TIME: '1-2 business days',
    },
  },
  
  // UI Configuration
  UI: {
    TOAST_DURATION: 4000,
    LOADING_TIMEOUT: 10000,
    THEME: 'light', // Default theme
  },
  
  // Build Information
  BUILD: {
    TIMESTAMP: new Date().toISOString(),
    COMMIT_HASH: getEnvVar('VITE_COMMIT_HASH', 'unknown'),
    BRANCH: getEnvVar('VITE_BRANCH', 'unknown'),
  },
};

// Validation function to ensure required environment variables are set
export const validateEnvironment = () => {
  const requiredEnvVars = [];
  const warnings = [];
  
  if (config.IS_PRODUCTION && !config.FEATURES.USE_MOCK_API) {
    requiredEnvVars.push('VITE_API_BASE_URL', 'VITE_FRONTEND_URL');
  }
  
  // Check for analytics setup in production
  if (config.IS_PRODUCTION && !config.SERVICES.ANALYTICS_ID) {
    warnings.push('Analytics not configured (VITE_ANALYTICS_ID missing)');
  }
  
  // Check for error reporting setup in production
  if (config.IS_PRODUCTION && !config.SERVICES.SENTRY_DSN) {
    warnings.push('Error reporting not configured (VITE_SENTRY_DSN missing)');
  }
  
  const missingVars = requiredEnvVars.filter(
    varName => !getEnvVar(varName)
  );
  
  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(', ')}`
    );
    
    if (config.IS_PRODUCTION) {
      throw new Error(
        `Production deployment requires: ${missingVars.join(', ')}`
      );
    }
  }
  
  if (warnings.length > 0) {
    warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings
  };
};

// Safe initialization - only validate when environment is available
if (typeof import.meta !== 'undefined' && import.meta.env) {
  try {
    const validation = validateEnvironment();
    
    if (config.FEATURES.DEBUG_LOGGING) {
      console.log('🔧 FlexBook Configuration:', {
        NODE_ENV: config.NODE_ENV,
        API_BASE_URL: config.API_BASE_URL,
        USE_MOCK_API: config.FEATURES.USE_MOCK_API,
        IS_DEVELOPMENT: config.IS_DEVELOPMENT,
        IS_PRODUCTION: config.IS_PRODUCTION,
        IS_DEMO: config.IS_DEMO,
        APP_NAME: config.APP.NAME,
        VERSION: config.APP.VERSION,
        validation
      });
    }
    
    // Production build info
    if (config.IS_PRODUCTION) {
      console.log(`🚀 ${config.APP.NAME} v${config.APP.VERSION} - Production Build`);
      if (config.IS_DEMO) {
        console.log('🧪 Demo Mode: Using mock API with sample data');
      }
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
  }
}

export default config;