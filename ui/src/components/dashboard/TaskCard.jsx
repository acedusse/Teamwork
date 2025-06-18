import React, { useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider,
  AvatarGroup
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Person,
  Comment,
  Attachment,
  Schedule,
  Flag,
  CheckCircle,
  Warning,
  Block,
  Assignment,
  CalendarToday,
  TrendingUp,
  AccessTime,
  BugReport,
  Star,
  Link,
  Delete,
  ContentCopy,
  Visibility
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

// Priority color mapping
const PRIORITY_COLORS = {
  high: 'error',
  medium: 'warning', 
  low: 'success',
  critical: 'error'
};

// Priority icons
const PRIORITY_ICONS = {
  high: <Flag fontSize="small" />,
  medium: <Flag fontSize="small" />,
  low: <Flag fontSize="small" />,
  critical: <Warning fontSize="small" />
};

// Status color mapping
const STATUS_COLORS = {
  backlog: 'default',
  ready: 'info',
  development: 'primary',
  'code-review': 'secondary',
  testing: 'warning',
  done: 'success',
  blocked: 'error'
};

// Status icons
const STATUS_ICONS = {
  backlog: <Assignment fontSize="small" />,
  ready: <TrendingUp fontSize="small" />,
  development: <Edit fontSize="small" />,
  'code-review': <Visibility fontSize="small" />,
  testing: <BugReport fontSize="small" />,
  done: <CheckCircle fontSize="small" />,
  blocked: <Block fontSize="small" />
};

// Quick Actions Menu Component
const TaskCardMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  task,
  onEdit,
  onAssign,
  onComment,
  onCopy,
  onDelete,
  onViewDetails
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={onViewDetails}>
        <Visibility sx={{ mr: 1 }} />
        View Details
      </MenuItem>
      
      <MenuItem onClick={onEdit}>
        <Edit sx={{ mr: 1 }} />
        Edit Task
      </MenuItem>
      
      <MenuItem onClick={onAssign}>
        <Person sx={{ mr: 1 }} />
        Reassign
      </MenuItem>
      
      <MenuItem onClick={onComment}>
        <Comment sx={{ mr: 1 }} />
        Add Comment
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={onCopy}>
        <ContentCopy sx={{ mr: 1 }} />
        Copy Link
      </MenuItem>
      
      <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
        <Delete sx={{ mr: 1 }} />
        Delete Task
      </MenuItem>
    </Menu>
  );
};

TaskCardMenu.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired
};

