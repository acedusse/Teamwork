import React, { forwardRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import {
  DragIndicator,
  Flag,
  Person,
  Schedule,
  Label,
  Assignment
} from '@mui/icons-material';
import PropTypes from 'prop-types';

// Priority configuration with colors and icons
const PRIORITY_CONFIG = {
  high: {
    color: '#f44336', // Red
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    icon: <Flag fontSize="small" />,
    label: 'High Priority'
  },
  medium: {
    color: '#ff9800', // Orange
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800', 
    icon: <Flag fontSize="small" />,
    label: 'Medium Priority'
  },
  low: {
    color: '#4caf50', // Green
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    icon: <Flag fontSize="small" />,
    label: 'Low Priority'
  }
};

// Status configuration
const STATUS_CONFIG = {
  pending: { color: '#9e9e9e', label: 'Pending' },
  'in-progress': { color: '#2196f3', label: 'In Progress' },
  review: { color: '#ff9800', label: 'In Review' },
  done: { color: '#4caf50', label: 'Done' },
  blocked: { color: '#f44336', label: 'Blocked' },
  cancelled: { color: '#9e9e9e', label: 'Cancelled' }
};

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Helper function to truncate text
const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const StoryCard = forwardRef(({
  story,
  isDragging = false,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  showDragHandle = true,
  compact = false,
  className = '',
  ...props
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    id,
    title = 'Untitled Story',
    description = '',
    effort = 0,
    priority = 'medium',
    status = 'pending',
    assignee = '',
    tags = [],
    createdAt,
    updatedAt
  } = story || {};

  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const handleCardClick = (event) => {
    if (onClick) {
      onClick(story, event);
    }
  };

  const handleEditClick = (event) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(story, event);
    }
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(story, event);
    }
  };

  return (
    <Card
      ref={ref}
      className={className}
      onClick={handleCardClick}
      sx={{
        minHeight: compact ? 120 : 180,
        maxHeight: compact ? 200 : 300,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        borderLeft: `4px solid ${priorityConfig.borderColor}`,
        backgroundColor: isSelected ? theme.palette.action.selected : 'white',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg)' : 'none',
        '&:hover': {
          elevation: 4,
          transform: isDragging ? 'rotate(5deg)' : 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        },
        '&:active': {
          transform: isDragging ? 'rotate(5deg)' : 'translateY(0px)'
        },
        // Drag and drop data attributes
        '&[draggable="true"]': {
          cursor: 'grab'
        },
        '&[draggable="true"]:active': {
          cursor: 'grabbing'
        }
      }}
      elevation={isDragging ? 6 : 2}
      data-story-id={id}
      data-story-priority={priority}
      data-story-effort={effort}
      data-testid={`story-card-${id}`}
      {...props}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header with priority indicator and drag handle */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          {/* Priority Indicator */}
          <Tooltip title={priorityConfig.label}>
            <Chip
              icon={priorityConfig.icon}
              label={priority.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: priorityConfig.backgroundColor,
                color: priorityConfig.color,
                border: `1px solid ${priorityConfig.borderColor}`,
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />
          </Tooltip>

          {/* Drag Handle */}
          {showDragHandle && (
            <Tooltip title="Drag to move story">
              <IconButton
                size="small"
                sx={{ 
                  p: 0.5,
                  color: theme.palette.grey[500],
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' }
                }}
              >
                <DragIndicator fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Story Title */}
        <Typography 
          variant={compact ? "body1" : "h6"} 
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: compact ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
        </Typography>

        {/* Story Description */}
        {description && !compact && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {truncateText(description, isMobile ? 80 : 120)}
          </Typography>
        )}

        {/* Metadata Row */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mt: 'auto'
        }}>
          {/* Left side - Effort and Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Effort Points */}
            <Tooltip title="Story Points">
              <Chip
                icon={<Schedule fontSize="small" />}
                label={`${effort} pts`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Tooltip>

            {/* Status */}
            <Tooltip title={`Status: ${statusConfig.label}`}>
              <Chip
                icon={<Assignment fontSize="small" />}
                label={statusConfig.label}
                size="small"
                sx={{
                  backgroundColor: `${statusConfig.color}20`,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.color}`,
                  fontSize: '0.7rem'
                }}
              />
            </Tooltip>
          </Box>

          {/* Right side - Assignee */}
          {assignee && (
            <Tooltip title={`Assigned to: ${assignee}`}>
              <Avatar
                sx={{ 
                  width: 24, 
                  height: 24, 
                  fontSize: '0.7rem',
                  backgroundColor: theme.palette.primary.main
                }}
              >
                {getInitials(assignee)}
              </Avatar>
            </Tooltip>
          )}
        </Box>

        {/* Tags Section */}
        {tags && tags.length > 0 && !compact && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tags.slice(0, isMobile ? 2 : 4).map((tag, index) => (
              <Chip
                key={index}
                icon={<Label fontSize="small" />}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.6rem',
                  height: 20,
                  backgroundColor: theme.palette.grey[50]
                }}
              />
            ))}
            {tags.length > (isMobile ? 2 : 4) && (
              <Chip
                label={`+${tags.length - (isMobile ? 2 : 4)}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.6rem',
                  height: 20,
                  backgroundColor: theme.palette.grey[100]
                }}
              />
            )}
          </Box>
        )}

        {/* Compact mode tags (single row) */}
        {tags && tags.length > 0 && compact && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, overflow: 'hidden' }}>
            {tags.slice(0, 2).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.6rem',
                  height: 18,
                  backgroundColor: theme.palette.grey[50]
                }}
              />
            ))}
            {tags.length > 2 && (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                +{tags.length - 2}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

StoryCard.displayName = 'StoryCard';

StoryCard.propTypes = {
  story: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    effort: PropTypes.number,
    priority: PropTypes.oneOf(['high', 'medium', 'low']),
    status: PropTypes.oneOf(['pending', 'in-progress', 'review', 'done', 'blocked', 'cancelled']),
    assignee: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired,
  isDragging: PropTypes.bool,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showDragHandle: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string
};

export default StoryCard; 