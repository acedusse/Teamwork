import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Delete as DeleteIcon,
  Speed as PerformanceIcon,
  AttachMoney as CostIcon,
  Schedule as TimeIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Science as TestIcon,
  Psychology as AIIcon,
  Help as HelpIcon,
  History as HistoryIcon
} from '@mui/icons-material';

// Sample test prompts for different use cases
const SAMPLE_PROMPTS = {
  'task-generation': {
    title: 'Task Generation Test',
    prompt: 'Generate 3 specific, actionable tasks for implementing a user authentication system using JWT tokens in a React application.',
    category: 'Task Management'
  },
  'code-review': {
    title: 'Code Review Test',
    prompt: 'Review this React component and suggest improvements:\n\nfunction UserProfile({ user }) {\n  return (\n    <div>\n      <h1>{user.name}</h1>\n      <p>{user.email}</p>\n    </div>\n  );\n}',
    category: 'Code Analysis'
  },
  'problem-solving': {
    title: 'Problem Solving Test',
    prompt: 'How would you optimize the performance of a React app that has 1000+ components and is experiencing slow rendering?',
    category: 'Technical Problem Solving'
  },
  'documentation': {
    title: 'Documentation Test',
    prompt: 'Write clear documentation for a REST API endpoint that creates a new user account, including request/response examples.',
    category: 'Technical Writing'
  }
};

// Mock model configurations
const AVAILABLE_MODELS = {
  main: { provider: 'anthropic', modelId: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Main)' },
  research: { provider: 'perplexity', modelId: 'sonar-pro', name: 'Sonar Pro (Research)' },
  fallback: { provider: 'anthropic', modelId: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Fallback)' }
};

