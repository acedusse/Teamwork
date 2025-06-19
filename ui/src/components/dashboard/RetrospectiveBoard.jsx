import React, { useState, useCallback, useEffect } from 'react';
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
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  Radio,
  FormLabel,
  Checkbox,
  ButtonGroup
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ThumbUp,
  MoreVert,
  PlayArrow,
  Stop,
  Repeat,
  Person,
  Schedule,
  Flag,
  Timer,
  Settings,
  ViewModule,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Speed,
  Sailing,
  Timeline,
  School,
  Star,
  StarBorder,
  HowToVote,
  VisibilityOff,
  Visibility,
  ExpandMore,
  Assignment,
  AutoAwesome,
  Refresh,
  Download,
  Share,
  Psychology
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  rectIntersection
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

// Retrospective Templates Configuration
const RETROSPECTIVE_TEMPLATES = {
  'start-stop-continue': {
    name: 'Start, Stop, Continue',
    description: 'Classic retrospective format focusing on what to start, stop, and continue doing',
    icon: <PlayArrow />,
    columns: [
      { id: 'start', title: 'Start', color: 'success', icon: <PlayArrow />, description: 'What should we start doing?' },
      { id: 'stop', title: 'Stop', color: 'error', icon: <Stop />, description: 'What should we stop doing?' },
      { id: 'continue', title: 'Continue', color: 'primary', icon: <Repeat />, description: 'What should we continue doing?' }
    ]
  },
  '4ls': {
    name: '4 Ls (Liked, Learned, Lacked, Longed for)',
    description: 'Comprehensive retrospective covering what was liked, learned, lacked, and longed for',
    icon: <School />,
    columns: [
      { id: 'liked', title: 'Liked', color: 'success', icon: <ThumbUp />, description: 'What did we like about this sprint?' },
      { id: 'learned', title: 'Learned', color: 'info', icon: <School />, description: 'What did we learn?' },
      { id: 'lacked', title: 'Lacked', color: 'warning', icon: <TrendingDown />, description: 'What was missing or lacking?' },
      { id: 'longed', title: 'Longed for', color: 'secondary', icon: <Star />, description: 'What did we wish we had?' }
    ]
  },
  'sailboat': {
    name: 'Sailboat',
    description: 'Visual metaphor using wind (helping factors) and anchors (hindering factors)',
    icon: <Sailing />,
    columns: [
      { id: 'wind', title: 'Wind', color: 'success', icon: <TrendingUp />, description: 'What helped us move forward?' },
      { id: 'anchors', title: 'Anchors', color: 'error', icon: <TrendingDown />, description: 'What slowed us down?' },
      { id: 'rocks', title: 'Rocks', color: 'warning', icon: <Flag />, description: 'What risks do we see ahead?' },
      { id: 'island', title: 'Island', color: 'primary', icon: <Star />, description: 'What is our goal/destination?' }
    ]
  },
  'timeline': {
    name: 'Timeline',
    description: 'Chronological reflection on events during the sprint',
    icon: <Timeline />,
    columns: [
      { id: 'week1', title: 'Week 1', color: 'primary', icon: <Schedule />, description: 'What happened in week 1?' },
      { id: 'week2', title: 'Week 2', color: 'secondary', icon: <Schedule />, description: 'What happened in week 2?' },
      { id: 'overall', title: 'Overall', color: 'success', icon: <Timeline />, description: 'Overall observations' }
    ]
  },
  'mad-sad-glad': {
    name: 'Mad, Sad, Glad',
    description: 'Emotional retrospective focusing on feelings about the sprint',
    icon: <Psychology />,
    columns: [
      { id: 'mad', title: 'Mad', color: 'error', icon: <TrendingDown />, description: 'What made us frustrated?' },
      { id: 'sad', title: 'Sad', icon: <TrendingDown />, description: 'What disappointed us?' },
      { id: 'glad', title: 'Glad', color: 'success', icon: <ThumbUp />, description: 'What made us happy?' }
    ]
  }
};

