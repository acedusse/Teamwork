/**
 * AIService.js
 * Frontend service for interacting with AI capabilities
 */
import axios from 'axios';

/**
 * AI Service for text generation and model management
 */
class AIService {
  constructor() {
    this.baseUrl = '/api/ai';
    this.isInitialized = false;
    this.isAvailable = false;
    this.lastError = null;
  }

  /**
   * Initialize the AI service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return this.isAvailable;
    
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      this.isAvailable = response.data.status === 'available';
      this.isInitialized = true;
      this.lastError = null;
      
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      this.isInitialized = true;
      this.lastError = error.message;
      
      console.error('Failed to initialize AI service:', error);
      return false;
    }
  }

  /**
   * Generate text based on a prompt
   * @param {string} prompt - Text prompt
   * @param {object} options - Generation options
   * @returns {Promise<Object>} Generated text and metadata
   */
  async generateText(prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.isAvailable) {
      throw new Error('AI service is not available');
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/generate`, {
        prompt,
        options
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(`Text generation failed: ${errorMessage}`);
    }
  }

  /**
   * Check if the service is currently available
   * @returns {Promise<boolean>} Whether the service is available
   */
  async checkAvailability() {
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      this.isAvailable = response.data.status === 'available';
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get the current status of the AI service
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      available: this.isAvailable,
      error: this.lastError
    };
  }
}

/**
 * Generate structured object output from AI
 * @param {object} params - Generation parameters
 * @returns {Promise<Object>} Generated structured object and metadata
 */
export const generateObjectService = async (params = {}) => {
  // Ensure service is initialized
  if (!aiService.isInitialized) {
    await aiService.initialize();
  }
  
  if (!aiService.isAvailable) {
    throw new Error('AI service is not available');
  }
  
  try {
    const response = await axios.post(`${aiService.baseUrl}/generate-object`, {
      prompt: params.prompt,
      schema: params.schema || {},
      options: {
        temperature: params.temperature || 0.2,
        maxTokens: params.maxTokens || 1000,
        role: params.role || 'main',
        outputType: params.outputType || 'service',
        ...params
      }
    });
    
    return {
      mainResult: response.data.result,
      telemetryData: response.data.telemetry || {}
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(`Object generation failed: ${errorMessage}`);
  }
};

/**
 * Generate text output from AI
 * @param {object} params - Generation parameters
 * @returns {Promise<Object>} Generated text and metadata
 */
export const generateTextService = async (params = {}) => {
  // Ensure service is initialized
  if (!aiService.isInitialized) {
    await aiService.initialize();
  }
  
  if (!aiService.isAvailable) {
    throw new Error('AI service is not available');
  }
  
  try {
    const response = await axios.post(`${aiService.baseUrl}/generate`, {
      prompt: params.prompt,
      options: {
        temperature: params.temperature || 0.7,
        maxTokens: params.maxTokens || 1500,
        role: params.role || 'main',
        outputType: params.outputType || 'text',
        ...params
      }
    });
    
    return {
      mainResult: { text: response.data.text },
      telemetryData: response.data.telemetry || {}
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(`Text generation failed: ${errorMessage}`);
  }
};

// Create singleton instance
const aiService = new AIService();

export default aiService;
