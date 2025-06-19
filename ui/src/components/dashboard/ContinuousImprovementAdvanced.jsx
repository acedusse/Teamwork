import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  AlertTitle,
  Chip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  Schedule,
  CalendarToday,
  Analytics,
  Score,
  CheckCircleOutline,
  Warning,
  Error as ErrorIcon,
  GetApp,
  Notifications,
  AccessTime,
  Group,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PropTypes from 'prop-types';

/**
 * Advanced Retrospective Scheduling Component
 * Provides calendar integration, automated reminders, and recurrence options
 */
export const RetrospectiveScheduler = ({ open, onClose, onSchedule }) => {
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(24); // hours before
  const [recurrence, setRecurrence] = useState('none');
  const [calendarIntegration, setCalendarIntegration] = useState(true);
  const [notificationMethod, setNotificationMethod] = useState('email');

  const handleSchedule = () => {
    const scheduleData = {
      title: title.trim(),
      date: scheduledDate,
      participants,
      reminder: reminderEnabled ? reminderTime : null,
      recurrence,
      calendarIntegration,
      notificationMethod,
      createdAt: new Date(),
      status: 'scheduled'
    };
    
    onSchedule(scheduleData);
    
    // Reset form
    setTitle('');
    setScheduledDate(new Date());
    setParticipants([]);
    setReminderEnabled(true);
    setReminderTime(24);
    setRecurrence('none');
    
    onClose();
  };

  const isFormValid = title.trim().length > 0 && scheduledDate > new Date();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="schedule-retrospective-title"
      PaperProps={{
        role: 'dialog',
        'aria-modal': true
      }}
    >
      <DialogTitle id="schedule-retrospective-title">
        <Box display="flex" alignItems="center" gap={1}>
          <Schedule />
          Schedule Retrospective
        </Box>
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Retrospective Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              error={title.length > 0 && title.trim().length === 0}
              helperText={title.length > 0 && title.trim().length === 0 ? 'Title cannot be empty' : ''}
              inputProps={{ 
                'aria-describedby': 'title-helper-text',
                maxLength: 100
              }}
            />
            
            <DateTimePicker
              label="Scheduled Date & Time"
              value={scheduledDate}
              onChange={setScheduledDate}
              minDateTime={new Date()}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  required 
                  helperText="Select a future date and time"
                />
              )}
              slotProps={{
                textField: {
                  'aria-describedby': 'datetime-helper-text'
                }
              }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Participants (Optional)
              </Typography>
              <TextField
                label="Add participant emails (comma separated)"
                value={participants.join(', ')}
                onChange={(e) => setParticipants(
                  e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                )}
                fullWidth
                multiline
                rows={2}
                helperText="Enter email addresses separated by commas"
                inputProps={{ 'aria-describedby': 'participants-helper-text' }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  aria-describedby="reminder-helper-text"
                />
              }
              label="Enable Reminder Notifications"
            />

            {reminderEnabled && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Reminder Time</InputLabel>
                    <Select
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      label="Reminder Time"
                    >
                      <MenuItem value={1}>1 hour before</MenuItem>
                      <MenuItem value={4}>4 hours before</MenuItem>
                      <MenuItem value={24}>24 hours before</MenuItem>
                      <MenuItem value={48}>48 hours before</MenuItem>
                      <MenuItem value={168}>1 week before</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Notification Method</InputLabel>
                    <Select
                      value={notificationMethod}
                      onChange={(e) => setNotificationMethod(e.target.value)}
                      label="Notification Method"
                    >
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="slack">Slack</MenuItem>
                      <MenuItem value="teams">Microsoft Teams</MenuItem>
                      <MenuItem value="in-app">In-App Notification</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            <FormControl fullWidth>
              <InputLabel>Recurrence</InputLabel>
              <Select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                label="Recurrence"
              >
                <MenuItem value="none">No Recurrence</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly (every 2 weeks)</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={calendarIntegration}
                  onChange={(e) => setCalendarIntegration(e.target.checked)}
                />
              }
              label="Add to Calendar (Google Calendar, Outlook)"
            />

            {recurrence !== 'none' && (
              <Alert severity="info" icon={<CalendarToday />}>
                <AlertTitle>Recurring Retrospective</AlertTitle>
                This will create a recurring retrospective series. You can modify or cancel 
                individual instances later.
              </Alert>
            )}
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSchedule} 
          variant="contained" 
          disabled={!isFormValid}
          startIcon={<Schedule />}
        >
          Schedule Retrospective
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RetrospectiveScheduler.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSchedule: PropTypes.func.isRequired
};

/**
 * Team Improvement Analytics Component
 * Provides comprehensive analytics and scoring for team improvement
 */
