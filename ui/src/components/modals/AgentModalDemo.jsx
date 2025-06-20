import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { SmartToy as AgentIcon } from '@mui/icons-material';
import AgentModal from './AgentModal';

/**
 * AgentModalDemo - Demo component to showcase AgentModal functionality
 */
const AgentModalDemo = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savedAgent, setSavedAgent] = useState(null);
  const [message, setMessage] = useState('');

  // Mock existing agents for validation
  const existingAgents = [
    { id: 'agent-1', name: 'Existing Agent 1' },
    { id: 'agent-2', name: 'Existing Agent 2' }
  ];

  // Sample agent for edit mode
  const sampleAgent = {
    id: 'agent-sample',
    name: 'Sample Business Analyst',
    type: 'business-analyst',
    description: 'A sample agent for demonstration purposes',
    capabilities: ['market-research', 'requirements-analysis'],
    priority: 'high',
    maxConcurrentTasks: 5,
    autoAcceptTasks: true,
    notificationsEnabled: true,
    apiConfiguration: {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: 'sk-ant-api03-sample-key',
      maxTokens: 8000,
      temperature: 0.3
    },
    createdAt: '2024-01-15T10:00:00Z'
  };

  const handleSaveAgent = async (agentData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSavedAgent(agentData);
    setMessage(`Agent "${agentData.name}" has been ${agentData.id.includes('sample') ? 'updated' : 'created'} successfully!`);
    
    // Clear message after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  const handleDeleteAgent = async (agentId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMessage(`Agent has been deleted successfully!`);
    setSavedAgent(null);
    
    // Clear message after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AgentIcon />
        AgentModal Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demo showcases the AgentModal component functionality including:
      </Typography>
      
      <ul>
        <li>Agent creation with role templates</li>
        <li>Form validation and error handling</li>
        <li>API configuration and connection testing</li>
        <li>Agent editing and deletion</li>
        <li>Settings management</li>
      </ul>

      {message && (
        <Alert severity="success" sx={{ my: 2 }}>
          {message}
        </Alert>
      )}

      {savedAgent && (
        <Alert severity="info" sx={{ my: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Last Saved Agent:
          </Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {savedAgent.name}<br />
            <strong>Role:</strong> {savedAgent.role}<br />
            <strong>Provider:</strong> {savedAgent.apiConfiguration.provider}<br />
            <strong>Max Tasks:</strong> {savedAgent.settings.maxConcurrentTasks}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          onClick={() => setIsCreateModalOpen(true)}
          startIcon={<AgentIcon />}
        >
          Create New Agent
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setIsEditModalOpen(true)}
          startIcon={<AgentIcon />}
        >
          Edit Sample Agent
        </Button>
      </Box>

      {/* Create Agent Modal */}
      <AgentModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveAgent}
        mode="create"
        availableAgents={existingAgents}
      />

      {/* Edit Agent Modal */}
      <AgentModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAgent}
        onDelete={handleDeleteAgent}
        mode="edit"
        agent={sampleAgent}
        availableAgents={existingAgents}
      />
    </Box>
  );
};

export default AgentModalDemo; 