function TestResponse({ response, isLoading, error }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(response?.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Generating response...
          </Typography>
          <LinearProgress sx={{ width: '100%', mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent>
          <Alert severity="error" icon={<ErrorIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              Test Failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" color="textSecondary">
            Run a test to see the response
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 400 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SuccessIcon color="success" />
            {response.modelName}
            <Chip label="Success" color="success" size="small" />
          </Box>
        }
        action={
          <Tooltip title={copied ? 'Copied!' : 'Copy response'}>
            <IconButton onClick={handleCopy}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ height: 280, overflow: 'auto' }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {response.text}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Performance Metrics */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <TimeIcon color="primary" />
              <Typography variant="caption" display="block">
                Response Time
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {response.responseTime}ms
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <AIIcon color="secondary" />
              <Typography variant="caption" display="block">
                Tokens
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {response.tokens?.toLocaleString() || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <CostIcon color="warning" />
              <Typography variant="caption" display="block">
                Cost
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ${response.cost?.toFixed(4) || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <PerformanceIcon color="info" />
              <Typography variant="caption" display="block">
                Quality
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {response.quality || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function SavedPromptsDialog({ open, onClose, onLoadPrompt, savedPrompts, onDeletePrompt }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Saved Test Prompts</DialogTitle>
      <DialogContent>
        {savedPrompts.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
            No saved prompts yet. Save a prompt during testing to see it here.
          </Typography>
        ) : (
          <List>
            {savedPrompts.map((prompt, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={prompt.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {prompt.prompt.substring(0, 100)}...
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Saved: {new Date(prompt.savedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => onLoadPrompt(prompt)}
                    sx={{ mr: 1 }}
                  >
                    <LoadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => onDeletePrompt(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function SavePromptDialog({ open, onClose, onSave, currentPrompt }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');

  const handleSave = () => {
    if (title.trim()) {
      onSave({
        title: title.trim(),
        prompt: currentPrompt,
        category,
        savedAt: new Date().toISOString()
      });
      setTitle('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Test Prompt</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Prompt Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="General">General</MenuItem>
            <MenuItem value="Task Management">Task Management</MenuItem>
            <MenuItem value="Code Analysis">Code Analysis</MenuItem>
            <MenuItem value="Technical Problem Solving">Technical Problem Solving</MenuItem>
            <MenuItem value="Technical Writing">Technical Writing</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!title.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ModelTestingConsole() {
  const [testMode, setTestMode] = useState('single'); // 'single' or 'compare'
  const [selectedModel, setSelectedModel] = useState('main');
  const [selectedModel2, setSelectedModel2] = useState('research');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [response1, setResponse1] = useState(null);
  const [response2, setResponse2] = useState(null);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskmaster_saved_prompts');
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved prompts:', error);
      }
    }
  }, []);

  // Save prompts to localStorage
  const savePromptsToStorage = (prompts) => {
    localStorage.setItem('taskmaster_saved_prompts', JSON.stringify(prompts));
  };

  const simulateModelTest = async (modelKey, prompt) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const model = AVAILABLE_MODELS[modelKey];
    
    // Simulate potential API errors (10% chance)
    if (Math.random() < 0.1) {
      const errors = [
        'API key invalid or expired',
        'Rate limit exceeded. Please try again in a few minutes.',
        'Model temporarily unavailable',
        'Request timeout after 30 seconds',
        'Insufficient quota remaining'
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }
    
    // Generate mock response
    const responses = [
      `Based on your request, here's a comprehensive approach:\n\n1. First, we need to analyze the requirements carefully\n2. Consider the technical constraints and dependencies\n3. Implement a scalable solution that follows best practices\n\nThis approach ensures maintainability and performance while meeting all specified requirements.`,
      
      `Here's my analysis of the situation:\n\n• The problem requires a multi-faceted solution\n• We should prioritize user experience and system reliability\n• Implementation should be done incrementally\n\nI recommend starting with the core functionality and then expanding based on user feedback and performance metrics.`,
      
      `To address this effectively:\n\n→ Begin with thorough planning and architecture design\n→ Focus on clean, maintainable code structure\n→ Implement comprehensive testing strategies\n→ Consider scalability from the start\n\nThis methodology has proven successful in similar projects and should deliver optimal results.`
    ];
    
    const responseText = responses[Math.floor(Math.random() * responses.length)];
    const inputTokens = Math.floor(prompt.length / 4); // Rough estimate
    const outputTokens = Math.floor(responseText.length / 4);
    const totalTokens = inputTokens + outputTokens;
    const responseTime = 800 + Math.random() * 2200; // 800-3000ms
    
    // Calculate cost based on model (mock pricing)
    const costs = {
      main: { input: 0.003, output: 0.015 }, // Claude Sonnet 4
      research: { input: 0.001, output: 0.001 }, // Perplexity
      fallback: { input: 0.0025, output: 0.012 } // Claude 3.7
    };
    
    const modelCost = costs[modelKey] || costs.main;
    const cost = (inputTokens * modelCost.input / 1000) + (outputTokens * modelCost.output / 1000);
    
    return {
      text: responseText,
      modelName: model.name,
      responseTime: Math.round(responseTime),
      tokens: totalTokens,
      inputTokens,
      outputTokens,
      cost,
      quality: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
      timestamp: new Date().toISOString()
    };
  };

  const handleRunTest = async () => {
    if (!prompt.trim()) {
      setSnackbarMessage('Please enter a test prompt');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    setError1(null);
    setResponse1(null);
    
    if (testMode === 'compare') {
      setIsLoading2(true);
      setError2(null);
      setResponse2(null);
    }

    try {
      // Test first model
      const result1 = await simulateModelTest(selectedModel, prompt);
      setResponse1(result1);
      
      // Add to test history
      const historyEntry = {
        id: Date.now(),
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        model: AVAILABLE_MODELS[selectedModel].name,
        timestamp: new Date().toISOString(),
        success: true,
        responseTime: result1.responseTime,
        cost: result1.cost
      };
      setTestHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
      
    } catch (error) {
      setError1(error.message);
    } finally {
      setIsLoading(false);
    }

    // Test second model if in compare mode
    if (testMode === 'compare') {
      try {
        const result2 = await simulateModelTest(selectedModel2, prompt);
        setResponse2(result2);
      } catch (error) {
        setError2(error.message);
      } finally {
        setIsLoading2(false);
      }
    }
  };

  const handleLoadSamplePrompt = (key) => {
    const sample = SAMPLE_PROMPTS[key];
    setPrompt(sample.prompt);
    setSnackbarMessage(`Loaded sample: ${sample.title}`);
    setSnackbarOpen(true);
  };

  const handleSavePrompt = (promptData) => {
    const newPrompts = [...savedPrompts, promptData];
    setSavedPrompts(newPrompts);
    savePromptsToStorage(newPrompts);
    setSnackbarMessage('Prompt saved successfully');
    setSnackbarOpen(true);
  };

  const handleLoadPrompt = (promptData) => {
    setPrompt(promptData.prompt);
    setShowSavedPrompts(false);
    setSnackbarMessage(`Loaded: ${promptData.title}`);
    setSnackbarOpen(true);
  };

  const handleDeletePrompt = (index) => {
    const newPrompts = savedPrompts.filter((_, i) => i !== index);
    setSavedPrompts(newPrompts);
    savePromptsToStorage(newPrompts);
    setSnackbarMessage('Prompt deleted');
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TestIcon />
          Model Testing Console
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LoadIcon />}
            onClick={() => setShowSavedPrompts(true)}
          >
            Load Prompt
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => setShowSaveDialog(true)}
            disabled={!prompt.trim()}
          >
            Save Prompt
          </Button>
        </Box>
      </Box>

      {/* Test Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Test Configuration" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Test Mode</InputLabel>
                <Select
                  value={testMode}
                  label="Test Mode"
                  onChange={(e) => setTestMode(e.target.value)}
                >
                  <MenuItem value="single">Single Model Test</MenuItem>
                  <MenuItem value="compare">Side-by-Side Comparison</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={testMode === 'compare' ? 3 : 6}>
              <FormControl fullWidth>
                <InputLabel>Primary Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Primary Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
                    <MenuItem key={key} value={key}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {testMode === 'compare' && (
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Comparison Model</InputLabel>
                  <Select
                    value={selectedModel2}
                    label="Comparison Model"
                    onChange={(e) => setSelectedModel2(e.target.value)}
                  >
                    {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
                      <MenuItem key={key} value={key}>
                        {model.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Sample Prompts */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon />
            <Typography>Sample Test Prompts</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(SAMPLE_PROMPTS).map(([key, sample]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => handleLoadSamplePrompt(key)}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {sample.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                      {sample.prompt.substring(0, 80)}...
                    </Typography>
                    <Chip label={sample.category} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Test Input */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Test Prompt"
          action={
            <Button
              variant="contained"
              startIcon={<RunIcon />}
              onClick={handleRunTest}
              disabled={isLoading || isLoading2}
            >
              {isLoading || isLoading2 ? 'Testing...' : 'Run Test'}
            </Button>
          }
        />
        <CardContent>
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="Enter your test prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            variant="outlined"
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={testMode === 'compare' ? 6 : 12}>
          <TestResponse
            response={response1}
            isLoading={isLoading}
            error={error1}
          />
        </Grid>
        
        {testMode === 'compare' && (
          <Grid item xs={12} md={6}>
            <TestResponse
              response={response2}
              isLoading={isLoading2}
              error={error2}
            />
          </Grid>
        )}
      </Grid>

      {/* Test History */}
      {testHistory.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader 
            title="Recent Tests"
            avatar={<HistoryIcon />}
          />
          <CardContent>
            {testHistory.map((test) => (
              <Box key={test.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                <Box>
                  <Typography variant="body2">{test.prompt}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {test.model} • {new Date(test.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`${test.responseTime}ms`} size="small" />
                  <Chip label={`$${test.cost.toFixed(4)}`} size="small" color="secondary" />
                  <Chip label="Success" size="small" color="success" />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <SavedPromptsDialog
        open={showSavedPrompts}
        onClose={() => setShowSavedPrompts(false)}
        onLoadPrompt={handleLoadPrompt}
        savedPrompts={savedPrompts}
        onDeletePrompt={handleDeletePrompt}
      />

      <SavePromptDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSavePrompt}
        currentPrompt={prompt}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
} 