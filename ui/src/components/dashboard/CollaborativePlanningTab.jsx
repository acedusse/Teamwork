import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import { useCollaborativePlanning } from '../../hooks/useCollaborativePlanning';
import { useDashboardModals } from './MainDashboard';
import AIResponseDisplay from '../ai/AIResponseDisplay';
import { useBrainstormingAI } from '../../hooks/useBrainstormingAI';
import { styled } from '@mui/material/styles';
import {
  Psychology as BrainIcon,
  Timeline as TimelineIcon,
  Groups as GroupsIcon,
  Lightbulb as IdeaIcon,
  Science as ResearchIcon, 
  Description as DocumentIcon,
  Check as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  ThumbUp as VoteIcon,
  Group as GroupIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Engineering as WorkshopIcon,
  Assignment as AssignmentIcon,
  Share as ShareIcon,
  Verified as VerifiedIcon,
  FileUpload as UploadIcon,
} from '@mui/icons-material';

// Styled components for custom styling
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2.5),
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
}));

const PhaseTrackerContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const BrainstormContainer = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const IdeationBoardContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const PhaseStep = styled(Box)(({ theme, status }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  zIndex: 2,
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const PhaseCircle = styled(Box)(({ theme, status }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '1.2rem',
  border: '3px solid',
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(1),
  ...(status === 'completed' && {
    background: 'linear-gradient(135deg, #28a745, #20c997)',
    borderColor: '#28a745',
    color: 'white',
  }),
  ...(status === 'current' && {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderColor: '#667eea',
    color: 'white',
    animation: 'pulse 2s infinite',
  }),
  ...(status === 'upcoming' && {
    background: '#f8f9fa',
    borderColor: '#dee2e6',
    color: '#6c757d',
  }),
  '@keyframes pulse': {
    '0%, 100%': { boxShadow: '0 0 0 0 rgba(102, 126, 234, 0.7)' },
    '70%': { boxShadow: '0 0 0 10px rgba(102, 126, 234, 0)' },
  },
}));

const PhaseLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  textAlign: 'center',
  fontWeight: 600,
  maxWidth: 80,
}));

const StickyNote = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'noteType',
})(({ theme, noteType }) => ({
  cursor: 'grab',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  borderLeft: `4px solid ${noteType === 'feature' ? '#28a745' : noteType === 'user-story' ? '#17a2b8' : '#dc3545'}`,
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[8],
  },
  '&:active': {
    cursor: 'grabbing',
  },
  ...(noteType === 'feature' && {
    backgroundColor: '#d4edda',
  }),
  ...(noteType === 'user-story' && {
    backgroundColor: '#d1ecf1',
  }),
  ...(noteType === 'business-goal' && {
    backgroundColor: '#f8d7da',
  }),
}));

const StakeholderCard = styled(({ agentType, ...props }) => <Card {...props} />)(({ theme, agentType }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  borderLeft: `4px solid ${
    agentType === 'business-analyst' ? '#28a745' :
    agentType === 'tech-lead' ? '#ffc107' :
    agentType === 'ux-designer' ? '#e83e8c' :
    '#667eea'
  }`,
}));