// Voting Systems Configuration
const VOTING_SYSTEMS = {
  simple: {
    name: 'Simple Voting',
    description: 'One vote per person per item',
    maxVotes: 1,
    allowMultiple: false
  },
  dot: {
    name: 'Dot Voting',
    description: 'Multiple votes per person (3-5 dots)',
    maxVotes: 5,
    allowMultiple: true
  },
  weighted: {
    name: 'Weighted Voting',
    description: 'Distribute points across items (10 points total)',
    maxVotes: 10,
    allowMultiple: true,
    weighted: true
  },
  anonymous: {
    name: 'Anonymous Voting',
    description: 'Votes are not attributed to individuals',
    maxVotes: 3,
    allowMultiple: true,
    anonymous: true
  }
};

/**
 * Template Selector Component
 */
const TemplateSelector = ({ currentTemplate, onTemplateChange, disabled = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <FormControl sx={{ minWidth: 200 }} disabled={disabled}>
      <InputLabel>Retrospective Template</InputLabel>
      <Select
        value={currentTemplate}
        label="Retrospective Template"
        onChange={(e) => onTemplateChange(e.target.value)}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
      >
        {Object.entries(RETROSPECTIVE_TEMPLATES).map(([key, template]) => (
          <MenuItem key={key} value={key}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {template.icon}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {template.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {template.description}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/**
 * Voting Configuration Component
 */
const VotingConfiguration = ({ votingSystem, onVotingSystemChange, votingEnabled, onVotingEnabledChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HowToVote />
          <Typography variant="h6">Voting Configuration</Typography>
          <Chip 
            size="small" 
            label={votingEnabled ? 'Enabled' : 'Disabled'} 
            color={votingEnabled ? 'success' : 'default'}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={votingEnabled}
                onChange={(e) => onVotingEnabledChange(e.target.checked)}
              />
            }
            label="Enable Voting"
          />
          
          {votingEnabled && (
            <FormControl component="fieldset">
              <FormLabel component="legend">Voting System</FormLabel>
              <RadioGroup
                value={votingSystem}
                onChange={(e) => onVotingSystemChange(e.target.value)}
              >
                {Object.entries(VOTING_SYSTEMS).map(([key, system]) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {system.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {system.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * Facilitation Timer Component
 */
const FacilitationTimer = ({ duration = 300, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsRunning(false);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  if (!showTimer) {
    return (
      <Tooltip title="Show Facilitation Timer">
        <IconButton onClick={() => setShowTimer(true)}>
          <Timer />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Paper sx={{ p: 2, minWidth: 200 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Timer />
        <Typography variant="h6">Timer</Typography>
        <IconButton size="small" onClick={() => setShowTimer(false)}>
          <VisibilityOff />
        </IconButton>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h4" color={timeLeft < 60 ? 'error.main' : 'text.primary'}>
          {formatTime(timeLeft)}
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ mb: 1 }}
        color={timeLeft < 60 ? 'error' : 'primary'}
      />
      
      <ButtonGroup size="small" fullWidth>
        <Button 
          onClick={() => setIsRunning(!isRunning)}
          variant={isRunning ? 'outlined' : 'contained'}
        >
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={() => { setTimeLeft(duration); setIsRunning(false); }}>
          Reset
        </Button>
      </ButtonGroup>
    </Paper>
  );
};

/**
 * Enhanced Retrospective Card with Advanced Voting
 */
const RetrospectiveCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onVote, 
  isDragging = false,
  votingSystem = 'simple',
  votingEnabled = true,
  userVotes = {}
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [voteValue, setVoteValue] = useState(1);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ 
    id: item.id,
    data: {
      type: 'retrospective-item',
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  const getTypeIcon = (type) => {
    const template = Object.values(RETROSPECTIVE_TEMPLATES).find(t => 
      t.columns.some(c => c.id === type)
    );
    if (template) {
      const column = template.columns.find(c => c.id === type);
      return column?.icon || <Flag />;
    }
    return <Flag />;
  };

  const getTypeColor = (type) => {
    const template = Object.values(RETROSPECTIVE_TEMPLATES).find(t => 
      t.columns.some(c => c.id === type)
    );
    if (template) {
      const column = template.columns.find(c => c.id === type);
      return column?.color || 'default';
    }
    return 'default';
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

  const handleVote = () => {
    if (!votingEnabled) return;
    
    const currentUserVotes = userVotes[item.id] || 0;
    const votingConfig = VOTING_SYSTEMS[votingSystem];
    
    if (votingConfig.weighted) {
      onVote(item.id, voteValue);
    } else {
      onVote(item.id, 1);
    }
  };

  const currentUserVotes = userVotes[item.id] || 0;
  const votingConfig = VOTING_SYSTEMS[votingSystem];
  const canVote = votingEnabled && (
    !votingConfig.allowMultiple ? currentUserVotes === 0 : 
    currentUserVotes < votingConfig.maxVotes
  );

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          mb: 2,
          cursor: 'grab',
          '&:hover': {
            boxShadow: theme.shadows[4]
          },
          border: `2px solid transparent`,
          borderColor: isDragging || isSortableDragging ? 'primary.main' : 'transparent'
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            {getTypeIcon(item.type)}
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
              {item.title}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 'auto' }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
          
          {item.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {item.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
              {item.author?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {votingConfig?.anonymous ? 'Anonymous' : (item.author || 'Anonymous')}
            </Typography>
            <Chip
              size="small"
              label={item.type}
              color={getTypeColor(item.type)}
              variant="outlined"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </CardContent>
        
        <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
          {votingEnabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {votingConfig.weighted && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                  <Typography variant="caption">Points:</Typography>
                  <Slider
                    size="small"
                    value={voteValue}
                    onChange={(e, newValue) => setVoteValue(newValue)}
                    min={1}
                    max={5}
                    marks
                    sx={{ width: 60 }}
                  />
                  <Typography variant="caption">{voteValue}</Typography>
                </Box>
              )}
              
              <Button
                size="small"
                startIcon={<ThumbUp />}
                onClick={handleVote}
                disabled={!canVote}
                variant={currentUserVotes > 0 ? 'contained' : 'outlined'}
                color="primary"
              >
                {item.votes || 0}
                {currentUserVotes > 0 && ` (${currentUserVotes})`}
              </Button>
            </Box>
          )}
          
          {!votingEnabled && (
            <Typography variant="body2" color="text.secondary">
              {item.votes || 0} votes
            </Typography>
          )}
        </CardActions>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

/**
 * Enhanced Retrospective Column
 */
const RetrospectiveColumn = ({ 
  column,
  items, 
  onAddItem, 
  onEditItem, 
  onDeleteItem, 
  onVoteItem,
  votingSystem,
  votingEnabled,
  userVotes,
  discussionPrompts = []
}) => {
  const theme = useTheme();
  const [showPrompts, setShowPrompts] = useState(false);

  const sortedItems = [...items].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return (
    <Paper sx={{ p: 2, height: '100%', minHeight: 400 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {column.icon}
        <Typography variant="h6" sx={{ flex: 1, color: `${column.color}.main` }}>
          {column.title}
        </Typography>
        <Chip 
          size="small" 
          label={items.length} 
          color={column.color}
          variant="outlined"
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {column.description}
      </Typography>

      {discussionPrompts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            startIcon={<Lightbulb />}
            onClick={() => setShowPrompts(!showPrompts)}
            variant="outlined"
          >
            Discussion Prompts
          </Button>
          {showPrompts && (
            <List dense sx={{ mt: 1 }}>
              {discussionPrompts.map((prompt, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Lightbulb fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={prompt}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <Box sx={{ minHeight: 200 }}>
          {sortedItems.map((item) => (
            <RetrospectiveCard
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onVote={onVoteItem}
              votingSystem={votingSystem}
              votingEnabled={votingEnabled}
              userVotes={userVotes}
            />
          ))}
        </Box>
      </SortableContext>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<Add />}
        onClick={() => onAddItem(column.id)}
        sx={{ mt: 2 }}
      >
        Add Item
      </Button>
    </Paper>
  );
};

/**
 * Action Item Generation Component
 */
const ActionItemGenerator = ({ items, onGenerateActionItems }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [open, setOpen] = useState(false);

  const topVotedItems = items
    .filter(item => (item.votes || 0) > 0)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 10);

  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleGenerate = () => {
    const actionItems = selectedItems.map(itemId => {
      const item = items.find(i => i.id === itemId);
      return {
        id: `action-${Date.now()}-${itemId}`,
        title: `Action: ${item.title}`,
        description: item.description || '',
        priority: item.votes > 5 ? 'high' : item.votes > 2 ? 'medium' : 'low',
        status: 'new',
        retrospectiveItemId: itemId,
        createdAt: new Date()
      };
    });
    
    onGenerateActionItems(actionItems);
    setSelectedItems([]);
    setOpen(false);
  };

  return (
    <>
      <Button
        startIcon={<Assignment />}
        onClick={() => setOpen(true)}
        variant="outlined"
        disabled={topVotedItems.length === 0}
      >
        Generate Action Items
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Action Items</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select retrospective items to convert into action items:
          </Typography>
          
          <List>
            {topVotedItems.map((item) => (
              <ListItem key={item.id} button onClick={() => handleToggleItem(item.id)}>
                <ListItemIcon>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleToggleItem(item.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">
                        {item.votes || 0} votes
                      </Typography>
                      <Chip size="small" label={item.type} variant="outlined" />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerate}
            variant="contained"
            disabled={selectedItems.length === 0}
          >
            Generate {selectedItems.length} Action Items
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Dialog for adding/editing retrospective items
 */
const ItemDialog = ({ 
  open, 
  onClose, 
  onSave, 
  item = null, 
  type = 'start' 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [item, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title: title.trim(),
      description: description.trim(),
      type,
      author: 'Current User' // This would come from user context
    });
    
    onClose();
  };

  const getDialogTitle = () => {
    if (item) {
      return `Edit ${type} Item`;
    }
    return `Add ${type} Item`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Description (optional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!title.trim()}
        >
          {item ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Enhanced Retrospective Board with Templates and Advanced Voting
 */
const RetrospectiveBoard = ({ 
  retrospectiveId,
  onItemsChange,
  onActionItemsGenerated,
  initialItems = [],
  readOnly = false,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [items, setItems] = useState(initialItems);
  const [currentTemplate, setCurrentTemplate] = useState('start-stop-continue');
  const [votingSystem, setVotingSystem] = useState('dot');
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [userVotes, setUserVotes] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dialogType, setDialogType] = useState('start');
  const [activeItem, setActiveItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [facilitationMode, setFacilitationMode] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Initialize with sample data for development
  useEffect(() => {
    if (initialItems.length === 0) {
      const sampleItems = [
        {
          id: 'item-1',
          type: 'start',
          title: 'Daily stand-up meetings',
          description: 'Improve team communication and alignment',
          votes: 5,
          author: 'John Doe',
          createdAt: new Date('2024-12-15')
        },
        {
          id: 'item-2',
          type: 'stop',
          title: 'Long email threads',
          description: 'Replace with direct communication or meetings',
          votes: 8,
          author: 'Jane Smith',
          createdAt: new Date('2024-12-15')
        },
        {
          id: 'item-3',
          type: 'continue',
          title: 'Code review process',
          description: 'Current process is working well for quality',
          votes: 3,
          author: 'Mike Johnson',
          createdAt: new Date('2024-12-15')
        }
      ];
      setItems(sampleItems);
      
      // Initialize user votes
      const initialUserVotes = {};
      sampleItems.forEach(item => {
        if (Math.random() > 0.5) { // Simulate some user votes
          initialUserVotes[item.id] = Math.floor(Math.random() * 3) + 1;
        }
      });
      setUserVotes(initialUserVotes);
    }
  }, [initialItems]);

  // Notify parent component of changes
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(items);
    }
  }, [items, onItemsChange]);

  // Get current template configuration
  const template = RETROSPECTIVE_TEMPLATES[currentTemplate];
  const votingConfig = VOTING_SYSTEMS[votingSystem];

  // Group items by type based on current template
  const groupedItems = {};
  template.columns.forEach(column => {
    groupedItems[column.id] = items.filter(item => item.type === column.id);
  });

  // Template change handler
  const handleTemplateChange = (newTemplate) => {
    if (items.length > 0) {
      // Show confirmation dialog
      if (window.confirm('Changing template will reset all items. Continue?')) {
        setItems([]);
        setUserVotes({});
        setCurrentTemplate(newTemplate);
      }
    } else {
      setCurrentTemplate(newTemplate);
    }
  };

  // Voting handlers
  const handleVoteItem = useCallback((itemId, voteValue = 1) => {
    if (!votingEnabled) return;

    const currentUserVotes = userVotes[itemId] || 0;
    const totalUserVotes = Object.values(userVotes).reduce((sum, votes) => sum + votes, 0);

    // Check voting limits
    if (!votingConfig.allowMultiple && currentUserVotes > 0) {
      setSnackbar({
        open: true,
        message: 'You can only vote once per item',
        severity: 'warning'
      });
      return;
    }

    if (totalUserVotes + voteValue > votingConfig.maxVotes) {
      setSnackbar({
        open: true,
        message: `You have reached the maximum of ${votingConfig.maxVotes} votes`,
        severity: 'warning'
      });
      return;
    }

    // Update votes
    setUserVotes(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + voteValue
    }));

    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, votes: (item.votes || 0) + voteValue }
        : item
    ));

    setSnackbar({
      open: true,
      message: `Voted for item${votingConfig.weighted ? ` with ${voteValue} points` : ''}`,
      severity: 'success'
    });
  }, [votingEnabled, votingConfig, userVotes]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const item = items.find(item => item.id === active.id);
    setActiveItem(item);
  }, [items]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeItem = items.find(item => item.id === active.id);
    if (!activeItem) return;

    // Determine the target type based on the over element
    let targetType = activeItem.type;
    
    // Check if dropped over a different column
    template.columns.forEach(column => {
      if (over.id === `${column.id}-column` || over.data.current?.type === column.id) {
        targetType = column.id;
      }
    });

    // Update the item type if it changed
    if (targetType !== activeItem.type) {
      setItems(prev => prev.map(item => 
        item.id === active.id 
          ? { ...item, type: targetType }
          : item
      ));
      
      setSnackbar({
        open: true,
        message: `Moved item to ${targetType} column`,
        severity: 'success'
      });
    }
  }, [items, template]);

  // Item management handlers
  const handleAddItem = useCallback((type) => {
    if (readOnly) return;
    setDialogType(type);
    setEditingItem(null);
    setDialogOpen(true);
  }, [readOnly]);

  const handleEditItem = useCallback((item) => {
    if (readOnly) return;
    setEditingItem(item);
    setDialogType(item.type);
    setDialogOpen(true);
  }, [readOnly]);

  const handleDeleteItem = useCallback((itemId) => {
    if (readOnly) return;
    setItems(prev => prev.filter(item => item.id !== itemId));
    setUserVotes(prev => {
      const newVotes = { ...prev };
      delete newVotes[itemId];
      return newVotes;
    });
    setSnackbar({
      open: true,
      message: 'Item deleted',
      severity: 'info'
    });
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
        message: 'Item updated',
        severity: 'success'
      });
    } else {
      // Add new item
      const newItem = {
        id: `item-${Date.now()}`,
        ...itemData,
        votes: 0,
        createdAt: new Date()
      };
      setItems(prev => [...prev, newItem]);
      setSnackbar({
        open: true,
        message: 'Item added',
        severity: 'success'
      });
    }
  }, [editingItem]);

  const handleGenerateActionItems = useCallback((actionItems) => {
    if (onActionItemsGenerated) {
      onActionItemsGenerated(actionItems);
    }
    setSnackbar({
      open: true,
      message: `Generated ${actionItems.length} action items`,
      severity: 'success'
    });
  }, [onActionItemsGenerated]);

  // Discussion prompts for different templates
  const getDiscussionPrompts = (columnId) => {
    const prompts = {
      'start-stop-continue': {
        start: ['What new practices could improve our workflow?', 'What tools or processes are we missing?'],
        stop: ['What activities waste our time?', 'What processes create friction?'],
        continue: ['What practices are working well?', 'What should we keep doing?']
      },
      '4ls': {
        liked: ['What went better than expected?', 'What made you feel proud?'],
        learned: ['What new insights did you gain?', 'What would you do differently?'],
        lacked: ['What resources were missing?', 'What support did you need?'],
        longed: ['What would have made this sprint perfect?', 'What do you wish we had?']
      }
    };
    
    return prompts[currentTemplate]?.[columnId] || [];
  };

  return (
    <Box className={className}>
      {/* Header with Template Selection and Controls */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: 'flex-start' }}>
        <TemplateSelector
          currentTemplate={currentTemplate}
          onTemplateChange={handleTemplateChange}
          disabled={readOnly}
        />
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ActionItemGenerator
            items={items}
            onGenerateActionItems={handleGenerateActionItems}
          />
          
          <FacilitationTimer
            duration={300}
            onTimeUp={() => setSnackbar({
              open: true,
              message: 'Time is up! Move to the next phase.',
              severity: 'info'
            })}
          />
          
          <Button
            startIcon={<Settings />}
            onClick={() => setFacilitationMode(!facilitationMode)}
            variant={facilitationMode ? 'contained' : 'outlined'}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Voting Configuration */}
      {facilitationMode && (
        <Box sx={{ mb: 3 }}>
          <VotingConfiguration
            votingSystem={votingSystem}
            onVotingSystemChange={setVotingSystem}
            votingEnabled={votingEnabled}
            onVotingEnabledChange={setVotingEnabled}
          />
        </Box>
      )}

      {/* Voting Status */}
      {votingEnabled && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Voting: {votingConfig.name} • 
            Used: {Object.values(userVotes).reduce((sum, votes) => sum + votes, 0)} / {votingConfig.maxVotes} votes
          </Typography>
        </Box>
      )}

      {/* Retrospective Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={3}>
          {template.columns.map((column) => (
            <Grid item xs={12} md={12 / template.columns.length} key={column.id}>
              <Box id={`${column.id}-column`} data-type={column.id}>
                <RetrospectiveColumn
                  column={column}
                  items={groupedItems[column.id] || []}
                  onAddItem={handleAddItem}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onVoteItem={handleVoteItem}
                  votingSystem={votingSystem}
                  votingEnabled={votingEnabled}
                  userVotes={userVotes}
                  discussionPrompts={getDiscussionPrompts(column.id)}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <DragOverlay>
          {activeItem ? (
            <RetrospectiveCard
              item={activeItem}
              onEdit={() => {}}
              onDelete={() => {}}
              onVote={() => {}}
              isDragging={true}
              votingSystem={votingSystem}
              votingEnabled={votingEnabled}
              userVotes={userVotes}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
        type={dialogType}
      />

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

RetrospectiveBoard.propTypes = {
  retrospectiveId: PropTypes.string,
  onItemsChange: PropTypes.func,
  onActionItemsGenerated: PropTypes.func,
  initialItems: PropTypes.array,
  readOnly: PropTypes.bool,
  className: PropTypes.string
};

TemplateSelector.propTypes = {
  currentTemplate: PropTypes.string.isRequired,
  onTemplateChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

VotingConfiguration.propTypes = {
  votingSystem: PropTypes.string.isRequired,
  onVotingSystemChange: PropTypes.func.isRequired,
  votingEnabled: PropTypes.bool.isRequired,
  onVotingEnabledChange: PropTypes.func.isRequired
};

FacilitationTimer.propTypes = {
  duration: PropTypes.number,
  onTimeUp: PropTypes.func
};

RetrospectiveCard.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onVote: PropTypes.func.isRequired,
  isDragging: PropTypes.bool,
  votingSystem: PropTypes.string,
  votingEnabled: PropTypes.bool,
  userVotes: PropTypes.object
};

RetrospectiveColumn.propTypes = {
  column: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onVoteItem: PropTypes.func.isRequired,
  votingSystem: PropTypes.string,
  votingEnabled: PropTypes.bool,
  userVotes: PropTypes.object,
  discussionPrompts: PropTypes.array
};

ActionItemGenerator.propTypes = {
  items: PropTypes.array.isRequired,
  onGenerateActionItems: PropTypes.func.isRequired
};

ItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  item: PropTypes.object,
  type: PropTypes.string
};

export default RetrospectiveBoard; 