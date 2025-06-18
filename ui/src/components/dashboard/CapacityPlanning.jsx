import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Tooltip,
  Paper,
  Stack,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  People, 
  Person, 
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Edit,
  Add,
  Remove,
  SwapHoriz,
  Timeline,
  Speed,
  Balance
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

const CapacityPlanning = ({ 
  teamMembers, 
  selectedStories, 
  teamAllocation, 
  onAllocationChange, 
  sprintDuration,
  sprintData,
  velocityData 
}) => {
  const [editingMember, setEditingMember] = useState(null);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedStoryForAllocation, setSelectedStoryForAllocation] = useState(null);

  // Calculate metrics
  const totalStoryPoints = selectedStories.reduce((sum, story) => sum + (story.points || 0), 0);
  const allocatedPoints = Object.values(teamAllocation).reduce((sum, points) => sum + points, 0);
  const unallocatedPoints = totalStoryPoints - allocatedPoints;

  // Calculate team member workloads
  const teamMemberWorkloads = useMemo(() => {
    return teamMembers.map(member => {
      const allocatedToMember = Object.entries(teamAllocation)
        .filter(([storyId, allocation]) => allocation.memberId === member.id)
        .reduce((sum, [storyId, allocation]) => sum + (allocation.points || 0), 0);
      
      const dailyCapacity = member.dailyCapacity || 6;
      const availability = member.availability || 1;
      const totalCapacity = dailyCapacity * sprintDuration * availability;
      const utilization = totalCapacity > 0 ? (allocatedToMember / totalCapacity) * 100 : 0;

      return {
        ...member,
        allocatedPoints: allocatedToMember,
        totalCapacity,
        utilization,
        remainingCapacity: Math.max(0, totalCapacity - allocatedToMember)
      };
    });
  }, [teamMembers, teamAllocation, sprintDuration]);

  // Get stories assigned to each member
  const getStoriesForMember = (memberId) => {
    return selectedStories.filter(story => {
      const allocation = teamAllocation[story.id];
      return allocation && allocation.memberId === memberId;
    });
  };

  // Handle story allocation
  const handleStoryAllocation = (storyId, memberId) => {
    const story = selectedStories.find(s => s.id === storyId);
    if (!story) return;

    if (memberId) {
      const newAllocation = {
        ...teamAllocation,
        [storyId]: {
          memberId,
          points: story.points || 0,
          percentage: 100
        }
      };
      onAllocationChange(newAllocation);
    } else {
      // Remove allocation
      const newAllocation = { ...teamAllocation };
      delete newAllocation[storyId];
      onAllocationChange(newAllocation);
    }
  };

  // Handle manual allocation
  const handleManualAllocation = (storyId, memberId, percentage = 100) => {
    const story = selectedStories.find(s => s.id === storyId);
    if (!story) return;

    const newAllocation = {
      ...teamAllocation,
      [storyId]: {
        memberId,
        points: Math.round((story.points || 0) * (percentage / 100)),
        percentage
      }
    };
    onAllocationChange(newAllocation);
  };

  // Auto-allocate stories based on capacity
  const autoAllocateStories = () => {
    const newAllocation = { ...teamAllocation };
    const availableMembers = [...teamMemberWorkloads].sort((a, b) => a.utilization - b.utilization);
    
    selectedStories.forEach(story => {
      if (!newAllocation[story.id]) {
        // Find member with lowest utilization who can handle this story
        const member = availableMembers.find(m => 
          m.remainingCapacity >= (story.points || 0)
        );
        
        if (member) {
          newAllocation[story.id] = {
            memberId: member.id,
            points: story.points || 0,
            percentage: 100
          };
          
          // Update member's remaining capacity for next iteration
          member.remainingCapacity -= story.points || 0;
          member.utilization = ((member.totalCapacity - member.remainingCapacity) / member.totalCapacity) * 100;
        }
      }
    });
    
    onAllocationChange(newAllocation);
  };

  // Clear all allocations
  const clearAllAllocations = () => {
    onAllocationChange({});
  };

  // Story allocation component
  const StoryAllocationCard = ({ story }) => {
    const allocation = teamAllocation[story.id];
    const assignedMember = allocation ? teamMembers.find(m => m.id === allocation.memberId) : null;
    
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {story.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip 
                  label={`${story.points || 0}SP`} 
                  size="small" 
                  color="primary"
                  sx={{ fontSize: '0.75rem' }}
                />
                <Chip 
                  label={story.priority || 'Medium'} 
                  size="small" 
                  color={story.priority === 'High' ? 'error' : story.priority === 'Low' ? 'default' : 'warning'}
                  sx={{ fontSize: '0.75rem' }}
                />
              </Box>
            </Box>
            {assignedMember && (
              <Tooltip title={assignedMember.name}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  <Person />
                </Avatar>
              </Tooltip>
            )}
          </Box>
          
          <FormControl fullWidth size="small">
            <InputLabel>Assign to Team Member</InputLabel>
            <Select
              value={allocation?.memberId || ''}
              onChange={(e) => handleStoryAllocation(story.id, e.target.value || null)}
              label="Assign to Team Member"
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {teamMembers.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 20, height: 20 }}>
                      <Person />
                    </Avatar>
                    {member.name}
                    <Typography variant="caption" color="text.secondary">
                      ({Math.round(teamMemberWorkloads.find(w => w.id === member.id)?.utilization || 0)}% utilized)
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Balance />
        Capacity Planning
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Allocate team members to stories and manage workload distribution
      </Typography>

      {/* Sprint Overview */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline />
            Sprint Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {sprintDuration || 14}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Days Duration
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {selectedStories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stories Selected
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {totalStoryPoints}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Story Points
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {teamMembers.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Team Members
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Allocation Summary */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed />
            Allocation Summary
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Allocated: {allocatedPoints} / {totalStoryPoints} story points
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalStoryPoints > 0 ? (allocatedPoints / totalStoryPoints) * 100 : 0}
                color={allocatedPoints === totalStoryPoints ? 'success' : 'primary'}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {totalStoryPoints > 0 ? ((allocatedPoints / totalStoryPoints) * 100).toFixed(1) : 0}% allocated
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={autoAllocateStories}
                  startIcon={<SwapHoriz />}
                  disabled={selectedStories.length === 0}
                >
                  Auto Allocate
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearAllAllocations}
                  color="error"
                  disabled={Object.keys(teamAllocation).length === 0}
                >
                  Clear All
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {unallocatedPoints > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{unallocatedPoints} story points</strong> are not yet allocated to team members.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Team Member Workloads */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {teamMemberWorkloads.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {member.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role || 'Developer'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => setEditingMember(member)}
                  >
                    <Edit />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Workload</Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {member.allocatedPoints} / {member.totalCapacity} SP
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(member.utilization, 100)}
                    color={
                      member.utilization > 100 ? 'error' :
                      member.utilization > 90 ? 'warning' : 'success'
                    }
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {member.utilization.toFixed(1)}% utilized
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Daily Capacity:</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {member.dailyCapacity || 6} SP/day
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Availability:</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {Math.round((member.availability || 1) * 100)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Stories Assigned:</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {getStoriesForMember(member.id).length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Story Allocation Interface */}
      <Grid container spacing={3}>
        {/* Story Allocation List */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment />
              Story Allocation
              <Badge badgeContent={selectedStories.length} color="primary">
                <Box />
              </Badge>
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Assign each story to a team member. Utilization percentages are shown to help balance workload.
            </Typography>
            
            {selectedStories.length > 0 ? (
              <Grid container spacing={2}>
                {selectedStories.map((story) => (
                  <Grid item xs={12} md={6} lg={4} key={story.id}>
                    <StoryAllocationCard story={story} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Assignment sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Stories Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please select stories in the Story Selection tab first
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onClose={() => setEditingMember(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Team Member Capacity
        </DialogTitle>
        <DialogContent>
          {editingMember && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Daily Capacity (Story Points)"
                type="number"
                value={editingMember.dailyCapacity || 6}
                onChange={(e) => setEditingMember({
                  ...editingMember,
                  dailyCapacity: parseInt(e.target.value) || 6
                })}
                sx={{ mb: 3 }}
                inputProps={{ min: 1, max: 20 }}
              />
              
              <Typography gutterBottom>
                Availability: {Math.round((editingMember.availability || 1) * 100)}%
              </Typography>
              <Slider
                value={(editingMember.availability || 1) * 100}
                onChange={(e, value) => setEditingMember({
                  ...editingMember,
                  availability: value / 100
                })}
                min={10}
                max={100}
                step={5}
                marks={[
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                Total Sprint Capacity: {Math.round((editingMember.dailyCapacity || 6) * sprintDuration * (editingMember.availability || 1))} SP
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingMember(null)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Update team member in parent component
              const updatedMembers = teamMembers.map(member =>
                member.id === editingMember.id ? editingMember : member
              );
              // This would need to be passed as a prop function
              setEditingMember(null);
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

CapacityPlanning.propTypes = {
  teamMembers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string,
    dailyCapacity: PropTypes.number,
    availability: PropTypes.number
  })).isRequired,
  selectedStories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    points: PropTypes.number,
    priority: PropTypes.string
  })).isRequired,
  teamAllocation: PropTypes.object.isRequired,
  onAllocationChange: PropTypes.func.isRequired,
  sprintDuration: PropTypes.number,
  sprintData: PropTypes.object,
  velocityData: PropTypes.shape({
    averageVelocity: PropTypes.number,
    lastSprintVelocity: PropTypes.number,
    sprintsAnalyzed: PropTypes.number
  })
};

export default CapacityPlanning; 