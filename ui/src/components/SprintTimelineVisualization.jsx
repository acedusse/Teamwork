import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Info as InfoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(minMax);

// Helper function to calculate sprint progress
const calculateSprintProgress = (sprint, tasks) => {
  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
  if (sprintTasks.length === 0) return 0;
  
  const completedTasks = sprintTasks.filter(task => task.status === 'done');
  return Math.round((completedTasks.length / sprintTasks.length) * 100);
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return '#4caf50';
    case 'active':
      return '#2196f3';
    case 'paused':
      return '#ff9800';
    case 'planned':
      return '#9e9e9e';
    default:
      return '#9e9e9e';
  }
};

// Timeline Bar Component
function TimelineBar({ sprint, tasks, timelineStart, timelineEnd, onSprintClick }) {
  const theme = useTheme();
  const sprintStart = dayjs(sprint.startDate);
  const sprintEnd = dayjs(sprint.endDate);
  const totalDays = dayjs(timelineEnd).diff(dayjs(timelineStart), 'day');
  const sprintStartOffset = sprintStart.diff(dayjs(timelineStart), 'day');
  const sprintDuration = sprintEnd.diff(sprintStart, 'day');
  
  // Calculate position and width as percentages
  const leftPosition = (sprintStartOffset / totalDays) * 100;
  const width = (sprintDuration / totalDays) * 100;
  
  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
  const progress = calculateSprintProgress(sprint, tasks);
  const statusColor = getStatusColor(sprint.status);
  
  // Check if sprint is current
  const now = dayjs();
  const isCurrent = now.isAfter(sprintStart) && now.isBefore(sprintEnd);
  const currentDayOffset = isCurrent ? now.diff(sprintStart, 'day') : 0;
  const currentDayPosition = isCurrent ? (currentDayOffset / sprintDuration) * 100 : 0;

  return (
    <Box
      sx={{
        position: 'relative',
        height: 80,
        mb: 2,
        cursor: 'pointer',
        '&:hover .sprint-bar': {
          transform: 'scaleY(1.1)',
          boxShadow: 3
        }
      }}
      onClick={() => onSprintClick && onSprintClick(sprint)}
    >
      {/* Sprint Bar */}
      <Box
        className="sprint-bar"
        sx={{
          position: 'absolute',
          left: `${leftPosition}%`,
          width: `${width}%`,
          height: 60,
          backgroundColor: statusColor,
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          minWidth: 120,
          boxShadow: 1,
          border: isCurrent ? `2px solid ${theme.palette.primary.main}` : 'none'
        }}
      >
        {/* Progress Bar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '0 0 8px 8px'
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '0 0 8px 8px',
              transition: 'width 0.3s ease-in-out'
            }}
          />
        </Box>

        {/* Current Day Indicator */}
        {isCurrent && (
          <Box
            sx={{
              position: 'absolute',
              left: `${currentDayPosition}%`,
              top: -5,
              bottom: -5,
              width: 2,
              backgroundColor: theme.palette.error.main,
              zIndex: 2
            }}
          />
        )}

        {/* Sprint Content */}
        <Box sx={{ color: 'white', minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {sprint.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <AssignmentIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">
              {sprintTasks.length} tasks
            </Typography>
            <Typography variant="caption">•</Typography>
            <Typography variant="caption">
              {progress}% complete
            </Typography>
          </Stack>
        </Box>

        {/* Status Icon */}
        <Box sx={{ ml: 1 }}>
          {sprint.status === 'active' && <PlayIcon sx={{ color: 'white' }} />}
          {sprint.status === 'completed' && <CompleteIcon sx={{ color: 'white' }} />}
          {sprint.status === 'paused' && <PauseIcon sx={{ color: 'white' }} />}
          {sprint.status === 'planned' && <InfoIcon sx={{ color: 'white' }} />}
        </Box>
      </Box>

      {/* Date Labels */}
      <Box
        sx={{
          position: 'absolute',
          left: `${leftPosition}%`,
          top: 65,
          fontSize: '0.75rem',
          color: 'text.secondary'
        }}
      >
        {sprintStart.format('MMM D')}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: `${leftPosition + width}%`,
          top: 65,
          fontSize: '0.75rem',
          color: 'text.secondary',
          transform: 'translateX(-100%)'
        }}
      >
        {sprintEnd.format('MMM D')}
      </Box>
    </Box>
  );
}

// Timeline Header with date markers
function TimelineHeader({ timelineStart, timelineEnd }) {
  const totalDays = dayjs(timelineEnd).diff(dayjs(timelineStart), 'day');
  const markers = [];
  
  // Create weekly markers
  let current = dayjs(timelineStart).startOf('week');
  while (current.isBefore(dayjs(timelineEnd))) {
    const offset = current.diff(dayjs(timelineStart), 'day');
    const position = (offset / totalDays) * 100;
    
    if (position >= 0 && position <= 100) {
      markers.push({
        date: current,
        position: position
      });
    }
    current = current.add(1, 'week');
  }

  return (
    <Box sx={{ position: 'relative', height: 40, mb: 2, borderBottom: '1px solid #e0e0e0' }}>
      {markers.map((marker, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: `${marker.position}%`,
            top: 0,
            height: '100%',
            borderLeft: '1px solid #e0e0e0',
            pl: 1
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {marker.date.format('MMM D')}
          </Typography>
        </Box>
      ))}
      
      {/* Current Date Indicator */}
      {(() => {
        const now = dayjs();
        if (now.isAfter(dayjs(timelineStart)) && now.isBefore(dayjs(timelineEnd))) {
          const currentOffset = now.diff(dayjs(timelineStart), 'day');
          const currentPosition = (currentOffset / totalDays) * 100;
          return (
            <Box
              sx={{
                position: 'absolute',
                left: `${currentPosition}%`,
                top: 0,
                height: '100%',
                borderLeft: '2px solid #f44336',
                zIndex: 1
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#f44336', 
                  fontWeight: 'bold',
                  pl: 1,
                  backgroundColor: 'white'
                }}
              >
                Today
              </Typography>
            </Box>
          );
        }
        return null;
      })()}
    </Box>
  );
}

export default function SprintTimelineVisualization({ 
  sprints = [], 
  tasks = [], 
  onSprintClick = null 
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const theme = useTheme();

  // Calculate timeline bounds
  const { timelineStart, timelineEnd } = useMemo(() => {
    if (sprints.length === 0) {
      const now = dayjs();
      return {
        timelineStart: now.subtract(1, 'month').toDate(),
        timelineEnd: now.add(2, 'month').toDate()
      };
    }

    const allDates = sprints.flatMap(sprint => [
      dayjs(sprint.startDate),
      dayjs(sprint.endDate)
    ]);

    const earliest = dayjs.min(allDates).subtract(1, 'week');
    const latest = dayjs.max(allDates).add(1, 'week');

    return {
      timelineStart: earliest.toDate(),
      timelineEnd: latest.toDate()
    };
  }, [sprints]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  if (sprints.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Sprints to Display
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create sprints to see them in the timeline visualization.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Sprint Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual overview of sprint schedules and progress
          </Typography>
        </Box>
        
        {/* Zoom Controls */}
        <Stack direction="row" spacing={1}>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 3}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Legend */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip
            icon={<PlayIcon />}
            label="Active"
            size="small"
            sx={{ backgroundColor: '#2196f3', color: 'white' }}
          />
          <Chip
            icon={<CompleteIcon />}
            label="Completed"
            size="small"
            sx={{ backgroundColor: '#4caf50', color: 'white' }}
          />
          <Chip
            icon={<PauseIcon />}
            label="Planned"
            size="small"
            sx={{ backgroundColor: '#ff9800', color: 'white' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 2, height: 16, backgroundColor: '#f44336' }} />
            <Typography variant="caption">Current Date</Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Timeline */}
      <Box 
        sx={{ 
          overflowX: 'auto',
          transform: `scaleX(${zoomLevel})`,
          transformOrigin: 'left center',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <Box sx={{ minWidth: 800, position: 'relative' }}>
          <TimelineHeader 
            timelineStart={timelineStart} 
            timelineEnd={timelineEnd} 
          />
          
          {sprints
            .sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)))
            .map(sprint => (
              <TimelineBar
                key={sprint.id}
                sprint={sprint}
                tasks={tasks}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                onSprintClick={onSprintClick}
              />
            ))}
        </Box>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="h6" color="primary">
              {sprints.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Sprints
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="success.main">
              {sprints.filter(s => s.status === 'completed').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="info.main">
              {sprints.filter(s => s.status === 'active').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="warning.main">
              {tasks.filter(t => t.sprintId).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Assigned Tasks
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
} 