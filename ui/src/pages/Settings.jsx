import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Tooltip,
  Chip,
  IconButton,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  InputAdornment
} from '@mui/material';
import ApiKeyManager from '../components/ApiKeyManager';
import UsageTrackingDashboard from '../components/UsageTrackingDashboard';
import ModelTestingConsole from '../components/ModelTestingConsole';
import ConfigurationBackup from '../components/ConfigurationBackup';
import {
  Settings as SettingsIcon,
  Help as HelpIcon,
  Psychology as AIIcon,
  Security as SecurityIcon,
  Assessment as AnalyticsIcon,
  CloudSync as SyncIcon,
  Science as TestIcon,
  Save as SaveIcon,
  Backup as BackupIcon
} from '@mui/icons-material';

// Available AI Models organized by provider
const AI_MODELS = {
  anthropic: [
    { 
      id: 'claude-sonnet-4-20250514', 
      name: 'Claude Sonnet 4 (Latest)', 
      contextWindow: 200000, 
      costPer1KInput: 3.0, 
      costPer1KOutput: 15.0,
      description: 'Latest Claude model with exceptional reasoning and coding capabilities'
    },
    { 
      id: 'claude-3-7-sonnet-20250219', 
      name: 'Claude 3.7 Sonnet', 
      contextWindow: 128000, 
      costPer1KInput: 2.5, 
      costPer1KOutput: 12.0,
      description: 'Balanced performance and speed for most tasks'
    },
    { 
      id: 'claude-3-5-haiku-20241022', 
      name: 'Claude 3.5 Haiku', 
      contextWindow: 200000, 
      costPer1KInput: 0.8, 
      costPer1KOutput: 4.0,
      description: 'Fast and efficient for simpler tasks'
    }
  ],
  openai: [
    { 
      id: 'gpt-4o', 
      name: 'GPT-4o', 
      contextWindow: 128000, 
      costPer1KInput: 5.0, 
      costPer1KOutput: 15.0,
      description: 'Most capable GPT model with multimodal capabilities'
    },
    { 
      id: 'gpt-4o-mini', 
      name: 'GPT-4o Mini', 
      contextWindow: 128000, 
      costPer1KInput: 0.15, 
      costPer1KOutput: 0.6,
      description: 'Cost-effective model for routine tasks'
    }
  ],
  perplexity: [
    { 
      id: 'sonar-pro', 
      name: 'Sonar Pro', 
      contextWindow: 127072, 
      costPer1KInput: 1.0, 
      costPer1KOutput: 1.0,
      description: 'Research-focused model with web search capabilities'
    },
    { 
      id: 'sonar', 
      name: 'Sonar', 
      contextWindow: 127072, 
      costPer1KInput: 0.2, 
      costPer1KOutput: 0.2,
      description: 'Basic research model with web access'
    }
  ],
  google: [
    { 
      id: 'gemini-2.0-flash-exp', 
      name: 'Gemini 2.0 Flash (Experimental)', 
      contextWindow: 1048576, 
      costPer1KInput: 0.075, 
      costPer1KOutput: 0.3,
      description: 'Latest Gemini model with massive context window'
    },
    { 
      id: 'gemini-1.5-pro', 
      name: 'Gemini 1.5 Pro', 
      contextWindow: 2097152, 
      costPer1KInput: 1.25, 
      costPer1KOutput: 5.0,
      description: 'High-performance model with very large context'
    }
  ]
};

