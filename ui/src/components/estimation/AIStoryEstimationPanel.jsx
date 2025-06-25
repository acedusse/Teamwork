/**
 * AIStoryEstimationPanel.jsx
 * UI component for AI-powered story point estimation
 * Integrates with useStoryEstimation hook and provides comprehensive estimation interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import useStoryEstimation from '../../hooks/useStoryEstimation';
import { ESTIMATION_SCALES } from '../../services/StoryEstimationAIService';

// Styled components
const EstimationCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const EstimationChip = styled(Chip)(({ theme, confidence }) => ({
  fontWeight: 'bold',
  backgroundColor: confidence >= 80 ? theme.palette.success.light :
                   confidence >= 60 ? theme.palette.warning.light :
                   theme.palette.error.light,
  color: confidence >= 80 ? theme.palette.success.contrastText :
         confidence >= 60 ? theme.palette.warning.contrastText :
         theme.palette.error.contrastText
}));

const ConfidenceBar = styled(LinearProgress)(({ theme, confidence }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    backgroundColor: confidence >= 80 ? theme.palette.success.main :
                     confidence >= 60 ? theme.palette.warning.main :
                     theme.palette.error.main
  }
}));

/**
 * AI Story Estimation Panel Component
 */
const AIStoryEstimationPanel = ({
  story = null,
  stories = [],
  teamHistory = [],
  onEstimationComplete = null,
  onBatchEstimationComplete = null,
  onConfigurationChange = null,
  initialConfiguration = {},
  showAdvancedOptions = true,
  showHistory = true,
  showAnalytics = true,
  maxHeight = 600
}) => {
  // Hook for story estimation
  const {
    isInitialized,
    isLoading,
    isEstimating,
    isBatchEstimating,
    isLoadingSuggestions,
    isRefining,
    isAnalyzing,
    error,
    currentEstimation,
    batchEstimations,
    suggestions,
    refinedEstimation,
    analysisResults,
    estimationHistory,
    estimationScale,
    teamContext,
    historicalContext,
    initialize,
    estimateStoryPoints,
    estimateMultipleStories,
    getEstimationSuggestions,
    refineEstimation,
    analyzeEstimationPatterns,
    cancelEstimation,
    clearResults,
    clearHistory,
    updateTeamContext,
    updateHistoricalContext,
    changeEstimationScale,
    getEstimationMetrics,
    exportEstimationData,
    availableScales,
    hasResults,
    hasHistory
  } = useStoryEstimation({
    defaultScale: initialConfiguration.scale || ESTIMATION_SCALES.FIBONACCI,
    autoInitialize: true,
    enableHistory: showHistory,
    maxHistorySize: 50
  });

  // Local state
  const [selectedStory, setSelectedStory] = useState(story);
  const [selectedStories, setSelectedStories] = useState(stories);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [actualEffort, setActualEffort] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [parallelProcessing, setParallelProcessing] = useState(true);

  // Update story/stories when props change
  useEffect(() => {
    setSelectedStory(story);
  }, [story]);

  useEffect(() => {
    setSelectedStories(stories);
  }, [stories]);

  // Auto-load suggestions when story changes
  useEffect(() => {
    if (autoSuggestions && selectedStory && teamHistory.length > 0 && isInitialized) {
      handleGetSuggestions();
    }
  }, [selectedStory, teamHistory, autoSuggestions, isInitialized]);

  // Handle single story estimation
  const handleEstimateStory = useCallback(async () => {
    if (!selectedStory) return;

    try {
      const estimation = await estimateStoryPoints(selectedStory, {
        includeBreakdown,
        teamContext,
        historicalContext
      });

      if (onEstimationComplete) {
        onEstimationComplete(estimation);
      }
    } catch (error) {
      console.error('Estimation failed:', error);
    }
  }, [selectedStory, estimateStoryPoints, includeBreakdown, teamContext, historicalContext, onEstimationComplete]);

  // Handle batch estimation
  const handleBatchEstimate = useCallback(async () => {
    if (!selectedStories.length) return;

    try {
      const result = await estimateMultipleStories(selectedStories, {
        parallel: parallelProcessing,
        maxConcurrency: 3,
        includeComparison: true,
        includeBreakdown,
        teamContext,
        historicalContext
      });

      if (onBatchEstimationComplete) {
        onBatchEstimationComplete(result);
      }
    } catch (error) {
      console.error('Batch estimation failed:', error);
    }
  }, [selectedStories, estimateMultipleStories, parallelProcessing, includeBreakdown, teamContext, historicalContext, onBatchEstimationComplete]);

  // Handle getting suggestions
  const handleGetSuggestions = useCallback(async () => {
    if (!selectedStory) return;

    try {
      await getEstimationSuggestions(selectedStory, teamHistory);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }, [selectedStory, getEstimationSuggestions, teamHistory]);

  // Handle estimation refinement
  const handleRefineEstimation = useCallback(async () => {
    if (!currentEstimation || !refinementFeedback.trim()) return;

    try {
      const feedback = {
        comments: refinementFeedback,
        timestamp: new Date().toISOString()
      };

      const effort = actualEffort ? parseFloat(actualEffort) : null;

      await refineEstimation(currentEstimation, feedback, effort);
      setShowRefinement(false);
      setRefinementFeedback('');
      setActualEffort('');
    } catch (error) {
      console.error('Refinement failed:', error);
    }
  }, [currentEstimation, refinementFeedback, actualEffort, refineEstimation]);

  // Handle pattern analysis
  const handleAnalyzePatterns = useCallback(async () => {
    if (!estimationHistory.length) return;

    try {
      await analyzeEstimationPatterns(estimationHistory);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [estimationHistory, analyzeEstimationPatterns]);

  // Handle configuration changes
  const handleConfigurationChange = useCallback((config) => {
    if (config.scale) {
      changeEstimationScale(config.scale);
    }
    if (config.teamContext !== undefined) {
      updateTeamContext(config.teamContext);
    }
    if (config.historicalContext !== undefined) {
      updateHistoricalContext(config.historicalContext);
    }

    if (onConfigurationChange) {
      onConfigurationChange(config);
    }
  }, [changeEstimationScale, updateTeamContext, updateHistoricalContext, onConfigurationChange]);

  // Export estimation data
  const handleExportData = useCallback(() => {
    const data = exportEstimationData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `story-estimations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportEstimationData]);

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  // Render estimation result
  const renderEstimationResult = (estimation) => (
    <EstimationCard key={estimation.storyId}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">{estimation.storyId}</Typography>
            <EstimationChip
              label={`${estimation.estimatedPoints} SP`}
              confidence={estimation.confidence}
              size="small"
            />
            <Chip
              label={`${estimation.confidence}% confident`}
              color={getConfidenceColor(estimation.confidence)}
              size="small"
              variant="outlined"
            />
          </Box>
        }
        action={
          <Tooltip title="Agent">
            <Chip
              icon={<PsychologyIcon />}
              label={estimation.agentName}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        }
      />
      <CardContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {estimation.reasoning}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Confidence Level
          </Typography>
          <ConfidenceBar
            variant="determinate"
            value={estimation.confidence}
            confidence={estimation.confidence}
          />
        </Box>

        {estimation.breakdown && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Complexity Breakdown</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {Object.entries(estimation.breakdown).map(([factor, value]) => (
                  <Grid item xs={6} key={factor}>
                    <Typography variant="body2" color="textSecondary">
                      {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={value * 10}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption">{value}/10</Typography>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {estimation.factors && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Risk Level: {estimation.factors.riskLevel}
            </Typography>
            {estimation.factors.assumptions && (
              <List dense>
                {estimation.factors.assumptions.map((assumption, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={assumption}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </CardContent>
    </EstimationCard>
  );

  // Render suggestions
  const renderSuggestions = () => (
    <Dialog
      open={showSuggestions}
      onClose={() => setShowSuggestions(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LightbulbIcon />
          Estimation Suggestions
        </Box>
      </DialogTitle>
      <DialogContent>
        {suggestions && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Confidence: {suggestions.confidence}%
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {suggestions.reasoning}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Suggested Estimations
            </Typography>
            {suggestions.suggestions.map((suggestion, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={`${suggestion.points} SP`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`${suggestion.confidence}%`}
                    color={getConfidenceColor(suggestion.confidence)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {suggestion.reasoning}
                </Typography>
              </Paper>
            ))}

            {suggestions.similarStories.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Similar Stories
                </Typography>
                {suggestions.similarStories.map((story, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={story.title}
                      secondary={`${story.points} points - ${(story.similarity * 100).toFixed(1)}% similar`}
                    />
                  </ListItem>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSuggestions(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // Render configuration dialog
  const renderConfiguration = () => (
    <Dialog
      open={showConfiguration}
      onClose={() => setShowConfiguration(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          Estimation Configuration
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Estimation Scale</InputLabel>
            <Select
              value={estimationScale}
              onChange={(e) => handleConfigurationChange({ scale: e.target.value })}
            >
              {Object.entries(availableScales).map(([name, scale]) => (
                <MenuItem key={name} value={scale}>
                  {name} ({Array.isArray(scale) ? scale.join(', ') : scale})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={includeBreakdown}
                onChange={(e) => setIncludeBreakdown(e.target.checked)}
              />
            }
            label="Include complexity breakdown"
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoSuggestions}
                onChange={(e) => setAutoSuggestions(e.target.checked)}
              />
            }
            label="Auto-load suggestions"
          />

          <FormControlLabel
            control={
              <Switch
                checked={parallelProcessing}
                onChange={(e) => setParallelProcessing(e.target.checked)}
              />
            }
            label="Parallel batch processing"
          />

          <TextField
            label="Team Context"
            multiline
            rows={3}
            value={teamContext || ''}
            onChange={(e) => handleConfigurationChange({ teamContext: e.target.value })}
            placeholder="Describe your team's context, skills, and constraints..."
          />

          <TextField
            label="Historical Context"
            multiline
            rows={3}
            value={historicalContext || ''}
            onChange={(e) => handleConfigurationChange({ historicalContext: e.target.value })}
            placeholder="Provide historical project context and lessons learned..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowConfiguration(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" display="flex" alignItems="center" gap={1}>
          <PsychologyIcon color="primary" />
          AI Story Estimation
        </Typography>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Configuration">
            <IconButton onClick={() => setShowConfiguration(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          {hasHistory && (
            <Tooltip title="Analyze Patterns">
              <IconButton onClick={handleAnalyzePatterns} disabled={isAnalyzing}>
                <Badge badgeContent={estimationHistory.length} color="primary">
                  <AnalyticsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
          
          {hasResults && (
            <Tooltip title="Export Data">
              <IconButton onClick={handleExportData}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {isLoading && (
            <Tooltip title="Cancel">
              <IconButton onClick={cancelEstimation} color="error">
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearResults}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <CircularProgress size={20} />
          <Typography variant="body2">
            {isEstimating && 'Estimating story points...'}
            {isBatchEstimating && 'Processing batch estimation...'}
            {isLoadingSuggestions && 'Loading suggestions...'}
            {isRefining && 'Refining estimation...'}
            {isAnalyzing && 'Analyzing patterns...'}
          </Typography>
        </Box>
      )}

      {/* Mode Toggle */}
      <Box mb={3}>
        <FormControlLabel
          control={
            <Switch
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
            />
          }
          label="Batch Mode"
        />
      </Box>

      {/* Single Story Mode */}
      {!batchMode && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Single Story Estimation
          </Typography>
          
          {selectedStory ? (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedStory.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedStory.description}
              </Typography>
            </Paper>
          ) : (
            <Alert severity="info">
              No story selected for estimation
            </Alert>
          )}

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={handleEstimateStory}
              disabled={!selectedStory || isLoading}
              startIcon={<PsychologyIcon />}
            >
              Estimate Story Points
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleGetSuggestions}
              disabled={!selectedStory || isLoadingSuggestions}
              startIcon={<LightbulbIcon />}
            >
              Get Suggestions
            </Button>
          </Box>
        </Box>
      )}

      {/* Batch Mode */}
      {batchMode && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Batch Story Estimation
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {selectedStories.length} stories selected for batch estimation
          </Typography>

          <Button
            variant="contained"
            onClick={handleBatchEstimate}
            disabled={!selectedStories.length || isLoading}
            startIcon={<TrendingUpIcon />}
          >
            Estimate All Stories
          </Button>
        </Box>
      )}

      {/* Current Estimation Result */}
      {currentEstimation && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Current Estimation
          </Typography>
          {renderEstimationResult(currentEstimation)}
          
          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="outlined"
              onClick={() => setShowRefinement(true)}
              startIcon={<RefreshIcon />}
            >
              Refine Estimation
            </Button>
          </Box>
        </Box>
      )}

      {/* Batch Estimation Results */}
      {batchEstimations && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Batch Estimation Results
          </Typography>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="h4" color="primary">
                  {batchEstimations.summary.totalStories}
                </Typography>
                <Typography variant="body2">Stories</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4" color="primary">
                  {batchEstimations.summary.totalPoints}
                </Typography>
                <Typography variant="body2">Total Points</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4" color="primary">
                  {batchEstimations.summary.averagePoints.toFixed(1)}
                </Typography>
                <Typography variant="body2">Avg Points</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4" color="primary">
                  {batchEstimations.summary.averageConfidence.toFixed(1)}%
                </Typography>
                <Typography variant="body2">Avg Confidence</Typography>
              </Grid>
            </Grid>
          </Paper>

          {batchEstimations.estimations.map(renderEstimationResult)}
        </Box>
      )}

      {/* Estimation History */}
      {showHistory && hasHistory && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <HistoryIcon />
              Estimation History ({estimationHistory.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box maxHeight={300} overflow="auto">
              {estimationHistory.slice(0, 10).map((estimation, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">
                      {estimation.storyTitle || estimation.storyId}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${estimation.estimatedPoints} SP`}
                        size="small"
                        color="primary"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(estimation.timestamp).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
              
              {estimationHistory.length > 10 && (
                <Typography variant="body2" color="textSecondary" align="center">
                  ... and {estimationHistory.length - 10} more
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Dialogs */}
      {renderSuggestions()}
      {renderConfiguration()}

      {/* Refinement Dialog */}
      <Dialog
        open={showRefinement}
        onClose={() => setShowRefinement(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refine Estimation</DialogTitle>
        <DialogContent>
          <TextField
            label="Team Feedback"
            multiline
            rows={4}
            fullWidth
            value={refinementFeedback}
            onChange={(e) => setRefinementFeedback(e.target.value)}
            placeholder="Provide feedback on the estimation..."
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Actual Effort (optional)"
            type="number"
            fullWidth
            value={actualEffort}
            onChange={(e) => setActualEffort(e.target.value)}
            placeholder="Enter actual story points if completed"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRefinement(false)}>Cancel</Button>
          <Button
            onClick={handleRefineEstimation}
            variant="contained"
            disabled={!refinementFeedback.trim() || isRefining}
          >
            Refine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Results Dialog */}
      <Dialog
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon />
            Estimation Pattern Analysis
          </Box>
        </DialogTitle>
        <DialogContent>
          {analysisResults && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Accuracy: {analysisResults.accuracy.toFixed(1)}%
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Patterns Identified
              </Typography>
              <List>
                {analysisResults.patterns.map((pattern, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Insights
              </Typography>
              <List>
                {analysisResults.insights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Recommendations
              </Typography>
              <List>
                {analysisResults.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysis(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIStoryEstimationPanel;
