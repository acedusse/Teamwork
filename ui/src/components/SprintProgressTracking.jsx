import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingDown as BurndownIcon,
  Assessment as MetricsIcon,
  Speed as VelocityIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

// Helper function to generate ideal burndown data
const generateIdealBurndown = (sprint, totalStoryPoints) => {
  const startDate = dayjs(sprint.startDate);
  const endDate = dayjs(sprint.endDate);
  const totalDays = endDate.diff(startDate, 'day');
  
  const data = [];
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = startDate.add(i, 'day');
    const remainingWork = totalStoryPoints * (1 - (i / totalDays));
    
    data.push({
      date: currentDate.format('MMM DD'),
      day: i,
      ideal: Math.max(0, remainingWork),
      dateObj: currentDate.toDate()
    });
  }
  
  return data;
};

// Helper function to generate actual progress data
const generateActualProgress = (sprint, tasks, idealData) => {
  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
  const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
  
  // Simulate daily progress (in real app, this would come from historical data)
  const progressData = idealData.map((day, index) => {
    let completedPoints = 0;
    
    // Simulate some realistic progress pattern
    if (sprint.status === 'completed') {
      // For completed sprints, show realistic completion curve
      const progressRatio = Math.min(1, (index / idealData.length) * 1.2);
      completedPoints = Math.floor(totalStoryPoints * progressRatio);
    } else if (sprint.status === 'active') {
      // For active sprints, show current progress
      const currentCompletedTasks = sprintTasks.filter(task => 
        task.status === 'done' || task.status === 'completed'
      ).length;
      const progressRatio = currentCompletedTasks / sprintTasks.length;
      completedPoints = Math.floor(totalStoryPoints * progressRatio);
    }
    
    return {
      ...day,
      actual: Math.max(0, totalStoryPoints - completedPoints),
      completed: completedPoints
    };
  });
  
  return progressData;
};

