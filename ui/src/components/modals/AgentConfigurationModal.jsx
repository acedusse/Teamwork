import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Badge,
  Slider,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
  AttachMoney as CostIcon,
  Speed as PerformanceIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Group as GroupIcon,
  Admin as AdminIcon,
  Build as ConfigureIcon,
  PlayArrow as UseIcon,
  RemoveRedEye as ViewIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

// Permission level icons and colors
const PERMISSION_ICONS = {
  view: { icon: <ViewIcon />, color: '#2196f3' },
  use: { icon: <UseIcon />, color: '#4caf50' },
  configure: { icon: <ConfigureIcon />, color: '#ff9800' },
  full: { icon: <AdminIcon />, color: '#f44336' }
};

// User role icons and colors
const ROLE_ICONS = {
  viewer: { icon: <ViewIcon />, color: '#2196f3' },
  developer: { icon: <ConfigureIcon />, color: '#4caf50' },
  manager: { icon: <GroupIcon />, color: '#ff9800' },
  admin: { icon: <AdminIcon />, color: '#f44336' }
};

/**
 * AgentConfigurationModal - Comprehensive Agent Configuration and Permission Management
 * 
 * Features:
 * - Basic agent configuration (name, description, capabilities)
 * - Advanced settings (API configuration, performance limits)
 * - Permission management (ACL, user roles, access control)
 * - Security settings (encryption, access restrictions)
 * - Usage monitoring and analytics
 */