// Main TaskCard Component
const TaskCard = ({
  task,
  column,
  isDragging = false,
  isSelected = false,
  showQuickActions = true,
  showProgress = true,
  showTags = true,
  showDueDate = true,
  showAssignee = true,
  showStoryPoints = true,
  compact = false,
  onClick,
  onEdit,
  onAssign,
  onComment,
  onDelete,
  onPriorityChange,
  onStatusChange,
  className,
  ...props
}) => {
  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDraggingFromKit
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // State management
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculated values
  const isMenuOpen = Boolean(menuAnchorEl);
  const hasAttachments = task.attachments && task.attachments.length > 0;
  const hasComments = task.comments && task.comments.length > 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isBlocked = task.blocked || task.status === 'blocked';
  const priorityColor = PRIORITY_COLORS[task.priority] || 'default';
  const statusColor = STATUS_COLORS[task.status] || 'default';
  const isDraggingState = isDragging || isDraggingFromKit;

  // Event handlers
  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleCardClick = useCallback((event) => {
    if (onClick && !isMenuOpen) {
      onClick(task, event);
    }
  }, [task, onClick, isMenuOpen]);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(task);
    }
    handleMenuClose();
  }, [task, onEdit, handleMenuClose]);

  const handleAssign = useCallback(() => {
    if (onAssign) {
      onAssign(task);
    }
    handleMenuClose();
  }, [task, onAssign, handleMenuClose]);

  const handleComment = useCallback(() => {
    if (onComment) {
      onComment(task);
    }
    handleMenuClose();
  }, [task, onComment, handleMenuClose]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/task/${task.id}`);
    handleMenuClose();
  }, [task.id, handleMenuClose]);

  const handleDelete = useCallback(() => {
    if (onDelete && window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      onDelete(task);
    }
    handleMenuClose();
  }, [task, onDelete, handleMenuClose]);

  const handleViewDetails = useCallback(() => {
    handleCardClick();
    handleMenuClose();
  }, [handleCardClick, handleMenuClose]);

  // Remove old drag handlers - now handled by @dnd-kit

  // Format due date
  const formatDueDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `${diffDays} days`;
    return `${Math.abs(diffDays)} days overdue`;
  }, []);

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      className={className}
      elevation={isDraggingState ? 8 : isHovered ? 3 : 1}
      sx={{
        p: compact ? 1.5 : 2,
        cursor: isDraggingState ? 'grabbing' : 'grab',
        transition: isDraggingState ? 'none' : 'all 0.2s ease-in-out',
        opacity: isDraggingState ? 0.5 : 1,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'transparent',
        position: 'relative',
        '&:hover': {
          transform: isDraggingState ? 'none' : 'translateY(-2px)',
          boxShadow: isDraggingState ? 'none' : 3
        },
        // Priority border indicator
        borderLeft: `4px solid`,
        borderLeftColor: `${priorityColor}.main`,
        // Blocked task styling
        ...(isBlocked && {
          backgroundColor: 'error.light',
          opacity: isDraggingState ? 0.3 : 0.7
        }),
        // Overdue task styling
        ...(isOverdue && {
          backgroundColor: 'warning.light'
        }),
        // Dragging state styling
        ...(isDraggingState && {
          zIndex: 1000,
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
        }),
        ...props.sx
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      {...attributes}
      {...listeners}
      {...props}
    >
      {/* Remove status indicator since cards are already in status columns */}

      {/* Quick Actions Menu Button */}
      {showQuickActions && (isHovered || isMenuOpen) && (
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{ 
            position: 'absolute',
            top: compact ? 4 : 8,
            right: compact ? 4 : 8,
            backgroundColor: 'background.paper',
            boxShadow: 1,
            '&:hover': { backgroundColor: 'action.hover' }
          }}
          aria-label="Task actions"
        >
          <MoreVert fontSize="small" />
        </IconButton>
      )}

      {/* Blocked/Priority indicators */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        {isBlocked && (
          <Tooltip title="Task is blocked">
            <Block color="error" sx={{ fontSize: 16 }} />
          </Tooltip>
        )}
        {task.priority === 'critical' && (
          <Tooltip title="Critical priority">
            <Star color="error" sx={{ fontSize: 16 }} />
          </Tooltip>
        )}
        {isOverdue && (
          <Tooltip title="Task is overdue">
            <AccessTime color="warning" sx={{ fontSize: 16 }} />
          </Tooltip>
        )}
      </Box>

      {/* Task ID and Title */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.75rem'
          }}
        >
          {task.id || 'TASK-001'}
        </Typography>
        {task.priority === 'high' && (
          <Chip 
            label="HIGH" 
            size="small" 
            color="error" 
            sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600 }}
          />
        )}
      </Box>
      
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600, 
          mb: 1,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {task.title}
      </Typography>

      {/* Task Description */}
      {!compact && task.description && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4
          }}
        >
          {task.description}
        </Typography>
      )}

      {/* Progress Bar */}
      {showProgress && task.progress !== undefined && task.progress > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {task.progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={task.progress} 
            sx={{ height: 4, borderRadius: 2 }}
            color={task.progress === 100 ? 'success' : 'primary'}
          />
        </Box>
      )}

      {/* Tags */}
      {showTags && task.tags && task.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {task.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
          {task.tags.length > (compact ? 2 : 3) && (
            <Chip
              label={`+${task.tags.length - (compact ? 2 : 3)}`}
              size="small"
              variant="outlined"
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </Box>
      )}

      {/* Assignee and Epic Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {showAssignee && task.assignee && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Avatar 
              sx={{ 
                width: 20, 
                height: 20, 
                fontSize: '0.7rem',
                bgcolor: task.assignee.color
              }}
            >
              {task.assignee.avatar}
            </Avatar>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {task.assignee.name}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Epic and Story Points */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 1
      }}>
        {/* Epic label */}
        {task.epic && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            Epic: {task.epic}
          </Typography>
        )}
        
        {/* Story Points */}
        {showStoryPoints && task.storyPoints && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {task.storyPoints} SP
          </Typography>
        )}
      </Box>

      {/* Quick Actions Menu */}
      <TaskCardMenu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        task={task}
        onEdit={handleEdit}
        onAssign={handleAssign}
        onComment={handleComment}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />
    </Paper>
  );
};

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    assignee: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired
    }),
    assignees: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired
    })),
    priority: PropTypes.oneOf(['low', 'medium', 'high', 'critical']).isRequired,
    status: PropTypes.string.isRequired,
    storyPoints: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    dueDate: PropTypes.string,
    progress: PropTypes.number,
    blocked: PropTypes.bool,
    attachments: PropTypes.array,
    comments: PropTypes.array
  }).isRequired,
  column: PropTypes.object,
  isDragging: PropTypes.bool,
  isSelected: PropTypes.bool,
  showQuickActions: PropTypes.bool,
  showProgress: PropTypes.bool,
  showTags: PropTypes.bool,
  showDueDate: PropTypes.bool,
  showAssignee: PropTypes.bool,
  showStoryPoints: PropTypes.bool,
  compact: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onAssign: PropTypes.func,
  onComment: PropTypes.func,
  onDelete: PropTypes.func,
  onPriorityChange: PropTypes.func,
  onStatusChange: PropTypes.func,
  className: PropTypes.string
};

export default TaskCard; 