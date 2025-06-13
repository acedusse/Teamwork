const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Safely serializes an object by removing circular references and non-serializable values
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - A clean, serializable copy of the object
 */
const sanitizeForJSON = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForJSON(item));
  }
  
  // Handle DOM nodes and React elements
  if (
    (typeof window !== 'undefined' && obj instanceof Node) ||
    (obj.$$typeof && (obj.$$typeof.toString().includes('Symbol(react') || obj._owner))
  ) {
    return '[React/DOM Element]';
  }
  
  const clean = {};
  
  // Process regular objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Skip functions, symbols, and other non-serializable types
      const val = obj[key];
      if (val === undefined || typeof val === 'function' || typeof val === 'symbol') {
        continue;
      }
      
      try {
        // Test if this property is serializable
        JSON.stringify(val);
        clean[key] = val;
      } catch (err) {
        // If not serializable, try to sanitize it recursively
        if (typeof val === 'object' && val !== null) {
          clean[key] = sanitizeForJSON(val);
        } else {
          // Skip this property if it can't be sanitized
          console.warn(`Skipping non-serializable property: ${key}`);
        }
      }
    }
  }
  
  return clean;
};

class TaskService {
  // Create a new task with optimistic updates
  static async createTask(taskData, options = {}) {
    try {
      if (!taskData || typeof taskData !== 'object') {
        throw new Error('Invalid task data: must be an object');
      }
      
      // Create optimistic task for immediate UI updates
      const optimisticTask = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        dependencies: Array.isArray(taskData.dependencyIds) ? 
          taskData.dependencyIds.filter(id => typeof id === 'string' || typeof id === 'number') : [],
        createdAt: new Date().toISOString(),
        subtasks: [],
        // Store UI-specific fields separately (not sent to API)
        _uiFields: {
          assignee: taskData.assignee || null,
          tags: Array.isArray(taskData.tags) ? 
            taskData.tags.filter(tag => typeof tag === 'string') : [],
          dueDate: taskData.dueDate || null,
        },
        _isOptimistic: true // Flag to identify optimistic updates
      };

      // If optimistic callback provided, call it immediately
      if (options.onOptimisticUpdate && typeof options.onOptimisticUpdate === 'function') {
        options.onOptimisticUpdate(optimisticTask);
      }
      
      // Prepare data for backend API (matching server schema)
      const serializedData = {
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        dependencies: Array.isArray(taskData.dependencyIds) ? 
          taskData.dependencyIds.filter(id => typeof id === 'string' || typeof id === 'number') : [],
      };

      // Add optional fields if they exist
      if (taskData.details) {
        serializedData.details = taskData.details;
      }
      if (taskData.testStrategy) {
        serializedData.testStrategy = taskData.testStrategy;
      }
      if (taskData.agent) {
        serializedData.agent = taskData.agent;
      }
      if (taskData.epic) {
        serializedData.epic = taskData.epic;
      }
      
      // Remove any undefined values to prevent issues
      Object.keys(serializedData).forEach(key => {
        if (serializedData[key] === undefined) {
          delete serializedData[key];
        }
      });
      
      // Final safety check with our sanitizer
      const safeData = sanitizeForJSON(serializedData);
      
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Enhanced error handling with specific error types
        let errorType = 'UnknownError';
        let userMessage = 'Failed to create task. Please try again.';
        
        switch (response.status) {
          case 400:
            errorType = 'ValidationError';
            userMessage = 'Invalid task data. Please check your inputs and try again.';
            break;
          case 401:
            errorType = 'AuthenticationError';
            userMessage = 'You need to be logged in to create tasks.';
            break;
          case 403:
            errorType = 'AuthorizationError';
            userMessage = 'You don\'t have permission to create tasks.';
            break;
          case 409:
            errorType = 'ConflictError';
            userMessage = 'Task data is out of date. Please refresh and try again.';
            break;
          case 429:
            errorType = 'RateLimitError';
            userMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorType = 'ServerError';
            userMessage = 'Server error. Please try again later.';
            break;
          default:
            if (response.status >= 500) {
              errorType = 'ServerError';
              userMessage = 'Server error. Please try again later.';
            } else if (response.status >= 400) {
              errorType = 'ClientError';
              userMessage = 'Request error. Please check your data and try again.';
            }
        }
        
        const error = new Error(errorData.message || userMessage);
        error.name = errorType;
        error.status = response.status;
        error.originalError = errorData;
        
        // If optimistic error callback provided, call it
        if (options.onOptimisticError && typeof options.onOptimisticError === 'function') {
          options.onOptimisticError(optimisticTask, error);
        }
        
        throw error;
      }

      const result = await response.json();
      
      // Merge the server response with UI-specific fields
      const finalTask = {
        ...result,
        _uiFields: optimisticTask._uiFields,
        _isOptimistic: false
      };

      // If optimistic success callback provided, call it
      if (options.onOptimisticSuccess && typeof options.onOptimisticSuccess === 'function') {
        options.onOptimisticSuccess(optimisticTask, finalTask);
      }
      
      return finalTask;
    } catch (error) {
      console.error('Error creating task:', error);
      
      // If it's a network error, categorize it
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.name = 'NetworkError';
        error.message = 'Network error. Please check your connection and try again.';
      }
      
      throw error;
    }
  }

  // Get all tasks
  static async getTasks() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error(error.message || 'Failed to fetch tasks');
    }
  }
}

export default TaskService; 
// Task API Service

// Additional utility functions for task management
export const TaskUtils = {
  // Validate task data before submission
  validateTaskData(taskData) {
    const errors = {};
    
    if (!taskData.title || taskData.title.trim().length === 0) {
      errors.title = 'Title is required';
    }
    
    if (!taskData.description || taskData.description.trim().length === 0) {
      errors.description = 'Description is required';
    }
    
    if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
      errors.priority = 'Priority must be low, medium, or high';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Format task data for display
  formatTaskForDisplay(task) {
    return {
      ...task,
      formattedCreatedAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '',
      formattedCompletedAt: task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '',
      priorityColor: {
        low: 'success',
        medium: 'warning', 
        high: 'error'
      }[task.priority] || 'default',
      statusColor: {
        pending: 'warning',
        'in-progress': 'info',
        done: 'success',
        blocked: 'error'
      }[task.status] || 'default'
    };
  },

  // Check if task can be edited
  canEditTask(task) {
    return task && task.status !== 'done';
  },

  // Check if task can be deleted
  canDeleteTask(task) {
    return task && !task.dependencies?.length;
  }
};
 