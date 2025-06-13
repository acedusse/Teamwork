/**
 * Production Configuration
 * Environment-specific settings for production deployment
 */

// Environment variable getter that works in both browser and Node.js
const getEnv = (key, defaultValue) => {
  // In browser with Vite
  if (typeof window !== 'undefined' && window.__VITE_ENV__) {
    return window.__VITE_ENV__[key] || defaultValue;
  }
  // In Node.js/Jest environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  // Fallback for module environments (Vite)
  try {
    // This will only work in browser with Vite
    if (import.meta && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors in Jest/Node
  }
  return defaultValue;
};

export const productionConfig = {
  // API Configuration
  api: {
    baseUrl: getEnv('VITE_API_BASE_URL', 'https://api.taskmaster.com'),
    timeout: 30000,
    retries: 3,
  },

  // Application Settings
  app: {
    title: 'Taskmaster - Task Management Platform',
    description: 'Professional task and project management application',
    version: '1.0.0',
  },

  // Performance Monitoring
  performance: {
    enabled: getEnv('VITE_ENABLE_PERFORMANCE_MONITORING', 'true') !== 'false',
    sampleRate: 0.1, // 10% sampling for production
    reportingInterval: 60000, // 1 minute
  },

  // Error Reporting
  errorReporting: {
    enabled: getEnv('VITE_ENABLE_ERROR_REPORTING', 'true') !== 'false',
    endpoint: getEnv('VITE_ERROR_REPORTING_ENDPOINT', '/api/errors'),
  },

  // Security Settings
  security: {
    csp: {
      enabled: getEnv('VITE_ENABLE_CSP', 'true') !== 'false',
      reportOnly: false,
    },
    secureCookies: getEnv('VITE_SECURE_COOKIES', 'true') !== 'false',
  },

  // Feature Flags
  features: {
    analytics: getEnv('VITE_ENABLE_ANALYTICS', 'true') !== 'false',
    accessibility: getEnv('VITE_ENABLE_ACCESSIBILITY_FEATURES', 'true') !== 'false',
    pwa: getEnv('VITE_ENABLE_PWA', 'true') !== 'false',
    developmentTools: false, // Always disabled in production
  },

  // Logging Configuration
  logging: {
    level: getEnv('VITE_LOG_LEVEL', 'error'),
    console: false, // Disable console logging in production
    remote: true, // Enable remote logging
  },

  // Build Configuration
  build: {
    sourcemap: false,
    minify: true,
    compression: true,
    caching: true,
  },
};

// Environment validation
const requiredEnvVars = [
  'VITE_API_BASE_URL',
];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !getEnv(envVar, null));
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export default productionConfig; 