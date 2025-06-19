import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Container,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Button,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  Analytics,
  Speed,
  Timeline,
  Refresh,
  Settings,
  GetApp,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BottleneckDetection from './BottleneckDetection';
import FlowMetricsCharts from './FlowMetricsCharts';
import AdvancedAnalytics from './AdvancedAnalytics';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import useFlowOptimizationData from '../../hooks/useFlowOptimizationData';

/**
 * FlowOptimizationTab Component
 * 
 * Main component for the Flow Optimization Dashboard that provides:
 * - Bottleneck detection and alerts
 * - Optimization suggestions with actionable recommendations
 * - Flow metrics trends and cumulative flow diagrams
 * - Cycle time and throughput analysis
 * 
 * Matches the purple-themed design from the dashboard mockup
 */
const FlowOptimizationTab = ({ 
  onApplySuggestions,
  onScheduleReview,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Real-time flow optimization data hook (Task 6.7 implementation)
  const {
    flowData,
    isLoading,
    lastUpdated,
    error,
    connectionStatus,
    isConnected,
    isPolling,
    refreshData,
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    getCacheStats
  } = useFlowOptimizationData({
    enableAutoRefresh: true,
    enableWebSocket: true,
    enableCaching: true,
    onDataUpdate: (data) => {
      console.log('Flow data updated:', data);
    },
    onError: (error) => {
      console.error('Flow data error:', error);
    }
  });

  // Component state for UI interactions
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);

  // Fallback to sample data if no real data is available
  const optimizationData = flowData || {
    bottlenecks: [],
    suggestions: [],
    metrics: {
      cycleTime: { current: 2.34, change: -0.3, trend: 'improving' },
      throughput: { current: 15, change: 15, trend: 'improving' },
      leadTime: { current: 4.2, change: -0.8, trend: 'improving' },
      wipLimits: { development: { current: 4, limit: 3, status: 'over' } }
    },
    lastUpdated: new Date()
  };

  // Initialize with sample data matching the mockup (fallback for when no real data)
  useEffect(() => {
    if (!flowData) {
      // Only set sample data if no real data is available
      const sampleData = {
        bottlenecks: [
          {
            id: 1,
            type: 'wip_limit',
            severity: 'high',
            column: 'Development',
            message: 'Development Column is over WIP limit (4/3). This is causing delays and reducing flow efficiency.',
            impact: 'high',
            detectedAt: new Date()
          }
        ],
        suggestions: [
          {
            id: 1,
            type: 'task_management',
            priority: 'high',
            title: 'Move TASK-005 (blocked) to separate blocked column',
            description: 'Separate blocked tasks to improve visibility and flow',
            impact: 'medium',
            effort: 'low',
            category: 'process'
          },
          {
            id: 2,
            type: 'resource',
            priority: 'medium',
            title: 'Consider adding another developer to reduce WIP limit pressure',
            description: 'Additional developer capacity could help clear the bottleneck',
            impact: 'high',
            effort: 'high',
            category: 'resource'
          },
          {
            id: 3,
            type: 'process',
            priority: 'medium',
            title: 'Break down large tasks (8 SP) into smaller chunks',
            description: 'Smaller tasks flow through the system more predictably',
            impact: 'medium',
            effort: 'medium',
            category: 'task_management'
          },
          {
            id: 4,
            type: 'process',
            priority: 'low',
            title: 'Review code review process - Items waiting too long',
            description: 'Optimize code review workflow to reduce wait times',
            impact: 'medium',
            effort: 'medium',
            category: 'process'
          },
          {
            id: 5,
            type: 'process',
            priority: 'low',
            title: 'Implement daily WIP limit check-ins',
            description: 'Regular monitoring to prevent bottlenecks before they occur',
            impact: 'low',
            effort: 'low',
            category: 'process'
          }
        ]
      };
      // This would normally be handled by the real-time data hook
      console.log('Using sample data for Flow Optimization');
    }
  }, [flowData]);

  // Handle suggestion selection
  const handleSuggestionToggle = useCallback((suggestionId) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  }, []);

  // Handle apply suggestions with optimistic updates
  const handleApplySuggestions = useCallback(async () => {
    if (selectedSuggestions.length === 0) return;

    try {
      // Apply optimistic update immediately
      const updateId = `apply-suggestions-${Date.now()}`;
      const optimisticUpdate = {
        suggestions: optimizationData.suggestions.filter(
          s => !selectedSuggestions.includes(s.id)
        )
      };
      
      applyOptimisticUpdate(updateId, optimisticUpdate);

      // Call the actual API/callback
      if (onApplySuggestions) {
        await onApplySuggestions(selectedSuggestions);
      }

      // Remove optimistic update on success
      removeOptimisticUpdate(updateId);
      
      // Reset selection after applying
      setSelectedSuggestions([]);
    } catch (error) {
      // Remove optimistic update on failure
      const updateId = `apply-suggestions-${Date.now()}`;
      removeOptimisticUpdate(updateId);
      console.error('Failed to apply suggestions:', error);
    }
  }, [selectedSuggestions, optimizationData.suggestions, onApplySuggestions, applyOptimisticUpdate, removeOptimisticUpdate]);

  // Handle schedule review
  const handleScheduleReview = useCallback(() => {
    if (onScheduleReview) {
      onScheduleReview();
    }
  }, [onScheduleReview]);

  // Get priority color for suggestions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // Get category icon for suggestions
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'process': return <Settings fontSize="small" />;
      case 'resource': return <Analytics fontSize="small" />;
      case 'task_management': return <Timeline fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  return (
    <Container maxWidth="xl" className={className}>
      <Box sx={{ py: 3 }}>
        {/* Header Section */}
        <Box sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          p: 3,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
              📊 Flow Optimization Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={refreshData} 
                  disabled={isLoading}
                  sx={{ color: 'white' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Report">
                <IconButton sx={{ color: 'white' }}>
                  <GetApp />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Collaborative Planning • Pull-Based Flow • Continuous Optimization
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
            Last updated: {(lastUpdated || optimizationData.lastUpdated).toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Real-time Connection Status Indicator */}
        <Box sx={{ mt: 2 }}>
          <ConnectionStatusIndicator
            connectionStatus={connectionStatus}
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefresh={refreshData}
            error={error}
            cacheStats={getCacheStats()}
          />
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Bottleneck Detection & Suggestions */}
          <Grid item xs={12} lg={8}>
            {/* Bottleneck Detection Section */}
            <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <BottleneckDetection 
                  flowData={optimizationData}
                  onBottleneckAction={(bottleneck, action) => {
                    console.log('Bottleneck action:', bottleneck, action);
                    // Handle bottleneck-specific actions here
                  }}
                  showDetails={true}
                />
              </Box>
            </Paper>

            {/* Optimization Suggestions Section */}
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    💡 Optimization Suggestions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={handleApplySuggestions}
                      disabled={selectedSuggestions.length === 0}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                        }
                      }}
                    >
                      ✨ Apply Suggestions
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Schedule />}
                      onClick={handleScheduleReview}
                      sx={{ 
                        borderColor: '#764ba2',
                        color: '#764ba2',
                        '&:hover': {
                          borderColor: '#6a4190',
                          backgroundColor: 'rgba(118, 75, 162, 0.04)'
                        }
                      }}
                    >
                      📅 Schedule Review
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {optimizationData.suggestions.map((suggestion) => (
                    <Grid item xs={12} key={suggestion.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: selectedSuggestions.includes(suggestion.id) ? '2px solid #764ba2' : '1px solid #e0e0e0',
                          bgcolor: selectedSuggestions.includes(suggestion.id) ? 'rgba(118, 75, 162, 0.04)' : 'white',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => handleSuggestionToggle(suggestion.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ color: '#764ba2', mt: 0.5 }}>
                              {getCategoryIcon(suggestion.category)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {suggestion.title}
                                </Typography>
                                <Chip 
                                  label={suggestion.priority} 
                                  size="small" 
                                  color={getPriorityColor(suggestion.priority)}
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {suggestion.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip 
                                  label={`Impact: ${suggestion.impact}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                                <Chip 
                                  label={`Effort: ${suggestion.effort}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                                <Chip 
                                  label={suggestion.category} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Flow Metrics */}
          <Grid item xs={12} lg={4}>
            <FlowMetricsCharts 
              flowData={optimizationData}
              onDateRangeChange={(range) => {
                console.log('Date range changed:', range);
                // Handle date range change for metrics
              }}
              onMetricFilterChange={(metrics) => {
                console.log('Metric filters changed:', metrics);
                // Handle metric filter changes
              }}
            />
          </Grid>
        </Grid>

        {/* Advanced Analytics Section */}
        <Box sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                📈 Advanced Analytics & Reporting
              </Typography>
              <AdvancedAnalytics 
                flowData={optimizationData}
                onExportReport={(format, analyticType, options) => {
                  console.log('Export report:', { format, analyticType, options });
                  // Handle report export functionality
                  return Promise.resolve();
                }}
                onWidgetCustomization={() => {
                  console.log('Widget customization requested');
                  // Handle widget customization
                }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Loading Overlay */}
        {isLoading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress sx={{ 
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
              }
            }} />
          </Box>
        )}
      </Box>
    </Container>
  );
};

FlowOptimizationTab.propTypes = {
  onApplySuggestions: PropTypes.func,
  onScheduleReview: PropTypes.func,
  className: PropTypes.string
};

export default FlowOptimizationTab; 