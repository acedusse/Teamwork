import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Badge
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Remove as RemoveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Priority colors matching the existing theme
const PRIORITY_COLORS = {
  high: { color: '#d32f2f', bg: '#ffebee' },
  medium: { color: '#f57c00', bg: '#fff3e0' },
  low: { color: '#388e3c', bg: '#e8f5e8' }
};

// Draggable Task Component
function DraggableTask({ task, isInSprint = false, onRemoveFromSprint = null }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  const handleRemoveFromSprint = (e) => {
    e.stopPropagation();
    if (onRemoveFromSprint) {
      onRemoveFromSprint(task.id);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        border: isDragging ? '2px dashed #2196f3' : '1px solid #e0e0e0',
        backgroundColor: isDragging ? '#f5f5f5' : 'white',
        '&:hover': {
          boxShadow: 2,
          borderColor: '#2196f3'
        }
      }}
      {...attributes}
      {...listeners}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <DragIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Task Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                #{task.id}
              </Typography>
              <Chip
                label={task.priority}
                size="small"
                sx={{
                  backgroundColor: priorityColor.bg,
                  color: priorityColor.color,
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
              <Chip
                label={task.status}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>

            {/* Task Title */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {task.title}
            </Typography>

            {/* Task Description */}
            {task.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {task.description}
              </Typography>
            )}

            {/* Task Metadata */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {task.subtasks && task.subtasks.length > 0 && (
                <Chip
                  icon={<AssignmentIcon />}
                  label={`${task.subtasks.length} subtasks`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              {task.dependencies && task.dependencies.length > 0 && (
                <Chip
                  icon={<FlagIcon />}
                  label={`${task.dependencies.length} deps`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Stack>
          </Box>

          {/* Remove from Sprint Button */}
          {isInSprint && onRemoveFromSprint && (
            <Tooltip title="Remove from sprint">
              <IconButton
                size="small"
                onClick={handleRemoveFromSprint}
                sx={{ color: 'error.main' }}
              >
                <RemoveIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Droppable Sprint Zone
function DroppableSprintZone({ sprint, tasks, onRemoveFromSprint }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `sprint-${sprint.id}`,
  });

  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        p: 2,
        minHeight: 200,
        backgroundColor: isOver ? '#e3f2fd' : 'background.paper',
        border: isOver ? '2px dashed #2196f3' : '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {sprint.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
          }).format(new Date(sprint.startDate))} - {new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
          }).format(new Date(sprint.endDate))}
        </Typography>
        <Badge badgeContent={sprintTasks.length} color="primary">
          <Chip
            label="Tasks"
            size="small"
            variant="outlined"
          />
        </Badge>
      </Box>

      {isOver && sprintTasks.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 100,
            border: '2px dashed #2196f3',
            borderRadius: 1,
            backgroundColor: '#f5f5f5'
          }}
        >
          <Typography variant="body2" color="primary">
            Drop task here to assign to sprint
          </Typography>
        </Box>
      )}

      <SortableContext items={sprintTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {sprintTasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            isInSprint={true}
            onRemoveFromSprint={onRemoveFromSprint}
          />
        ))}
      </SortableContext>
    </Paper>
  );
}

// Droppable Backlog Zone
function DroppableBacklog({ tasks }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog',
  });

  const backlogTasks = tasks.filter(task => !task.sprintId);

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        p: 2,
        minHeight: 400,
        backgroundColor: isOver ? '#fff3e0' : 'background.paper',
        border: isOver ? '2px dashed #f57c00' : '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Product Backlog
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Drag tasks to sprints to assign them
        </Typography>
        <Badge badgeContent={backlogTasks.length} color="warning">
          <Chip
            label="Unassigned Tasks"
            size="small"
            variant="outlined"
          />
        </Badge>
      </Box>

      {backlogTasks.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            border: '1px dashed #ccc',
            borderRadius: 1,
            backgroundColor: '#f9f9f9'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            All tasks are assigned to sprints
          </Typography>
        </Box>
      ) : (
        <SortableContext items={backlogTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {backlogTasks.map(task => (
            <DraggableTask
              key={task.id}
              task={task}
              isInSprint={false}
            />
          ))}
        </SortableContext>
      )}
    </Paper>
  );
}

export default function TaskSprintAssignment({ 
  tasks = [], 
  sprints = [], 
  loading = false,
  onTaskAssign = null,
  onTaskUnassign = null 
}) {
  const [activeTask, setActiveTask] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine the target
    if (over.id === 'backlog') {
      // Moving to backlog (unassigning)
      if (task.sprintId && onTaskUnassign) {
        onTaskUnassign(taskId, task.sprintId);
      }
    } else if (over.id.startsWith('sprint-')) {
      // Moving to a sprint
      const sprintId = parseInt(over.id.replace('sprint-', ''));
      if (task.sprintId !== sprintId && onTaskAssign) {
        onTaskAssign(taskId, sprintId, task.sprintId);
      }
    }
  }, [tasks, onTaskAssign, onTaskUnassign]);

  const handleRemoveFromSprint = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.sprintId && onTaskUnassign) {
      onTaskUnassign(taskId, task.sprintId);
    }
  }, [tasks, onTaskUnassign]);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {[1, 2].map(i => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="rectangular" height={200} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (sprints.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Create sprints first to assign tasks to them.
      </Alert>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Grid container spacing={3}>
        {/* Backlog */}
        <Grid item xs={12} md={4}>
          <DroppableBacklog tasks={tasks} />
        </Grid>

        {/* Sprints */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {sprints.map(sprint => (
              <Grid item xs={12} sm={6} key={sprint.id}>
                <DroppableSprintZone
                  sprint={sprint}
                  tasks={tasks}
                  onRemoveFromSprint={handleRemoveFromSprint}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <Card sx={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2">
                #{activeTask.id} - {activeTask.title}
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 