export const ImprovementAnalytics = ({ retrospectives, actionItems, onClose }) => {
  const analytics = useMemo(() => {
    // Calculate improvement scores and metrics
    const totalRetros = retrospectives.length;
    const completedRetros = retrospectives.filter(r => r.status === 'completed').length;
    const scheduledRetros = retrospectives.filter(r => r.status === 'scheduled').length;
    
    const totalActions = actionItems.length;
    const completedActions = actionItems.filter(item => item.status === 'done').length;
    const inProgressActions = actionItems.filter(item => item.status === 'in-progress').length;
    const overdueActions = actionItems.filter(item => {
      return item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'done';
    }).length;
    
    // Calculate rates
    const actionCompletionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    const retroCompletionRate = totalRetros > 0 ? (completedRetros / totalRetros) * 100 : 0;
    
    // Calculate average participation
    const avgParticipation = completedRetros > 0 
      ? retrospectives
          .filter(r => r.status === 'completed')
          .reduce((sum, retro) => sum + (retro.participants || 0), 0) / completedRetros
      : 0;
    
    // Team improvement score calculation (0-100)
    // Weighted scoring: Action completion (40%), Retro frequency (30%), Participation (20%), Timeliness (10%)
    const actionScore = Math.min(actionCompletionRate * 0.4, 40);
    const retroScore = Math.min(retroCompletionRate * 0.3, 30);
    const participationScore = Math.min(avgParticipation * 2, 20); // Assuming 10 is max team size
    const timelinessScore = totalActions > 0 ? Math.max(10 - (overdueActions / totalActions) * 10, 0) : 10;
    
    const improvementScore = Math.round(actionScore + retroScore + participationScore + timelinessScore);

    // Trend analysis (simplified - in real app would use historical data)
    const recentRetros = retrospectives.filter(r => {
      const retroDate = new Date(r.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return retroDate >= thirtyDaysAgo;
    }).length;

    const trend = recentRetros >= 2 ? 'improving' : recentRetros === 1 ? 'stable' : 'declining';

    return {
      improvementScore,
      actionCompletionRate: Math.round(actionCompletionRate),
      retroCompletionRate: Math.round(retroCompletionRate),
      avgParticipation: Math.round(avgParticipation * 10) / 10,
      totalRetros,
      completedRetros,
      scheduledRetros,
      totalActions,
      completedActions,
      inProgressActions,
      overdueActions,
      trend,
      recommendations: generateRecommendations({
        improvementScore,
        actionCompletionRate,
        avgParticipation,
        overdueActions,
        recentRetros
      })
    };
  }, [retrospectives, actionItems]);

  const generateRecommendations = ({
    improvementScore,
    actionCompletionRate,
    avgParticipation,
    overdueActions,
    recentRetros
  }) => {
    const recommendations = [];
    
    if (improvementScore < 50) {
      recommendations.push({
        type: 'critical',
        title: 'Team Improvement Needs Attention',
        description: 'Consider scheduling more frequent retrospectives and focusing on action item follow-through.'
      });
    }
    
    if (actionCompletionRate < 60) {
      recommendations.push({
        type: 'warning',
        title: 'Low Action Item Completion',
        description: 'Review action item assignments and due dates. Consider breaking down large items into smaller tasks.'
      });
    }
    
    if (avgParticipation < 3) {
      recommendations.push({
        type: 'info',
        title: 'Increase Retrospective Participation',
        description: 'Encourage more team members to participate in retrospectives for better insights.'
      });
    }
    
    if (overdueActions > 0) {
      recommendations.push({
        type: 'warning',
        title: `${overdueActions} Overdue Action Items`,
        description: 'Review and update overdue action items. Consider adjusting due dates or reassigning tasks.'
      });
    }
    
    if (recentRetros === 0) {
      recommendations.push({
        type: 'info',
        title: 'Schedule Regular Retrospectives',
        description: 'Regular retrospectives help maintain team improvement momentum. Consider scheduling one soon.'
      });
    }
    
    return recommendations;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircleOutline />;
    if (score >= 60) return <Warning />;
    return <ErrorIcon />;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp color="success" />;
      case 'stable': return <TrendingUp color="info" />;
      case 'declining': return <TrendingUp color="error" sx={{ transform: 'rotate(180deg)' }} />;
      default: return <TrendingUp />;
    }
  };

  return (
    <Dialog 
      open 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      aria-labelledby="analytics-title"
      PaperProps={{
        role: 'dialog',
        'aria-modal': true
      }}
    >
      <DialogTitle id="analytics-title">
        <Box display="flex" alignItems="center" gap={1}>
          <Analytics />
          Team Improvement Analytics
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Overall Improvement Score */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                  <Score color={getScoreColor(analytics.improvementScore)} />
                  <Typography variant="h6">Improvement Score</Typography>
                </Box>
                <Typography 
                  variant="h2" 
                  color={getScoreColor(analytics.improvementScore) + '.main'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {analytics.improvementScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  out of 100
                </Typography>
                <Box mt={2} display="flex" alignItems="center" justifyContent="center" gap={1}>
                  {getScoreIcon(analytics.improvementScore)}
                  {getTrendIcon(analytics.trend)}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {analytics.trend === 'improving' && 'Team is improving!'}
                    {analytics.trend === 'stable' && 'Performance is stable'}
                    {analytics.trend === 'declining' && 'Needs attention'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Performance Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Action Item Completion Rate
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={analytics.actionCompletionRate} 
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={analytics.actionCompletionRate >= 80 ? 'success' : analytics.actionCompletionRate >= 60 ? 'warning' : 'error'}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {analytics.actionCompletionRate}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Retrospective Completion Rate
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={analytics.retroCompletionRate} 
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={analytics.retroCompletionRate >= 80 ? 'success' : 'warning'}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {analytics.retroCompletionRate}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Average Participation
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Group color="action" />
                        <Typography variant="h6">
                          {analytics.avgParticipation} members
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Overdue Action Items
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime color={analytics.overdueActions > 0 ? 'error' : 'success'} />
                        <Typography variant="h6" color={analytics.overdueActions > 0 ? 'error.main' : 'success.main'}>
                          {analytics.overdueActions}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Retrospectives</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {analytics.completedRetros}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {analytics.scheduledRetros}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scheduled
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {analytics.totalRetros}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Action Items</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {analytics.completedActions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Done
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {analytics.inProgressActions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {analytics.overdueActions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overdue
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {analytics.totalActions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recommendations</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {analytics.recommendations.map((rec, index) => (
                      <Alert 
                        key={index}
                        severity={rec.type === 'critical' ? 'error' : rec.type}
                        variant="outlined"
                      >
                        <AlertTitle>{rec.title}</AlertTitle>
                        {rec.description}
                      </Alert>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<GetApp />}>
          Export Analytics Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ImprovementAnalytics.propTypes = {
  retrospectives: PropTypes.array.isRequired,
  actionItems: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired
};

/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling and recovery options
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error for monitoring (in production, send to error tracking service)
    const errorDetails = {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      errorId: this.state.errorId
    };
    
    console.error('ContinuousImprovementTab Error:', errorDetails);
    
    // In production, send to error tracking service
    // sendErrorToTrackingService(errorDetails);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body2" paragraph>
              The continuous improvement dashboard encountered an unexpected error. 
              This has been logged for our development team.
            </Typography>
            {this.state.errorId && (
              <Typography variant="caption" color="text.secondary" paragraph>
                Error ID: {this.state.errorId}
              </Typography>
            )}
            <Box display="flex" gap={1} mt={2}>
              <Button 
                onClick={this.handleRetry} 
                variant="outlined"
                size="small"
              >
                Try Again
              </Button>
              <Button 
                onClick={this.handleReload} 
                variant="contained"
                size="small"
              >
                Refresh Page
              </Button>
            </Box>
          </Alert>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Development Error Details</AlertTitle>
              <Typography variant="body2" component="pre" sx={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '0.75rem',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </Typography>
            </Alert>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Performance Monitoring Hook
 * Tracks component performance metrics
 */
export const usePerformanceMonitoring = (componentName) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  const startTime = useMemo(() => performance.now(), []);

  const recordMetric = useCallback((metricName, value) => {
    setMetrics(prev => ({
      ...prev,
      [metricName]: value
    }));
    
    // In production, send to analytics service
    console.log(`${componentName} ${metricName}:`, value);
  }, [componentName]);

  const measureRenderTime = useCallback(() => {
    const renderTime = performance.now() - startTime;
    recordMetric('renderTime', Math.round(renderTime));
  }, [startTime, recordMetric]);

  const measureMemoryUsage = useCallback(() => {
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      recordMetric('memoryUsage', Math.round(memoryUsage * 100) / 100);
    }
  }, [recordMetric]);

  return {
    metrics,
    recordMetric,
    measureRenderTime,
    measureMemoryUsage
  };
};

/**
 * Accessibility Helper Functions
 */
export const accessibilityHelpers = {
  // Announce messages to screen readers
  announceToScreenReader: (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Enhanced keyboard navigation
  handleKeyboardNavigation: (event, options = {}) => {
    const { onEscape, onEnter, onArrowKeys, onTab } = options;
    
    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys(event.key);
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab(event.shiftKey);
        }
        break;
    }
  },

  // Focus management
  manageFocus: {
    trap: (containerElement) => {
      const focusableElements = containerElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      containerElement.addEventListener('keydown', handleTabKey);
      return () => containerElement.removeEventListener('keydown', handleTabKey);
    },

    restore: (previousActiveElement) => {
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    }
  }
};

export default {
  RetrospectiveScheduler,
  ImprovementAnalytics,
  ErrorBoundary,
  usePerformanceMonitoring,
  accessibilityHelpers
}; 