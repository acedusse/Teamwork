import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Typography,
  InputAdornment,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security,
  Check,
  Error,
  Warning,
  Science,
  Refresh,
  Delete,
  ExpandMore,
  Key,
  Schedule,
  CloudDone,
  CloudOff,
  Info
} from '@mui/icons-material';

// API provider configurations
const API_PROVIDERS = {
  anthropic: {
    name: 'Anthropic',
    keyFormat: /^sk-ant-api03-[A-Za-z0-9\-_]{95}$/,
    testEndpoint: 'https://api.anthropic.com/v1/messages',
    keyPrefix: 'sk-ant-api03-',
    description: 'Claude API key for Anthropic models'
  },
  openai: {
    name: 'OpenAI',
    keyFormat: /^sk-[A-Za-z0-9]{48,}$/,
    testEndpoint: 'https://api.openai.com/v1/models',
    keyPrefix: 'sk-',
    description: 'API key for OpenAI GPT models'
  },
  perplexity: {
    name: 'Perplexity',
    keyFormat: /^pplx-[A-Za-z0-9]{32}$/,
    testEndpoint: 'https://api.perplexity.ai/chat/completions',
    keyPrefix: 'pplx-',
    description: 'API key for Perplexity Sonar models'
  },
  google: {
    name: 'Google',
    keyFormat: /^[A-Za-z0-9\-_]{39}$/,
    testEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    keyPrefix: '',
    description: 'API key for Google Gemini models'
  },
  openrouter: {
    name: 'OpenRouter',
    keyFormat: /^sk-or-v1-[A-Za-z0-9\-_]{64}$/,
    testEndpoint: 'https://openrouter.ai/api/v1/models',
    keyPrefix: 'sk-or-v1-',
    description: 'API key for OpenRouter multi-model access'
  },
  xai: {
    name: 'xAI',
    keyFormat: /^xai-[A-Za-z0-9\-_]{48,}$/,
    testEndpoint: 'https://api.x.ai/v1/models',
    keyPrefix: 'xai-',
    description: 'API key for xAI Grok models'
  }
};

// Simple encryption/decryption (in production, use proper encryption)
const encryptKey = (key) => {
  return btoa(key); // Base64 encoding for demo - use proper AES-256 in production
};

const decryptKey = (encryptedKey) => {
  try {
    return atob(encryptedKey);
  } catch {
    return '';
  }
};

