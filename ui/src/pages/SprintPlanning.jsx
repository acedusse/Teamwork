import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Timer as TimerIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  List as ListIcon,
  Timeline as TimelineIcon,
  Assessment
} from '@mui/icons-material';
import SprintCreationForm from '../components/SprintCreationForm';
import TaskSprintAssignment from '../components/TaskSprintAssignment';
import SprintTimelineVisualization from '../components/SprintTimelineVisualization';
import SprintManagementControls from '../components/SprintManagementControls';
import SprintProgressTracking from '../components/SprintProgressTracking';
import SprintDetailPanel from '../components/SprintDetailPanel';

export default function SprintPlanning() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sprints, setSprints] = useState([
    // Sample data - this would come from API in real implementation
    {
      id: 1,
      name: 'Sprint 1 - Foundation',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-29'),
      goals: 'Set up the basic infrastructure and core components for the project.',
      status: 'completed',
      createdAt: new Date('2024-01-10')
    },
    {
      id: 2,
      name: 'Sprint 2 - User Management',
      startDate: new Date('2024-01-30'),
      endDate: new Date('2024-02-13'),
      goals: 'Implement user authentication, registration, and profile management features.',
      status: 'active',
      createdAt: new Date('2024-01-25')
    },
    {
      id: 3,
      name: 'Sprint 3 - Task Management',
      startDate: new Date('2024-02-14'),
      endDate: new Date('2024-02-28'),
      goals: 'Build comprehensive task management features including CRUD operations, filtering, and bulk actions.',
      status: 'planned',
      createdAt: new Date('2024-02-05')
    }
  ]);
  
  // Sample task data - this would come from API in real implementation
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Set up authentication system',
      description: 'Implement JWT-based authentication with login and registration',
      status: 'pending',
      priority: 'high',
      sprintId: null, // Not assigned to any sprint
      storyPoints: 8,
      subtasks: [
        { id: 1, title: 'Create login form' },
        { id: 2, title: 'Implement JWT validation' }
      ],
      dependencies: []
    },
    {
      id: 2,
      title: 'Design user dashboard',
      description: 'Create responsive dashboard with key metrics and navigation',
      status: 'done',
      priority: 'medium',
      sprintId: 1, // Assigned to Sprint 1
      storyPoints: 5,
      subtasks: [],
      dependencies: [1]
    },
    {
      id: 3,
      title: 'Implement task management',
      description: 'Build CRUD operations for task management',
      status: 'pending',
      priority: 'high',
      sprintId: null,
      storyPoints: 13,
      subtasks: [
        { id: 1, title: 'Create task form' },
        { id: 2, title: 'Add task listing' },
        { id: 3, title: 'Implement task editing' }
      ],
      dependencies: [1]
    },
    {
      id: 4,
      title: 'Add notification system',
      description: 'Real-time notifications for task updates',
      status: 'pending',
      priority: 'low',
      sprintId: 2, // Assigned to Sprint 2
      storyPoints: 3,
      subtasks: [],
      dependencies: [2, 3]
    },
    {
      id: 5,
      title: 'Optimize database queries',
      description: 'Improve performance of database operations',
      status: 'pending',
      priority: 'medium',
      sprintId: null,
      storyPoints: 5,
      subtasks: [],
      dependencies: []
    },
    {
      id: 6,
      title: 'Implement advanced search',
      description: 'Add advanced search functionality with filters',
      status: 'pending',
      priority: 'high',
      sprintId: 3, // Assigned to Sprint 3
      storyPoints: 8,
      subtasks: [],
      dependencies: []
    },
    {
      id: 7,
      title: 'Build reporting dashboard',
      description: 'Create comprehensive reporting and analytics dashboard',
      status: 'done',
      priority: 'medium',
      sprintId: 3, // Assigned to Sprint 3
      storyPoints: 5,
      subtasks: [],
      dependencies: []
    }
  ]);
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintDetailOpen, setSprintDetailOpen] = useState(false);

  const handleCreateSprint = async (sprintData) => {
    try {
      // In a real app, this would make an API call
      const newSprint = {
        ...sprintData,
        id: sprints.length + 1
      };
      
      setSprints(prev => [...prev, newSprint]);
      setShowCreateForm(false);
      setNotification({
        open: true,
        message: `Sprint "${sprintData.name}" created successfully!`,
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to create sprint. Please try again.',
        severity: 'error'
      });
      throw error; // Re-throw to let the form handle it
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTaskAssign = (taskId, sprintId, previousSprintId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, sprintId: sprintId }
        : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    const sprint = sprints.find(s => s.id === sprintId);
    
    setNotification({
      open: true,
      message: `Task "${task?.title}" assigned to "${sprint?.name}"`,
      severity: 'success'
    });
  };

  const handleTaskUnassign = (taskId, sprintId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, sprintId: null }
        : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    
    setNotification({
      open: true,
      message: `Task "${task?.title}" moved back to backlog`,
      severity: 'info'
    });
  };

  const handleSprintClick = (sprint) => {
    setSelectedSprint(sprint);
    setSprintDetailOpen(true);
  };

  const handleSprintStatusChange = (sprintId, newStatus) => {
    setSprints(prev => prev.map(sprint => 
      sprint.id === sprintId 
        ? { ...sprint, status: newStatus }
        : sprint
    ));
    
    const sprint = sprints.find(s => s.id === sprintId);
    const statusMessages = {
      active: 'started',
      paused: 'paused', 
      completed: 'completed'
    };
    
    setNotification({
      open: true,
      message: `Sprint "${sprint?.name}" has been ${statusMessages[newStatus] || 'updated'}`,
      severity: 'success'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'paused':
        return 'warning';
      case 'planned':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const calculateDuration = (startDate, endDate) => {
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (showCreateForm) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancelCreate}
            sx={{ mb: 2 }}
          >
            ← Back to Sprint List
          </Button>
        </Box>
        <SprintCreationForm
          onSprintCreate={handleCreateSprint}
          onCancel={handleCancelCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Sprint Planning
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your sprints, set goals, and track progress across development cycles.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
          size="large"
        >
          Create New Sprint
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<ListIcon />} 
            label="Sprint Overview" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssignmentIcon />} 
            label="Task Assignment" 
            iconPosition="start"
          />
          <Tab 
            icon={<TimelineIcon />} 
            label="Timeline View" 
            iconPosition="start"
          />
          <Tab 
            icon={<TimerIcon />} 
            label="Sprint Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<Assessment />} 
            label="Progress Tracking" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        /* Sprint List */
        sprints.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Sprints Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create your first sprint to start organizing your development work.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
              >
                Create First Sprint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {sprints.map((sprint) => (
              <Grid item xs={12} md={6} lg={4} key={sprint.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Sprint Header */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                          {sprint.name}
                        </Typography>
                        <Chip
                          label={sprint.status}
                          color={getStatusColor(sprint.status)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    {/* Sprint Timeline */}
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TimerIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {calculateDuration(sprint.startDate, sprint.endDate)} days
                      </Typography>
                    </Box>

                    {/* Sprint Goals */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FlagIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Goals:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {sprint.goals}
                      </Typography>
                    </Box>

                    {/* Task Count */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {tasks.filter(task => task.sprintId === sprint.id).length} tasks assigned
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button size="small" variant="outlined" fullWidth onClick={() => handleSprintClick(sprint)}>
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {activeTab === 1 && (
        /* Task Assignment */
        <TaskSprintAssignment
          tasks={tasks}
          sprints={sprints}
          onTaskAssign={handleTaskAssign}
          onTaskUnassign={handleTaskUnassign}
        />
      )}

      {activeTab === 2 && (
        /* Timeline Visualization */
        <SprintTimelineVisualization
          sprints={sprints}
          tasks={tasks}
          onSprintClick={handleSprintClick}
        />
      )}

      {activeTab === 3 && (
        /* Sprint Management */
        <Box>
          {sprints.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <TimerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  No Sprints to Manage
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first sprint to start managing sprint lifecycles.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateForm(true)}
                >
                  Create First Sprint
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={4}>
              {sprints.map((sprint) => (
                <Grid item xs={12} key={sprint.id}>
                  <Card sx={{ p: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h5" gutterBottom>
                        {sprint.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {sprint.goals}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)} 
                        ({calculateDuration(sprint.startDate, sprint.endDate)} days)
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <SprintManagementControls
                      sprint={sprint}
                      tasks={tasks}
                      onStatusChange={handleSprintStatusChange}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 4 && (
        /* Progress Tracking */
        <SprintProgressTracking
          sprints={sprints}
          tasks={tasks}
          onSprintSelect={(sprintId) => {
            // Handle sprint selection if needed
            console.log('Selected sprint:', sprintId);
          }}
        />
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      {/* Sprint Detail Panel */}
      <SprintDetailPanel
        open={sprintDetailOpen}
        sprint={selectedSprint}
        tasks={tasks}
        onClose={() => setSprintDetailOpen(false)}
      />
    </Box>
  );
} 