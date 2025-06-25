/**
 * AIBottleneckAnalysisPanel Component
 * UI component for AI-driven bottleneck detection and analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Settings,
  ExpandMore,
  ExpandLess,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Info as InfoIcon,
  TrendingUp,
  Speed,
  Block,
  Assignment,
  Timeline,
  Lightbulb,
  AutoFixHigh,
  History,
  Analytics
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import useBottleneckAnalysis from '../../hooks/useBottleneckAnalysis.js';

/**
 * AIBottleneckAnalysisPanel Component
 */
const AIBottleneckAnalysisPanel = ({
  workflowData,
  onBottleneckAction,
  onSuggestionApply,
  className,
  autoAnalysis = false,
  configVisible = true
}) => {
  const theme = useTheme();

  // Local state
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfiguration, setShowConfiguration] = useState(configVisible);
  const [selectedBottlenecks, setSelectedBottlenecks] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  // AI bottleneck analysis hook
  const {
    isInitialized,
    isInitializing,
    currentSession,
    isAnalyzing,
    isGeneratingSuggestions,
    analysisResults,
    bottlenecks,
    suggestions,
    analysisHistory,
    error,
    lastAnalysisTime,
    analysisMode,
    timeframe,
    focusAreas,
    severityThreshold,
    initializeService,
    startSession,
    analyzeBottlenecks,
    generateOptimizationSuggestions,
    analyzeHistoricalPatterns,
    predictFutureBottlenecks,
    endSession,
    clearError,
    reset,
    updateConfig,
    getSessionStatus,
    filterBottlenecks,
    filterSuggestions,
    getAnalysisSummary,
    BOTTLENECK_TYPES,
    ANALYSIS_MODES,
    SEVERITY_LEVELS
  } = useBottleneckAnalysis({
    autoInitialize: true,
    enableAutoAnalysis: autoAnalysis,
    onBottleneckDetected: (detectedBottlenecks) => {
      console.log('Bottlenecks detected:', detectedBottlenecks);
    },
    onSuggestionGenerated: (newSuggestions) => {
      console.log('Suggestions generated:', newSuggestions);
    },
    onAnalysisComplete: (results) => {
      console.log('Analysis complete:', results);
    },
    onError: (err) => {
      console.error('Bottleneck analysis error:', err);
    }
  });

  // Handle starting analysis
  const handleStartAnalysis = useCallback(async () => {
    try {
      let session = currentSession;
      if (!session) {
        // Make sure we have a session before proceeding
        session = await startSession(workflowData);
        // Brief delay to ensure session is properly registered
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Verify session is active before proceeding
      if (!session) {
        throw new Error('Failed to establish analysis session');
      }
      
      await analyzeBottlenecks(workflowData);
    } catch (err) {
      console.error('Failed to start analysis:', err);
    }
  }, [currentSession, startSession, analyzeBottlenecks, workflowData]);

  // Handle generating additional suggestions
  const handleGenerateSuggestions = useCallback(async () => {
    try {
      await generateOptimizationSuggestions(selectedBottlenecks);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    }
  }, [generateOptimizationSuggestions, selectedBottlenecks]);

  // Handle configuration changes
  const handleConfigChange = useCallback((field, value) => {
    updateConfig({ [field]: value });
  }, [updateConfig]);

  // Handle bottleneck selection
  const handleBottleneckSelect = useCallback((bottleneckId) => {
    setSelectedBottlenecks(prev => 
      prev.includes(bottleneckId)
        ? prev.filter(id => id !== bottleneckId)
        : [...prev, bottleneckId]
    );
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestionId) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  }, []);

  // Handle applying suggestions
  const handleApplySuggestions = useCallback(() => {
    const suggestionsToApply = suggestions.filter(s => 
      selectedSuggestions.includes(s.id)
    );
    
    if (onSuggestionApply) {
      onSuggestionApply(suggestionsToApply);
    }
    
    setSelectedSuggestions([]);
  }, [suggestions, selectedSuggestions, onSuggestionApply]);

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL: return theme.palette.error.main;
      case SEVERITY_LEVELS.HIGH: return theme.palette.error.light;
      case SEVERITY_LEVELS.MEDIUM: return theme.palette.warning.main;
      case SEVERITY_LEVELS.LOW: return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL: return <ErrorIcon color="error" />;
      case SEVERITY_LEVELS.HIGH: return <Warning color="error" />;
      case SEVERITY_LEVELS.MEDIUM: return <Warning color="warning" />;
      case SEVERITY_LEVELS.LOW: return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  // Get bottleneck type icon
  const getBottleneckTypeIcon = (type) => {
    switch (type) {
      case BOTTLENECK_TYPES.WIP_LIMIT: return <Speed />;
      case BOTTLENECK_TYPES.BLOCKED_TASKS: return <Block />;
      case BOTTLENECK_TYPES.RESOURCE_CONSTRAINT: return <Assignment />;
      case BOTTLENECK_TYPES.PROCESS_INEFFICIENCY: return <Timeline />;
      default: return <Warning />;
    }
  };

  // Auto-start analysis when workflow data changes
  useEffect(() => {
    if (workflowData && isInitialized && !currentSession && autoAnalysis) {
      handleStartAnalysis();
    }
  }, [workflowData, isInitialized, currentSession, autoAnalysis, handleStartAnalysis]);

  const analysisSummary = getAnalysisSummary();

  return (
    <Paper 
      className={className}
      sx={{ 
        p: 2, 
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main, 
              mr: 2,
              width: 32,
              height: 32
            }}
          >
            🤖
          </Avatar>
          <Typography variant="h6" component="h3">
            AI Bottleneck Analysis
          </Typography>
          {currentSession && (
            <Chip 
              label="Active Session" 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {showConfiguration && (
            <Tooltip title="Configuration">
              <IconButton 
                onClick={() => setShowConfiguration(!showConfiguration)}
                color={showConfiguration ? "primary" : "default"}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
            <IconButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          <AlertTitle>Analysis Error</AlertTitle>
          {error.message}
        </Alert>
      )}

      {/* Configuration Panel */}
      <Collapse in={showConfiguration}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Analysis Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Analysis Mode</InputLabel>
                  <Select
                    value={analysisMode}
                    label="Analysis Mode"
                    onChange={(e) => handleConfigChange('analysisMode', e.target.value)}
                  >
                    {Object.values(ANALYSIS_MODES).map(mode => (
                      <MenuItem key={mode} value={mode}>
                        {mode.replace('-', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    value={timeframe}
                    label="Timeframe"
                    onChange={(e) => handleConfigChange('timeframe', e.target.value)}
                  >
                    <MenuItem value="1d">1 Day</MenuItem>
                    <MenuItem value="7d">7 Days</MenuItem>
                    <MenuItem value="30d">30 Days</MenuItem>
                    <MenuItem value="90d">90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity Threshold</InputLabel>
                  <Select
                    value={severityThreshold}
                    label="Severity Threshold"
                    onChange={(e) => handleConfigChange('severityThreshold', e.target.value)}
                  >
                    {Object.values(SEVERITY_LEVELS).map(level => (
                      <MenuItem key={level} value={level}>
                        {level.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoAnalysis}
                      disabled // This would be controlled by parent component
                    />
                  }
                  label="Auto Analysis"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      <Collapse in={isExpanded}>
        {/* Analysis Controls */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={isAnalyzing ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || isInitializing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<AutoFixHigh />}
            onClick={handleGenerateSuggestions}
            disabled={isGeneratingSuggestions || selectedBottlenecks.length === 0}
          >
            Generate Suggestions
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={reset}
            disabled={isAnalyzing}
          >
            Reset
          </Button>
          
          {currentSession && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              onClick={endSession}
            >
              End Session
            </Button>
          )}
        </Box>

        {/* Analysis Progress */}
        {(isAnalyzing || isGeneratingSuggestions) && (
          <Box mb={2}>
            <LinearProgress />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              {isAnalyzing ? 'Analyzing workflow for bottlenecks...' : 'Generating optimization suggestions...'}
            </Typography>
          </Box>
        )}

        {/* Analysis Summary */}
        {analysisSummary && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Analysis Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error">
                      {analysisSummary.criticalBottlenecks}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Critical
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {analysisSummary.highPriorityBottlenecks}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      High Priority
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {analysisSummary.totalBottlenecks}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Bottlenecks
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {analysisSummary.implementableSuggestions}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Actionable Suggestions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Bottlenecks List */}
        {bottlenecks.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Detected Bottlenecks ({bottlenecks.length})
              </Typography>
              
              <List dense>
                {bottlenecks.map((bottleneck, index) => (
                  <React.Fragment key={bottleneck.id}>
                    <ListItem
                      button
                      onClick={() => handleBottleneckSelect(bottleneck.id)}
                      selected={selectedBottlenecks.includes(bottleneck.id)}
                    >
                      <ListItemIcon>
                        <Badge
                          badgeContent=""
                          color="error"
                          variant="dot"
                          invisible={bottleneck.severity !== SEVERITY_LEVELS.CRITICAL}
                        >
                          {getBottleneckTypeIcon(bottleneck.type)}
                        </Badge>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {bottleneck.title}
                            </Typography>
                            <Chip
                              label={bottleneck.severity}
                              size="small"
                              sx={{
                                bgcolor: getSeverityColor(bottleneck.severity),
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {bottleneck.description}
                            </Typography>
                            {bottleneck.location && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Location: {bottleneck.location}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        {getSeverityIcon(bottleneck.severity)}
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {index < bottlenecks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Optimization Suggestions ({suggestions.length})
              </Typography>
              
              <List dense>
                {suggestions.map((suggestion, index) => (
                  <React.Fragment key={suggestion.id}>
                    <ListItem
                      button
                      onClick={() => handleSuggestionSelect(suggestion.id)}
                      selected={selectedSuggestions.includes(suggestion.id)}
                    >
                      <ListItemIcon>
                        <Lightbulb color={suggestion.implementable ? "primary" : "disabled"} />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {suggestion.title}
                            </Typography>
                            <Chip
                              label={suggestion.priority}
                              size="small"
                              color={suggestion.priority === 'high' ? 'error' : 
                                     suggestion.priority === 'medium' ? 'warning' : 'default'}
                            />
                            {suggestion.implementable && (
                              <Chip
                                label="Actionable"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {suggestion.description}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              Impact: {suggestion.impact} • Effort: {suggestion.effort}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    
                    {index < suggestions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            
            {selectedSuggestions.length > 0 && (
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={handleApplySuggestions}
                  disabled={selectedSuggestions.length === 0}
                >
                  Apply Selected ({selectedSuggestions.length})
                </Button>
              </CardActions>
            )}
          </Card>
        )}

        {/* No Results */}
        {analysisResults && bottlenecks.length === 0 && (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Bottlenecks Detected
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your workflow appears to be running smoothly! The AI analysis found no significant bottlenecks.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Initialization */}
        {!isInitialized && (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              {isInitializing ? (
                <>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    Initializing AI bottleneck analysis service...
                  </Typography>
                </>
              ) : (
                <>
                  <Analytics sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                  <Typography variant="h6" gutterBottom>
                    AI Bottleneck Analysis Ready
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Click "Start Analysis" to begin AI-powered bottleneck detection
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={initializeService}
                  >
                    Initialize Service
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Collapse>
    </Paper>
  );
};

AIBottleneckAnalysisPanel.propTypes = {
  workflowData: PropTypes.object,
  onBottleneckAction: PropTypes.func,
  onSuggestionApply: PropTypes.func,
  className: PropTypes.string,
  autoAnalysis: PropTypes.bool,
  configVisible: PropTypes.bool
};

export default AIBottleneckAnalysisPanel;