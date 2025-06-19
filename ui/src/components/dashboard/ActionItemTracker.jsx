import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  AvatarGroup,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  FilterList,
  Sort,
  CheckCircle,
  Schedule,
  Block,
  Assignment,
  Person,
  CalendarToday,
  Flag,
  Search,
  SelectAll,
  Clear,
  PlayArrow,
  Pause,
  Done,
  Error,
  Warning,
  Info,
  TrendingUp,
  Group
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PropTypes from 'prop-types';

/**
 * Individual Action Item Card Component
 */
const ActionItemCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onAssigneeChange,
  isSelected,
  onSelect,
  readOnly = false 
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <Assignment sx={{ color: 'info.main' }} />;
      case 'in-progress':
        return <PlayArrow sx={{ color: 'primary.main' }} />;
      case 'done':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'blocked':
        return <Block sx={{ color: 'error.main' }} />;
      default:
        return <Assignment />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'in-progress':
        return 'primary';
      case 'done':
        return 'success';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <Flag sx={{ color: 'error.main' }} />;
      case 'medium':
        return <Flag sx={{ color: 'warning.main' }} />;
      case 'low':
        return <Flag sx={{ color: 'info.main' }} />;
      default:
        return <Flag />;
    }
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    onEdit(item);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(item.id);
    handleMenuClose();
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(item.id, newStatus);
    handleMenuClose();
  };

  const isOverdue = () => {
    return new Date(item.dueDate) < new Date() && item.status !== 'done';
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
        borderColor: isOverdue() ? 'error.main' : (isSelected ? 'primary.main' : 'transparent'),
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelect(item.id, e.target.checked)}
            size="small"
          />
          {getStatusIcon(item.status)}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {item.description}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 'auto' }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {/* Metadata Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={item.status.replace('-', ' ')} 
              color={getStatusColor(item.status)}
              size="small"
              icon={getStatusIcon(item.status)}
            />
            <Chip 
              label={item.priority} 
              color={getPriorityColor(item.priority)}
              size="small"
              variant="outlined"
              icon={getPriorityIcon(item.priority)}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
              {item.assignee?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {item.assignee || 'Unassigned'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <CalendarToday fontSize="small" color="disabled" />
            <Typography 
              variant="caption" 
              color={isOverdue() ? 'error.main' : 'text.secondary'}
              sx={{ fontWeight: isOverdue() ? 600 : 400 }}
            >
              {isOverdue() ? 'Overdue' : `${getDaysUntilDue()} days`}
            </Typography>
          </Box>
        </Box>

        {/* Progress Bar for In-Progress Items */}
        {item.status === 'in-progress' && item.progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={item.progress || 0} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleStatusChange('new')}>
          <Assignment fontSize="small" sx={{ mr: 1 }} />
          Mark as New
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('in-progress')}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} />
          Mark In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('done')}>
          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
          Mark Done
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('blocked')}>
          <Block fontSize="small" sx={{ mr: 1 }} />
          Mark Blocked
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

ActionItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['new', 'in-progress', 'done', 'blocked']).isRequired,
    priority: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
    assignee: PropTypes.string,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    progress: PropTypes.number,
    retrospectiveId: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onAssigneeChange: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  readOnly: PropTypes.bool
};

/**
 * Action Item Dialog for Creating/Editing Action Items
 */