// Model role descriptions
const MODEL_ROLES = {
  main: {
    title: 'Main Model',
    description: 'Primary model used for task generation, updates, and general operations',
    icon: <AIIcon color="primary" />,
    color: 'primary'
  },
  research: {
    title: 'Research Model', 
    description: 'Specialized model for research-backed operations and web-enhanced tasks',
    icon: <AnalyticsIcon color="secondary" />,
    color: 'secondary'
  },
  fallback: {
    title: 'Fallback Model',
    description: 'Backup model used when the primary model fails or is unavailable',
    icon: <SyncIcon color="warning" />,
    color: 'warning'
  }
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function ModelSelectionCard({ role, roleInfo, currentModel, onModelChange, models }) {
  const [selectedProvider, setSelectedProvider] = useState('anthropic');
  const [selectedModel, setSelectedModel] = useState(currentModel?.modelId || '');
  const [maxTokens, setMaxTokens] = useState(currentModel?.maxTokens || 50000);
  const [temperature, setTemperature] = useState(currentModel?.temperature || 0.2);

  const availableModels = models[selectedProvider] || [];
  const modelDetails = availableModels.find(m => m.id === selectedModel);

  const handleProviderChange = (event) => {
    const newProvider = event.target.value;
    setSelectedProvider(newProvider);
    // Reset model selection when provider changes
    setSelectedModel('');
  };

  const handleModelChange = (event) => {
    const newModelId = event.target.value;
    setSelectedModel(newModelId);
    const modelData = availableModels.find(m => m.id === newModelId);
    
    if (modelData && onModelChange) {
      onModelChange(role, {
        provider: selectedProvider,
        modelId: newModelId,
        maxTokens,
        temperature,
        ...modelData
      });
    }
  };

  const handleParameterChange = (param, value) => {
    if (param === 'maxTokens') {
      setMaxTokens(value);
    } else if (param === 'temperature') {
      setTemperature(value);
    }
    
    if (onModelChange && selectedModel) {
      onModelChange(role, {
        provider: selectedProvider,
        modelId: selectedModel,
        maxTokens: param === 'maxTokens' ? value : maxTokens,
        temperature: param === 'temperature' ? value : temperature,
        ...modelDetails
      });
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={roleInfo.icon}
        title={roleInfo.title}
        subheader={roleInfo.description}
        action={
          <Tooltip title="Learn more about model roles">
            <IconButton>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Provider Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>AI Provider</InputLabel>
              <Select
                value={selectedProvider}
                label="AI Provider"
                onChange={handleProviderChange}
              >
                <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
                <MenuItem value="openai">OpenAI (GPT)</MenuItem>
                <MenuItem value="perplexity">Perplexity (Sonar)</MenuItem>
                <MenuItem value="google">Google (Gemini)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Model Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={handleModelChange}
                disabled={!selectedProvider}
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {model.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {model.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Model Details */}
          {modelDetails && (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip 
                    label={`Context: ${modelDetails.contextWindow.toLocaleString()}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Input: $${modelDetails.costPer1KInput}/1K`} 
                    size="small" 
                    variant="outlined"
                    color="info"
                  />
                  <Chip 
                    label={`Output: $${modelDetails.costPer1KOutput}/1K`} 
                    size="small" 
                    variant="outlined"
                    color="info"
                  />
                </Box>
              </Grid>

              {/* Model Parameters */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                  fullWidth
                  inputProps={{ min: 1000, max: modelDetails.contextWindow }}
                  helperText={`Maximum: ${modelDetails.contextWindow.toLocaleString()}`}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ px: 2 }}>
                  <Typography gutterBottom>
                    Temperature: {temperature}
                    <Tooltip title="Controls randomness. Lower = more focused, Higher = more creative">
                      <IconButton size="small">
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  <Slider
                    value={temperature}
                    onChange={(e, value) => handleParameterChange('temperature', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                      { value: 0, label: 'Focused' },
                      { value: 0.5, label: 'Balanced' },
                      { value: 1, label: 'Creative' }
                    ]}
                  />
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState({
    models: {
      main: { provider: 'anthropic', modelId: 'claude-sonnet-4-20250514', maxTokens: 50000, temperature: 0.2 },
      research: { provider: 'perplexity', modelId: 'sonar-pro', maxTokens: 8700, temperature: 0.1 },
      fallback: { provider: 'anthropic', modelId: 'claude-3-7-sonnet-20250219', maxTokens: 128000, temperature: 0.2 }
    },
    global: {
      logLevel: 'info',
      debug: false,
      defaultSubtasks: 5,
      defaultPriority: 'medium'
    }
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleModelConfigChange = (role, modelConfig) => {
    setConfig(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [role]: modelConfig
      }
    }));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Settings
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="AI Models" icon={<AIIcon />} />
          <Tab label="API Keys" icon={<SecurityIcon />} />
          <Tab label="Usage Tracking" icon={<AnalyticsIcon />} />
          <Tab label="Model Testing" icon={<TestIcon />} />
          <Tab label="Backup & Restore" icon={<BackupIcon />} />
        </Tabs>

        {/* AI Models Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            AI Model Configuration
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Configure the AI models used for different operations in Task Master. Each role serves a specific purpose
            and can be optimized for cost, performance, or specialized capabilities.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Changes to model configuration will take effect after saving. Make sure you have valid API keys 
            configured for the selected providers.
          </Alert>

          {Object.entries(MODEL_ROLES).map(([role, roleInfo]) => (
            <ModelSelectionCard
              key={role}
              role={role}
              roleInfo={roleInfo}
              currentModel={config.models[role]}
              onModelChange={handleModelConfigChange}
              models={AI_MODELS}
            />
          ))}
        </TabPanel>

        {/* API Keys Tab */}
        <TabPanel value={activeTab} index={1}>
          <ApiKeyManager />
        </TabPanel>

        {/* Usage Tracking Tab */}
        <TabPanel value={activeTab} index={2}>
          <UsageTrackingDashboard />
        </TabPanel>

        {/* Model Testing Tab */}
        <TabPanel value={activeTab} index={3}>
          <ModelTestingConsole />
        </TabPanel>

        {/* Backup & Restore Tab */}
        <TabPanel value={activeTab} index={4}>
          <ConfigurationBackup 
            currentConfig={config}
            onConfigRestore={(backup) => {
              if (backup.models) {
                setConfig(prev => ({
                  ...prev,
                  models: backup.models,
                  global: backup.global || prev.global
                }));
              }
            }}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
} 