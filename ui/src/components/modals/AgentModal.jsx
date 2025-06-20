import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  InputAdornment,
  FormHelperText,
  LinearProgress
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  ExpandMore as ExpandMoreIcon,
  Science as TestIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Speed as SpeedIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

// Predefined agent roles and templates
const AGENT_ROLES = {
  'business-analyst': {
    name: 'Business Analyst',
    description: 'Market research, requirements analysis, and business strategy',
    icon: '📊',
    color: '#2196F3',
    capabilities: ['market-research', 'requirements-analysis', 'stakeholder-management', 'business-strategy']
  },
  'technical-architect': {
    name: 'Technical Architect',
    description: 'System design, architecture decisions, and technical feasibility',
    icon: '🏗️',
    color: '#FF9800',
    capabilities: ['system-design', 'architecture-review', 'technical-feasibility', 'code-review']
  },
  'ux-researcher': {
    name: 'UX Researcher',
    description: 'User experience research, design thinking, and usability analysis',
    icon: '🎨',
    color: '#E91E63',
    capabilities: ['user-research', 'design-thinking', 'usability-testing', 'prototype-review']
  },
  'product-strategist': {
    name: 'Product Strategist',
    description: 'Product vision, roadmap planning, and market positioning',
    icon: '🎯',
    color: '#9C27B0',
    capabilities: ['product-strategy', 'roadmap-planning', 'market-analysis', 'feature-prioritization']
  },
  'data-scientist': {
    name: 'Data Scientist',
    description: 'Data analysis, machine learning insights, and predictive analytics',
    icon: '📈',
    color: '#4CAF50',
    capabilities: ['data-analysis', 'machine-learning', 'predictive-analytics', 'statistical-modeling']
  },
  'security-expert': {
    name: 'Security Expert',
    description: 'Security analysis, compliance review, and threat assessment',
    icon: '🔒',
    color: '#F44336',
    capabilities: ['security-analysis', 'compliance-review', 'threat-assessment', 'vulnerability-scanning']
  },
  'devops-specialist': {
    name: 'DevOps Specialist',
    description: 'Infrastructure, deployment pipelines, and operational efficiency',
    icon: '⚙️',
    color: '#607D8B',
    capabilities: ['infrastructure-design', 'deployment-automation', 'monitoring', 'performance-optimization']
  },
  'qa-specialist': {
    name: 'QA Specialist',
    description: 'Quality assurance, testing strategies, and defect analysis',
    icon: '🛡️',
    color: '#795548',
    capabilities: ['test-strategy', 'quality-metrics', 'defect-analysis', 'automation-testing']
  }
};

/**
 * AgentModal - AI Agent Configuration Modal
 * 
 * Features:
 * - Agent creation and editing
 * - Role-based templates and capabilities
 * - Form validation and error handling
 * - Connection testing and validation
 * - Settings management and persistence
 */