const ActionItemDialog = ({ 
  open, 
  onClose, 
  onSave, 
  item = null,
  availableAssignees = []
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('new');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setStatus(item.status || 'new');
      setPriority(item.priority || 'medium');
      setAssignee(item.assignee || '');
      setDueDate(new Date(item.dueDate) || new Date());
      setProgress(item.progress || 0);
    } else {
      setTitle('');
      setDescription('');
      setStatus('new');
      setPriority('medium');
      setAssignee('');
      setDueDate(new Date());
      setProgress(0);
    }
  }, [item, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    const itemData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee || 'Unassigned',
      dueDate,
      progress: status === 'in-progress' ? progress : 0
    };

    onSave(itemData);
    onClose();
  };

  const getDialogTitle = () => {
    return item ? 'Edit Action Item' : 'Create New Action Item';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Title"
                fullWidth
                variant="outlined"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={assignee}
                  label="Assignee"
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {availableAssignees.map((person) => (
                    <MenuItem key={person} value={person}>
                      {person}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <MUIDatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            {status === 'in-progress' && (
              <Grid item xs={12}>
                <Typography gutterBottom>Progress: {progress}%</Typography>
                <Box sx={{ px: 2 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!title.trim()}
          >
            {item ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

ActionItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  item: PropTypes.object,
  availableAssignees: PropTypes.array
};

/**
 * Filter and Sort Controls Component
 */
const FilterSortControls = ({ 
  filters, 
  onFiltersChange, 
  sortBy, 
  onSortChange,
  onClearFilters,
  itemCounts 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button
          startIcon={<FilterList />}
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? 'contained' : 'outlined'}
          size="small"
        >
          Filters
        </Button>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => onSortChange(e.target.value)}
          >
            <MenuItem value="dueDate">Due Date</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="assignee">Assignee</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          startIcon={<Clear />}
          onClick={onClearFilters}
          size="small"
          variant="text"
        >
          Clear Filters
        </Button>

        {/* Quick Status Filters */}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Chip 
            label={`New (${itemCounts.new})`} 
            color={filters.status === 'new' ? 'info' : 'default'}
            onClick={() => onFiltersChange({ ...filters, status: filters.status === 'new' ? 'all' : 'new' })}
            clickable
          />
          <Chip 
            label={`In Progress (${itemCounts.inProgress})`} 
            color={filters.status === 'in-progress' ? 'primary' : 'default'}
            onClick={() => onFiltersChange({ ...filters, status: filters.status === 'in-progress' ? 'all' : 'in-progress' })}
            clickable
          />
          <Chip 
            label={`Done (${itemCounts.done})`} 
            color={filters.status === 'done' ? 'success' : 'default'}
            onClick={() => onFiltersChange({ ...filters, status: filters.status === 'done' ? 'all' : 'done' })}
            clickable
          />
          <Chip 
            label={`Blocked (${itemCounts.blocked})`} 
            color={filters.status === 'blocked' ? 'error' : 'default'}
            onClick={() => onFiltersChange({ ...filters, status: filters.status === 'blocked' ? 'all' : 'blocked' })}
            clickable
          />
        </Box>
      </Box>

      {showFilters && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={filters.assignee}
                  label="Assignee"
                  onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value })}
                >
                  <MenuItem value="all">All Assignees</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                  <MenuItem value="John Doe">John Doe</MenuItem>
                  <MenuItem value="Jane Smith">Jane Smith</MenuItem>
                  <MenuItem value="Mike Johnson">Mike Johnson</MenuItem>
                  <MenuItem value="Sarah Wilson">Sarah Wilson</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Due Date</InputLabel>
                <Select
                  value={filters.dueDate}
                  label="Due Date"
                  onChange={(e) => onFiltersChange({ ...filters, dueDate: e.target.value })}
                >
                  <MenuItem value="all">All Dates</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="today">Due Today</MenuItem>
                  <MenuItem value="thisWeek">This Week</MenuItem>
                  <MenuItem value="nextWeek">Next Week</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

FilterSortControls.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  itemCounts: PropTypes.object.isRequired
};

/**
 * Main ActionItemTracker Component
 */
const ActionItemTracker = ({ 
  initialItems = [],
  onItemsChange,
  readOnly = false,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [items, setItems] = useState(initialItems);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Filter and sort state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all'
  });
  const [sortBy, setSortBy] = useState('dueDate');

  // Available assignees for dropdown
  const availableAssignees = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'];

  // Initialize with sample data for development
  useEffect(() => {
    if (initialItems.length === 0) {
      const sampleItems = [
        {
          id: 'action-1',
          title: 'Improve code review process',
          description: 'Implement checklist and reduce review time from 2 days to 1 day',
          status: 'in-progress',
          priority: 'high',
          assignee: 'John Doe',
          dueDate: new Date('2024-12-30'),
          progress: 60,
          retrospectiveId: 'retro-1',
          createdAt: new Date('2024-12-15')
        },
        {
          id: 'action-2',
          title: 'Set up automated testing',
          description: 'Reduce manual testing overhead by implementing unit tests',
          status: 'new',
          priority: 'medium',
          assignee: 'Jane Smith',
          dueDate: new Date('2025-01-15'),
          progress: 0,
          retrospectiveId: 'retro-1',
          createdAt: new Date('2024-12-15')
        },
        {
          id: 'action-3',
          title: 'Daily standup optimization',
          description: 'Reduce meeting time from 30 to 15 minutes',
          status: 'done',
          priority: 'low',
          assignee: 'Mike Johnson',
          dueDate: new Date('2024-12-10'),
          progress: 100,
          retrospectiveId: 'retro-2',
          createdAt: new Date('2024-12-01')
        },
        {
          id: 'action-4',
          title: 'Documentation update',
          description: 'Update API documentation with latest changes',
          status: 'blocked',
          priority: 'medium',
          assignee: 'Sarah Wilson',
          dueDate: new Date('2024-12-20'),
          progress: 25,
          retrospectiveId: 'retro-1',
          createdAt: new Date('2024-12-15')
        }
      ];
      setItems(sampleItems);
    }
  }, [initialItems]);

  // Notify parent component of changes
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(items);
    }
  }, [items, onItemsChange]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }
      
      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned' && item.assignee) {
          return false;
        }
        if (filters.assignee !== 'unassigned' && item.assignee !== filters.assignee) {
          return false;
        }
      }
      
      // Due date filter
      if (filters.dueDate !== 'all') {
        const today = new Date();
        const itemDueDate = new Date(item.dueDate);
        
        switch (filters.dueDate) {
          case 'overdue':
            if (itemDueDate >= today || item.status === 'done') return false;
            break;
          case 'today':
            if (itemDueDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'thisWeek':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (itemDueDate < today || itemDueDate > weekFromNow) return false;
            break;
          case 'nextWeek':
            const nextWeekStart = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            const nextWeekEnd = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            if (itemDueDate < nextWeekStart || itemDueDate > nextWeekEnd) return false;
            break;
        }
      }
      
      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { new: 1, 'in-progress': 2, blocked: 3, done: 4 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'assignee':
          return (a.assignee || 'Unassigned').localeCompare(b.assignee || 'Unassigned');
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, filters, sortBy]);

  // Calculate item counts for filter chips
  const itemCounts = useMemo(() => {
    return {
      new: items.filter(item => item.status === 'new').length,
      inProgress: items.filter(item => item.status === 'in-progress').length,
      done: items.filter(item => item.status === 'done').length,
      blocked: items.filter(item => item.status === 'blocked').length
    };
  }, [items]);

  // Event handlers
  const handleAddItem = useCallback(() => {
    if (readOnly) return;
    setEditingItem(null);
    setDialogOpen(true);
  }, [readOnly]);

  const handleEditItem = useCallback((item) => {
    if (readOnly) return;
    setEditingItem(item);
    setDialogOpen(true);
  }, [readOnly]);

  const handleDeleteItem = useCallback((itemId) => {
    if (readOnly) return;
    setItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setSnackbar({
      open: true,
      message: 'Action item deleted',
      severity: 'info'
    });
  }, [readOnly]);

  const handleStatusChange = useCallback((itemId, newStatus) => {
    if (readOnly) return;
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status: newStatus,
            progress: newStatus === 'done' ? 100 : (newStatus === 'new' ? 0 : item.progress)
          }
        : item
    ));
    setSnackbar({
      open: true,
      message: `Status updated to ${newStatus.replace('-', ' ')}`,
      severity: 'success'
    });
  }, [readOnly]);

  const handleAssigneeChange = useCallback((itemId, newAssignee) => {
    if (readOnly) return;
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, assignee: newAssignee }
        : item
    ));
  }, [readOnly]);

  const handleSaveItem = useCallback((itemData) => {
    if (editingItem) {
      // Update existing item
      setItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...itemData, updatedAt: new Date() }
          : item
      ));
      setSnackbar({
        open: true,
        message: 'Action item updated',
        severity: 'success'
      });
    } else {
      // Add new item
      const newItem = {
        id: `action-${Date.now()}`,
        ...itemData,
        createdAt: new Date()
      };
      setItems(prev => [...prev, newItem]);
      setSnackbar({
        open: true,
        message: 'Action item created',
        severity: 'success'
      });
    }
  }, [editingItem]);

  const handleSelectItem = useCallback((itemId, isSelected) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)));
    }
  }, [selectedItems.size, filteredAndSortedItems]);

  const handleBulkStatusChange = useCallback((newStatus) => {
    if (readOnly || selectedItems.size === 0) return;
    
    setItems(prev => prev.map(item => 
      selectedItems.has(item.id)
        ? { 
            ...item, 
            status: newStatus,
            progress: newStatus === 'done' ? 100 : (newStatus === 'new' ? 0 : item.progress)
          }
        : item
    ));
    
    setSnackbar({
      open: true,
      message: `Updated ${selectedItems.size} items to ${newStatus.replace('-', ' ')}`,
      severity: 'success'
    });
    
    setSelectedItems(new Set());
  }, [readOnly, selectedItems]);

  const handleBulkDelete = useCallback(() => {
    if (readOnly || selectedItems.size === 0) return;
    
    setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    
    setSnackbar({
      open: true,
      message: `Deleted ${selectedItems.size} action items`,
      severity: 'info'
    });
    
    setSelectedItems(new Set());
  }, [readOnly, selectedItems]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      assignee: 'all',
      dueDate: 'all'
    });
  }, []);

  return (
    <Box className={className}>
      {/* Header with Bulk Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            📋 Action Items
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage action items from retrospectives
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedItems.size > 0 && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleBulkStatusChange('done')}
                startIcon={<CheckCircle />}
              >
                Mark Done ({selectedItems.size})
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleBulkDelete}
                startIcon={<Delete />}
                color="error"
              >
                Delete ({selectedItems.size})
              </Button>
            </>
          )}
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddItem}
            disabled={readOnly}
          >
            Add Action Item
          </Button>
        </Box>
      </Box>

      {/* Filter and Sort Controls */}
      <FilterSortControls
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={handleClearFilters}
        itemCounts={itemCounts}
      />

      {/* Bulk Selection Controls */}
      {filteredAndSortedItems.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedItems.size === filteredAndSortedItems.length}
                indeterminate={selectedItems.size > 0 && selectedItems.size < filteredAndSortedItems.length}
                onChange={handleSelectAll}
              />
            }
            label={`Select All (${filteredAndSortedItems.length} items)`}
          />
          
          {selectedItems.size > 0 && (
            <Typography variant="body2" color="primary">
              {selectedItems.size} selected
            </Typography>
          )}
        </Box>
      )}

      {/* Action Items List */}
      <Box>
        {filteredAndSortedItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No action items found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {items.length === 0 
                ? 'Create your first action item to get started' 
                : 'Try adjusting your filters to see more items'
              }
            </Typography>
            {!readOnly && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
              >
                Add Action Item
              </Button>
            )}
          </Paper>
        ) : (
          filteredAndSortedItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
              isSelected={selectedItems.has(item.id)}
              onSelect={handleSelectItem}
              readOnly={readOnly}
            />
          ))
        )}
      </Box>

      {/* Action Item Dialog */}
      <ActionItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
        availableAssignees={availableAssignees}
      />

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

ActionItemTracker.propTypes = {
  initialItems: PropTypes.array,
  onItemsChange: PropTypes.func,
  readOnly: PropTypes.bool,
  className: PropTypes.string
};

export default ActionItemTracker;