const AgentConfigurationModal = ({
  open = false,
  onClose,
  onSave,
  onDelete,
  agent = null,
  mode = 'create',
  currentUser = null,
  availableUsers = [],
  ...other
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    description: '',
    capabilities: [],
    configuration: {
      maxConcurrentTasks: 3,
      autoAcceptTasks: false,
      notificationsEnabled: true,
      priority: 'medium',
      allowedCapabilities: [],
      restrictedCapabilities: [],
      workingHours: {
        enabled: false,
        start: '09:00',
        end: '17:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      costLimits: {
        enabled: false,
        dailyLimit: 10.0,
        monthlyLimit: 300.0
      }
    },
    accessControl: {
      isPublic: false,
      ownerId: '',
      acl: [],
      defaultPermission: 'view'
    },
    apiConfiguration: {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      apiKey: '',
      maxTokens: 4000,
      temperature: 0.2,
      customEndpoint: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPermission, setNewPermission] = useState('use');
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [userPermission, setUserPermission] = useState(null);

  // Initialize form data when agent prop changes
  useEffect(() => {
    if (agent && mode === 'edit') {
      setFormData({
        id: agent.id || '',
        name: agent.name || '',
        type: agent.type || '',
        description: agent.description || '',
        capabilities: agent.capabilities || [],
        configuration: {
          maxConcurrentTasks: agent.configuration?.maxConcurrentTasks || 3,
          autoAcceptTasks: agent.configuration?.autoAcceptTasks || false,
          notificationsEnabled: agent.configuration?.notificationsEnabled !== false,
          priority: agent.configuration?.priority || 'medium',
          allowedCapabilities: agent.configuration?.allowedCapabilities || [],
          restrictedCapabilities: agent.configuration?.restrictedCapabilities || [],
          workingHours: {
            enabled: agent.configuration?.workingHours?.enabled || false,
            start: agent.configuration?.workingHours?.start || '09:00',
            end: agent.configuration?.workingHours?.end || '17:00',
            timezone: agent.configuration?.workingHours?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          costLimits: {
            enabled: agent.configuration?.costLimits?.enabled || false,
            dailyLimit: agent.configuration?.costLimits?.dailyLimit || 10.0,
            monthlyLimit: agent.configuration?.costLimits?.monthlyLimit || 300.0
          }
        },
        accessControl: {
          isPublic: agent.accessControl?.isPublic || false,
          ownerId: agent.accessControl?.ownerId || currentUser?.id || '',
          acl: agent.accessControl?.acl || [],
          defaultPermission: agent.accessControl?.defaultPermission || 'view'
        },
        apiConfiguration: {
          provider: agent.apiConfiguration?.provider || 'anthropic',
          modelId: agent.apiConfiguration?.modelId || 'claude-3-5-sonnet-20241022',
          apiKey: agent.apiConfiguration?.apiKey === '***hidden***' ? '' : agent.apiConfiguration?.apiKey || '',
          maxTokens: agent.apiConfiguration?.maxTokens || 4000,
          temperature: agent.apiConfiguration?.temperature || 0.2,
          customEndpoint: agent.apiConfiguration?.customEndpoint || ''
        }
      });
      setUserPermission(agent._userPermission);
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        id: '',
        name: '',
        type: '',
        description: '',
        capabilities: [],
        configuration: {
          maxConcurrentTasks: 3,
          autoAcceptTasks: false,
          notificationsEnabled: true,
          priority: 'medium',
          allowedCapabilities: [],
          restrictedCapabilities: [],
          workingHours: {
            enabled: false,
            start: '09:00',
            end: '17:00',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          costLimits: {
            enabled: false,
            dailyLimit: 10.0,
            monthlyLimit: 300.0
          }
        },
        accessControl: {
          isPublic: false,
          ownerId: currentUser?.id || '',
          acl: [],
          defaultPermission: 'view'
        },
        apiConfiguration: {
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20241022',
          apiKey: '',
          maxTokens: 4000,
          temperature: 0.2,
          customEndpoint: ''
        }
      });
      setUserPermission(null);
      setErrors({});
    }
  }, [agent, mode, open, currentUser]);

  // Handle field changes
  const handleFieldChange = useCallback((fieldPath, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathParts = fieldPath.split('.');
      
      let current = newData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      return newData;
    });

    // Clear errors for this field
    if (errors[fieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle capability toggle
  const handleCapabilityToggle = useCallback((capability) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  }, []);

  // Handle ACL management
  const handleAddPermission = useCallback(async () => {
    if (!selectedUser || !newPermission) return;

    try {
      setIsLoading(true);
      
      // Call API to grant permission
      const response = await fetch(`/api/agent-permissions/agents/${formData.id}/permissions/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id,
          'X-User-Role': currentUser?.role
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          permission: newPermission,
          userRole: selectedUser.role
        })
      });

      if (!response.ok) {
        throw new Error('Failed to grant permission');
      }

      const result = await response.json();
      
      // Update local ACL
      setFormData(prev => ({
        ...prev,
        accessControl: {
          ...prev.accessControl,
          acl: [...prev.accessControl.acl.filter(entry => entry.userId !== selectedUser.id), result.aclEntry]
        }
      }));

      setSelectedUser(null);
      setNewPermission('use');
      setPermissionDialogOpen(false);
      setUserSearchTerm('');
    } catch (error) {
      setErrors({ permission: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, newPermission, formData.id, currentUser]);

  const handleRemovePermission = useCallback(async (userId) => {
    try {
      setIsLoading(true);
      
      // Call API to revoke permission
      const response = await fetch(`/api/agent-permissions/agents/${formData.id}/permissions/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id,
          'X-User-Role': currentUser?.role
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to revoke permission');
      }

      // Update local ACL
      setFormData(prev => ({
        ...prev,
        accessControl: {
          ...prev.accessControl,
          acl: prev.accessControl.acl.filter(entry => entry.userId !== userId)
        }
      }));
    } catch (error) {
      setErrors({ permission: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [formData.id, currentUser]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Agent type is required';
    }

    if (formData.apiConfiguration.apiKey && formData.apiConfiguration.apiKey.length < 10) {
      newErrors.apiKey = 'API key appears to be too short';
    }

    if (formData.configuration.costLimits.enabled) {
      if (formData.configuration.costLimits.dailyLimit <= 0) {
        newErrors.dailyLimit = 'Daily limit must be positive';
      }
      if (formData.configuration.costLimits.monthlyLimit <= 0) {
        newErrors.monthlyLimit = 'Monthly limit must be positive';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save agent configuration' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSave, onClose, validateForm]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (mode === 'edit' && agent?.id) {
      const confirmed = window.confirm(`Are you sure you want to delete "${formData.name}"? This action cannot be undone.`);
      if (!confirmed) return;

      setIsLoading(true);
      try {
        await onDelete(agent.id);
        onClose();
      } catch (error) {
        setErrors({ general: error.message });
      } finally {
        setIsLoading(false);
      }
    }
  }, [mode, agent, onDelete, onClose, formData.name]);

  // Filter available users for permission assignment
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Check if user can edit this agent
  const canEdit = userPermission?.permission === 'full' || userPermission?.permission === 'configure' || currentUser?.role === 'admin';
  const canManagePermissions = userPermission?.permission === 'full' || currentUser?.role === 'admin' || formData.accessControl.ownerId === currentUser?.id;

  // Tab content
  const tabs = [
    { label: 'Basic Configuration', icon: <SettingsIcon /> },
    { label: 'Advanced Settings', icon: <ConfigureIcon /> },
    { label: 'Permissions & Access', icon: <SecurityIcon /> },
    { label: 'API Configuration', icon: <LockIcon /> }
  ];

  const actions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {mode === 'edit' && canEdit && (
        <Button
          onClick={handleDelete}
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          disabled={isLoading}
        >
          Delete Agent
        </Button>
      )}
      <Box sx={{ flex: 1 }} />
      <Button onClick={onClose} variant="outlined" disabled={isLoading}>
        Cancel
      </Button>
      {canEdit && (
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={isLoading || Object.keys(errors).length > 0}
        >
          {mode === 'create' ? 'Create Agent' : 'Save Changes'}
        </Button>
      )}
    </Box>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">
            {mode === 'create' ? 'Create AI Agent' : `Configure ${formData.name}`}
          </Typography>
          {userPermission && (
            <Chip
              size="small"
              icon={PERMISSION_ICONS[userPermission.permission]?.icon}
              label={userPermission.permission}
              sx={{ 
                bgcolor: PERMISSION_ICONS[userPermission.permission]?.color + '20',
                color: PERMISSION_ICONS[userPermission.permission]?.color 
              }}
            />
          )}
        </Box>
      }
      maxWidth="lg"
      fullWidth
      actions={actions}
      {...other}
    >
      {/* Display errors */}
      {errors.submit && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.submit}
        </Alert>
      )}

      {/* Permission warning for read-only users */}
      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            You have {userPermission?.permission || 'limited'} access to this agent. 
            {userPermission?.reason && ` (${userPermission.reason})`}
          </Typography>
        </Alert>
      )}

      {/* Tab navigation */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Tab content */}
      <Box sx={{ minHeight: 400 }}>
        {/* Basic Configuration Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Agent Name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={!canEdit}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Agent Type"
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                error={!!errors.type}
                helperText={errors.type}
                disabled={!canEdit}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={!canEdit}
                placeholder="Describe what this agent does and its role in your project..."
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Capabilities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.capabilities.map((capability) => (
                  <Chip
                    key={capability}
                    label={capability}
                    onDelete={canEdit ? () => handleCapabilityToggle(capability) : undefined}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {canEdit && (
                  <Chip
                    icon={<AddIcon />}
                    label="Add Capability"
                    onClick={() => {
                      const capability = prompt('Enter capability name:');
                      if (capability) handleCapabilityToggle(capability);
                    }}
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Advanced Settings Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Task Management
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Max Concurrent Tasks: {formData.configuration.maxConcurrentTasks}
                  </Typography>
                  <Slider
                    value={formData.configuration.maxConcurrentTasks}
                    onChange={(e, value) => handleFieldChange('configuration.maxConcurrentTasks', value)}
                    min={1}
                    max={10}
                    marks
                    disabled={!canEdit}
                  />
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.configuration.priority}
                    onChange={(e) => handleFieldChange('configuration.priority', e.target.value)}
                    disabled={!canEdit}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuration.autoAcceptTasks}
                      onChange={(e) => handleFieldChange('configuration.autoAcceptTasks', e.target.checked)}
                      disabled={!canEdit}
                    />
                  }
                  label="Auto-accept tasks"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuration.notificationsEnabled}
                      onChange={(e) => handleFieldChange('configuration.notificationsEnabled', e.target.checked)}
                      disabled={!canEdit}
                    />
                  }
                  label="Enable notifications"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Working Hours
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuration.workingHours.enabled}
                      onChange={(e) => handleFieldChange('configuration.workingHours.enabled', e.target.checked)}
                      disabled={!canEdit}
                    />
                  }
                  label="Enable working hours"
                />
                {formData.configuration.workingHours.enabled && (
                  <>
                    <TextField
                      type="time"
                      label="Start Time"
                      value={formData.configuration.workingHours.start}
                      onChange={(e) => handleFieldChange('configuration.workingHours.start', e.target.value)}
                      disabled={!canEdit}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="time"
                      label="End Time"
                      value={formData.configuration.workingHours.end}
                      onChange={(e) => handleFieldChange('configuration.workingHours.end', e.target.value)}
                      disabled={!canEdit}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Timezone"
                      value={formData.configuration.workingHours.timezone}
                      onChange={(e) => handleFieldChange('configuration.workingHours.timezone', e.target.value)}
                      disabled={!canEdit}
                    />
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Cost Limits
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuration.costLimits.enabled}
                      onChange={(e) => handleFieldChange('configuration.costLimits.enabled', e.target.checked)}
                      disabled={!canEdit}
                    />
                  }
                  label="Enable cost limits"
                />
                {formData.configuration.costLimits.enabled && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Daily Limit"
                        value={formData.configuration.costLimits.dailyLimit}
                        onChange={(e) => handleFieldChange('configuration.costLimits.dailyLimit', parseFloat(e.target.value))}
                        disabled={!canEdit}
                        error={!!errors.dailyLimit}
                        helperText={errors.dailyLimit}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Monthly Limit"
                        value={formData.configuration.costLimits.monthlyLimit}
                        onChange={(e) => handleFieldChange('configuration.costLimits.monthlyLimit', parseFloat(e.target.value))}
                        disabled={!canEdit}
                        error={!!errors.monthlyLimit}
                        helperText={errors.monthlyLimit}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* Permissions & Access Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Access Control
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.accessControl.isPublic}
                      onChange={(e) => handleFieldChange('accessControl.isPublic', e.target.checked)}
                      disabled={!canManagePermissions}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formData.accessControl.isPublic ? <PublicIcon /> : <LockIcon />}
                      Public Agent
                    </Box>
                  }
                />
                {formData.accessControl.isPublic && (
                  <FormControl fullWidth>
                    <InputLabel>Default Permission</InputLabel>
                    <Select
                      value={formData.accessControl.defaultPermission}
                      onChange={(e) => handleFieldChange('accessControl.defaultPermission', e.target.value)}
                      disabled={!canManagePermissions}
                    >
                      <MenuItem value="view">View Only</MenuItem>
                      <MenuItem value="use">Use Agent</MenuItem>
                      <MenuItem value="configure">Configure</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Owner Information
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: ROLE_ICONS[currentUser?.role]?.color }}>
                      {ROLE_ICONS[currentUser?.role]?.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{currentUser?.name || 'Current User'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Owner • {currentUser?.role || 'Unknown Role'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {canManagePermissions && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    User Permissions ({formData.accessControl.acl.length})
                  </Typography>
                  <Button
                    startIcon={<PersonAddIcon />}
                    variant="outlined"
                    onClick={() => setPermissionDialogOpen(true)}
                    disabled={!canManagePermissions}
                  >
                    Add User
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Permission</TableCell>
                        <TableCell>Granted</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.accessControl.acl.map((aclEntry) => (
                        <TableRow key={aclEntry.userId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {ROLE_ICONS[aclEntry.userRole]?.icon}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{aclEntry.userId}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {aclEntry.userRole}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={PERMISSION_ICONS[aclEntry.permission]?.icon}
                              label={aclEntry.permission}
                              sx={{
                                bgcolor: PERMISSION_ICONS[aclEntry.permission]?.color + '20',
                                color: PERMISSION_ICONS[aclEntry.permission]?.color
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(aclEntry.grantedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleRemovePermission(aclEntry.userId)}
                              disabled={isLoading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {formData.accessControl.acl.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="textSecondary">
                              No additional users have been granted permissions
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        )}

        {/* API Configuration Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>AI Provider</InputLabel>
                <Select
                  value={formData.apiConfiguration.provider}
                  onChange={(e) => handleFieldChange('apiConfiguration.provider', e.target.value)}
                  disabled={!canEdit}
                >
                  <MenuItem value="anthropic">Anthropic</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="google">Google</MenuItem>
                  <MenuItem value="ollama">Ollama</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model ID"
                value={formData.apiConfiguration.modelId}
                onChange={(e) => handleFieldChange('apiConfiguration.modelId', e.target.value)}
                disabled={!canEdit}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiConfiguration.apiKey}
                onChange={(e) => handleFieldChange('apiConfiguration.apiKey', e.target.value)}
                disabled={!canEdit}
                error={!!errors.apiKey}
                helperText={errors.apiKey}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Tokens"
                value={formData.apiConfiguration.maxTokens}
                onChange={(e) => handleFieldChange('apiConfiguration.maxTokens', parseInt(e.target.value))}
                disabled={!canEdit}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Temperature: {formData.apiConfiguration.temperature}
                </Typography>
                <Slider
                  value={formData.apiConfiguration.temperature}
                  onChange={(e, value) => handleFieldChange('apiConfiguration.temperature', value)}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={!canEdit}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Custom Endpoint"
                value={formData.apiConfiguration.customEndpoint}
                onChange={(e) => handleFieldChange('apiConfiguration.customEndpoint', e.target.value)}
                disabled={!canEdit}
                placeholder="https://api.example.com"
              />
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Add User Permission Dialog */}
      <Dialog open={permissionDialogOpen} onClose={() => setPermissionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User Permission</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Search Users"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
            />
            <List sx={{ maxHeight: 200, overflow: 'auto' }}>
              {filteredUsers.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  selected={selectedUser?.id === user.id}
                  onClick={() => setSelectedUser(user)}
                >
                  <ListItemAvatar>
                    <Avatar>{user.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                  />
                </ListItem>
              ))}
            </List>
            <FormControl fullWidth>
              <InputLabel>Permission Level</InputLabel>
              <Select
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
              >
                <MenuItem value="view">View Only</MenuItem>
                <MenuItem value="use">Use Agent</MenuItem>
                <MenuItem value="configure">Configure</MenuItem>
                <MenuItem value="full">Full Control</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddPermission}
            variant="contained"
            disabled={!selectedUser || isLoading}
          >
            Add Permission
          </Button>
        </DialogActions>
      </Dialog>
    </BaseModal>
  );
};

AgentConfigurationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  agent: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
  currentUser: PropTypes.object,
  availableUsers: PropTypes.array
};

export default AgentConfigurationModal;
