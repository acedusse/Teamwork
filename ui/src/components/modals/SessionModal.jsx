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
  LinearProgress
} from '@mui/material';
import {
  Group as SessionIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

// Session permission levels
const PERMISSION_LEVELS = {
  'owner': {
    name: 'Owner',
    description: 'Full control over session settings and participants',
    color: '#f44336',
    permissions: ['read', 'write', 'admin', 'delete', 'invite', 'manage_roles']
  },
  'moderator': {
    name: 'Moderator',
    description: 'Can manage participants and session flow',
    color: '#ff9800',
    permissions: ['read', 'write', 'admin', 'invite', 'manage_participants']
  },
  'contributor': {
    name: 'Contributor',
    description: 'Can participate and contribute to session activities',
    color: '#4caf50',
    permissions: ['read', 'write', 'contribute']
  },
  'observer': {
    name: 'Observer',
    description: 'Can view session but not make changes',
    color: '#2196f3',
    permissions: ['read']
  }
};

// Session types and templates
const SESSION_TYPES = {
  'brainstorming': {
    name: 'Brainstorming Session',
    description: 'Collaborative idea generation and exploration',
    icon: '💡',
    defaultDuration: 90,
    suggestedParticipants: 5,
    features: ['idea-board', 'voting', 'clustering', 'export']
  },
  'planning': {
    name: 'Planning Session',
    description: 'Sprint and project planning activities',
    icon: '📋',
    defaultDuration: 120,
    suggestedParticipants: 8,
    features: ['task-planning', 'estimation', 'dependencies', 'timeline']
  },
  'retrospective': {
    name: 'Retrospective',
    description: 'Team reflection and improvement planning',
    icon: '🔄',
    defaultDuration: 60,
    suggestedParticipants: 6,
    features: ['feedback-board', 'action-items', 'voting', 'analytics']
  },
  'review': {
    name: 'Review Session',
    description: 'Design, code, or document review meetings',
    icon: '👀',
    defaultDuration: 45,
    suggestedParticipants: 4,
    features: ['annotations', 'comments', 'approval-workflow', 'version-control']
  },
  'workshop': {
    name: 'Workshop',
    description: 'Structured learning and skill development',
    icon: '🎓',
    defaultDuration: 180,
    suggestedParticipants: 12,
    features: ['presentations', 'breakout-rooms', 'exercises', 'resources']
  }
};

// User roles for participant management
const USER_ROLES = {
  'facilitator': { name: 'Facilitator', color: '#9c27b0', icon: '🎯' },
  'participant': { name: 'Participant', color: '#4caf50', icon: '👤' },
  'observer': { name: 'Observer', color: '#2196f3', icon: '👁️' },
  'ai-agent': { name: 'AI Agent', color: '#ff9800', icon: '🤖' }
};

/**
 * SessionModal - Session Management Modal Component
 * 
 * Features:
 * - Session creation, editing, and deletion
 * - Participant management (add/remove users, role assignments)
 * - Session settings (duration, permissions, collaboration rules)
 * - Session history and activity tracking
 * - Session sharing and invitation functionality
 * - Real-time collaboration features
 */
const SessionModal = ({
  open = false,
  onClose,
  onSave,
  onDelete,
  onInvite,
  session = null,
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
    type: 'brainstorming',
    description: '',
    duration: 90,
    maxParticipants: 10,
    isPrivate: false,
    allowInvites: true,
    autoRecord: false,
    participants: [],
    settings: {
      enableVoting: true,
      enableChat: true,
      enableScreenShare: false,
      requireApproval: false,
      allowAnonymous: false,
      enableBreakoutRooms: false,
      recordingEnabled: false,
      notificationsEnabled: true
    },
    schedule: {
      startTime: null,
      endTime: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recurring: false,
      recurrencePattern: 'weekly'
    },
    collaboration: {
      rules: [],
      permissions: {},
      integrations: []
    }
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('participant');
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Initialize form data when session prop changes
  useEffect(() => {
    if (session && mode === 'edit') {
      setFormData({
        id: session.id || '',
        name: session.name || '',
        type: session.type || 'brainstorming',
        description: session.description || '',
        duration: session.duration || 90,
        maxParticipants: session.maxParticipants || 10,
        isPrivate: session.isPrivate || false,
        allowInvites: session.allowInvites !== false,
        autoRecord: session.autoRecord || false,
        participants: session.participants || [],
        settings: {
          enableVoting: session.settings?.enableVoting !== false,
          enableChat: session.settings?.enableChat !== false,
          enableScreenShare: session.settings?.enableScreenShare || false,
          requireApproval: session.settings?.requireApproval || false,
          allowAnonymous: session.settings?.allowAnonymous || false,
          enableBreakoutRooms: session.settings?.enableBreakoutRooms || false,
          recordingEnabled: session.settings?.recordingEnabled || false,
          notificationsEnabled: session.settings?.notificationsEnabled !== false
        },
        schedule: {
          startTime: session.schedule?.startTime || null,
          endTime: session.schedule?.endTime || null,
          timezone: session.schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          recurring: session.schedule?.recurring || false,
          recurrencePattern: session.schedule?.recurrencePattern || 'weekly'
        },
        collaboration: {
          rules: session.collaboration?.rules || [],
          permissions: session.collaboration?.permissions || {},
          integrations: session.collaboration?.integrations || []
        }
      });
      
      // Generate share URL for existing sessions
      if (session.id) {
        setShareUrl(`${window.location.origin}/session/${session.id}`);
      }
    } else if (mode === 'create') {
      // Reset form for create mode
      const sessionType = SESSION_TYPES['brainstorming'];
      setFormData({
        id: '',
        name: '',
        type: 'brainstorming',
        description: '',
        duration: sessionType.defaultDuration,
        maxParticipants: sessionType.suggestedParticipants * 2,
        isPrivate: false,
        allowInvites: true,
        autoRecord: false,
        participants: currentUser ? [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: 'facilitator',
          permission: 'owner',
          joinedAt: new Date().toISOString(),
          status: 'active'
        }] : [],
        settings: {
          enableVoting: true,
          enableChat: true,
          enableScreenShare: false,
          requireApproval: false,
          allowAnonymous: false,
          enableBreakoutRooms: false,
          recordingEnabled: false,
          notificationsEnabled: true
        },
        schedule: {
          startTime: null,
          endTime: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          recurring: false,
          recurrencePattern: 'weekly'
        },
        collaboration: {
          rules: [],
          permissions: {},
          integrations: []
        }
      });
      setErrors({});
      setShareUrl('');
    }
  }, [session, mode, open, currentUser]);

  // Load session history when switching to history tab
  useEffect(() => {
    if (activeTab === 3 && session?.id && mode === 'edit') {
      loadSessionHistory();
    }
  }, [activeTab, session?.id, mode]);

  // Handle field changes
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle nested field changes
  const handleNestedFieldChange = useCallback((section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  }, []);

  // Handle session type change
  const handleSessionTypeChange = useCallback((type) => {
    const sessionType = SESSION_TYPES[type];
    if (sessionType) {
      setFormData(prev => ({
        ...prev,
        type,
        duration: sessionType.defaultDuration,
        maxParticipants: sessionType.suggestedParticipants * 2
      }));
    }
  }, []);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Session name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Session type is required';
    }

    if (formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }

    if (formData.duration > 480) {
      newErrors.duration = 'Duration cannot exceed 8 hours';
    }

    if (formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Must allow at least 1 participant';
    }

    if (formData.maxParticipants > 100) {
      newErrors.maxParticipants = 'Cannot exceed 100 participants';
    }

    if (formData.participants.length === 0) {
      newErrors.participants = 'At least one participant is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const sessionData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        ...(mode === 'create' && { createdAt: new Date().toISOString() })
      };

      await onSave?.(sessionData);
      onClose?.();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save session' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, mode, onSave, onClose, validateForm]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!session?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${formData.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await onDelete?.(session.id);
      onClose?.();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to delete session' });
    } finally {
      setIsLoading(false);
    }
  }, [session?.id, formData.name, onDelete, onClose]);

  // Handle participant management
  const handleAddParticipant = useCallback((user, role = 'participant', permission = 'contributor') => {
    const newParticipant = {
      id: user.id || Date.now().toString(),
      name: user.name,
      email: user.email,
      role,
      permission,
      joinedAt: new Date().toISOString(),
      status: 'invited'
    };

    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant]
    }));
  }, []);

  const handleRemoveParticipant = useCallback((participantId) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== participantId)
    }));
  }, []);

  const handleUpdateParticipantRole = useCallback((participantId, role) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === participantId ? { ...p, role } : p
      )
    }));
  }, []);

  const handleUpdateParticipantPermission = useCallback((participantId, permission) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === participantId ? { ...p, permission } : p
      )
    }));
  }, []);

  // Handle invitations
  const handleSendInvite = useCallback(async () => {
    if (!inviteEmail.trim()) {
      return;
    }

    try {
      const inviteData = {
        sessionId: session?.id || 'new',
        email: inviteEmail,
        role: inviteRole,
        permission: 'contributor',
        invitedBy: currentUser?.id,
        invitedAt: new Date().toISOString()
      };

      await onInvite?.(inviteData);
      
      // Add to participants list
      handleAddParticipant({
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail
      }, inviteRole, 'contributor');

      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (error) {
      setErrors({ invite: error.message || 'Failed to send invitation' });
    }
  }, [inviteEmail, inviteRole, session?.id, currentUser?.id, onInvite, handleAddParticipant]);

  // Handle sharing
  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [shareUrl]);

  // Load session history
  const loadSessionHistory = useCallback(async () => {
    if (!session?.id) return;

    setLoadingHistory(true);
    try {
      // Simulate API call - replace with actual implementation
      const mockHistory = [
        {
          id: 1,
          action: 'Session Created',
          user: 'John Doe',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: 'Initial session setup completed'
        },
        {
          id: 2,
          action: 'Participant Added',
          user: 'Jane Smith',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          details: 'Added Sarah Wilson as contributor'
        },
        {
          id: 3,
          action: 'Settings Updated',
          user: 'John Doe',
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          details: 'Enabled voting and screen sharing'
        }
      ];

      setSessionHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load session history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [session?.id]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicSettings();
      case 1:
        return renderParticipantManagement();
      case 2:
        return renderAdvancedSettings();
      case 3:
        return renderSessionHistory();
      default:
        return null;
    }
  };

  // Render basic settings tab
  const renderBasicSettings = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Session Name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Enter a descriptive name for your session"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel>Session Type</InputLabel>
            <Select
              value={formData.type}
              label="Session Type"
              onChange={(e) => handleSessionTypeChange(e.target.value)}
            >
              {Object.entries(SESSION_TYPES).map(([key, type]) => (
                <MenuItem key={key} value={key}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{type.icon}</span>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {type.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Duration (minutes)"
            value={formData.duration}
            onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
            error={!!errors.duration}
            helperText={errors.duration || 'Recommended: 60-120 minutes'}
            InputProps={{
              inputProps: { min: 15, max: 480 }
            }}
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
            placeholder="Describe the purpose and goals of this session"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Max Participants"
            value={formData.maxParticipants}
            onChange={(e) => handleFieldChange('maxParticipants', parseInt(e.target.value) || 0)}
            error={!!errors.maxParticipants}
            helperText={errors.maxParticipants}
            InputProps={{
              inputProps: { min: 1, max: 100 }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={formData.schedule.timezone}
              label="Timezone"
              onChange={(e) => handleNestedFieldChange('schedule', 'timezone', e.target.value)}
            >
              <MenuItem value="America/New_York">Eastern Time</MenuItem>
              <MenuItem value="America/Chicago">Central Time</MenuItem>
              <MenuItem value="America/Denver">Mountain Time</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="Europe/London">London</MenuItem>
              <MenuItem value="Europe/Paris">Paris</MenuItem>
              <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrivate}
                  onChange={(e) => handleFieldChange('isPrivate', e.target.checked)}
                />
              }
              label="Private Session"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.allowInvites}
                  onChange={(e) => handleFieldChange('allowInvites', e.target.checked)}
                />
              }
              label="Allow Participant Invitations"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.autoRecord}
                  onChange={(e) => handleFieldChange('autoRecord', e.target.checked)}
                />
              }
              label="Auto-Record Session"
            />
          </Box>
        </Grid>

        {/* Session Type Features */}
        {formData.type && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {SESSION_TYPES[formData.type].icon} {SESSION_TYPES[formData.type].name} Features
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {SESSION_TYPES[formData.type].features.map((feature) => (
                    <Chip
                      key={feature}
                      label={feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // Render participant management tab
  const renderParticipantManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Participants ({formData.participants.length}/{formData.maxParticipants})
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteDialogOpen(true)}
          disabled={formData.participants.length >= formData.maxParticipants}
        >
          Invite Participant
        </Button>
      </Box>

      {errors.participants && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.participants}
        </Alert>
      )}

      <List>
        {formData.participants.map((participant) => (
          <ListItem key={participant.id} divider>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: USER_ROLES[participant.role]?.color }}>
                {USER_ROLES[participant.role]?.icon || <PersonIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">{participant.name}</Typography>
                  <Chip
                    label={USER_ROLES[participant.role]?.name || participant.role}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={PERMISSION_LEVELS[participant.permission]?.name || participant.permission}
                    size="small"
                    sx={{
                      bgcolor: PERMISSION_LEVELS[participant.permission]?.color + '20',
                      color: PERMISSION_LEVELS[participant.permission]?.color
                    }}
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {participant.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Joined: {new Date(participant.joinedAt).toLocaleDateString()} • 
                    Status: {participant.status}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Box display="flex" gap={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={participant.role}
                    onChange={(e) => handleUpdateParticipantRole(participant.id, e.target.value)}
                    disabled={participant.permission === 'owner' && participant.id === currentUser?.id}
                  >
                    {Object.entries(USER_ROLES).map(([key, role]) => (
                      <MenuItem key={key} value={key}>
                        {role.icon} {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={participant.permission}
                    onChange={(e) => handleUpdateParticipantPermission(participant.id, e.target.value)}
                    disabled={participant.permission === 'owner' && participant.id === currentUser?.id}
                  >
                    {Object.entries(PERMISSION_LEVELS).map(([key, permission]) => (
                      <MenuItem key={key} value={key}>
                        {permission.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  onClick={() => handleRemoveParticipant(participant.id)}
                  disabled={participant.permission === 'owner' && participant.id === currentUser?.id}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {formData.participants.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <PeopleIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No participants yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Invite team members to collaborate in this session
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite First Participant
          </Button>
        </Paper>
      )}

      {/* Sharing Section */}
      {shareUrl && (
        <Box mt={4}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Share Session
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                fullWidth
                label="Share URL"
                value={shareUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
                      <IconButton onClick={handleCopyShareUrl}>
                        {copySuccess ? <CheckIcon color="success" /> : <CopyIcon />}
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={handleCopyShareUrl}
              >
                Share
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Anyone with this link can join the session (if public) or request access (if private)
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );

  // Render advanced settings tab
  const renderAdvancedSettings = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Collaboration Features
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.enableVoting}
                  onChange={(e) => handleNestedFieldChange('settings', 'enableVoting', e.target.checked)}
                />
              }
              label="Enable Voting"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.enableChat}
                  onChange={(e) => handleNestedFieldChange('settings', 'enableChat', e.target.checked)}
                />
              }
              label="Enable Chat"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.enableScreenShare}
                  onChange={(e) => handleNestedFieldChange('settings', 'enableScreenShare', e.target.checked)}
                />
              }
              label="Enable Screen Sharing"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.enableBreakoutRooms}
                  onChange={(e) => handleNestedFieldChange('settings', 'enableBreakoutRooms', e.target.checked)}
                />
              }
              label="Enable Breakout Rooms"
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Access Control
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.requireApproval}
                  onChange={(e) => handleNestedFieldChange('settings', 'requireApproval', e.target.checked)}
                />
              }
              label="Require Approval to Join"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.allowAnonymous}
                  onChange={(e) => handleNestedFieldChange('settings', 'allowAnonymous', e.target.checked)}
                />
              }
              label="Allow Anonymous Participants"
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Recording & Notifications
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.recordingEnabled}
                  onChange={(e) => handleNestedFieldChange('settings', 'recordingEnabled', e.target.checked)}
                />
              }
              label="Enable Session Recording"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.notificationsEnabled}
                  onChange={(e) => handleNestedFieldChange('settings', 'notificationsEnabled', e.target.checked)}
                />
              }
              label="Enable Notifications"
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Recurring Sessions
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={formData.schedule.recurring}
                onChange={(e) => handleNestedFieldChange('schedule', 'recurring', e.target.checked)}
              />
            }
            label="Make this a recurring session"
          />
          {formData.schedule.recurring && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Recurrence Pattern</InputLabel>
              <Select
                value={formData.schedule.recurrencePattern}
                label="Recurrence Pattern"
                onChange={(e) => handleNestedFieldChange('schedule', 'recurrencePattern', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  // Render session history tab
  const renderSessionHistory = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Session Activity</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadSessionHistory}
          disabled={loadingHistory}
        >
          Refresh
        </Button>
      </Box>

      {loadingHistory ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : sessionHistory.length > 0 ? (
        <List>
          {sessionHistory.map((activity) => (
            <ListItem key={activity.id} divider>
              <ListItemAvatar>
                <Avatar>
                  <HistoryIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={activity.action}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                    {activity.details && (
                      <Typography variant="caption" color="text.secondary">
                        {activity.details}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No activity yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session activity will appear here once the session begins
          </Typography>
        </Paper>
      )}
    </Box>
  );

  // Modal actions
  const modalActions = (
    <Box display="flex" gap={2} width="100%">
      {mode === 'edit' && session?.id && (
        <Button
          onClick={handleDelete}
          disabled={isLoading}
          color="error"
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
      )}
      <Box flex={1} />
      <Button onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={isLoading}
        variant="contained"
        startIcon={isLoading ? <CircularProgress size={20} /> : null}
      >
        {mode === 'create' ? 'Create Session' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <SessionIcon />
            {mode === 'create' ? 'Create New Session' : `Edit ${formData.name || 'Session'}`}
          </Box>
        }
        maxWidth="lg"
        actions={modalActions}
        {...other}
      >
        <Box>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab
              label="Basic Settings"
              icon={<SettingsIcon />}
              iconPosition="start"
            />
            <Tab
              label="Participants"
              icon={
                <Badge badgeContent={formData.participants.length} color="primary">
                  <PeopleIcon />
                </Badge>
              }
              iconPosition="start"
            />
            <Tab
              label="Advanced"
              icon={<SecurityIcon />}
              iconPosition="start"
            />
            {mode === 'edit' && (
              <Tab
                label="History"
                icon={<HistoryIcon />}
                iconPosition="start"
              />
            )}
          </Tabs>

          {renderTabContent()}
        </Box>
      </BaseModal>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Participant</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter participant's email"
              error={!!errors.invite}
              helperText={errors.invite}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                label="Role"
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {Object.entries(USER_ROLES).map(([key, role]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{role.icon}</span>
                      {role.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            variant="contained"
            disabled={!inviteEmail.trim()}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

SessionModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  onInvite: PropTypes.func,
  session: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
  currentUser: PropTypes.object,
  availableUsers: PropTypes.array
};

export default SessionModal; 