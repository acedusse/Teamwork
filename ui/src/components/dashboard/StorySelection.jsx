import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Tooltip,
  Paper,
  Stack,
  Badge
} from '@mui/material';
import {
  Search,
  FilterList,
  Assignment,
  Person,
  Priority,
  Schedule,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  RadioButtonUnchecked,
  Star,
  StarBorder,
  Refresh
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

const StorySelection = ({ 
  stories, 
  selectedStories, 
  onSelectionChange, 
  teamCapacity,
  sprintGoal,
  velocityData 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showOnlyReady, setShowOnlyReady] = useState(false);

  // Calculate metrics
  const totalSelectedPoints = selectedStories.reduce((sum, story) => sum + (story.points || 0), 0);
  const capacityUtilization = teamCapacity > 0 ? (totalSelectedPoints / teamCapacity) * 100 : 0;
  const remainingCapacity = Math.max(0, teamCapacity - totalSelectedPoints);

  // Get unique values for filters
  const uniqueAssignees = [...new Set(stories.map(story => story.assignee).filter(Boolean))];
  const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };

  // Filter and search stories
  const filteredAvailableStories = useMemo(() => {
    return stories
      .filter(story => !selectedStories.find(selected => selected.id === story.id))
      .filter(story => {
        const matchesSearch = !searchTerm || 
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (story.tags && story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        
        const matchesPriority = priorityFilter === 'all' || story.priority === priorityFilter;
        const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || story.assignee === assigneeFilter;
        const matchesReady = !showOnlyReady || story.status === 'Ready';

        return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesReady;
      })
      .sort((a, b) => {
        // Sort by priority first, then by points
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return (b.points || 0) - (a.points || 0);
      });
  }, [stories, selectedStories, searchTerm, priorityFilter, statusFilter, assigneeFilter, showOnlyReady]);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag and drop
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const storyId = parseInt(active.id);
    const story = stories.find(s => s.id === storyId);

    if (!story) return;

    // Simple toggle selection for now
    const isSelected = selectedStories.find(s => s.id === storyId);
    if (isSelected) {
      onSelectionChange(selectedStories.filter(s => s.id !== storyId));
    } else {
      if (totalSelectedPoints + story.points <= teamCapacity * 1.2) { // Allow 20% over capacity
        onSelectionChange([...selectedStories, story]);
      }
    }
  };

  // Quick actions
  const selectHighPriorityStories = () => {
    const highPriorityStories = filteredAvailableStories
      .filter(story => story.priority === 'High')
      .slice(0, 5); // Limit to 5 stories
    
    const newSelected = [...selectedStories];
    highPriorityStories.forEach(story => {
      if (totalSelectedPoints + story.points <= teamCapacity * 1.1) {
        newSelected.push(story);
      }
    });
    onSelectionChange(newSelected);
  };

  const selectByCapacity = () => {
    const sortedStories = [...filteredAvailableStories].sort((a, b) => (a.points || 0) - (b.points || 0));
    const newSelected = [...selectedStories];
    let currentPoints = totalSelectedPoints;

    for (const story of sortedStories) {
      if (currentPoints + (story.points || 0) <= teamCapacity) {
        newSelected.push(story);
        currentPoints += story.points || 0;
      }
    }
    onSelectionChange(newSelected);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  // Story card component
  const StoryCard = ({ story, isSelected, ...props }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: story.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.8 : 1,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        variant="outlined"
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'primary.main' : 'grey.300',
          bgcolor: isSelected ? 'primary.light' : 'background.paper',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          }
        }}
        onClick={() => {
          if (isSelected) {
            onSelectionChange(selectedStories.filter(s => s.id !== story.id));
          } else {
            onSelectionChange([...selectedStories, story]);
          }
        }}
        {...props}
      >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`${story.points || 0}SP`} 
              size="small" 
              color="primary"
              sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
            />
            <Chip 
              label={story.priority || 'Medium'} 
              size="small" 
              color={
                story.priority === 'High' ? 'error' : 
                story.priority === 'Low' ? 'default' : 'warning'
              }
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
          <IconButton size="small" color={isSelected ? 'primary' : 'default'}>
            {isSelected ? <CheckCircle /> : <RadioButtonUnchecked />}
          </IconButton>
        </Box>
        
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
          {story.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3, mb: 1 }}>
          {story.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {story.tags?.slice(0, 3).map((tag, i) => (
              <Chip 
                key={i} 
                label={tag} 
                size="small" 
                variant="outlined" 
                sx={{ fontSize: '0.7rem', height: 20 }} 
              />
            ))}
            {story.tags?.length > 3 && (
              <Chip 
                label={`+${story.tags.length - 3}`} 
                size="small" 
                variant="outlined" 
                sx={{ fontSize: '0.7rem', height: 20 }} 
              />
            )}
          </Box>
          
          {story.assignee && (
            <Tooltip title={story.assignee}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                {story.assignee.charAt(0)}
              </Avatar>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assignment />
        Story Selection
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select stories for your sprint and manage capacity allocation
      </Typography>

      {/* Capacity Overview */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Capacity Overview
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Selected: {totalSelectedPoints} / {teamCapacity} story points
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(capacityUtilization, 100)}
                color={capacityUtilization > 100 ? 'error' : capacityUtilization > 90 ? 'warning' : 'primary'}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {capacityUtilization.toFixed(1)}% capacity utilized
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${selectedStories.length} stories`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${remainingCapacity} SP remaining`}
                  color={remainingCapacity < 5 ? 'warning' : 'success'}
                  size="small"
                />
                {velocityData && (
                  <Chip
                    label={`Avg velocity: ${velocityData.averageVelocity} SP`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filters and Search
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Ready">Ready</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  label="Assignee"
                >
                  <MenuItem value="all">All</MenuItem>
                  {uniqueAssignees.map(assignee => (
                    <MenuItem key={assignee} value={assignee}>{assignee}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={showOnlyReady ? 'contained' : 'outlined'}
                  onClick={() => setShowOnlyReady(!showOnlyReady)}
                  startIcon={<CheckCircle />}
                >
                  Ready Only
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setPriorityFilter('all');
                    setStatusFilter('all');
                    setAssigneeFilter('all');
                    setShowOnlyReady(false);
                  }}
                  startIcon={<Refresh />}
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              onClick={selectHighPriorityStories}
              startIcon={<Priority />}
              disabled={filteredAvailableStories.filter(s => s.priority === 'High').length === 0}
            >
              Select High Priority
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={selectByCapacity}
              startIcon={<Schedule />}
              disabled={filteredAvailableStories.length === 0}
            >
              Auto-fill Capacity
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={clearSelection}
              color="error"
              disabled={selectedStories.length === 0}
            >
              Clear Selection
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Capacity Warning */}
      {capacityUtilization > 100 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Over Capacity:</strong> You've selected {totalSelectedPoints} story points, 
            which exceeds your team capacity of {teamCapacity} SP by {totalSelectedPoints - teamCapacity} SP.
            Consider removing some stories or increasing team capacity.
          </Typography>
        </Alert>
      )}

      {/* Story Lists */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={3}>
          {/* Available Stories */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, minHeight: '500px' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Available Stories
                  <Badge badgeContent={filteredAvailableStories.length} color="primary">
                    <Box />
                  </Badge>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {filteredAvailableStories.reduce((sum, story) => sum + (story.points || 0), 0)} SP total
                </Typography>
              </Typography>
              
              <SortableContext 
                items={filteredAvailableStories.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ minHeight: '400px', borderRadius: 1, p: 1 }}>
                  {filteredAvailableStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      isSelected={false}
                    />
                  ))}
                  
                  {filteredAvailableStories.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <Typography variant="body2">
                        {stories.length === 0 ? 'No stories available' : 'No stories match your filters'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </SortableContext>
            </Paper>
          </Grid>

          {/* Selected Stories */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, minHeight: '500px' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Selected Stories
                  <Badge badgeContent={selectedStories.length} color="primary">
                    <Box />
                  </Badge>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {totalSelectedPoints} SP total
                </Typography>
              </Typography>
              
              <SortableContext 
                items={selectedStories.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ minHeight: '400px', borderRadius: 1, p: 1 }}>
                  {selectedStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      isSelected={true}
                    />
                  ))}
                  
                  {selectedStories.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <Typography variant="body2">
                        Click stories to select them for the sprint
                      </Typography>
                      <ArrowBack sx={{ mt: 1, opacity: 0.5 }} />
                    </Box>
                  )}
                </Box>
              </SortableContext>
            </Paper>
          </Grid>
        </Grid>
      </DndContext>
    </Box>
  );
};

StorySelection.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    points: PropTypes.number,
    priority: PropTypes.string,
    status: PropTypes.string,
    assignee: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  })).isRequired,
  selectedStories: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  teamCapacity: PropTypes.number,
  sprintGoal: PropTypes.string,
  velocityData: PropTypes.shape({
    averageVelocity: PropTypes.number,
    lastSprintVelocity: PropTypes.number,
    sprintsAnalyzed: PropTypes.number
  })
};

export default StorySelection; 