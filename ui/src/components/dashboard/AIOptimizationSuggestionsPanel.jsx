/**
 * AIOptimizationSuggestionsPanel.jsx
 * Comprehensive UI component for AI-driven optimization suggestions
 * Provides interface for generating, viewing, and managing optimization suggestions
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Paper, 
  Alert, 
  Collapse, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  AutoFixHigh as OptimizeIcon,
  Lightbulb as SuggestionIcon,
  TrendingUp as ImpactIcon,
  Schedule as TimelineIcon,
  Warning as RiskIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Analytics as AnalyticsIcon,
  Settings as ConfigIcon,
  Psychology as AIIcon,
  Speed as QuickWinIcon,
  Star as PriorityIcon
} from '@mui/icons-material';

import useOptimizationSuggestions from '../../hooks/useOptimizationSuggestions.js';

// Priority colors
const PRIORITY_COLORS = {
  critical: '#f44336',
  high: '#ff9800',
  medium: '#2196f3',
  low: '#4caf50'
};

// Effort colors
const EFFORT_COLORS = {
  immediate: '#4caf50',
  'short-term': '#8bc34a',
  'medium-term': '#ff9800',
  'long-term': '#f44336'
};

// Type icons
const TYPE_ICONS = {
  workflow: <OptimizeIcon />,
  resource: <AnalyticsIcon />,
  process: <ImpactIcon />,
  automation: <OptimizeIcon />,
  collaboration: <AIIcon />,
  quality: <SuccessIcon />,
  performance: <QuickWinIcon />,
  planning: <TimelineIcon />
};

/**
 * Individual suggestion card component
 */