// Phase Tracker Component
const PhaseTracker = ({ currentPhase, phases, onPhaseChange, onCompletePhase }) => {
  const getPhaseStatus = (phaseId) => {
    if (phaseId < currentPhase) return 'completed';
    if (phaseId === currentPhase) return 'current';
    return 'upcoming';
  };

  const currentPhaseName = phases.find(p => p.id === currentPhase)?.name || 'Unknown Phase';

  return (
    <StyledPaper>
      <Box display="flex" alignItems="center" mb={3}>
        <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" component="h2">
          📋 Planning Workflow Progress
        </Typography>
      </Box>

      {/* Phase tracker visualization */}
      <Box 
        sx={{ 
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          px: 2,
        }}
      >
        {/* Progress line */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 3,
            background: '#e9ecef',
            zIndex: 1,
            transform: 'translateY(-50%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%`,
            height: 3,
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            zIndex: 1,
            transform: 'translateY(-50%)',
            transition: 'width 0.5s ease',
          }}
        />

        {phases.map((phase) => (
          <PhaseStep
            key={phase.id}
            status={getPhaseStatus(phase.id)}
            onClick={() => onPhaseChange(phase.id)}
          >
            <PhaseCircle status={getPhaseStatus(phase.id)}>
              {getPhaseStatus(phase.id) === 'completed' ? (
                <CheckIcon />
              ) : (
                phase.id
              )}
            </PhaseCircle>
            <PhaseLabel>
              {phase.label.split('\n').map((line, idx) => (
                <span key={idx}>{line}</span>
              ))}
            </PhaseLabel>
          </PhaseStep>
        ))}
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Current Phase: {currentPhaseName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collaborative brainstorming to identify and prioritize features
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="contained" 
            color="success" 
            onClick={onCompletePhase}
            sx={{ mr: 1 }}
            startIcon={<CheckIcon />}
          >
            Complete Phase
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<DownloadIcon />}
          >
            Export Progress
          </Button>
        </Box>
      </Box>
    </StyledPaper>
  );
};

