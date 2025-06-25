/**
 * ai-module.js
 * Module for AI functionality following the established modular pattern
 */
import aiService from './services/AIService';

// Module state
let isInitialized = false;
let currentSession = null;
let pendingRequests = [];

/**
 * Initialize the AI module
 * @param {object} appState - Global application state
 */
const init = async (appState) => {
  if (isInitialized) return;
  
  try {
    // Initialize the AI service
    const isAvailable = await aiService.initialize();
    
    // Set up module state
    isInitialized = true;
    appState.ai = {
      isAvailable,
      canGenerateText: isAvailable,
      lastError: isAvailable ? null : aiService.getStatus().error
    };
    
    // Expose methods via appState
    appState.ai.generateText = generateText;
    appState.ai.checkAvailability = checkAvailability;
    appState.ai.getStatus = getStatus;
    
    console.log('AI module initialized successfully');
    return isAvailable;
  } catch (error) {
    console.error('Failed to initialize AI module:', error);
    
    // Set error state
    appState.ai = {
      isAvailable: false,
      canGenerateText: false,
      lastError: error.message,
      generateText: () => Promise.reject(new Error('AI module not available')),
      checkAvailability: checkAvailability,
      getStatus: getStatus
    };
    
    return false;
  }
};

/**
 * Generate text using the AI service
 * @param {string} prompt - Text prompt
 * @param {object} options - Generation options
 * @returns {Promise<Object>} - Generated text and metadata
 */
const generateText = async (prompt, options = {}) => {
  if (!isInitialized) {
    throw new Error('AI module not initialized');
  }
  
  try {
    return await aiService.generateText(prompt, options);
  } catch (error) {
    console.error('Text generation failed:', error);
    throw new Error(`Text generation failed: ${error.message}`);
  }
};

/**
 * Check if the AI service is available
 * @returns {Promise<boolean>} - Whether the service is available
 */
const checkAvailability = async () => {
  try {
    return await aiService.checkAvailability();
  } catch (error) {
    return false;
  }
};

/**
 * Get the current status of the AI module
 * @returns {Object} - Status information
 */
const getStatus = () => {
  return {
    initialized: isInitialized,
    ...aiService.getStatus()
  };
};

// Public API
export default {
  init,
  generateText,
  checkAvailability,
  getStatus
};