const SuggestionCard = ({ 
  suggestion, 
  expanded, 
  onToggleExpand, 
  onImplement, 
  onDismiss 
}) => {
  const priorityColor = PRIORITY_COLORS[suggestion.priority] || PRIORITY_COLORS.medium;
  const effortColor = EFFORT_COLORS[suggestion.effort] || EFFORT_COLORS['medium-term'];

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2, 
        borderLeft: `4px solid ${priorityColor}`,
        '&:hover': { boxShadow: 2 }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {TYPE_ICONS[suggestion.type] || <SuggestionIcon />}
              <Typography variant="h6" component="h3">
                {suggestion.title}
              </Typography>
              <Chip 
                label={suggestion.priority} 
                size="small" 
                sx={{ 
                  backgroundColor: priorityColor, 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {suggestion.description}
            </Typography>

            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={suggestion.type} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={suggestion.effort} 
                size="small" 
                sx={{ 
                  backgroundColor: effortColor, 
                  color: 'white' 
                }}
              />
              <Chip 
                label={suggestion.timeline} 
                size="small" 
                icon={<TimelineIcon />}
              />
              {suggestion.confidence && (
                <Chip 
                  label={`${Math.round(suggestion.confidence * 100)}% confidence`} 
                  size="small" 
                  color="primary"
                />
              )}
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            <IconButton 
              onClick={() => onToggleExpand(suggestion.id)}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box mt={2}>
            {suggestion.rationale && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  <ImpactIcon sx={{ fontSize: 16, mr: 1 }} />
                  Rationale
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {suggestion.rationale}
                </Typography>
              </Box>
            )}

            {suggestion.expectedImpact && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  <ImpactIcon sx={{ fontSize: 16, mr: 1 }} />
                  Expected Impact
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {suggestion.expectedImpact}
                </Typography>
              </Box>
            )}

            {suggestion.implementationSteps && suggestion.implementationSteps.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Implementation Steps
                </Typography>
                <List dense>
                  {suggestion.implementationSteps.map((step, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary">
                          {index + 1}.
                        </Typography>
                      </ListItemIcon>
                      <ListItemText 
                        primary={step}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box display="flex" gap={1} mt={2}>
              <Button 
                variant="contained" 
                size="small"
                startIcon={<SuccessIcon />}
                onClick={() => onImplement(suggestion)}
              >
                Mark as Implemented
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                color="secondary"
                onClick={() => onDismiss(suggestion)}
              >
                Dismiss
              </Button>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

/**
 * Main AI Optimization Suggestions Panel component
 */
const AIOptimizationSuggestionsPanel = ({
  workflowData = null,
  autoStart = true,
  showConfiguration = true,
  onSuggestionImplemented = null,
  onSuggestionDismissed = null,
  onError = null
}) => {
  // Optimization suggestions hook
  const {
    isInitialized,
    isLoading,
    isGenerating,
    error,
    sessionId,
    sessionStatus,
    suggestions,
    metadata,
    config,
    startSession,
    generateSuggestions,
    endSession,
    updateConfig,
    clearError,
    getSummaryStats,
    OPTIMIZATION_MODES
  } = useOptimizationSuggestions({
    autoInitialize: true,
    workflowData,
    onError: onError
  });

  // Local state
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());
  const [configExpanded, setConfigExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-start session if enabled
  useEffect(() => {
    if (autoStart && isInitialized && !sessionId && workflowData) {
      startSession().catch(err => {
        console.error('Failed to auto-start optimization session:', err);
      });
    }
  }, [autoStart, isInitialized, sessionId, workflowData, startSession]);

  // Handle suggestion card expansion
  const handleToggleExpand = useCallback((suggestionId) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  }, []);

  // Handle suggestion implementation
  const handleImplementSuggestion = useCallback((suggestion) => {
    if (onSuggestionImplemented) {
      onSuggestionImplemented(suggestion);
    }
    console.log('Implementing suggestion:', suggestion.title);
  }, [onSuggestionImplemented]);

  // Handle suggestion dismissal
  const handleDismissSuggestion = useCallback((suggestion) => {
    if (onSuggestionDismissed) {
      onSuggestionDismissed(suggestion);
    }
    console.log('Dismissing suggestion:', suggestion.title);
  }, [onSuggestionDismissed]);

  // Handle manual suggestion generation
  const handleGenerateSuggestions = useCallback(async () => {
    if (!sessionId) {
      try {
        await startSession();
      } catch (err) {
        console.error('Failed to start session for suggestion generation:', err);
        return;
      }
    }

    try {
      await generateSuggestions({ workflowData });
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    }
  }, [sessionId, workflowData, startSession, generateSuggestions]);

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return suggestion.title.toLowerCase().includes(term) || 
           suggestion.description.toLowerCase().includes(term);
  });

  // Get summary statistics
  const summaryStats = getSummaryStats();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          AI Optimization Suggestions
          {sessionId && (
            <Chip 
              label={sessionStatus?.agentName || 'Active'} 
              size="small" 
              color="primary"
            />
          )}
        </Typography>

        <Box display="flex" gap={1}>
          <Tooltip title="Generate New Suggestions">
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleGenerateSuggestions}
                disabled={isLoading || isGenerating || !workflowData}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading indicator */}
      {(isLoading || isGenerating) && (
        <Box mb={2}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" mt={1}>
            {isGenerating ? 'AI is analyzing your workflow and generating optimization suggestions...' : 'Loading...'}
          </Typography>
        </Box>
      )}

      {/* Error display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Configuration panel */}
      {showConfiguration && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                <ConfigIcon />
                Configuration
              </Typography>
              <IconButton onClick={() => setConfigExpanded(!configExpanded)}>
                {configExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={configExpanded}>
              <Box mt={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Optimization Mode</InputLabel>
                      <Select
                        value={config.optimizationMode}
                        label="Optimization Mode"
                        onChange={(e) => updateConfig({ optimizationMode: e.target.value })}
                      >
                        <MenuItem value="comprehensive">Comprehensive</MenuItem>
                        <MenuItem value="targeted">Targeted</MenuItem>
                        <MenuItem value="quick-wins">Quick Wins</MenuItem>
                        <MenuItem value="strategic">Strategic</MenuItem>
                        <MenuItem value="reactive">Reactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={config.timeframe}
                        label="Timeframe"
                        onChange={(e) => updateConfig({ timeframe: e.target.value })}
                      >
                        <MenuItem value="7d">Last 7 days</MenuItem>
                        <MenuItem value="30d">Last 30 days</MenuItem>
                        <MenuItem value="90d">Last 90 days</MenuItem>
                        <MenuItem value="1y">Last year</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Summary statistics */}
      {suggestions.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {summaryStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Suggestions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error">
                    {summaryStats.byPriority.critical || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Priority
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {summaryStats.byEffort.immediate || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quick Wins
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {Math.round(summaryStats.averageConfidence * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {suggestions.length > 0 && (
        <Box mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
      )}

      {/* Suggestions list */}
      {filteredSuggestions.length > 0 ? (
        <Box>
          {filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              expanded={expandedSuggestions.has(suggestion.id)}
              onToggleExpand={handleToggleExpand}
              onImplement={handleImplementSuggestion}
              onDismiss={handleDismissSuggestion}
            />
          ))}
        </Box>
      ) : suggestions.length > 0 ? (
        <Alert severity="info">
          No suggestions match your search criteria.
        </Alert>
      ) : sessionId && !isLoading && !isGenerating ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Ready to Generate Optimization Suggestions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Click "Generate" to have AI analyze your workflow and provide optimization recommendations.
          </Typography>
          <Button
            variant="contained"
            startIcon={<SuggestionIcon />}
            onClick={handleGenerateSuggestions}
            disabled={!workflowData}
          >
            Generate Suggestions
          </Button>
        </Paper>
      ) : !sessionId && !isLoading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            AI Optimization Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Get AI-powered optimization suggestions for your workflow. 
            The system will analyze your current setup and provide actionable recommendations.
          </Typography>
          {!workflowData && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Workflow data is required to generate optimization suggestions.
            </Alert>
          )}
        </Paper>
      ) : null}
    </Box>
  );
};

export default AIOptimizationSuggestionsPanel;