// Brainstorming Board Component
const BrainstormingBoard = ({ session, onStartSession, onInviteAgents, onUpdateSession }) => {
  const focusAreas = ['Core Features', 'User Experience', 'Technical Constraints', 'Business Goals'];

  const handleSessionUpdate = (field, value) => {
    onUpdateSession({ [field]: value });
  };

  return (
    <StyledPaper>
      <Box display="flex" alignItems="center" mb={3}>
        <BrainIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          🎯 Session Setup
        </Typography>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          label="Session Name"
          value={session.name}
          onChange={(e) => handleSessionUpdate('name', e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Duration</InputLabel>
          <Select
            value={session.duration}
            label="Duration"
            onChange={(e) => handleSessionUpdate('duration', e.target.value)}
          >
            <MenuItem value="60 minutes">60 minutes</MenuItem>
            <MenuItem value="90 minutes">90 minutes</MenuItem>
            <MenuItem value="120 minutes">120 minutes</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Session Focus:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {focusAreas.map((area) => (
            <Chip
              key={area}
              label={area}
              onClick={() => handleSessionUpdate('focusArea', area)}
              color={session.focusArea === area ? 'primary' : 'default'}
              variant={session.focusArea === area ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Button 
          variant="contained" 
          onClick={onStartSession}
          startIcon={<PlayIcon />}
          color="success"
        >
          🚀 Start Session
        </Button>
        <Button 
          variant="outlined" 
          onClick={onInviteAgents}
          startIcon={<GroupsIcon />}
        >
          🤖 Invite AI Agents
        </Button>
        <Button 
          variant="outlined"
          startIcon={<AssignmentIcon />}
        >
          📋 Load Template
        </Button>
      </Box>
    </StyledPaper>
  );
};

// AI Participants Panel Component
const AIParticipantsPanel = ({ participants }) => {
  const getAvatarColor = (type) => {
    const colors = {
      'business-analyst': '#28a745',
      'tech-lead': '#ffc107',
      'ux-designer': '#e83e8c',
      'product-owner': '#667eea',
    };
    return colors[type] || '#6c757d';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : status === 'processing' ? 'warning' : 'default';
  };

  return (
    <StyledPaper>
      <Box display="flex" alignItems="center" mb={3}>
        <GroupsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          🤖 AI Session Participants
        </Typography>
      </Box>

      <Box mb={3}>
        {participants.map((participant) => (
          <StakeholderCard key={participant.id} agentType={participant.type}>
            <Avatar
              sx={{ 
                bgcolor: getAvatarColor(participant.type),
                mr: 2,
                width: 40,
                height: 40,
              }}
            >
              {participant.name ? participant.name.split(' ').map(word => word[0]).join('').slice(0, 2) : '??'}
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold">
                {participant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {participant.type === 'business-analyst' ? 'Market research & requirements analysis' :
                 participant.type === 'tech-lead' ? 'System design & feasibility assessment' :
                 participant.type === 'ux-designer' ? 'User experience & design thinking' :
                 'Product vision & market positioning'}
              </Typography>
            </Box>
            <Chip
              label={participant.status === 'active' ? 'Active' : 'Processing'}
              color={getStatusColor(participant.status)}
              size="small"
            />
          </StakeholderCard>
        ))}
      </Box>

      <Button 
        variant="outlined" 
        fullWidth
        startIcon={<AddIcon />}
      >
        🤖 Add AI Agent
      </Button>
    </StyledPaper>
  );
};

// Ideation Board Component
const IdeationBoard = ({ ideas, votingEnabled, onAddIdea, onVoteIdea, onEnableVoting, onGroupIdeas }) => {
  const handleVoteToggle = () => {
    onEnableVoting();
  };

  return (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IdeaIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            💡 Collaborative Ideation Board
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            4 AI agents active
          </Typography>
          <Button 
            variant={votingEnabled ? 'contained' : 'outlined'}
            onClick={handleVoteToggle}
            startIcon={<VoteIcon />}
          >
            🗳️ {votingEnabled ? 'Voting Enabled' : 'Enable Agent Voting'}
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Button 
          variant="contained" 
          onClick={() => onAddIdea('feature')}
          startIcon={<AddIcon />}
        >
          + Feature Idea
        </Button>
        <Button 
          variant="contained" 
          onClick={() => onAddIdea('user-story')}
          startIcon={<AddIcon />}
        >
          + User Story
        </Button>
        <Button 
          variant="contained" 
          onClick={() => onAddIdea('business-goal')}
          startIcon={<AddIcon />}
        >
          + Business Goal
        </Button>
        <Button 
          variant="outlined" 
          onClick={onGroupIdeas}
          startIcon={<GroupIcon />}
        >
          🗂️ Group Ideas
        </Button>
        <Button 
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          📤 Export Board
        </Button>
      </Box>

      {/* Ideation board grid */}
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 3,
          minHeight: 400,
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          p: 3,
          border: '2px dashed #dee2e6',
        }}
      >
        {ideas.map((idea) => (
          <StickyNote key={idea.id} noteType={idea.type}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {idea.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {idea.content}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  by {idea.author}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => onVoteIdea(idea.id)}
                    disabled={!votingEnabled}
                    color="primary"
                  >
                    <VoteIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" fontWeight="bold">
                    {idea.votes}
                  </Typography>
                </Box>
              </Box>
              {idea.tags && idea.tags.length > 0 && (
                <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                  {idea.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </CardContent>
          </StickyNote>
        ))}
        
        {ideas.length === 0 && (
          <Box 
            sx={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Start adding ideas to populate the board
            </Typography>
          </Box>
        )}
      </Box>
    </StyledPaper>
  );
};

// Research Panel Component
const ResearchPanel = ({ activeTab, researchFindings, onTabChange, onAddFinding }) => {
  const researchTabs = [
    { label: 'Market Research', key: 'market' },
    { label: 'Competitive Analysis', key: 'competitive' },
    { label: 'Technical Research', key: 'technical' },
    { label: 'User Research', key: 'user' },
  ];

  const currentTabIndex = researchTabs.findIndex(tab => tab.key === activeTab);

  const handleTabChange = (event, newValue) => {
    onTabChange(researchTabs[newValue].key);
  };

  const handleAddFinding = () => {
    const finding = prompt(`Add a new ${researchTabs[currentTabIndex].label.toLowerCase()} finding:`);
    if (finding) {
      onAddFinding(activeTab, finding);
    }
  };

  return (
    <StyledPaper>
      <Box display="flex" alignItems="center" mb={3}>
        <ResearchIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          🔍 Research & Documentation Hub
        </Typography>
      </Box>

      <Tabs value={currentTabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        {researchTabs.map((tab, index) => (
          <Tab key={tab.key} label={tab.label} />
        ))}
      </Tabs>

      <Box 
        sx={{
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          p: 2,
          mb: 3,
          minHeight: 200,
        }}
      >
        <Typography variant="h6" gutterBottom>
          📊 {researchTabs[currentTabIndex]?.label} Findings
        </Typography>
        <List>
          {(researchFindings[activeTab] || []).map((finding, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <CheckIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={finding} />
            </ListItem>
          ))}
        </List>
        {(!researchFindings[activeTab] || researchFindings[activeTab].length === 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No findings yet. Click "Add Finding" to get started.
          </Typography>
        )}
      </Box>

      <Box display="flex" gap={2}>
        <Button 
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddFinding}
        >
          + Add Finding
        </Button>
        <Button 
          variant="outlined"
          startIcon={<UploadIcon />}
        >
          📁 Import Research
        </Button>
      </Box>
    </StyledPaper>
  );
};

// Document Generator Component
const DocumentGenerator = ({ documents, onUpdateProgress }) => {
  const handleAutoGenerate = (docType) => {
    // Simulate auto-generation progress
    const currentProgress = documents[docType].progress;
    const newProgress = Math.min(currentProgress + 15, 100);
    onUpdateProgress(docType, { progress: newProgress });
  };

  const getStatusColor = (status) => {
    return status === 'complete' ? 'success' : status === 'in-progress' ? 'warning' : 'default';
  };

  const getStatusIcon = (status) => {
    return status === 'complete' ? <VerifiedIcon /> : status === 'in-progress' ? <PlayIcon /> : <UncheckedIcon />;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <StyledPaper>
          <Box display="flex" alignItems="center" mb={2}>
            <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3">
              📋 Product Requirements Document (PRD)
            </Typography>
          </Box>
          
          <Box mb={2}>
            <LinearProgress variant="determinate" value={documents.prd.progress} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              {documents.prd.progress}% Complete
            </Typography>
          </Box>
          
          <List dense>
            {documents.prd.sections.map((section, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getStatusIcon(section.status)}
                </ListItemIcon>
                <ListItemText primary={section.name} />
                <Chip
                  label={section.status === 'complete' ? 'Complete' : 
                         section.status === 'in-progress' ? 'In Progress' : 'Pending'}
                  color={getStatusColor(section.status)}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
          
          <Box display="flex" gap={2} mt={2}>
            <Button 
              variant="contained"
              startIcon={<BrainIcon />}
              onClick={() => handleAutoGenerate('prd')}
            >
              🤖 Auto-Generate
            </Button>
            <Button 
              variant="outlined"
              startIcon={<AssignmentIcon />}
            >
              👀 Review Draft
            </Button>
          </Box>
        </StyledPaper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <StyledPaper>
          <Box display="flex" alignItems="center" mb={2}>
            <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3">
              💼 Business Requirements Document (BRD)
            </Typography>
          </Box>
          
          <Box mb={2}>
            <LinearProgress variant="determinate" value={documents.brd.progress} />
            <Typography variant="body2" color="text.secondary" mt={1}>
              {documents.brd.progress}% Complete
            </Typography>
          </Box>
          
          <List dense>
            {documents.brd.sections.map((section, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getStatusIcon(section.status)}
                </ListItemIcon>
                <ListItemText primary={section.name} />
                <Chip
                  label={section.status === 'complete' ? 'Complete' : 
                         section.status === 'in-progress' ? 'In Progress' : 'Pending'}
                  color={getStatusColor(section.status)}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
          
          <Box display="flex" gap={2} mt={2}>
            <Button 
              variant="contained"
              startIcon={<BrainIcon />}
              onClick={() => handleAutoGenerate('brd')}
            >
              🤖 Auto-Generate
            </Button>
            <Button 
              variant="outlined"
              startIcon={<AssignmentIcon />}
            >
              👀 Review Draft
            </Button>
          </Box>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

// Phase Actions Component
const PhaseActions = ({ onAction }) => (
  <StyledPaper>
    <Typography variant="h6" component="h3" mb={3}>
      🎯 Phase Actions
    </Typography>
    
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => onAction('schedule')}
          startIcon={<ScheduleIcon />}
        >
          📅 Schedule Session
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => onAction('workshop')}
          startIcon={<WorkshopIcon />}
        >
          🎪 Facilitate Workshop
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => onAction('consolidate')}
          startIcon={<AssignmentIcon />}
        >
          📝 Consolidate Findings
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => onAction('validate')}
          startIcon={<VerifiedIcon />}
        >
          ✅ Validate Requirements
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => onAction('export')}
          startIcon={<DownloadIcon />}
        >
          📤 Export All Artifacts
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={() => onAction('share')}
          startIcon={<ShareIcon />}
        >
          👥 Share with Team
        </Button>
      </Grid>
    </Grid>
  </StyledPaper>
);

// Main Component
const CollaborativePlanningTab = () => {
  const { state, actions, computed, utils, error, setError } = useCollaborativePlanning();
  const modalActions = useDashboardModals();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // AI brainstorming integration
  const {
    agentContributions,
    agentRecommendations,
    isGeneratingIdeas,
    sessionActive: aiSessionActive,
    error: aiError,
    startAISession,
    generateIdeas,
    evaluateIdeas,
    getIdeaRecommendations
  } = useBrainstormingAI({
    focusArea: 'Collaborative Planning',
    participantTypes: ['optimization', 'estimation', 'planning'],
    autoGenerateIdeas: true
  });

  // Utility function to show notifications
  const showNotification = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Event handlers with enhanced state management
  const handlePhaseChange = (phase) => {
    actions.setPhase(phase);
    showNotification(`Switched to ${computed.currentPhaseName}`, 'info');
  };

  const handleCompletePhase = () => {
    const currentPhaseName = computed.currentPhaseName;
    actions.completePhase();
    
    if (state.currentPhase < 7) {
      showNotification(`✅ ${currentPhaseName} completed! Moving to next phase.`, 'success');
    } else {
      showNotification('🎉 All planning phases completed! Ready for sprint organization.', 'success');
    }
  };

  const handleStartSession = async () => {
    actions.updateSession({
      isActive: true,
      startTime: new Date().toISOString(),
    });
    
    // Update all participants to active status
    state.participants.forEach(participant => {
      if (participant.status !== 'active') {
        actions.updateParticipantStatus(participant.id, 'active');
      }
    });

    // Start AI brainstorming session
    try {
      await startAISession({
        focusArea: computed.currentPhaseName,
        duration: 90,
        mode: 'idea-generation'
      });
      showNotification('🚀 AI-powered brainstorming session started! All agents are now active.', 'success');
    } catch (error) {
      console.error('Failed to start AI session:', error);
      showNotification('⚠️ Session started but AI agents may not be fully active.', 'warning');
    }
  };

  const handleInviteAgents = async () => {
    try {
      const result = await modalActions.addAIAgent({
        sessionType: 'brainstorming',
        currentParticipants: state.participants
      });
      
      if (result) {
        actions.addParticipant({
          ...result,
          status: 'active',
        });
        showNotification(`🤖 ${result.name} has joined the session!`, 'info');
      }
    } catch (error) {
      showNotification('Failed to add AI agent. Please try again.', 'error');
    }
  };

  const handleAddIdea = async (type) => {
    try {
      const result = await modalActions.openForm({
        title: `Add ${type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        fields: [
          { 
            name: 'title', 
            label: 'Title', 
            type: 'text', 
            required: true,
            placeholder: `Enter the title for your ${type.replace('-', ' ')}`
          },
          { 
            name: 'content', 
            label: 'Description', 
            type: 'textarea', 
            required: true,
            placeholder: `Describe your ${type.replace('-', ' ')} in detail`
          },
          {
            name: 'author',
            label: 'Author',
            type: 'select',
            options: [
              'User',
              ...state.participants
                .filter(p => p.status === 'active')
                .map(p => p.name)
            ],
            defaultValue: 'User'
          }
        ]
      });
      
      if (result) {
        const ideaData = {
          type,
          title: result.title,
          content: result.content,
          author: result.author,
          tags: [type, 'brainstorming'],
        };
        
        actions.addIdea(ideaData);
        showNotification(`💡 New ${type.replace('-', ' ')} added by ${result.author}!`, 'success');
        
        // Simulate AI agent response after a delay
        setTimeout(() => {
          const suggestions = {
            feature: 'Consider technical feasibility and user impact metrics',
            'user-story': 'Define acceptance criteria and edge cases',
            'business-goal': 'Establish measurable KPIs and timeline'
          };
          showNotification(`🤖 AI Suggestion: ${suggestions[type]}`, 'info');
        }, 2000);
      }
    } catch (error) {
      showNotification('Failed to add idea. Please try again.', 'error');
    }
  };

  const handleVoteIdea = (ideaId) => {
    if (!state.votingEnabled) {
      showNotification('⚠️ Voting is not enabled. Enable voting first.', 'warning');
      return;
    }
    
    actions.voteIdea(ideaId, 1);
    showNotification('🗳️ Vote recorded!', 'success');
  };

  const handleEnableVoting = () => {
    const newVotingState = !state.votingEnabled;
    actions.setVotingEnabled(newVotingState);
    
    if (newVotingState) {
      showNotification('🗳️ AI agent voting enabled! Agents will evaluate ideas based on expertise.', 'success');
    } else {
      showNotification('🗳️ Voting disabled.', 'info');
    }
  };

  const handleGroupIdeas = () => {
    // Simulate AI clustering
    const groups = [
      {
        id: 'automation-group',
        name: 'Automation & AI Features',
        ideaIds: state.ideas.filter(idea => 
          idea.content.toLowerCase().includes('ai') || 
          idea.content.toLowerCase().includes('automation')
        ).map(idea => idea.id),
      },
      {
        id: 'collaboration-group',
        name: 'Collaboration Features',
        ideaIds: state.ideas.filter(idea => 
          idea.content.toLowerCase().includes('collaboration') || 
          idea.content.toLowerCase().includes('team')
        ).map(idea => idea.id),
      },
    ];
    
    actions.groupIdeas(groups.filter(group => group.ideaIds.length > 0));
    showNotification('🗂️ AI clustering completed! Ideas have been grouped by themes.', 'success');
  };

  const handleResearchTabChange = (tab) => {
    actions.setResearchTab(tab);
  };

  // Handle AI response actions
  const handleAIResponseAction = async (actionType, response, data = {}) => {
    try {
      switch (actionType) {
        case 'approve':
          // Convert AI suggestion to idea
          const ideaFromAI = {
            type: 'ai-suggestion',
            title: response.content.title || 'AI Suggestion',
            content: response.content.description || response.content.content,
            author: response.agentName,
            tags: ['ai-generated', 'brainstorming'],
            aiResponse: response
          };
          actions.addIdea(ideaFromAI);
          showNotification(`✅ AI suggestion from ${response.agentName} added to ideation board!`, 'success');
          break;
          
        case 'implement':
          showNotification(`🚀 Implementing suggestion from ${response.agentName}...`, 'info');
          // Here you could integrate with task creation or other implementation logic
          break;
          
        case 'save':
          showNotification(`💾 Saved suggestion from ${response.agentName}`, 'info');
          break;
          
        case 'reject':
          showNotification(`❌ Rejected suggestion from ${response.agentName}`, 'warning');
          break;
          
        default:
          console.log('Unhandled AI response action:', actionType, response);
      }
    } catch (error) {
      console.error('Error handling AI response action:', error);
      showNotification('Failed to process AI response action', 'error');
    }
  };

  const handlePhaseAction = async (action) => {
    try {
      switch (action) {
        case 'schedule':
          const sessionResult = await modalActions.schedulePlanningSession({
            type: 'planning',
            phase: state.currentPhase
          });
          if (sessionResult) {
            showNotification('📅 Planning session scheduled successfully!', 'success');
          }
          break;
          
        case 'workshop':
          showNotification('🎪 Workshop facilitated with all stakeholders!', 'success');
          break;
          
        case 'consolidate':
          actions.updateDocumentProgress('prd', { progress: Math.min(state.documents.prd.progress + 10, 100) });
          actions.updateDocumentProgress('brd', { progress: Math.min(state.documents.brd.progress + 5, 100) });
          showNotification('📝 Findings consolidated into actionable insights!', 'success');
          break;
          
        case 'validate':
          showNotification('✅ Requirements validated with stakeholders!', 'success');
          break;
          
        case 'export':
          showNotification('📤 All artifacts exported successfully!', 'success');
          break;
          
        case 'share':
          showNotification('👥 Shared with team via collaboration platform!', 'success');
          break;
          
        default:
          showNotification('Action completed!', 'success');
      }
    } catch (error) {
      showNotification('Failed to complete action. Please try again.', 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          🧠 Collaborative Planning
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered collaborative planning with phase tracking, brainstorming, and ideation
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Phase Tracker */}
      <PhaseTrackerContainer>
        <PhaseTracker
          currentPhase={state.currentPhase}
          phases={state.phases}
          onPhaseChange={handlePhaseChange}
          onCompletePhase={handleCompletePhase}
        />
      </PhaseTrackerContainer>

      {/* Brainstorming Section */}
      <BrainstormContainer container spacing={3}>
        <Grid item xs={12} md={6}>
          <BrainstormingBoard
            session={state.session}
            onStartSession={handleStartSession}
            onInviteAgents={handleInviteAgents}
            onUpdateSession={actions.updateSession}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <AIParticipantsPanel 
            participants={state.participants}
            onAddParticipant={actions.addParticipant}
            onUpdateStatus={actions.updateParticipantStatus}
          />
        </Grid>
      </BrainstormContainer>

      {/* Ideation Board */}
      <IdeationBoardContainer>
        <IdeationBoard
          ideas={state.ideas}
          votingEnabled={state.votingEnabled}
          onAddIdea={handleAddIdea}
          onVoteIdea={handleVoteIdea}
          onEnableVoting={handleEnableVoting}
          onGroupIdeas={handleGroupIdeas}
        />
      </IdeationBoardContainer>

      {/* AI Agent Responses Section */}
      {(agentContributions.length > 0 || agentRecommendations.length > 0 || isGeneratingIdeas) && (
        <Box sx={{ mb: 4 }}>
          <StyledPaper>
            <AIResponseDisplay
              title="🤖 AI Agent Insights & Recommendations"
              responses={[
                ...agentContributions.map(contrib => ({
                  id: contrib.id,
                  agentId: contrib.agentId,
                  agentName: contrib.agentName,
                  type: 'BRAINSTORMING_IDEA',
                  content: contrib.idea,
                  status: 'pending',
                  timestamp: contrib.timestamp
                })),
                ...agentRecommendations.map(rec => ({
                  id: rec.id,
                  agentId: rec.agentId,
                  agentName: rec.agentName,
                  type: 'PLANNING_RECOMMENDATION',
                  content: rec.recommendation,
                  status: 'pending',
                  timestamp: rec.timestamp
                }))
              ]}
              loading={isGeneratingIdeas}
              error={aiError}
              onResponseAction={handleAIResponseAction}
              maxDisplayed={8}
              showActions={true}
              emptyMessage="AI agents will contribute ideas and recommendations as the session progresses"
              groupByStatus={false}
            />
          </StyledPaper>
        </Box>
      )}

      {/* Research Panel */}
      <Box mb={4}>
        <ResearchPanel
          activeTab={state.activeResearchTab}
          researchFindings={state.researchFindings}
          onTabChange={handleResearchTabChange}
          onAddFinding={actions.addResearchFinding}
        />
      </Box>

      {/* Document Generator */}
      <Box mb={4}>
        <DocumentGenerator 
          documents={state.documents}
          onUpdateProgress={actions.updateDocumentProgress}
        />
      </Box>

      {/* Phase Actions */}
      <PhaseActions onAction={handlePhaseAction} />

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CollaborativePlanningTab; 