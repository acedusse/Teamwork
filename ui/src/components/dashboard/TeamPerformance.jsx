import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert, Stack, ToggleButtonGroup, ToggleButton, Chip, Tooltip, Divider, LinearProgress, FormControl, InputLabel, MenuItem, Select, Paper } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

// API endpoint for team performance data
const API_ENDPOINT = '/api/team/performance';

const StyledCard = styled(Card)(({ theme }) => ({
  height: 'calc(100% + 10px)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
  overflow: 'hidden',
}));

const CardContentStyled = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  '&:last-child': {
    paddingBottom: theme.spacing(3),
  },
}));

// Avatar component no longer needed since we're removing the pictures

const SkillChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  fontWeight: 500,
  fontSize: '0.75rem',
}));

const ProductivityBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  }
}));

// Utility for formatting percentage values
const formatPercent = (value) => `${Math.round(value)}%`;

// Format date string to readable format
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

export default function TeamPerformance() {
  const theme = useTheme();
  const [teamData, setTeamData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week'); // 'day', 'week', 'month', 'quarter'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch team performance data
  const fetchTeamData = async () => {
    setIsLoading(prevState => prevState && true); // Only show loading on first load
    setError(null);
    
    try {
      console.log(`Fetching team data with timeRange=${timeFilter}`);
      const response = await axios.get(`${API_ENDPOINT}?timeRange=${timeFilter}`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Team data received:', response.data);
        console.log(`Received ${response.data.length} team members with metrics`);
        
        // Check if any team members have non-zero metrics
        const hasActiveMembers = response.data.some(member => 
          member.tasksCompleted > 0 || member.tasksInProgress > 0 || member.totalTasks > 0
        );
        
        if (!hasActiveMembers && response.data.length > 0) {
          console.warn('All team members have zero metrics despite data being received');
        }
        
        setTeamData(response.data);
        setLastUpdated(new Date());
      } else {
        // Handle unexpected API response format
        console.error('Unexpected data format:', response.data);
        setError('Unexpected data format received from server.');
        setTeamData([]);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team performance data. Please try again later.');
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchTeamData();
  }, [timeFilter]); // Re-fetch when time filter changes
  
  // Auto-refresh with polling for real-time updates
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh) {
      // Poll every 10 seconds for updates
      intervalId = setInterval(() => {
        console.log('Auto-refreshing team performance data...');
        fetchTeamData();
      }, 10000); // 10 second interval
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeFilter, autoRefresh]); // Re-setup when filter or autoRefresh changes

  // Handle time filter change
  const handleTimeFilterChange = (event) => {
    setTimeFilter(event.target.value);
  };
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };
  
  // No longer needed as we removed manual refresh button

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // If no data is available
  if (!teamData || teamData.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          No team performance data is available for the selected time period.
        </Alert>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Debug information: Time filter: {timeFilter}, Last attempted: {lastUpdated.toLocaleString()}
          </Typography>
        </Box>
      </Box>
    );
  }
  
  // Check if all metrics are zero
  const allZeroMetrics = teamData.every(member => 
    member.tasksCompleted === 0 && member.tasksInProgress === 0 && member.totalTasks === 0
  );

  return (
    <Box sx={{ width: '100%' }}>
      {allZeroMetrics && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          All team members currently show zero metrics for the selected time period. This could be because there are no tasks assigned within this period, or tasks haven't been updated with status information.
        </Alert>
      )}
      
      {/* Controls bar with filters and refresh options */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: theme.palette.background.paper,
        padding: '2px 0',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel id="time-filter-label">Time Range</InputLabel>
              <Select
                labelId="time-filter-label"
                id="time-filter-select"
                value={timeFilter}
                label="Time Range"
                onChange={handleTimeFilterChange}
              >
                <MenuItem value="day">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              value={autoRefresh ? 'auto' : 'manual'}
              exclusive
              aria-label="refresh mode"
            >
              <ToggleButton 
                value="auto" 
                aria-label="auto refresh" 
                onClick={() => setAutoRefresh(true)}
              >
                Auto
              </ToggleButton>
              <ToggleButton 
                value="manual" 
                aria-label="manual refresh" 
                onClick={() => setAutoRefresh(false)}
              >
                Manual
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
        
        <Typography variant="caption" color="textSecondary">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
        </Typography>
      </Box>
      
      {/* Team member cards - wider layout with max 2 per row */}
      <Grid container spacing={3}>
        {teamData.map((member, index) => (
          <Grid item xs={12} sm={12} md={6} key={`team-member-${index}`}>
            <StyledCard>
              <CardContentStyled>
                {/* Header section with basic info (avatar removed) */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {member.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {member.role}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {member.department}
                        </Typography>
                      </Box>
                      <Box>
                        <Chip 
                          label={`Joined ${formatDate(member.joined)}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mt: 0.5 }} 
                        />
                      </Box>
                    </Box>
                    
                    {/* Contact info */}
                    <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
                      {member.email}
                    </Typography>
                  </Grid>
                </Grid>
                <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: theme.palette.background.default }}>
                  {/* Bio */}
                  <Typography variant="subtitle2" gutterBottom>Bio</Typography>
                  <Tooltip title={member.bio || 'No bio available'}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {member.bio || 'No bio available'}
                    </Typography>
                  </Tooltip>
                </Paper>
                
                {/* Skills */}
                <Typography variant="subtitle2" gutterBottom>Skills</Typography>
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {member.skills && member.skills.length > 0 ? (
                    member.skills.map((skill, i) => (
                      <SkillChip key={`skill-${i}`} label={skill} size="small" variant="outlined" color="primary" />
                    ))
                  ) : (
                    <Typography variant="caption" color="textSecondary">No skills listed</Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Performance metrics */}
                <Typography variant="subtitle2" gutterBottom>Performance Metrics</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 1.5, backgroundColor: theme.palette.success.light, borderRadius: 1 }}>
                      <Typography variant="h6" align="center">{member.tasksCompleted}</Typography>
                      <Typography variant="caption" color="textSecondary" align="center" display="block">Completed</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 1.5, backgroundColor: theme.palette.info.light, borderRadius: 1 }}>
                      <Typography variant="h6" align="center">{member.tasksInProgress}</Typography>
                      <Typography variant="caption" color="textSecondary" align="center" display="block">In Progress</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 1.5, backgroundColor: theme.palette.warning.light, borderRadius: 1 }}>
                      <Typography variant="h6" align="center">{member.completionRate || '0'}</Typography>
                      <Typography variant="caption" color="textSecondary" align="center" display="block">Tasks/Day</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 1.5, backgroundColor: theme.palette.grey[200], borderRadius: 1 }}>
                      <Typography variant="h6" align="center">{member.avgTaskComplexity || '0'}</Typography>
                      <Typography variant="caption" color="textSecondary" align="center" display="block">Avg Complexity</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                {/* Productivity metrics */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {/* Productivity */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">Productivity</Typography>
                        <Typography variant="subtitle2" color={member.productivity > 80 ? 'success.main' : member.productivity > 60 ? 'warning.main' : 'error.main'}>
                          {member.productivity}%
                        </Typography>
                      </Stack>
                      <ProductivityBar 
                        value={member.productivity || 0}
                        variant="determinate"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: member.productivity > 80 ? theme.palette.success.main : member.productivity > 60 ? theme.palette.warning.main : theme.palette.error.main
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  {/* Efficiency */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">Efficiency</Typography>
                        <Typography variant="subtitle2" color={member.efficiency > 80 ? 'success.main' : member.efficiency > 60 ? 'warning.main' : 'error.main'}>
                          {member.efficiency || 0}%
                        </Typography>
                      </Stack>
                      <ProductivityBar 
                        value={member.efficiency || 0}
                        variant="determinate"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: member.efficiency > 80 ? theme.palette.success.main : member.efficiency > 60 ? theme.palette.warning.main : theme.palette.error.main
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  {/* Focus Score */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">Focus Score</Typography>
                        <Typography variant="subtitle2" color={member.focusScore > 80 ? 'success.main' : member.focusScore > 60 ? 'warning.main' : 'error.main'}>
                          {member.focusScore || 0}%
                        </Typography>
                      </Stack>
                      <ProductivityBar 
                        value={member.focusScore || 0}
                        variant="determinate"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: member.focusScore > 80 ? theme.palette.success.main : member.focusScore > 60 ? theme.palette.warning.main : theme.palette.error.main
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Task distribution */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Task Breakdown</Typography>
                  <Grid container spacing={2}>
                    {/* Complexity breakdown */}
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{ p: 1.5, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">By Complexity:</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Chip 
                            label={`${member.tasksByComplexity?.low || 0} Low`} 
                            size="small" 
                            sx={{ bgcolor: theme.palette.success.light }}
                          />
                          <Chip 
                            label={`${member.tasksByComplexity?.medium || 0} Med`} 
                            size="small"
                            sx={{ bgcolor: theme.palette.warning.light }} 
                          />
                          <Chip 
                            label={`${member.tasksByComplexity?.high || 0} High`}
                            size="small" 
                            sx={{ bgcolor: theme.palette.error.light }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                    
                    {/* Priority breakdown */}
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{ p: 1.5, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">By Priority:</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Chip 
                            label={`${member.tasksByPriority?.low || 0} Low`} 
                            size="small" 
                            sx={{ bgcolor: theme.palette.success.light }}
                          />
                          <Chip 
                            label={`${member.tasksByPriority?.medium || 0} Med`} 
                            size="small"
                            sx={{ bgcolor: theme.palette.warning.light }} 
                          />
                          <Chip 
                            label={`${member.tasksByPriority?.high || 0} High`}
                            size="small" 
                            sx={{ bgcolor: theme.palette.error.light }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Resolution time */}
                {member.avgResolutionTime > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Avg Resolution Time: {member.avgResolutionTime.toFixed(1)} days
                    </Typography>
                  </Box>
                )}
                
                {/* Last activity info */}
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  {member.lastCompletionDate && (
                    <Typography variant="caption" color="textSecondary">
                      Last Completion: {formatDate(member.lastCompletionDate)}
                    </Typography>
                  )}
                  {member.lastActiveDate && (
                    <Typography variant="caption" color="textSecondary">
                      Last Active: {formatDate(member.lastActiveDate)}
                    </Typography>
                  )}
                </Box>
              </CardContentStyled>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}