import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Badge,
  Divider
} from '@mui/material';
import {
  Add,
  MoreVert,
  Warning,
  Edit,
  Delete,
  Settings,
  Clear,
  Archive,
  FilterList,
  SortByAlpha
} from '@mui/icons-material';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PropTypes from 'prop-types';

// Column Settings Dialog Component
const ColumnSettingsDialog = ({ 
  open, 
  onClose, 
  column, 
  onColumnUpdate 
}) => {
  const [editedColumn, setEditedColumn] = useState(column);

  const handleSave = () => {
    onColumnUpdate(editedColumn);
    onClose();
  };

  const handleReset = () => {
    setEditedColumn(column);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Column Settings - {column.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Column Title"
            value={editedColumn.title}
            onChange={(e) => setEditedColumn(prev => ({ ...prev, title: e.target.value }))}
            fullWidth
          />
          
          <TextField
            label="Description"
            value={editedColumn.description}
            onChange={(e) => setEditedColumn(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={2}
            fullWidth
          />
          
          <TextField
            label="Icon (emoji)"
            value={editedColumn.icon}
            onChange={(e) => setEditedColumn(prev => ({ ...prev, icon: e.target.value }))}
            fullWidth
            inputProps={{ maxLength: 2 }}
          />
          
          <TextField
            label="WIP Limit"
            type="number"
            value={editedColumn.wipLimit || ''}
            onChange={(e) => setEditedColumn(prev => ({ 
              ...prev, 
              wipLimit: e.target.value ? parseInt(e.target.value) : null 
            }))}
            fullWidth
            helperText="Leave empty for no limit"
          />
          
          <TextField
            label="Background Color"
            value={editedColumn.color}
            onChange={(e) => setEditedColumn(prev => ({ ...prev, color: e.target.value }))}
            fullWidth
            type="color"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

ColumnSettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  column: PropTypes.object.isRequired,
  onColumnUpdate: PropTypes.func.isRequired
};

// Column Actions Menu Component
const ColumnActionsMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  column,
  taskCount,
  onAddTask,
  onClearTasks,
  onArchiveTasks,
  onEditColumn,
  onDeleteColumn,
  onFilterColumn
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={onAddTask}>
        <Add sx={{ mr: 1 }} />
        Add Task
      </MenuItem>
      
      <MenuItem onClick={onFilterColumn}>
        <FilterList sx={{ mr: 1 }} />
        Filter Tasks
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={onEditColumn}>
        <Edit sx={{ mr: 1 }} />
        Edit Column
      </MenuItem>
      
      {taskCount > 0 && (
        <>
          <MenuItem onClick={onClearTasks}>
            <Clear sx={{ mr: 1 }} />
            Clear All Tasks
          </MenuItem>
          
          <MenuItem onClick={onArchiveTasks}>
            <Archive sx={{ mr: 1 }} />
            Archive Completed
          </MenuItem>
        </>
      )}
      
      <Divider />
      
      <MenuItem onClick={onDeleteColumn} sx={{ color: 'error.main' }}>
        <Delete sx={{ mr: 1 }} />
        Delete Column
      </MenuItem>
    </Menu>
  );
};

ColumnActionsMenu.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  column: PropTypes.object.isRequired,
  taskCount: PropTypes.number.isRequired,
  onAddTask: PropTypes.func.isRequired,
  onClearTasks: PropTypes.func.isRequired,
  onArchiveTasks: PropTypes.func.isRequired,
  onEditColumn: PropTypes.func.isRequired,
  onDeleteColumn: PropTypes.func.isRequired,
  onFilterColumn: PropTypes.func.isRequired
};

// Main KanbanColumn Component
const KanbanColumn = ({
  column,
  tasks = [],
  wipViolation = 0,
  isDropZone = false,
  isDragOver = false,
  onTaskDrop,
  onTaskClick,
  onAddTask,
  onColumnUpdate,
  onColumnDelete,
  renderTaskCard,
  className,
  ...props
}) => {
  // Droppable setup
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column
    }
  });

  // State management
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculated values
  const taskCount = tasks.length;
  const isWipViolated = wipViolation > 0;
  const isMenuOpen = Boolean(menuAnchorEl);
  const hasWipLimit = column.wipLimit !== null && column.wipLimit !== undefined;
  const taskIds = tasks.map(task => task.id);

  // Event handlers
  const handleMenuOpen = useCallback((event) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleEditColumn = useCallback(() => {
    setSettingsOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleColumnUpdate = useCallback((updatedColumn) => {
    if (onColumnUpdate) {
      onColumnUpdate(updatedColumn);
    }
  }, [onColumnUpdate]);

  const handleAddTask = useCallback(() => {
    if (onAddTask) {
      onAddTask(column.id);
    }
    handleMenuClose();
  }, [column.id, onAddTask, handleMenuClose]);

  const handleClearTasks = useCallback(() => {
    console.log(`Clear all tasks from ${column.title}`);
    // TODO: Implement clear tasks functionality
    handleMenuClose();
  }, [column.title, handleMenuClose]);

  const handleArchiveTasks = useCallback(() => {
    console.log(`Archive completed tasks from ${column.title}`);
    // TODO: Implement archive tasks functionality
    handleMenuClose();
  }, [column.title, handleMenuClose]);

  const handleDeleteColumn = useCallback(() => {
    if (onColumnDelete && window.confirm(`Are you sure you want to delete the "${column.title}" column?`)) {
      onColumnDelete(column.id);
    }
    handleMenuClose();
  }, [column.id, column.title, onColumnDelete, handleMenuClose]);

  const handleFilterColumn = useCallback(() => {
    console.log(`Filter tasks in ${column.title}`);
    // TODO: Implement column-specific filtering
    handleMenuClose();
  }, [column.title, handleMenuClose]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Old drag handlers removed - now handled by @dnd-kit

  return (
    <Box
      ref={setNodeRef}
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: column.color,
        borderRadius: 2,
        p: 2,
        minHeight: '300px',
        border: isOver ? '2px solid' : '1px solid transparent',
        borderColor: isOver ? 'primary.main' : 'transparent',
        transition: 'all 0.2s ease-in-out',
        opacity: isCollapsed ? 0.7 : 1,
        // Enhanced visual feedback for drop zone
        ...(isOver && {
          backgroundColor: 'action.hover',
          transform: 'scale(1.02)'
        }),
        ...props.sx
      }}
    >
      {/* Column Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2,
        cursor: 'pointer'
      }}
      onClick={handleToggleCollapse}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
            {column.icon}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {column.title}
          </Typography>
          <Badge
            badgeContent={taskCount}
            color={isWipViolated ? 'error' : 'primary'}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: isWipViolated ? 'error.main' : 'primary.main',
                color: 'white'
              }
            }}
          >
            <Chip 
              label={taskCount}
              size="small"
              color={isWipViolated ? 'error' : 'default'}
              variant={isWipViolated ? 'filled' : 'outlined'}
            />
          </Badge>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {hasWipLimit && (
            <Tooltip title={`WIP Limit: ${column.wipLimit}${isWipViolated ? ` (${wipViolation} over)` : ''}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isWipViolated && (
                  <Warning color="error" sx={{ fontSize: 16 }} />
                )}
                <Typography 
                  variant="caption" 
                  color={isWipViolated ? 'error.main' : 'text.secondary'}
                  sx={{ fontWeight: isWipViolated ? 600 : 400 }}
                >
                  {taskCount}/{column.wipLimit}
                </Typography>
              </Box>
            </Tooltip>
          )}
          
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e);
            }}
            sx={{ ml: 0.5 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* WIP Limit Warning */}
      {isWipViolated && (
        <Box sx={{ 
          mb: 2, 
          p: 1, 
          backgroundColor: 'error.light', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Warning color="error" sx={{ fontSize: 16 }} />
          <Typography variant="caption" color="error.dark">
            WIP limit exceeded by {wipViolation} task{wipViolation > 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* Column Description */}
      {!isCollapsed && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mb: 2, fontStyle: 'italic' }}
        >
          {column.description}
        </Typography>
      )}

      {/* Task Cards Area */}
      {!isCollapsed && (
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minHeight: 200
          }}>
            {taskCount === 0 ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                border: '2px dashed',
                borderColor: isOver ? 'primary.main' : 'divider',
                borderRadius: 1,
                color: 'text.secondary',
                backgroundColor: isOver ? 'action.hover' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <Typography variant="body2">
                  {isOver ? 'Drop task here' : 'No tasks'}
                </Typography>
              </Box>
            ) : (
              tasks.map((task) => (
                renderTaskCard ? 
                  renderTaskCard(task, column) : 
                  <Paper
                    key={task.id}
                    elevation={1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => onTaskClick && onTaskClick(task)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                  </Paper>
              ))
            )}
          </Box>
        </SortableContext>
      )}

      {/* Add Task Button */}
      {!isCollapsed && (
        <Button
          variant="outlined"
          startIcon={<Add />}
          size="small"
          sx={{ mt: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            handleAddTask();
          }}
          disabled={hasWipLimit && taskCount >= column.wipLimit}
        >
          Add Task
        </Button>
      )}

      {/* Column Actions Menu */}
      <ColumnActionsMenu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        column={column}
        taskCount={taskCount}
        onAddTask={handleAddTask}
        onClearTasks={handleClearTasks}
        onArchiveTasks={handleArchiveTasks}
        onEditColumn={handleEditColumn}
        onDeleteColumn={handleDeleteColumn}
        onFilterColumn={handleFilterColumn}
      />

      {/* Column Settings Dialog */}
      <ColumnSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        column={column}
        onColumnUpdate={handleColumnUpdate}
      />
    </Box>
  );
};

KanbanColumn.propTypes = {
  column: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    color: PropTypes.string,
    wipLimit: PropTypes.number
  }).isRequired,
  tasks: PropTypes.array,
  wipViolation: PropTypes.number,
  isDropZone: PropTypes.bool,
  isDragOver: PropTypes.bool,
  onTaskDrop: PropTypes.func,
  onTaskClick: PropTypes.func,
  onAddTask: PropTypes.func,
  onColumnUpdate: PropTypes.func,
  onColumnDelete: PropTypes.func,
  renderTaskCard: PropTypes.func,
  className: PropTypes.string
};

export default KanbanColumn; 