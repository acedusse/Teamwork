/**
 * ai-services.js
 * API routes for AI services
 */
import express from 'express';
const router = express.Router();
import { BedrockService } from '../services/bedrock-service.js';

const bedrockService = new BedrockService();

// Initialize the service
bedrockService.initialize().catch(console.error);

// Check service status
router.get('/status', async (req, res) => {
  try {
    const isAvailable = await bedrockService.checkAvailability();
    res.json({ status: isAvailable ? 'available' : 'unavailable' });
  } catch (error) {
    console.error('Error checking AI service status:', error);
    res.status(500).json({ error: 'Failed to check AI service status' });
  }
});

// Text generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await bedrockService.generateText(prompt, options);
    res.json(result);
  } catch (error) {
    console.error('Error generating text with AI service:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

export default router;
