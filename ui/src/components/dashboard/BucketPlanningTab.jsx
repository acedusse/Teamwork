import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Container,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  CalendarToday,
  DateRange,
  Schedule,
  Add,
  SmartToy,
  PlayArrow,
  Assessment,
  Psychology,
  ExpandMore,
  AutoAwesome
} from '@mui/icons-material';
import PropTypes from 'prop-types';
// TimeBuckets is imported but not used in the render method
import TimeBuckets from './TimeBuckets';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import StoryCard from './StoryCard';
import DraggableStoryCard from './DraggableStoryCard';
import DroppableBucket from './DroppableBucket';
import AIOptimizationSuggestionsPanel from './AIOptimizationSuggestionsPanel';
import useOptimizationSuggestions from '../../hooks/useOptimizationSuggestions';

// Time horizon constants
const TIME_HORIZONS = {
  YEAR: 'year',
  QUARTER: 'quarter', 
  MONTH: 'month'
};

// AI Agents data
const aiAgents = [
  {
    id: 'frontend',
    name: 'Frontend Agent',
    status: 'Available for pull',
    workload: 3.5,
    maxWorkload: 5,
    color: '#4CAF50'
  },
  {
    id: 'backend',
    name: 'Backend Agent', 
    status: 'At capacity',
    workload: 5.5,
    maxWorkload: 5,
    color: '#FF9800'
  },
  {
    id: 'ml',
    name: 'ML Agent',
    status: 'Ready to pull',
    workload: 2.5,
    maxWorkload: 5,
    color: '#2196F3'
  }
];

// Sprint data
const sprintData = {
  name: 'Sprint 3.2',
  dates: 'Dec 16 - Dec 30, 2024',
  completion: 68,
  daysRemaining: 5
};

// AI Agents Capacity Component
const AIAgentsCapacity = () => {
  const theme = useTheme();
  
  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SmartToy color="primary" />
        <Typography variant="h6">AI Agents Capacity</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {aiAgents.map((agent) => (
          <Box key={agent.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: agent.color,
                width: 32,
                height: 32,
                fontSize: '0.875rem'
              }}
            >
              {agent.name.split(' ').map(word => word[0]).join('')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {agent.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {agent.status}
              </Typography>
            </Box>
            <Box sx={{ width: 100, mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(agent.workload / agent.maxWorkload) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: agent.color,
                    borderRadius: 4
                  }
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'right' }}>
              {agent.workload}/{agent.maxWorkload} WIP
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Button
        variant="outlined"
        startIcon={<Add />}
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => console.log('Add AI Agent')}
      >
        Add AI Agent
      </Button>
    </Paper>
  );
};

// Sprint Integration Component
const SprintIntegration = () => {
  const theme = useTheme();
  
  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Assessment color="primary" />
        <Typography variant="h6">Sprint Integration</Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {sprintData.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {sprintData.dates}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            {sprintData.completion}% Complete
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sprintData.daysRemaining} days remaining
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={sprintData.completion}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.success.main,
              borderRadius: 4
            }
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          size="small"
          onClick={() => console.log('Plan Next Sprint')}
        >
          Plan Next Sprint
        </Button>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          size="small"
          onClick={() => console.log('Sprint Retrospective')}
        >
          Sprint Retrospective
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => console.log('Sprint Report')}
        >
          Sprint Report
        </Button>
      </Box>
    </Paper>
  );
};

// Enhanced DroppableBucket with Add Vision Item button
const EnhancedDroppableBucket = ({ bucket, onAddItem, ...props }) => {
  const theme = useTheme();
  
  return (
    <DroppableBucket bucket={bucket} {...props}>
      <Button
        variant="outlined"
        startIcon={<Add />}
        fullWidth
        size="small"
        sx={{ 
          mt: 1,
          borderStyle: 'dashed',
          color: theme.palette.text.secondary,
          borderColor: theme.palette.grey[300],
          '&:hover': {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            backgroundColor: 'transparent'
          }
        }}
        onClick={() => onAddItem?.(bucket.id)}
      >
        + Add Vision Item
      </Button>
    </DroppableBucket>
  );
};

EnhancedDroppableBucket.propTypes = {
  bucket: PropTypes.object.isRequired,
  onAddItem: PropTypes.func
};

