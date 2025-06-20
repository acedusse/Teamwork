import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from './useWebSocket';

// Access environment variables safely in the browser context
const API_BASE_URL = window.env?.REACT_APP_API_URL || 'http://localhost:3000';
const WS_URL = window.env?.REACT_APP_WS_URL || 'ws://localhost:3000';

// Control WebSocket functionality
// Set to true when the WebSocket server is ready to handle agent connections
const WS_ENABLED = false;

const useAIAgents = () => {
  const [agents, setAgents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const lastUpdateRef = useRef(Date.now());

  // Mock WebSocket values when disabled
  const mockWebSocketValues = {
    lastMessage: null,
    readyState: 3, // CLOSED state
    sendMessage: () => console.log('AI Agents WebSocket disabled: message not sent'),
    error: null
  };
  
  // WebSocket connection for real-time updates - only if enabled
  const { lastMessage, readyState, sendMessage } = WS_ENABLED ? useWebSocket(WS_URL, {
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection failed');
    },
    shouldReconnect: true,
    reconnectLimit: 10,
    reconnectInterval: 5000
  }) : mockWebSocketValues;
  
  // Inform when WebSockets are disabled
  useEffect(() => {
    if (!WS_ENABLED) {
      console.log('AI Agents WebSocket disabled: using polling fallback');
    }
  }, []);

  // Handle WebSocket messages
  function handleWebSocketMessage(message) {
    try {
      switch (message.type) {
        case 'aiAgentsUpdated':
          setAgents(message.agents || []);
          break;
          
        case 'agentActivity':
          setActivities(prev => [message.activity, ...prev.slice(0, 99)]); // Keep last 100
          break;
          
        case 'agentRecommendation':
          // Add notification for new recommendation
          addNotification({
            id: Date.now().toString(),
            type: 'recommendation',
            agentId: message.agentId,
            title: 'New AI Recommendation',
            message: `${getAgentName(message.agentId)} has a new recommendation`,
            timestamp: new Date().toISOString(),
            data: message.recommendation
          });
          break;
          
        case 'tasksUpdated':
          // Handle task updates that might trigger agent actions
          handleTaskUpdate(message.tasks);
          break;
          
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  }

  // Get agent name by ID
  const getAgentName = useCallback((agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  }, [agents]);

  // Add notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Fetch AI agents from API
  const fetchAIAgents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/ai-agents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAgents(data.data?.agents || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI agents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch agent activities
  const fetchActivities = useCallback(async (limit = 50) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agents/activities?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setActivities(data.data?.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, []);

  // Update agent status
  const updateAgentStatus = useCallback(async (agentId, status, currentTask = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agents/${agentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, currentTask }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state immediately for better UX
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status, currentTask, lastActivity: new Date().toISOString() }
          : agent
      ));
      
    } catch (err) {
      console.error('Error updating agent status:', err);
      setError(err.message);
    }
  }, []);

  // Add agent recommendation
  const addAgentRecommendation = useCallback(async (agentId, recommendation) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agents/${agentId}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recommendation),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
    } catch (err) {
      console.error('Error adding agent recommendation:', err);
      setError(err.message);
    }
  }, []);

  // Clear agent recommendations
  const clearAgentRecommendations = useCallback(async (agentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agents/${agentId}/recommendations`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, recommendations: [] }
          : agent
      ));
      
    } catch (err) {
      console.error('Error clearing agent recommendations:', err);
      setError(err.message);
    }
  }, []);

  // Simulate agent work
  const simulateAgentWork = useCallback(async (agentId, task, duration = 3000) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agents/${agentId}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, duration }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      addNotification({
        id: Date.now().toString(),
        type: 'info',
        agentId,
        title: 'Agent Simulation Started',
        message: `${getAgentName(agentId)} is analyzing "${task.title}"`,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Error simulating agent work:', err);
      setError(err.message);
    }
  }, [getAgentName, addNotification]);

  // Reset all agents
  const resetAllAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-agents/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'Agents Reset',
        message: 'All AI agents have been reset to idle state',
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Error resetting agents:', err);
      setError(err.message);
    }
  }, [addNotification]);

  // Handle task updates (trigger agent analysis)
  const handleTaskUpdate = useCallback((tasks) => {
    // Simple logic to trigger agent analysis on task changes
    const now = Date.now();
    if (now - lastUpdateRef.current > 5000) { // Throttle to every 5 seconds
      lastUpdateRef.current = now;
      
      // Find tasks that might need agent attention
      const pendingTasks = tasks.filter(task => 
        task.status === 'pending' || task.status === 'in-progress'
      );
      
      if (pendingTasks.length > 0) {
        // Randomly select an agent to analyze a task
        const availableAgents = agents.filter(agent => agent.status === 'idle');
        if (availableAgents.length > 0) {
          const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
          const randomTask = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
          
          // Simulate agent work with a delay
          setTimeout(() => {
            simulateAgentWork(randomAgent.id, randomTask, 2000);
          }, Math.random() * 3000 + 1000); // Random delay 1-4 seconds
        }
      }
    }
  }, [agents, simulateAgentWork]);

  // Get active agents
  const getActiveAgents = useCallback(() => {
    return agents.filter(agent => agent.status !== 'idle');
  }, [agents]);

  // Get agent by ID
  const getAgentById = useCallback((agentId) => {
    return agents.find(agent => agent.id === agentId);
  }, [agents]);

  // Get unread notifications count
  const getUnreadNotificationsCount = useCallback(() => {
    return notifications.length;
  }, [notifications]);

  // Initial data fetch
  useEffect(() => {
    fetchAIAgents();
    fetchActivities();
  }, [fetchAIAgents, fetchActivities]);

  // Periodic refresh of data
  useEffect(() => {
    const interval = setInterval(() => {
      if (readyState !== 1) { // If WebSocket is not connected
        fetchAIAgents();
        fetchActivities();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchAIAgents, fetchActivities, readyState]);

  return {
    // State
    agents,
    activities,
    loading,
    error,
    notifications,
    wsConnected: readyState === 1,
    
    // Actions
    fetchAIAgents,
    fetchActivities,
    updateAgentStatus,
    addAgentRecommendation,
    clearAgentRecommendations,
    simulateAgentWork,
    resetAllAgents,
    
    // Notifications
    addNotification,
    removeNotification,
    clearNotifications,
    getUnreadNotificationsCount,
    
    // Utilities
    getActiveAgents,
    getAgentById,
    getAgentName,
    
    // WebSocket
    sendMessage
  };
};

export default useAIAgents; 