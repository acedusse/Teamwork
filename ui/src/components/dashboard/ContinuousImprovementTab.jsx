import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Button,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Tab,
  Tabs,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  CircularProgress,
  Badge,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Psychology,
  Assignment,
  TrendingUp,
  Add,
  Refresh,
  GetApp,
  Settings,
  Timeline,
  CheckCircle,
  Schedule,
  Group,
  Lightbulb,
  Flag,
  ThumbUp,
  CalendarToday,
  Notifications,
  Analytics,
  Score,
  Accessibility,
  Speed,
  Error as ErrorIcon,
  Warning,
  Info,
  CheckCircleOutline
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PropTypes from 'prop-types';
import RetrospectiveBoard from './RetrospectiveBoard';
import ActionItemTracker from './ActionItemTracker';
import ImprovementMetrics from './ImprovementMetrics';
import RetrospectiveExporter from './RetrospectiveExporter';

/**
 * TabPanel component for managing tab content with enhanced accessibility
 */
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`improvement-tabpanel-${index}`}
      aria-labelledby={`improvement-tab-${index}`}
      tabIndex={value === index ? 0 : -1}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }} role="region" aria-live="polite">
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

/**
 * Advanced Retrospective Scheduling Component
 */
const RetrospectiveScheduler = ({ open, onClose, onSchedule }) => {
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(24); // hours before
  const [recurrence, setRecurrence] = useState('none');

  const handleSchedule = () => {
    const scheduleData = {
      title,
      date: scheduledDate,
      participants,
      reminder: reminderEnabled ? reminderTime : null,
      recurrence
    };
    onSchedule(scheduleData);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="schedule-retrospective-title"
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
              inputProps={{ 'aria-describedby': 'title-helper-text' }}
            />
            
            <DateTimePicker
              label="Scheduled Date & Time"
              value={scheduledDate}
              onChange={setScheduledDate}
              renderInput={(params) => (
                <TextField {...params} fullWidth required />
              )}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  aria-describedby="reminder-helper-text"
                />
              }
              label="Enable Reminder"
            />

            {reminderEnabled && (
              <FormControl fullWidth>
                <InputLabel>Reminder Time</InputLabel>
                <Select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  label="Reminder Time"
                >
                  <MenuItem value={1}>1 hour before</MenuItem>
                  <MenuItem value={24}>24 hours before</MenuItem>
                  <MenuItem value={48}>48 hours before</MenuItem>
                  <MenuItem value={168}>1 week before</MenuItem>
                </Select>
              </FormControl>
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
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSchedule} 
          variant="contained" 
          disabled={!title.trim()}
          startIcon={<Schedule />}
        >
          Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Team Improvement Analytics Component
 */
const ImprovementAnalytics = ({ retrospectives, actionItems, onClose }) => {
  const analytics = useMemo(() => {
    // Calculate improvement scores
    const totalRetros = retrospectives.length;
    const completedActions = actionItems.filter(item => item.status === 'done').length;
    const totalActions = actionItems.length;
    
    const actionCompletionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    const avgParticipation = retrospectives.reduce((sum, retro) => sum + (retro.participants || 0), 0) / Math.max(totalRetros, 1);
    
    // Team improvement score calculation (0-100)
    const improvementScore = Math.round(
      (actionCompletionRate * 0.4) + 
      (Math.min(avgParticipation * 10, 40)) + 
      (Math.min(totalRetros * 5, 20))
    );

    return {
      improvementScore,
      actionCompletionRate: Math.round(actionCompletionRate),
      avgParticipation: Math.round(avgParticipation * 10) / 10,
      totalRetros,
      totalActions,
      completedActions,
      trends: {
        improving: improvementScore > 70,
        stable: improvementScore >= 50 && improvementScore <= 70,
        declining: improvementScore < 50
      }
    };
  }, [retrospectives, actionItems]);

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

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Analytics />
          Team Improvement Analytics
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Overall Improvement Score */}
          <Grid item xs={12} md={6}>
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
                <Box mt={2}>
                  {getScoreIcon(analytics.improvementScore)}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {analytics.trends.improving && 'Team is improving well!'}
                    {analytics.trends.stable && 'Team performance is stable'}
                    {analytics.trends.declining && 'Team needs attention'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Action Item Completion Rate
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={analytics.actionCompletionRate} 
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {analytics.actionCompletionRate}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Participation
                    </Typography>
                    <Typography variant="h6">
                      {analytics.avgParticipation} members
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Retrospectives Conducted
                    </Typography>
                    <Typography variant="h6">
                      {analytics.totalRetros}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Items Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Action Items Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {analytics.completedActions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {analytics.totalActions - analytics.completedActions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
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
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<GetApp />}>
          Export Analytics
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Enhanced Error Boundary Component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error for monitoring
    console.error('ContinuousImprovementTab Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <AlertTitle>Something went wrong</AlertTitle>
          <Typography variant="body2">
            The continuous improvement dashboard encountered an error. Please refresh the page or contact support.
          </Typography>
          <Button 
            onClick={() => window.location.reload()} 
            sx={{ mt: 1 }}
            variant="outlined"
            size="small"
          >
            Refresh Page
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// AgentEventsPanel: Shows recent agent events and agent health
function AgentEventsPanel() {
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAction, setFilterAction] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, agentsRes] = await Promise.all([
        fetch('/api/ai-agents/activities?limit=20'),
        fetch('/api/ai-agents')
      ]);
      if (!eventsRes.ok || !agentsRes.ok) throw new Error('Failed to fetch agent data');
      const eventsData = await eventsRes.json();
      const agentsData = await agentsRes.json();
      setEvents(eventsData.data.activities || []);
      setAgents(agentsData.data.agents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAgent = (agentId) => agents.find(a => a.id === agentId) || {};
  const getEventColor = (action) => {
    switch (action) {
      case 'status_change': return 'info';
      case 'recommendation': return 'success';
      case 'task_completed': return 'primary';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // Get unique actions and agent IDs for filter dropdowns
  const uniqueActions = useMemo(() => ['all', ...Array.from(new Set(events.map(e => e.action)))], [events]);
  const uniqueAgents = useMemo(() => ['all', ...agents.map(a => a.id)], [agents]);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      (filterAction === 'all' || event.action === filterAction) &&
      (filterAgent === 'all' || event.agentId === filterAgent)
    );
  }, [events, filterAction, filterAgent]);

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Analytics sx={{ color: 'primary.main' }} /> Recent AI Agent Events & Health
        </Typography>
        <IconButton aria-label="Refresh events" onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}>
          {refreshing ? <CircularProgress size={24} /> : <Refresh />}
        </IconButton>
      </Box>
      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filter-action-label">Event Type</InputLabel>
          <Select
            labelId="filter-action-label"
            value={filterAction}
            label="Event Type"
            onChange={e => setFilterAction(e.target.value)}
          >
            {uniqueActions.map(action => (
              <MenuItem key={action} value={action}>
                {action === 'all' ? 'All Types' : action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filter-agent-label">Agent</InputLabel>
          <Select
            labelId="filter-agent-label"
            value={filterAgent}
            label="Agent"
            onChange={e => setFilterAgent(e.target.value)}
          >
            {uniqueAgents.map(agentId => {
              const agent = agents.find(a => a.id === agentId);
              return (
                <MenuItem key={agentId} value={agentId}>
                  {agentId === 'all' ? 'All Agents' : (agent?.name || agentId)}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <List dense>
            {filteredEvents.length === 0 && (
              <ListItem><ListItemText primary="No recent agent events." /></ListItem>
            )}
            {filteredEvents.map(event => {
              const agent = getAgent(event.agentId);
              return (
                <ListItem key={event.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: agent.color || 'grey.300' }}>
                      {agent.avatar || agent.name?.[0] || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<>
                      <Chip label={event.action} color={getEventColor(event.action)} size="small" sx={{ mr: 1 }} />
                      <b>{agent.name || event.agentId}</b>
                      {event.details?.title && <>: <span>{event.details.title}</span></>}
                    </>}
                    secondary={<>
                      <Typography component="span" variant="body2" color="text.secondary">
                        {event.details?.description || event.details?.status || ''}
                        {event.details?.priority && <> | Priority: {event.details.priority}</>}
                        {event.details?.currentTask && <> | Task: {event.details.currentTask}</>}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                    </>}
                  />
                </ListItem>
              );
            })}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Agent Health</Typography>
          <Grid container spacing={2}>
            {agents.map(agent => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: agent.color || 'grey.300', width: 40, height: 40 }}>
                    {agent.avatar || agent.name?.[0] || '?'}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2">{agent.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{agent.description}</Typography>
                    <Chip label={agent.status} color={agent.status === 'active' ? 'success' : 'default'} size="small" sx={{ mt: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Last activity: {agent.lastActivity ? new Date(agent.lastActivity).toLocaleString() : 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Paper>
  );
}

/**
 * ContinuousImprovementTab Component with Advanced Features
 * 
 * Enhanced with:
 * - Retrospective scheduling and calendar integration
 * - Team improvement analytics and scoring
 * - Enhanced accessibility features
 * - Performance optimization
 * - Comprehensive error handling
 */
const ContinuousImprovementTab = ({ 
  onRetrospectiveCreate,
  onActionItemUpdate,
  onExportReport,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Refs for accessibility
  const tabsRef = useRef(null);
  const contentRef = useRef(null);
  const startTimeRef = useRef(performance.now());

  // Main tab state
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loadTime, setLoadTime] = useState(null);
  
  // Retrospective state
  const [retrospectives, setRetrospectives] = useState([]);
  const [currentRetrospective, setCurrentRetrospective] = useState(null);
  const [retrospectiveItems, setRetrospectiveItems] = useState([]);
  
  // Action items state
  const [actionItems, setActionItems] = useState([]);
  const [actionItemFilters, setActionItemFilters] = useState({
    status: 'all',
    assignee: 'all',
    priority: 'all'
  });
  
  // Improvement metrics state
  const [improvementMetrics, setImprovementMetrics] = useState([]);
  const [metricsTimeRange, setMetricsTimeRange] = useState('3months');
  
  // UI state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Advanced features state
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0
  });

  useEffect(() => {
    const endTime = performance.now();
    setLoadTime(endTime - startTimeRef.current);
  }, []);

  // Initialize with sample data for development
  useEffect(() => {
    const sampleRetrospectives = [
      {
        id: 'retro-1',
        title: 'Sprint 3.2 Retrospective',
        date: new Date('2024-12-15'),
        status: 'completed',
        participants: 5,
        actionItemsGenerated: 3,
        scheduled: false
      },
      {
        id: 'retro-2',
        title: 'Sprint 3.1 Retrospective', 
        date: new Date('2024-12-01'),
        status: 'completed',
        participants: 4,
        actionItemsGenerated: 5,
        scheduled: false
      },
      {
        id: 'retro-3',
        title: 'Sprint 3.3 Retrospective',
        date: new Date('2024-12-29'),
        status: 'scheduled',
        participants: 0,
        actionItemsGenerated: 0,
        scheduled: true,
        reminder: 24
      }
    ];

    const sampleActionItems = [
      {
        id: 'action-1',
        title: 'Improve code review process',
        description: 'Implement checklist and reduce review time',
        status: 'in-progress',
        assignee: 'John Doe',
        dueDate: new Date('2024-12-30'),
        priority: 'high',
        retrospectiveId: 'retro-1'
      },
      {
        id: 'action-2',
        title: 'Set up automated testing',
        description: 'Reduce manual testing overhead',
        status: 'new',
        assignee: 'Jane Smith',
        dueDate: new Date('2025-01-15'),
        priority: 'medium',
        retrospectiveId: 'retro-1'
      },
      {
        id: 'action-3',
        title: 'Daily standup optimization',
        description: 'Reduce meeting time from 30 to 15 minutes',
        status: 'done',
        assignee: 'Mike Johnson',
        dueDate: new Date('2024-12-10'),
        priority: 'low',
        retrospectiveId: 'retro-2'
      }
    ];

    setRetrospectives(sampleRetrospectives);
    setActionItems(sampleActionItems);
    
    // Check for upcoming retrospectives
    checkUpcomingRetrospectives(sampleRetrospectives);
  }, []);

  // Check for upcoming retrospectives and create notifications
  const checkUpcomingRetrospectives = useCallback((retros) => {
    const now = new Date();
    const upcoming = retros.filter(retro => {
      if (!retro.scheduled || retro.status !== 'scheduled') return false;
      const timeDiff = retro.date.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      return hoursDiff > 0 && hoursDiff <= (retro.reminder || 24);
    });

    if (upcoming.length > 0) {
      setNotifications(upcoming.map(retro => ({
        id: `reminder-${retro.id}`,
        type: 'reminder',
        message: `Retrospective "${retro.title}" is scheduled for ${retro.date.toLocaleDateString()}`,
        timestamp: new Date(),
        retrospectiveId: retro.id
      })));
    }
  }, []);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((event) => {
    // Tab navigation with Ctrl+Arrow keys
    if (event.ctrlKey) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setActiveTab(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          event.preventDefault();
          setActiveTab(prev => Math.min(2, prev + 1));
          break;
        case 'Home':
          event.preventDefault();
          setActiveTab(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveTab(2);
          break;
      }
    }
    
    // Escape key to close modals
    if (event.key === 'Escape') {
      setSchedulerOpen(false);
      setAnalyticsOpen(false);
      setExportDialogOpen(false);
    }
  }, []);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Announce tab change for screen readers
    const tabNames = ['Retrospectives', 'Action Items', 'Metrics'];
    setSnackbar({
      open: true,
      message: `Switched to ${tabNames[newValue]} tab`,
      severity: 'info'
    });
  };

  // Handle refresh with performance tracking
  const handleRefresh = useCallback(async () => {
    const startTime = performance.now();
    setIsLoading(true);
    
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastUpdated(new Date());
      setSnackbar({
        open: true,
        message: 'Data refreshed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh data',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
      const refreshTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, refreshTime }));
    }
  }, []);

  // Handle retrospective creation with enhanced features
  const handleRetrospectiveCreate = useCallback((retrospectiveData) => {
    try {
      const newRetrospective = {
        id: `retro-${Date.now()}`,
        ...retrospectiveData,
        date: new Date(),
        status: 'active',
        participants: retrospectiveData.participants || 0,
        actionItemsGenerated: 0
      };
      
      setRetrospectives(prev => [...prev, newRetrospective]);
      setCurrentRetrospective(newRetrospective);
      
      if (onRetrospectiveCreate) {
        onRetrospectiveCreate(newRetrospective);
      }
      
      setSnackbar({
        open: true,
        message: `Retrospective "${newRetrospective.title}" created successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create retrospective',
        severity: 'error'
      });
    }
  }, [onRetrospectiveCreate]);

  // Handle retrospective scheduling
  const handleRetrospectiveSchedule = useCallback((scheduleData) => {
    try {
      const scheduledRetrospective = {
        id: `retro-scheduled-${Date.now()}`,
        ...scheduleData,
        status: 'scheduled',
        scheduled: true,
        participants: 0,
        actionItemsGenerated: 0
      };
      
      setRetrospectives(prev => [...prev, scheduledRetrospective]);
      
      setSnackbar({
        open: true,
        message: `Retrospective "${scheduleData.title}" scheduled successfully`,
        severity: 'success'
      });
      
      // Set up reminder if enabled
      if (scheduleData.reminder) {
        // In a real app, this would integrate with a notification system
        console.log(`Reminder set for ${scheduleData.reminder} hours before retrospective`);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to schedule retrospective',
        severity: 'error'
      });
    }
  }, []);

  // Memoized computed values for performance
  const computedMetrics = useMemo(() => {
    const completedActions = actionItems.filter(item => item.status === 'done').length;
    const totalActions = actionItems.length;
    const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    
    return {
      totalRetrospectives: retrospectives.length,
      totalActionItems: totalActions,
      completedActionItems: completedActions,
      actionCompletionRate: Math.round(completionRate),
      upcomingRetrospectives: retrospectives.filter(r => r.status === 'scheduled').length
    };
  }, [retrospectives, actionItems]);

  // Handle action item updates with error handling
  const handleActionItemUpdate = useCallback((actionItemData) => {
    try {
      setActionItems(prev => 
        prev.map(item => 
          item.id === actionItemData.id 
            ? { ...item, ...actionItemData }
            : item
        )
      );
      
      if (onActionItemUpdate) {
        onActionItemUpdate(actionItemData);
      }
      
      setSnackbar({
        open: true,
        message: 'Action item updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update action item',
        severity: 'error'
      });
    }
  }, [onActionItemUpdate]);

  const handleActionItemCreate = useCallback((actionItemData) => {
    try {
      const newActionItem = {
        id: `action-${Date.now()}`,
        ...actionItemData,
        status: 'new'
      };
      
      setActionItems(prev => [...prev, newActionItem]);
      
      setSnackbar({
        open: true,
        message: 'Action item created successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create action item',
        severity: 'error'
      });
    }
  }, []);

  const handleMetricsTimeRangeChange = useCallback((newTimeRange) => {
    setMetricsTimeRange(newTimeRange);
    setSnackbar({
      open: true,
      message: `Metrics time range changed to ${newTimeRange}`,
      severity: 'info'
    });
  }, []);

  const handleExportReport = useCallback((exportData) => {
    try {
      if (onExportReport) {
        onExportReport(exportData);
      }
      
      setSnackbar({
        open: true,
        message: 'Report exported successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export report',
        severity: 'error'
      });
    }
  }, [onExportReport]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <ErrorBoundary>
      <Container 
        maxWidth="xl" 
        className={className}
        sx={{ py: 3 }}
        role="main"
        aria-label="Continuous Improvement Dashboard"
      >
        {/* Header with enhanced controls */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Continuous Improvement
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Manage retrospectives, track action items, and monitor team improvement metrics
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {process.env.NODE_ENV === 'development' && loadTime && (
                  <Typography variant="caption" color="text.secondary">
                    Load time: {Math.round(loadTime)}ms
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Last updated: {lastUpdated.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              {/* Notifications badge */}
              {notifications.length > 0 && (
                <Tooltip title={`${notifications.length} upcoming retrospective(s)`}>
                  <IconButton 
                    aria-label={`${notifications.length} notifications`}
                    color="warning"
                  >
                    <Badge badgeContent={notifications.length} color="error">
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Schedule Retrospective">
                <IconButton 
                  onClick={() => setSchedulerOpen(true)}
                  aria-label="schedule retrospective"
                >
                  <CalendarToday />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="View Analytics">
                <IconButton 
                  onClick={() => setAnalyticsOpen(true)}
                  aria-label="view analytics"
                >
                  <Analytics />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh data">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  aria-label="refresh"
                >
                  {isLoading ? <CircularProgress size={24} /> : <Refresh />}
                </IconButton>
              </Tooltip>
              
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={() => setExportDialogOpen(true)}
                disabled={isLoading}
              >
                Export
              </Button>
              
              <Tooltip title="Settings">
                <IconButton aria-label="settings">
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Key metrics overview */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {computedMetrics.totalRetrospectives}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Retrospectives
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="success.main">
                    {computedMetrics.actionCompletionRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Action Completion
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="warning.main">
                    {computedMetrics.totalActionItems}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Action Items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="info.main">
                    {computedMetrics.upcomingRetrospectives}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upcoming Retros
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Enhanced Tab Navigation */}
        <Paper sx={{ width: '100%' }}>
          <Tabs
            ref={tabsRef}
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Continuous improvement navigation tabs"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
            role="tablist"
          >
            <Tab
              icon={<Psychology />}
              label="Retrospectives"
              id="improvement-tab-0"
              aria-controls="improvement-tabpanel-0"
              sx={{ minHeight: 72 }}
            />
            <Tab
              icon={<Assignment />}
              label="Action Items"
              id="improvement-tab-1"
              aria-controls="improvement-tabpanel-1"
              sx={{ minHeight: 72 }}
            />
            <Tab
              icon={<TrendingUp />}
              label="Metrics"
              id="improvement-tab-2"
              aria-controls="improvement-tabpanel-2"
              sx={{ minHeight: 72 }}
            />
          </Tabs>

          {/* Tab Panels with enhanced content */}
          <TabPanel value={activeTab} index={0} ref={contentRef}>
            <RetrospectiveBoard
              retrospectives={retrospectives}
              onRetrospectiveCreate={handleRetrospectiveCreate}
              onItemCreate={(item) => {
                setRetrospectiveItems(prev => [...prev, item]);
              }}
              currentRetrospective={currentRetrospective}
              aria-label="Retrospective board interface"
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ActionItemTracker
              actionItems={actionItems}
              onActionItemUpdate={handleActionItemUpdate}
              onActionItemCreate={handleActionItemCreate}
              filters={actionItemFilters}
              onFiltersChange={setActionItemFilters}
              aria-label="Action item tracker interface"
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <AgentEventsPanel />
            <ImprovementMetrics
              retrospectives={retrospectives}
              actionItems={actionItems}
              timeRange={metricsTimeRange}
              onTimeRangeChange={handleMetricsTimeRangeChange}
              aria-label="Improvement metrics interface"
            />
          </TabPanel>
        </Paper>

        {/* Enhanced Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add retrospective"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={() => {
            if (activeTab === 0) {
              // Create new retrospective
              handleRetrospectiveCreate({
                title: `Retrospective ${new Date().toLocaleDateString()}`,
                participants: []
              });
            } else if (activeTab === 1) {
              // Create new action item
              handleActionItemCreate({
                title: 'New Action Item',
                description: '',
                priority: 'medium'
              });
            } else {
              // Schedule retrospective
              setSchedulerOpen(true);
            }
          }}
        >
          <Add />
        </Fab>

        {/* Advanced Feature Modals */}
        <RetrospectiveScheduler
          open={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
          onSchedule={handleRetrospectiveSchedule}
        />

        {analyticsOpen && (
          <ImprovementAnalytics
            retrospectives={retrospectives}
            actionItems={actionItems}
            onClose={() => setAnalyticsOpen(false)}
          />
        )}

        <RetrospectiveExporter
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onExport={handleExportReport}
          retrospectives={retrospectives}
          actionItems={actionItems}
        />

        {/* Enhanced Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ErrorBoundary>
  );
};

ContinuousImprovementTab.propTypes = {
  onRetrospectiveCreate: PropTypes.func,
  onActionItemUpdate: PropTypes.func,
  onExportReport: PropTypes.func,
  className: PropTypes.string,
};

ContinuousImprovementTab.defaultProps = {
  onRetrospectiveCreate: null,
  onActionItemUpdate: null,
  onExportReport: null,
  className: ''
};

export default ContinuousImprovementTab; 