// Main BucketPlanningTab component
const BucketPlanningTab = ({ 
  initialStories = [], 
  bucketConfig = {},
  onStoriesUpdate,
  onBucketConfigUpdate 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [activeTimeHorizon, setActiveTimeHorizon] = useState(TIME_HORIZONS.QUARTER);
  const [stories, setStories] = useState(initialStories);
  const [buckets, setBuckets] = useState({
    [TIME_HORIZONS.YEAR]: bucketConfig.year || [],
    [TIME_HORIZONS.QUARTER]: bucketConfig.quarter || [],
    [TIME_HORIZONS.MONTH]: bucketConfig.month || []
  });
  
  // Drag and drop state
  const [activeStory, setActiveStory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  
  // History stack for undo/redo
  const historyRef = useRef({ past: [], future: [] });

  // Local storage keys
  const BUCKETS_STORAGE_KEY = 'bucketPlanningBuckets';
  const STORIES_STORAGE_KEY = 'bucketPlanningStories';

  // AI optimization suggestions hook
  const {
    isLoading: isOptimizing,
    suggestions,
    generateSuggestions,
    applySuggestion,
    clearSuggestions,
    error: optimizationError
  } = useOptimizationSuggestions({
    context: 'bucket-planning',
    autoGenerate: false
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedBuckets = JSON.parse(localStorage.getItem(BUCKETS_STORAGE_KEY));
      const savedStories = JSON.parse(localStorage.getItem(STORIES_STORAGE_KEY));
      if (savedBuckets) setBuckets(savedBuckets);
      if (savedStories) setStories(savedStories);
    } catch (_) {
      // ignore parse errors
    }
  }, []);

  // Persist buckets & stories
  useEffect(() => {
    localStorage.setItem(BUCKETS_STORAGE_KEY, JSON.stringify(buckets));
    localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(stories));
  }, [buckets, stories]);

  // Helper to push current state to history
  const pushHistory = useCallback(() => {
    historyRef.current.past.push({ buckets: JSON.parse(JSON.stringify(buckets)), stories: JSON.parse(JSON.stringify(stories)) });
    // limit history length to 20
    if (historyRef.current.past.length > 20) historyRef.current.past.shift();
    // clear future on new action
    historyRef.current.future = [];
  }, [buckets, stories]);

  // Undo handler
  const handleUndo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const previous = past.pop();
    future.unshift({ buckets: buckets, stories: stories });
    setBuckets(previous.buckets);
    setStories(previous.stories);
  }, [buckets, stories]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const next = future.shift();
    past.push({ buckets: buckets, stories: stories });
    setBuckets(next.buckets);
    setStories(next.stories);
  }, [buckets, stories]);

  // Listen to keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper: get buckets for current time horizon
  const getCurrentBuckets = useCallback(() => {
    const defaultBuckets = {
      [TIME_HORIZONS.YEAR]: [
        { id: 'y1', title: '📅 1-Year Bucket', capacity: 50, stories: [] },
        { id: 'y2', title: '📅 6-Month Bucket', capacity: 50, stories: [] },
        { id: 'y3', title: '📅 3-Month Bucket', capacity: 30, stories: [] }
      ],
      [TIME_HORIZONS.QUARTER]: [
        { id: 'q1', title: 'Q1 2024', capacity: 20, stories: [] },
        { id: 'q2', title: 'Q2 2024', capacity: 20, stories: [] },
        { id: 'q3', title: 'Q3 2024', capacity: 15, stories: [] },
        { id: 'q4', title: 'Q4 2024', capacity: 15, stories: [] }
      ],
      [TIME_HORIZONS.MONTH]: [
        { id: 'm1', title: 'January', capacity: 8, stories: [] },
        { id: 'm2', title: 'February', capacity: 8, stories: [] },
        { id: 'm3', title: 'March', capacity: 8, stories: [] },
        { id: 'm4', title: 'April', capacity: 6, stories: [] },
        { id: 'm5', title: 'May', capacity: 6, stories: [] },
        { id: 'm6', title: 'June', capacity: 6, stories: [] }
      ]
    };

    return buckets[activeTimeHorizon]?.length > 0
      ? buckets[activeTimeHorizon]
      : defaultBuckets[activeTimeHorizon];
  }, [activeTimeHorizon, buckets]);

  // Event handlers
  const handleTimeHorizonChange = useCallback((event, newHorizon) => {
    if (newHorizon !== null) {
      setActiveTimeHorizon(newHorizon);
    }
  }, []);

  const handleStoriesUpdate = useCallback((updatedStories) => {
    setStories(updatedStories);
    onStoriesUpdate?.(updatedStories);
  }, [onStoriesUpdate]);

  const handleBucketUpdate = useCallback((horizon, updatedBuckets) => {
    setBuckets(prev => ({
      ...prev,
      [horizon]: updatedBuckets
    }));
    onBucketConfigUpdate?.(buckets);
  }, [buckets, onBucketConfigUpdate]);

  // AI optimization handlers
  const handleGenerateOptimizations = useCallback(async () => {
    const currentBuckets = getCurrentBuckets();
    const bucketData = {
      stories,
      activeTimeHorizon,
      buckets: currentBuckets,
      totalCapacity: currentBuckets.reduce((sum, bucket) => sum + bucket.capacity, 0),
      utilization: currentBuckets.map(bucket => ({
        id: bucket.id,
        capacity: bucket.capacity,
        used: bucket.stories?.length || 0
      }))
    };

    await generateSuggestions({
      type: 'bucket-optimization',
      data: bucketData,
      focusAreas: ['capacity-balancing', 'timeline-optimization', 'priority-alignment']
    });
  }, [stories, activeTimeHorizon, getCurrentBuckets, generateSuggestions]);

  const handleApplyOptimization = useCallback(async (suggestion) => {
    pushHistory();
    
    if (suggestion.action === 'move-story') {
      const { storyId, fromBucket, toBucket } = suggestion.data;
      
      setBuckets(prev => {
        const newBuckets = { ...prev };
        const currentHorizonBuckets = [...(newBuckets[activeTimeHorizon] || [])];
        
        // Remove from source bucket
        const fromBucketIndex = currentHorizonBuckets.findIndex(b => b.id === fromBucket);
        if (fromBucketIndex !== -1) {
          const storyToMove = currentHorizonBuckets[fromBucketIndex].stories?.find(s => s.id === storyId);
          if (storyToMove) {
            currentHorizonBuckets[fromBucketIndex] = {
              ...currentHorizonBuckets[fromBucketIndex],
              stories: currentHorizonBuckets[fromBucketIndex].stories.filter(s => s.id !== storyId)
            };
            
            // Add to target bucket
            const toBucketIndex = currentHorizonBuckets.findIndex(b => b.id === toBucket);
            if (toBucketIndex !== -1) {
              currentHorizonBuckets[toBucketIndex] = {
                ...currentHorizonBuckets[toBucketIndex],
                stories: [...(currentHorizonBuckets[toBucketIndex].stories || []), storyToMove]
              };
            }
          }
        }
        
        newBuckets[activeTimeHorizon] = currentHorizonBuckets;
        return newBuckets;
      });
      
      setSnackbar({
        open: true,
        message: `Applied AI suggestion: Moved story to optimize bucket allocation`,
        severity: 'success'
      });
    }
    
    await applySuggestion(suggestion.id);
  }, [activeTimeHorizon, pushHistory, applySuggestion]);

  // Add item to bucket handler
  const handleAddItem = useCallback((bucketId) => {
    const newItem = {
      id: `${bucketId}-${Date.now()}`,
      title: 'New Vision Item',
      description: 'Click to edit description',
      priority: 'medium',
      effort: 5,
      tags: ['vision']
    };
    
    pushHistory();
    
    setBuckets(prev => {
      const newBuckets = { ...prev };
      const currentHorizonBuckets = [...(newBuckets[activeTimeHorizon] || [])];
      
      const bucketIndex = currentHorizonBuckets.findIndex(b => b.id === bucketId);
      if (bucketIndex !== -1) {
        currentHorizonBuckets[bucketIndex] = {
          ...currentHorizonBuckets[bucketIndex],
          stories: [...(currentHorizonBuckets[bucketIndex].stories || []), newItem]
        };
      }
      
      newBuckets[activeTimeHorizon] = currentHorizonBuckets;
      return newBuckets;
    });
    
    setSnackbar({
      open: true,
      message: `Added new vision item to ${bucketId}`
    });
  }, [activeTimeHorizon, pushHistory]);

  // Drag and drop event handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const storyId = active.id;
    
    // Find the story being dragged
    const currentBuckets = getCurrentBuckets();
    let draggedStory = null;
    
    // Check backlog stories first
    draggedStory = stories.find(story => story.id.toString() === storyId);
    
    // If not in backlog, check bucket stories
    if (!draggedStory) {
      for (const bucket of currentBuckets) {
        if (bucket.stories) {
          draggedStory = bucket.stories.find(story => story.id.toString() === storyId);
          if (draggedStory) break;
        }
      }
    }
    
    setActiveStory(draggedStory);
  }, [stories, getCurrentBuckets]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveStory(null);

    if (!over) return;

    const storyId = active.id;
    const targetBucketId = over.id;

    // Capacity validation
    const currentBuckets = getCurrentBuckets();

    const targetBucket = currentBuckets.find(b => b.id === targetBucketId);
    if (!targetBucket) return;

    const storyEffort = (active.data?.current?.story?.effort) || (stories.find(s=>s.id.toString()===storyId)?.effort) || 0;
    const currentLoad = targetBucket.stories ? targetBucket.stories.reduce((sum, s) => sum + (s.effort || 0), 0) : 0;
    if (currentLoad + storyEffort > (targetBucket.capacity || 0)) {
      setSnackbar({
        open: true,
        message: `Cannot move story: '${targetBucket.title}' would exceed capacity (${currentLoad + storyEffort}/${targetBucket.capacity})`
      });
      return; // abort move
    }

    // Find the story being moved
    let storyToMove = null;
    let sourceBucketId = null;

    // Check if story is from backlog
    storyToMove = stories.find(story => story.id.toString() === storyId);
    if (storyToMove) {
      sourceBucketId = 'backlog';
    } else {
      // Find story in buckets
      for (const bucket of currentBuckets) {
        if (bucket.stories) {
          storyToMove = bucket.stories.find(story => story.id.toString() === storyId);
          if (storyToMove) {
            sourceBucketId = bucket.id;
            break;
          }
        }
      }
    }

    if (!storyToMove || sourceBucketId === targetBucketId) return;

    // Update bucket data
    pushHistory();

    setBuckets(prev => {
      const newBuckets = { ...prev };
      const currentHorizonBuckets = [...(newBuckets[activeTimeHorizon] || [])];
      
      // Remove story from source bucket (if not from backlog)
      if (sourceBucketId !== 'backlog') {
        const sourceBucketIndex = currentHorizonBuckets.findIndex(b => b.id === sourceBucketId);
        if (sourceBucketIndex !== -1) {
          currentHorizonBuckets[sourceBucketIndex] = {
            ...currentHorizonBuckets[sourceBucketIndex],
            stories: currentHorizonBuckets[sourceBucketIndex].stories.filter(s => s.id !== storyToMove.id)
          };
        }
      }
      
      // Add story to target bucket
      const targetBucketIndex = currentHorizonBuckets.findIndex(b => b.id === targetBucketId);
      if (targetBucketIndex !== -1) {
        currentHorizonBuckets[targetBucketIndex] = {
          ...currentHorizonBuckets[targetBucketIndex],
          stories: [...(currentHorizonBuckets[targetBucketIndex].stories || []), storyToMove]
        };
      }
      
      newBuckets[activeTimeHorizon] = currentHorizonBuckets;
      return newBuckets;
    });

    // Remove story from backlog if it was moved from there
    if (sourceBucketId === 'backlog') {
      setStories(prev => prev.filter(story => story.id !== storyToMove.id));
    }
  }, [activeTimeHorizon, stories, getCurrentBuckets, pushHistory]);

  const handleStoryMove = useCallback((story, targetBucketId) => {
    // Legacy handler - can be removed once TimeBuckets is fully integrated with DnD
    console.log('Legacy story move handler called', story, targetBucketId);
  }, []);

  const currentBuckets = getCurrentBuckets();

  // Export / Import helpers
  const handleExport = () => {
    const data = JSON.stringify({ buckets, stories }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bucket-planning-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.buckets && parsed.stories) {
          setBuckets(parsed.buckets);
          setStories(parsed.stories);
        } else {
          throw new Error('Invalid data');
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to import data: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            🗓️ Bucket-Size Planning
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Organize work into time horizons. Items move from long-term to short-term buckets as they become more concrete.
          </Typography>

          {/* Time Horizon Selector */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
              value={activeTimeHorizon}
              exclusive
              onChange={handleTimeHorizonChange}
              aria-label="time horizon selector"
              size={isMobile ? 'small' : 'medium'}
            >
              <ToggleButton value={TIME_HORIZONS.YEAR} aria-label="year view">
                <CalendarToday sx={{ mr: 1 }} />
                {!isMobile && 'Year'}
              </ToggleButton>
              <ToggleButton value={TIME_HORIZONS.QUARTER} aria-label="quarter view">
                <DateRange sx={{ mr: 1 }} />
                {!isMobile && 'Quarter'}
              </ToggleButton>
              <ToggleButton value={TIME_HORIZONS.MONTH} aria-label="month view">
                <Schedule sx={{ mr: 1 }} />
                {!isMobile && 'Month'}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Content Area */}
          <Grid item xs={12} lg={8}>
            {/* Bucket Grid Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: `repeat(${Math.min(currentBuckets.length, 3)}, 1fr)`
                },
                gap: 2
              }}>
                {currentBuckets.map((bucket) => (
                  <EnhancedDroppableBucket
                    key={bucket.id}
                    bucket={bucket}
                    onAddItem={handleAddItem}
                  />
                ))}
              </Box>
            </Box>

            {/* Story Backlog Section */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Story Backlog ({stories.length} stories)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {stories.length} stories available for planning
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: 2,
                minHeight: '600px',
                '@media (max-width: 900px)': {
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(6, 1fr)'
                },
                '@media (max-width: 600px)': {
                  gridTemplateColumns: '1fr',
                  gridTemplateRows: 'repeat(12, 1fr)'
                }
              }}>
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <DraggableStoryCard key={story.id} story={story} compact={true} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', gridColumn: '1 / -1', textAlign: 'center' }}>
                    No stories available. Add stories to begin planning.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* AI Bucket Optimization */}
            <Accordion defaultExpanded sx={{ mb: 3 }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="ai-optimization-content"
                id="ai-optimization-header"
                sx={{ 
                  bgcolor: 'secondary.light',
                  color: 'secondary.contrastText',
                  '&.Mui-expanded': {
                    minHeight: 48
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome />
                  <Typography variant="h6">AI Bucket Optimization</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                <AIOptimizationSuggestionsPanel
                  context="bucket-planning"
                  onSuggestionGenerated={handleGenerateOptimizations}
                  onSuggestionApplied={handleApplyOptimization}
                  isLoading={isOptimizing}
                  suggestions={suggestions}
                  error={optimizationError}
                  showAdvancedOptions={false}
                  maxHeight={300}
                  customActions={[
                    {
                      label: 'Optimize Buckets',
                      action: handleGenerateOptimizations,
                      icon: <AutoAwesome />,
                      disabled: isOptimizing
                    }
                  ]}
                />
              </AccordionDetails>
            </Accordion>
            
            <AIAgentsCapacity />
            <SprintIntegration />
          </Grid>
        </Grid>
        
        <DragOverlay>
          {activeStory ? (
            <StoryCard 
              story={activeStory} 
              isDragging={true}
              style={{ 
                transform: 'rotate(5deg)',
                opacity: 0.8
              }}
            />
          ) : null}
        </DragOverlay>

        {/* Export / Import buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleExport}>
            Export Data
          </Button>
          <Button variant="outlined" component="label">
            Import Data
            <input type="file" accept="application/json" hidden onChange={handleImport} />
          </Button>
        </Box>
      </Container>

      {/* Snackbar for capacity warnings */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setSnackbar({ open: false, message: '' })}
      >
        <Alert severity="warning" onClose={() => setSnackbar({ open: false, message: '' })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DndContext>
  );
};

// PropTypes for the main component
BucketPlanningTab.propTypes = {
  initialStories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    priority: PropTypes.oneOf(['high', 'medium', 'low']),
    effort: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    assignee: PropTypes.string
  })),
  bucketConfig: PropTypes.shape({
    year: PropTypes.array,
    quarter: PropTypes.array,
    month: PropTypes.array
  }),
  onStoriesUpdate: PropTypes.func,
  onBucketConfigUpdate: PropTypes.func
};

export default BucketPlanningTab; 