// Sprint Statistics Component
function SprintStatistics({ sprint, tasks, progressData }) {
  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
  const completedTasks = sprintTasks.filter(task => task.status === 'done' || task.status === 'completed');
  const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
  const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
  
  const startDate = dayjs(sprint.startDate);
  const endDate = dayjs(sprint.endDate);
  const today = dayjs();
  const totalDays = endDate.diff(startDate, 'day');
  const elapsedDays = Math.max(0, today.diff(startDate, 'day'));
  const remainingDays = Math.max(0, endDate.diff(today, 'day'));
  
  const velocity = elapsedDays > 0 ? completedStoryPoints / elapsedDays : 0;
  const projectedCompletion = velocity > 0 ? Math.ceil(totalStoryPoints / velocity) : 0;
  
  const completionPercentage = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0;
  const timeElapsedPercentage = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
  
  const isOnTrack = completionPercentage >= timeElapsedPercentage - 10; // 10% tolerance
  
  const statistics = [
    {
      label: 'Total Story Points',
      value: totalStoryPoints,
      icon: <TaskIcon />,
      color: 'primary'
    },
    {
      label: 'Completed Points',
      value: completedStoryPoints,
      icon: <CompletedIcon />,
      color: 'success'
    },
    {
      label: 'Completion Rate',
      value: `${Math.round(completionPercentage)}%`,
      icon: <MetricsIcon />,
      color: isOnTrack ? 'success' : 'warning'
    },
    {
      label: 'Current Velocity',
      value: `${velocity.toFixed(1)} pts/day`,
      icon: <VelocityIcon />,
      color: 'info'
    },
    {
      label: 'Days Remaining',
      value: remainingDays,
      icon: <ScheduleIcon />,
      color: remainingDays <= 2 ? 'warning' : 'default'
    },
    {
      label: 'Sprint Status',
      value: sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1),
      icon: sprint.status === 'completed' ? <CompletedIcon /> : 
            sprint.status === 'active' ? <InfoIcon /> : <ScheduleIcon />,
      color: sprint.status === 'completed' ? 'success' : 
             sprint.status === 'active' ? 'primary' : 'default'
    }
  ];

  return (
    <Grid container spacing={2}>
      {statistics.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: `${stat.color}.main` }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h6">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
      
      {/* Progress Indicators */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sprint Progress Overview
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Work Completion</Typography>
                <Typography variant="body2">{Math.round(completionPercentage)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={completionPercentage} 
                sx={{ height: 8, borderRadius: 1 }}
                color={isOnTrack ? 'success' : 'warning'}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Time Elapsed</Typography>
                <Typography variant="body2">{Math.round(timeElapsedPercentage)}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={timeElapsedPercentage} 
                sx={{ height: 8, borderRadius: 1 }}
                color="info"
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              {isOnTrack ? (
                <Chip 
                  icon={<CompletedIcon />} 
                  label="On Track" 
                  color="success" 
                  variant="outlined" 
                />
              ) : (
                <Chip 
                  icon={<WarningIcon />} 
                  label="Behind Schedule" 
                  color="warning" 
                  variant="outlined" 
                />
              )}
              {projectedCompletion > 0 && projectedCompletion !== totalDays && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  Projected completion: {projectedCompletion} days
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Task Distribution Chart Component
function TaskDistributionChart({ tasks, sprint }) {
  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
  
  const statusCounts = sprintTasks.reduce((acc, task) => {
    const status = task.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    percentage: ((count / sprintTasks.length) * 100).toFixed(1)
  }));
  
  const COLORS = {
    'Done': '#4caf50',
    'Completed': '#4caf50',
    'Pending': '#ff9800',
    'In-progress': '#2196f3',
    'Blocked': '#f44336',
    'Review': '#9c27b0'
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Task Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percentage }) => `${name}: ${percentage}%`}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name] || '#8884d8'} 
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default function SprintProgressTracking({ 
  sprints = [], 
  tasks = [], 
  selectedSprintId = null,
  onSprintSelect = () => {} 
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [currentSprintId, setCurrentSprintId] = useState(
    selectedSprintId || (sprints.length > 0 ? sprints[0].id : null)
  );

  const currentSprint = sprints.find(s => s.id === currentSprintId);
  
  const chartData = useMemo(() => {
    if (!currentSprint) return [];
    
    const sprintTasks = tasks.filter(task => task.sprintId === currentSprint.id);
    const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
    
    const idealData = generateIdealBurndown(currentSprint, totalStoryPoints);
    return generateActualProgress(currentSprint, tasks, idealData);
  }, [currentSprint, tasks]);

  const handleSprintChange = (event) => {
    const sprintId = event.target.value;
    setCurrentSprintId(sprintId);
    onSprintSelect(sprintId);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (sprints.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 6 }}>
        <CardContent>
          <BurndownIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Sprints Available
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create sprints to view progress tracking and burndown charts.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Sprint Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ maxWidth: 300 }}>
          <InputLabel>Select Sprint</InputLabel>
          <Select
            value={currentSprintId || ''}
            label="Select Sprint"
            onChange={handleSprintChange}
          >
            {sprints.map((sprint) => (
              <MenuItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {currentSprint && (
        <>
          {/* Sprint Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {currentSprint.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {dayjs(currentSprint.startDate).format('MMM DD, YYYY')} - {dayjs(currentSprint.endDate).format('MMM DD, YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentSprint.goals}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<BurndownIcon />} label="Burndown Chart" iconPosition="start" />
              <Tab icon={<MetricsIcon />} label="Statistics" iconPosition="start" />
              <Tab icon={<TaskIcon />} label="Task Distribution" iconPosition="start" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            /* Burndown Chart */
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sprint Burndown Chart
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track sprint progress against the ideal burndown line
              </Typography>
              
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} points`,
                      name === 'ideal' ? 'Ideal Burndown' : 'Actual Progress'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    stroke="#ff9800"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Ideal Burndown"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#2196f3"
                    strokeWidth={3}
                    name="Actual Progress"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {activeTab === 1 && (
            /* Statistics */
            <SprintStatistics 
              sprint={currentSprint} 
              tasks={tasks} 
              progressData={chartData} 
            />
          )}

          {activeTab === 2 && (
            /* Task Distribution */
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <TaskDistributionChart 
                    tasks={tasks} 
                    sprint={currentSprint} 
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Sprint Tasks
                  </Typography>
                  <List>
                    {tasks
                      .filter(task => task.sprintId === currentSprint.id)
                      .map((task) => (
                        <ListItem key={task.id}>
                          <ListItemIcon>
                            {task.status === 'done' || task.status === 'completed' ? (
                              <CompletedIcon color="success" />
                            ) : (
                              <PendingIcon color="warning" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={task.title}
                            secondary={`Priority: ${task.priority} | Status: ${task.status}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
} 