import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Control whether WebSockets are enabled
// Set to true when the WebSocket server is ready to handle connections
const WS_ENABLED = false;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minute timeout for processing
});

// Upload PRD file
export const uploadPRD = async (file, onUploadProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/prd/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });
  
  return response.data;
};

// Process uploaded PRD file
export const processPRD = async (fileId) => {
  const response = await api.post(`/prd/process/${fileId}`);
  return response.data;
};

// Get processing status
export const getProcessingStatus = async (fileId) => {
  const response = await api.get(`/prd/status/${fileId}`);
  return response.data;
};

// Get list of recent processing jobs
export const getProcessingJobs = async () => {
  const response = await api.get('/prd/jobs');
  return response.data;
};

// Get PRD content
export const getPRDContent = async () => {
  const response = await api.get('/prd');
  return response.data;
};

// Update PRD content
export const updatePRDContent = async (content) => {
  const response = await api.post('/prd', { content });
  return response.data;
};

// WebSocket connection for real-time updates
export class PRDProcessingSocket {
  constructor(onProgress, onError, onComplete) {
    this.onProgress = onProgress;
    this.onError = onError;
    this.onComplete = onComplete;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    // Skip WebSocket connection if explicitly disabled
    if (!WS_ENABLED) {
      console.log('PRD WebSocket disabled: falling back to polling');
      return false;
    }
    
    try {
      // Use the same host as the API but with WebSocket protocol
      const wsUrl = API_URL.replace('http://', 'ws://').replace('/api', '');
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected for PRD processing updates');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type || data.event) {
            case 'processing-progress':
              if (this.onProgress) {
                this.onProgress({
                  fileId: data.fileId,
                  progress: data.progress,
                  step: data.step,
                  message: data.message
                });
              }
              break;
              
            case 'processing-error':
              if (this.onError) {
                this.onError({
                  fileId: data.fileId,
                  error: data.error
                });
              }
              break;
              
            case 'processing-complete':
              if (this.onComplete) {
                this.onComplete({
                  fileId: data.fileId,
                  tasksGenerated: data.tasksGenerated
                });
              }
              break;
          }
        } catch (parseError) {
          console.warn('Failed to parse WebSocket message:', parseError);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError({ error: 'WebSocket connection error' });
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.onError) {
        this.onError({ error: 'Failed to establish real-time connection' });
      }
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.warn('Max WebSocket reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Utility function to poll processing status
export const pollProcessingStatus = async (fileId, onProgress, interval = 2000) => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getProcessingStatus(fileId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'completed') {
          resolve(status);
        } else if (status.status === 'error') {
          reject(new Error(status.error || 'Processing failed'));
        } else {
          // Continue polling
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

// Combined upload and process function with progress tracking
export const uploadAndProcessPRD = async (
  file, 
  onUploadProgress = null, 
  onProcessingProgress = null,
  useWebSocket = WS_ENABLED // Only use WebSocket if globally enabled
) => {
  try {
    // Step 1: Upload file
    const uploadResult = await uploadPRD(file, onUploadProgress);
    const { fileId } = uploadResult;

    // Step 2: Set up real-time updates if requested
    let socket = null;
    if (useWebSocket && onProcessingProgress) {
      socket = new PRDProcessingSocket(
        onProcessingProgress,
        (error) => console.error('Processing error:', error),
        (result) => console.log('Processing complete:', result)
      );
      socket.connect();
    }

    // Step 3: Start processing
    const processingResult = await processPRD(fileId);

    // Step 4: If not using WebSocket, poll for status
    if (!useWebSocket && onProcessingProgress) {
      await pollProcessingStatus(fileId, onProcessingProgress);
    }

    // Clean up WebSocket
    if (socket) {
      setTimeout(() => socket.disconnect(), 5000); // Disconnect after 5 seconds
    }

    return {
      upload: uploadResult,
      processing: processingResult,
      fileId
    };

  } catch (error) {
    throw new Error(`Upload and processing failed: ${error.message}`);
  }
}; 