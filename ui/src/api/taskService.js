import apiClient from './client';

export const taskService = {
  // Get all tasks
  getTasks: async () => {
    const response = await apiClient.get('/tasks');
    return response.data;
  },

  // Get a single task by ID
  getTask: async (id) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  // Update an existing task
  updateTask: async (id, taskData) => {
    const response = await apiClient.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get task statistics
  getTaskStats: async () => {
    const response = await apiClient.get('/tasks/stats');
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async () => {
    const response = await apiClient.get('/tasks/activities');
    return response.data;
  },

  // Get daily task statistics
  getDailyStatistics: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/tasks/analytics/statistics${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },
}; 