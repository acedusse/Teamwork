import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  DragIndicator,
  Download,
  Upload,
  Restore,
  Save,
  ViewColumn,
  Palette,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

// Sortable Column Item Component
const SortableColumnItem = ({ column, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        backgroundColor: 'background.paper',
        '&:hover': { backgroundColor: 'action.hover' }
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1 }}>
        <DragIndicator color="action" />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <Typography sx={{ fontSize: '1.2rem' }}>{column.icon}</Typography>
        <ListItemText
          primary={column.title}
          secondary={`WIP Limit: ${column.wipLimit || 'None'}`}
        />
      </Box>
      <ListItemSecondaryAction>
        <IconButton size="small" onClick={() => onEdit(column)} sx={{ mr: 1 }}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(column.id)} color="error">
          <Delete fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// Column Management Tab
const ColumnManagementTab = ({ columns, onColumnsChange }) => {
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumn, setNewColumn] = useState({
    title: '',
    description: '',
    icon: '📋',
    color: '#f5f5f5',
    wipLimit: null
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id);
      const newIndex = columns.findIndex(col => col.id === over.id);
      onColumnsChange(arrayMove(columns, oldIndex, newIndex));
    }
  }, [columns, onColumnsChange]);

  const handleAddColumn = useCallback(() => {
    const id = `col-${Date.now()}`;
    const column = { ...newColumn, id };
    onColumnsChange([...columns, column]);
    setNewColumn({ title: '', description: '', icon: '📋', color: '#f5f5f5', wipLimit: null });
  }, [columns, newColumn, onColumnsChange]);

  const handleEditColumn = useCallback((column) => {
    setEditingColumn(column);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const updatedColumns = columns.map(col => 
      col.id === editingColumn.id ? editingColumn : col
    );
    onColumnsChange(updatedColumns);
    setEditingColumn(null);
  }, [columns, editingColumn, onColumnsChange]);

  const handleDeleteColumn = useCallback((columnId) => {
    onColumnsChange(columns.filter(col => col.id !== columnId));
  }, [columns, onColumnsChange]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Column Management
      </Typography>
      
      {/* Add New Column */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Add New Column
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Column Title"
                value={newColumn.title}
                onChange={(e) => setNewColumn(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Icon (emoji)"
                value={newColumn.icon}
                onChange={(e) => setNewColumn(prev => ({ ...prev, icon: e.target.value }))}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="WIP Limit"
                value={newColumn.wipLimit || ''}
                onChange={(e) => setNewColumn(prev => ({ 
                  ...prev, 
                  wipLimit: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newColumn.description}
                onChange={(e) => setNewColumn(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddColumn}
            disabled={!newColumn.title}
          >
            Add Column
          </Button>
        </CardActions>
      </Card>

      {/* Existing Columns */}
      <Typography variant="subtitle1" gutterBottom>
        Existing Columns (Drag to reorder)
      </Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
          <List>
            {columns.map((column) => (
              <SortableColumnItem
                key={column.id}
                column={column}
                onEdit={handleEditColumn}
                onDelete={handleDeleteColumn}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>

      {/* Edit Column Dialog */}
      {editingColumn && (
        <Dialog open={Boolean(editingColumn)} onClose={() => setEditingColumn(null)}>
          <DialogTitle>Edit Column</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Column Title"
                  value={editingColumn.title}
                  onChange={(e) => setEditingColumn(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Icon (emoji)"
                  value={editingColumn.icon}
                  onChange={(e) => setEditingColumn(prev => ({ ...prev, icon: e.target.value }))}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="WIP Limit"
                  value={editingColumn.wipLimit || ''}
                  onChange={(e) => setEditingColumn(prev => ({ 
                    ...prev, 
                    wipLimit: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editingColumn.description}
                  onChange={(e) => setEditingColumn(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingColumn(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// Layout Preferences Tab
const LayoutPreferencesTab = ({ preferences, onPreferencesChange }) => {
  const handleChange = useCallback((key, value) => {
    onPreferencesChange({ ...preferences, [key]: value });
  }, [preferences, onPreferencesChange]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Layout Preferences
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Board Layout</InputLabel>
            <Select
              value={preferences.layout || 'comfortable'}
              onChange={(e) => handleChange('layout', e.target.value)}
              label="Board Layout"
            >
              <MenuItem value="compact">Compact</MenuItem>
              <MenuItem value="comfortable">Comfortable</MenuItem>
              <MenuItem value="spacious">Spacious</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Column Width</InputLabel>
            <Select
              value={preferences.columnWidth || 'auto'}
              onChange={(e) => handleChange('columnWidth', e.target.value)}
              label="Column Width"
            >
              <MenuItem value="narrow">Narrow</MenuItem>
              <MenuItem value="auto">Auto</MenuItem>
              <MenuItem value="wide">Wide</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Display Options
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showTaskCount || true}
                onChange={(e) => handleChange('showTaskCount', e.target.checked)}
              />
            }
            label="Show task count in column headers"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showWipLimits || true}
                onChange={(e) => handleChange('showWipLimits', e.target.checked)}
              />
            }
            label="Show WIP limit indicators"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showColumnDescription || false}
                onChange={(e) => handleChange('showColumnDescription', e.target.checked)}
              />
            }
            label="Show column descriptions"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.enableAnimations || true}
                onChange={(e) => handleChange('enableAnimations', e.target.checked)}
              />
            }
            label="Enable animations"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Task Card Options
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showAssigneeAvatars || true}
                onChange={(e) => handleChange('showAssigneeAvatars', e.target.checked)}
              />
            }
            label="Show assignee avatars"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showPriorityIndicators || true}
                onChange={(e) => handleChange('showPriorityIndicators', e.target.checked)}
              />
            }
            label="Show priority indicators"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showDueDates || true}
                onChange={(e) => handleChange('showDueDates', e.target.checked)}
              />
            }
            label="Show due dates"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.showStoryPoints || true}
                onChange={(e) => handleChange('showStoryPoints', e.target.checked)}
              />
            }
            label="Show story points"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Board Templates Tab
const BoardTemplatesTab = ({ onApplyTemplate, onExportConfig, onImportConfig }) => {
  const templates = [
    {
      id: 'kanban',
      name: 'Basic Kanban',
      description: 'Simple Kanban board with To Do, In Progress, and Done columns',
      columns: [
        { id: 'todo', title: 'To Do', icon: '📝', wipLimit: null },
        { id: 'in-progress', title: 'In Progress', icon: '🔄', wipLimit: 3 },
        { id: 'done', title: 'Done', icon: '✅', wipLimit: null }
      ]
    },
    {
      id: 'scrumban',
      name: 'Scrumban',
      description: 'Full Scrumban workflow with detailed stages',
      columns: [
        { id: 'backlog', title: 'Backlog', icon: '📋', wipLimit: null },
        { id: 'ready', title: 'Ready', icon: '🚀', wipLimit: 5 },
        { id: 'development', title: 'Development', icon: '💻', wipLimit: 3 },
        { id: 'review', title: 'Code Review', icon: '👀', wipLimit: 2 },
        { id: 'testing', title: 'Testing', icon: '🧪', wipLimit: 2 },
        { id: 'done', title: 'Done', icon: '✅', wipLimit: null }
      ]
    },
    {
      id: 'support',
      name: 'Support Workflow',
      description: 'Customer support ticket workflow',
      columns: [
        { id: 'new', title: 'New', icon: '🆕', wipLimit: null },
        { id: 'triaged', title: 'Triaged', icon: '🔍', wipLimit: 10 },
        { id: 'assigned', title: 'Assigned', icon: '👤', wipLimit: 5 },
        { id: 'resolved', title: 'Resolved', icon: '✅', wipLimit: null }
      ]
    }
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Board Templates
      </Typography>
      
      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {template.columns.map((col) => (
                    <Chip
                      key={col.id}
                      label={`${col.icon} ${col.title}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => onApplyTemplate(template)}
                  variant="contained"
                >
                  Apply Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Import/Export Configuration
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={onExportConfig}
        >
          Export Board Config
        </Button>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          onClick={onImportConfig}
        >
          Import Board Config
        </Button>
      </Box>
    </Box>
  );
};

// Main BoardSettings Component
const BoardSettings = ({ 
  open, 
  onClose, 
  columns, 
  onColumnsChange,
  preferences,
  onPreferencesChange,
  onApplyTemplate,
  onExportConfig,
  onImportConfig
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleSave = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Board Settings
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Columns" icon={<ViewColumn />} />
          <Tab label="Layout" icon={<Palette />} />
          <Tab label="Templates" icon={<Restore />} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <ColumnManagementTab 
            columns={columns} 
            onColumnsChange={onColumnsChange} 
          />
        )}
        {activeTab === 1 && (
          <LayoutPreferencesTab 
            preferences={preferences} 
            onPreferencesChange={onPreferencesChange} 
          />
        )}
        {activeTab === 2 && (
          <BoardTemplatesTab 
            onApplyTemplate={onApplyTemplate}
            onExportConfig={onExportConfig}
            onImportConfig={onImportConfig}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes for sub-components
SortableColumnItem.propTypes = {
  column: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

ColumnManagementTab.propTypes = {
  columns: PropTypes.array.isRequired,
  onColumnsChange: PropTypes.func.isRequired
};

LayoutPreferencesTab.propTypes = {
  preferences: PropTypes.object.isRequired,
  onPreferencesChange: PropTypes.func.isRequired
};

BoardTemplatesTab.propTypes = {
  onApplyTemplate: PropTypes.func.isRequired,
  onExportConfig: PropTypes.func.isRequired,
  onImportConfig: PropTypes.func.isRequired
};

BoardSettings.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  onColumnsChange: PropTypes.func.isRequired,
  preferences: PropTypes.object.isRequired,
  onPreferencesChange: PropTypes.func.isRequired,
  onApplyTemplate: PropTypes.func.isRequired,
  onExportConfig: PropTypes.func.isRequired,
  onImportConfig: PropTypes.func.isRequired
};

export default BoardSettings; 