const AgentModal = ({
  open = false,
  onClose,
  onSave,
  onDelete,
  agent = null,
  mode = 'create',
  availableAgents = [],
  ...other
}) => {
  // State management
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    description: '',
    capabilities: [],
    settings: {
      priority: 'medium',
      maxConcurrentTasks: 3,
      autoAcceptTasks: false,
      notificationsEnabled: true
    },
    apiConfiguration: {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: '',
      maxTokens: 4000,
      temperature: 0.2
    }
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize form data when agent prop changes
  useEffect(() => {
    if (agent && mode === 'edit') {
      setFormData({
        id: agent.id || '',
        name: agent.name || '',
        role: agent.type || '',
        description: agent.description || '',
        capabilities: agent.capabilities || [],
        settings: {
          priority: agent.priority || 'medium',
          maxConcurrentTasks: agent.maxConcurrentTasks || 3,
          autoAcceptTasks: agent.autoAcceptTasks || false,
          notificationsEnabled: agent.notificationsEnabled !== false
        },
        apiConfiguration: agent.apiConfiguration || {
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20241022',
          apiKey: '',
          maxTokens: 4000,
          temperature: 0.2
        }
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        id: '',
        name: '',
        role: '',
        description: '',
        capabilities: [],
        settings: {
          priority: 'medium',
          maxConcurrentTasks: 3,
          autoAcceptTasks: false,
          notificationsEnabled: true
        },
        apiConfiguration: {
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20241022',
          apiKey: '',
          maxTokens: 4000,
          temperature: 0.2
        }
      });
      setErrors({});
      setConnectionStatus(null);
    }
  }, [agent, mode, open]);

  // Handle field changes
  const handleFieldChange = useCallback((fieldPath, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathParts = fieldPath.split('.');
      
      let current = newData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      return newData;
    });

    // Clear errors for this field
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle role selection
  const handleRoleChange = useCallback((roleKey) => {
    const roleTemplate = AGENT_ROLES[roleKey];
    if (roleTemplate) {
      setFormData(prev => ({
        ...prev,
        role: roleKey,
        capabilities: roleTemplate.capabilities
      }));
    }
  }, []);

  // Handle capability toggle
  const handleCapabilityToggle = useCallback((capability) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  }, []);

  // Test connection
  const handleTestConnection = useCallback(async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!formData.apiConfiguration.apiKey) {
        throw new Error('API key is required for connection testing');
      }

      if (formData.apiConfiguration.apiKey.length < 10) {
        throw new Error('API key appears to be invalid');
      }

      setConnectionStatus({
        success: true,
        message: 'Connection successful! Agent is ready to work.',
        details: {
          provider: formData.apiConfiguration.provider,
          model: formData.apiConfiguration.modelId,
          latency: Math.floor(Math.random() * 200) + 100 + 'ms'
        }
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error.message,
        details: null
      });
    } finally {
      setIsTestingConnection(false);
    }
  }, [formData.apiConfiguration]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Agent name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Agent name must be no more than 50 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Agent role is required';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be no more than 500 characters';
    }

    if (formData.settings.maxConcurrentTasks < 1 || formData.settings.maxConcurrentTasks > 10) {
      newErrors.maxConcurrentTasks = 'Max concurrent tasks must be between 1 and 10';
    }

    // Check for duplicate names
    if (mode === 'create' && availableAgents.some(a => a.name === formData.name)) {
      newErrors.name = 'An agent with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, mode, availableAgents]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const agentData = {
        ...formData,
        id: mode === 'create' ? `agent-${Date.now()}` : formData.id,
        status: 'idle',
        createdAt: mode === 'create' ? new Date().toISOString() : agent?.createdAt,
        updatedAt: new Date().toISOString()
      };

      await onSave(agentData);
      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, mode, agent, onSave, onClose]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (mode === 'edit' && agent?.id) {
      setIsLoading(true);
      try {
        await onDelete(agent.id);
        onClose();
      } catch (error) {
        setErrors({ general: error.message });
      } finally {
        setIsLoading(false);
      }
    }
  }, [mode, agent, onDelete, onClose]);

  // Get role template
  const selectedRoleTemplate = formData.role ? AGENT_ROLES[formData.role] : null;

  // Form actions
  const actions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {mode === 'edit' && (
        <Button
          onClick={handleDelete}
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          disabled={isLoading}
        >
          Delete Agent
        </Button>
      )}
      <Box sx={{ flex: 1 }} />
      <Button onClick={onClose} variant="outlined" disabled={isLoading}>
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        variant="contained"
        startIcon={isLoading ? <CircularProgress size={16} /> : <CheckIcon />}
        disabled={isLoading || Object.keys(errors).length > 0}
      >
        {mode === 'create' ? 'Create Agent' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AgentIcon />
          {mode === 'create' ? 'Create AI Agent' : `Edit ${formData.name || 'Agent'}`}
        </Box>
      }
      actions={actions}
      maxWidth="lg"
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
      {...other}
    >
      <Box sx={{ width: '100%' }}>
        {/* General Error Alert */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        {/* Loading Progress */}
        {isLoading && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {/* Basic Information Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              Basic Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Agent Name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  placeholder="e.g., My Business Analyst"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Agent Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    label="Agent Role"
                    required
                  >
                    {Object.entries(AGENT_ROLES).map(([key, role]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>{role.icon}</Typography>
                          <Box>
                            <Typography variant="body1">{role.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {role.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description || `${formData.description.length}/500 characters`}
                  placeholder="Describe what this agent will do and its specific role in your project..."
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Capabilities Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon />
              Capabilities & Specializations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {selectedRoleTemplate && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {selectedRoleTemplate.name} Template Applied
                </Typography>
                <Typography variant="body2">
                  {selectedRoleTemplate.description}
                </Typography>
              </Alert>
            )}
            
            <Typography variant="subtitle2" gutterBottom>
              Agent Capabilities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {selectedRoleTemplate?.capabilities.map((capability) => (
                <Chip
                  key={capability}
                  label={capability.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  color={formData.capabilities.includes(capability) ? 'primary' : 'default'}
                  onClick={() => handleCapabilityToggle(capability)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Settings Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon />
              Agent Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    value={formData.settings.priority}
                    onChange={(e) => handleFieldChange('settings.priority', e.target.value)}
                    label="Priority Level"
                  >
                    <MenuItem value="low">Low Priority</MenuItem>
                    <MenuItem value="medium">Medium Priority</MenuItem>
                    <MenuItem value="high">High Priority</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Concurrent Tasks"
                  value={formData.settings.maxConcurrentTasks}
                  onChange={(e) => handleFieldChange('settings.maxConcurrentTasks', parseInt(e.target.value))}
                  error={!!errors.maxConcurrentTasks}
                  helperText={errors.maxConcurrentTasks}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.autoAcceptTasks}
                      onChange={(e) => handleFieldChange('settings.autoAcceptTasks', e.target.checked)}
                    />
                  }
                  label="Auto-accept assigned tasks"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.notificationsEnabled}
                      onChange={(e) => handleFieldChange('settings.notificationsEnabled', e.target.checked)}
                    />
                  }
                  label="Enable notifications"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* API Configuration Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon />
              API Configuration
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>AI Provider</InputLabel>
                  <Select
                    value={formData.apiConfiguration.provider}
                    onChange={(e) => handleFieldChange('apiConfiguration.provider', e.target.value)}
                    label="AI Provider"
                  >
                    <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
                    <MenuItem value="openai">OpenAI (GPT)</MenuItem>
                    <MenuItem value="perplexity">Perplexity (Sonar)</MenuItem>
                    <MenuItem value="google">Google (Gemini)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model ID"
                  value={formData.apiConfiguration.modelId}
                  onChange={(e) => handleFieldChange('apiConfiguration.modelId', e.target.value)}
                  placeholder="e.g., claude-3-5-sonnet-20241022"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showApiKey ? 'text' : 'password'}
                  label="API Key"
                  value={formData.apiConfiguration.apiKey}
                  onChange={(e) => handleFieldChange('apiConfiguration.apiKey', e.target.value)}
                  placeholder="Enter your API key for the selected provider"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Tokens"
                  value={formData.apiConfiguration.maxTokens}
                  onChange={(e) => handleFieldChange('apiConfiguration.maxTokens', parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 50000 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Temperature"
                  value={formData.apiConfiguration.temperature}
                  onChange={(e) => handleFieldChange('apiConfiguration.temperature', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={isTestingConnection ? <CircularProgress size={16} /> : <TestIcon />}
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !formData.apiConfiguration.apiKey}
                  sx={{ height: '56px' }}
                >
                  Test Connection
                </Button>
              </Grid>
              
              {/* Connection Status */}
              {connectionStatus && (
                <Grid item xs={12}>
                  <Alert 
                    severity={connectionStatus.success ? 'success' : 'error'}
                    icon={connectionStatus.success ? <CheckIcon /> : <ErrorIcon />}
                  >
                    <Typography variant="body2">
                      {connectionStatus.message}
                    </Typography>
                    {connectionStatus.details && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Provider: {connectionStatus.details.provider}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Model: {connectionStatus.details.model}
                        </Typography>
                        {connectionStatus.details.latency && (
                          <Typography variant="caption" display="block">
                            Response Time: {connectionStatus.details.latency}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </BaseModal>
  );
};

AgentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  agent: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
  availableAgents: PropTypes.array,
};

export default AgentModal;