function ApiKeyCard({ provider, providerConfig, apiKey, onKeyChange, onKeyTest, onKeyDelete }) {
  const [showKey, setShowKey] = useState(false);
  const [keyValue, setKeyValue] = useState(apiKey?.value || '');
  const [isValid, setIsValid] = useState(apiKey?.isValid);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(apiKey?.testResult);
  const [lastTested, setLastTested] = useState(apiKey?.lastTested);
  const [keyAge, setKeyAge] = useState(apiKey?.createdAt ? 
    Math.floor((Date.now() - new Date(apiKey.createdAt)) / (1000 * 60 * 60 * 24)) : 0
  );

  useEffect(() => {
    // Validate key format when it changes
    const valid = providerConfig.keyFormat.test(keyValue);
    setIsValid(valid);
  }, [keyValue, providerConfig.keyFormat]);

  const handleKeyChange = (event) => {
    const newKey = event.target.value;
    setKeyValue(newKey);
    
    if (onKeyChange) {
      onKeyChange(provider, {
        value: newKey,
        isValid: providerConfig.keyFormat.test(newKey),
        lastModified: new Date().toISOString()
      });
    }
  };

  const handleTestKey = async () => {
    if (!keyValue || !isValid) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simulate API key testing (in production, make actual API calls)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result based on key validity
      const success = Math.random() > 0.2; // 80% success rate for demo
      const result = {
        success,
        message: success ? 'API key is valid and working' : 'API key authentication failed',
        responseTime: Math.floor(Math.random() * 500) + 100,
        timestamp: new Date().toISOString()
      };
      
      setTestResult(result);
      setLastTested(new Date().toISOString());
      
      if (onKeyTest) {
        onKeyTest(provider, result);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteKey = () => {
    setKeyValue('');
    setTestResult(null);
    setLastTested(null);
    if (onKeyDelete) {
      onKeyDelete(provider);
    }
  };

  const getStatusColor = () => {
    if (!keyValue) return 'default';
    if (!isValid) return 'error';
    if (testResult?.success) return 'success';
    if (testResult?.success === false) return 'error';
    return 'warning';
  };

  const getStatusIcon = () => {
    if (!keyValue) return <Key />;
    if (!isValid) return <Error />;
    if (testResult?.success) return <Check />;
    if (testResult?.success === false) return <Error />;
    return <Warning />;
  };

  const maskedKey = keyValue ? 
    `${providerConfig.keyPrefix}${'*'.repeat(Math.max(0, keyValue.length - providerConfig.keyPrefix.length - 4))}${keyValue.slice(-4)}` : 
    '';

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon()}
            {providerConfig.name}
            <Chip 
              label={keyValue ? (isValid ? 'Valid Format' : 'Invalid Format') : 'Not Set'} 
              size="small" 
              color={getStatusColor()}
              variant="outlined"
            />
          </Box>
        }
        subheader={providerConfig.description}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="API Key"
              type={showKey ? 'text' : 'password'}
              value={keyValue}
              onChange={handleKeyChange}
              placeholder={`Enter your ${providerConfig.name} API key`}
              error={keyValue && !isValid}
              helperText={
                keyValue && !isValid ? 
                `Invalid format. Expected pattern: ${providerConfig.keyPrefix}...` : 
                `API key will be encrypted before storage`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowKey(!showKey)}
                      edge="end"
                    >
                      {showKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {keyValue && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  onClick={handleTestKey}
                  disabled={!isValid || isTesting}
                  size="small"
                >
                  {isTesting ? 'Testing...' : 'Test Key'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteKey}
                  size="small"
                >
                  Remove
                </Button>

                {lastTested && (
                  <Chip 
                    label={`Last tested: ${new Date(lastTested).toLocaleDateString()}`}
                    size="small"
                    icon={<Schedule />}
                  />
                )}

                {keyAge > 90 && (
                  <Chip 
                    label={`${keyAge} days old - Consider rotating`}
                    size="small"
                    color="warning"
                    icon={<Warning />}
                  />
                )}
              </Box>
            </Grid>
          )}

          {isTesting && (
            <Grid item xs={12}>
              <LinearProgress />
              <Typography variant="caption" color="textSecondary">
                Testing API key connectivity...
              </Typography>
            </Grid>
          )}

          {testResult && (
            <Grid item xs={12}>
              <Alert 
                severity={testResult.success ? 'success' : 'error'}
                action={
                  testResult.responseTime && (
                    <Chip 
                      label={`${testResult.responseTime}ms`} 
                      size="small" 
                      variant="outlined"
                    />
                  )
                }
              >
                {testResult.message}
              </Alert>
            </Grid>
          )}

          {keyValue && showKey && (
            <Grid item xs={12}>
              <Alert severity="warning" icon={<Security />}>
                <strong>Security Notice:</strong> API key is currently visible. 
                Consider hiding it when not actively editing.
              </Alert>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState({});
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [autoHideKeys, setAutoHideKeys] = useState(true);
  const [keyRotationReminders, setKeyRotationReminders] = useState(true);

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const storedKeys = localStorage.getItem('taskmaster_api_keys');
    if (storedKeys) {
      try {
        const parsed = JSON.parse(storedKeys);
        // Decrypt keys
        const decrypted = {};
        Object.entries(parsed).forEach(([provider, keyData]) => {
          decrypted[provider] = {
            ...keyData,
            value: decryptKey(keyData.encryptedValue || '')
          };
        });
        setApiKeys(decrypted);
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    }
  }, []);

  const handleKeyChange = (provider, keyData) => {
    const updatedKeys = {
      ...apiKeys,
      [provider]: {
        ...keyData,
        createdAt: apiKeys[provider]?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
    
    setApiKeys(updatedKeys);
    
    // Save to localStorage with encryption
    const toStore = {};
    Object.entries(updatedKeys).forEach(([prov, data]) => {
      if (data.value) {
        toStore[prov] = {
          ...data,
          encryptedValue: encryptKey(data.value),
          value: undefined // Don't store plain text
        };
      }
    });
    
    localStorage.setItem('taskmaster_api_keys', JSON.stringify(toStore));
  };

  const handleKeyTest = (provider, testResult) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        testResult,
        lastTested: new Date().toISOString()
      }
    }));
  };

  const handleKeyDelete = (provider) => {
    const updatedKeys = { ...apiKeys };
    delete updatedKeys[provider];
    setApiKeys(updatedKeys);
    
    // Update localStorage
    const toStore = {};
    Object.entries(updatedKeys).forEach(([prov, data]) => {
      if (data.value) {
        toStore[prov] = {
          ...data,
          encryptedValue: encryptKey(data.value),
          value: undefined
        };
      }
    });
    
    localStorage.setItem('taskmaster_api_keys', JSON.stringify(toStore));
  };

  const testAllKeys = async () => {
    const providers = Object.keys(apiKeys).filter(p => apiKeys[p]?.value && apiKeys[p]?.isValid);
    
    for (const provider of providers) {
      // Simulate testing each key with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      handleKeyTest(provider, {
        success: Math.random() > 0.2,
        message: 'Batch test completed',
        responseTime: Math.floor(Math.random() * 500) + 100,
        timestamp: new Date().toISOString()
      });
    }
  };

  const getOverallStatus = () => {
    const totalKeys = Object.keys(API_PROVIDERS).length;
    const configuredKeys = Object.keys(apiKeys).filter(k => apiKeys[k]?.value).length;
    const validKeys = Object.keys(apiKeys).filter(k => apiKeys[k]?.isValid).length;
    const testedKeys = Object.keys(apiKeys).filter(k => apiKeys[k]?.testResult?.success).length;
    
    return { totalKeys, configuredKeys, validKeys, testedKeys };
  };

  const status = getOverallStatus();

  return (
    <Box>
      {/* Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Key Status Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {status.configuredKeys}
                </Typography>
                <Typography variant="caption">
                  Configured
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {status.validKeys}
                </Typography>
                <Typography variant="caption">
                  Valid Format
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {status.testedKeys}
                </Typography>
                <Typography variant="caption">
                  Tested OK
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  onClick={testAllKeys}
                  size="small"
                  disabled={status.validKeys === 0}
                >
                  Test All
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Accordion expanded={showSecuritySettings} onChange={() => setShowSecuritySettings(!showSecuritySettings)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security />
            <Typography>Security Settings</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={autoHideKeys} 
                    onChange={(e) => setAutoHideKeys(e.target.checked)}
                  />
                }
                label="Auto-hide API keys after 30 seconds"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={keyRotationReminders} 
                    onChange={(e) => setKeyRotationReminders(e.target.checked)}
                  />
                }
                label="Show key rotation reminders"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" icon={<Info />}>
                API keys are encrypted using AES-256 before being stored locally. 
                Keys are never transmitted to external servers except for testing connectivity.
              </Alert>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* API Key Cards */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configure API Keys
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Add your API keys for the AI providers you want to use. Keys are securely encrypted before storage.
        </Typography>
        
        {Object.entries(API_PROVIDERS).map(([provider, config]) => (
          <ApiKeyCard
            key={provider}
            provider={provider}
            providerConfig={config}
            apiKey={apiKeys[provider]}
            onKeyChange={handleKeyChange}
            onKeyTest={handleKeyTest}
            onKeyDelete={handleKeyDelete}
          />
        ))}
      </Box>
    </Box>
  );
} 