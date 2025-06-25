import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Container,
  useTheme,
  useMediaQuery,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  CalendarToday,
  Assignment,
  People,
  AccountTree,
  Psychology,
  ExpandMore
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import DependencyManager from './DependencyManager';
import AIStoryEstimationPanel from '../estimation/AIStoryEstimationPanel';
import AIResponseDisplay from '../ai/AIResponseDisplay';
import { useStoryEstimation } from '../../hooks/useStoryEstimation';

// Note: Individual subcomponents not used in this layout approach

const SprintPlanningTab = ({ 
  stories = [], 
  teamMembers = [], 
  existingSprints = [],
  onSprintCreate,
  onSprintUpdate,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Main state management
  const [sprintData, setSprintData] = useState({
    name: '',
    startDate: null,
    endDate: null,
    goal: '',
    teamCapacity: 0,
    selectedStories: [],
    teamAllocation: {},
    dependencies: []
  });
  const [errors, setErrors] = useState({});

  const {
    responses,
    loading,
    error,
    handleResponseAction
  } = useStoryEstimation();

  // State update handlers
  const handleStorySelection = useCallback((selectedStories) => {
    setSprintData(prev => ({
      ...prev,
      selectedStories
    }));
  }, []);

  // Calculate sprint metrics
  const totalStoryPoints = sprintData.selectedStories.reduce((sum, story) => sum + (story.points || 0), 0);

  // Handle AI estimation completion
  const handleEstimationComplete = useCallback((estimation) => {
    // Update the estimated story in the selected stories
    if (estimation && estimation.story) {
      const updatedStories = sprintData.selectedStories.map(story => 
        story.id === estimation.story.id 
          ? { ...story, points: estimation.estimatedPoints, aiEstimated: true, confidence: estimation.confidence }
          : story
      );
      setSprintData(prev => ({
        ...prev,
        selectedStories: updatedStories
      }));
    }
  }, [sprintData.selectedStories]);

  // Handle batch estimation completion
  const handleBatchEstimationComplete = useCallback((batchEstimations) => {
    if (batchEstimations && batchEstimations.length > 0) {
      const updatedStories = sprintData.selectedStories.map(story => {
        const estimation = batchEstimations.find(est => est.story.id === story.id);
        return estimation 
          ? { ...story, points: estimation.estimatedPoints, aiEstimated: true, confidence: estimation.confidence }
          : story;
      });
      setSprintData(prev => ({
        ...prev,
        selectedStories: updatedStories
      }));
    }
  }, [sprintData.selectedStories]);

  return (
    <Container maxWidth="xl" className={className}>
      <Box sx={{ py: 3 }}>
        {/* Two Column Layout */}
        <Grid container spacing={3}>
          {/* Left Column - Ready Stories */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                minHeight: '80vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📋 Ready Stories (3-Month Bucket)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  4 stories available • {sprintData.selectedStories.length} selected ({(sprintData.selectedStories.length / 4 * 100).toFixed(1)}%)
                </Typography>
              </Box>

              {/* Story Cards Grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: 2,
                minHeight: '600px',
                '@media (max-width: 900px)': {
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(6, 1fr)'
                },
                '@media (max-width: 600px)': {
                  gridTemplateColumns: '1fr',
                  gridTemplateRows: 'repeat(12, 1fr)'
                }
              }}>
                {/* Predefined stories matching the image format */}
                {[
                  {
                    id: 1,
                    title: "User Authentication System",
                    description: "JWT-based auth with role management and session handling",
                    points: 8,
                    priority: "High Priority",
                    tags: ["auth", "security", "backend"],
                    assignee: "John Doe"
                  },
                  {
                    id: 2,
                    title: "Task Management UI",
                    description: "Kanban board with drag-and-drop functionality",
                    points: 5,
                    priority: "Medium Priority", 
                    tags: ["ui", "frontend", "drag"],
                    assignee: "Jane Smith"
                  },
                  {
                    id: 3,
                    title: "AI Agent Communication",
                    description: "Inter-agent messaging and coordination protocols",
                    points: 13,
                    priority: "High Priority",
                    tags: ["ai", "communication", "protocols"],
                    assignee: "AI Team"
                  },
                  {
                    id: 4,
                    title: "Database Schema Design",
                    description: "Optimized data models for scalability and performance",
                    points: 5,
                    priority: "Medium Priority",
                    tags: ["data", "schema", "performance"],
                    assignee: "DB Team"
                  }
                ].map((story, index) => (
                  <Card 
                    key={story.id}
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: sprintData.selectedStories.find(s => s.id === story.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      bgcolor: sprintData.selectedStories.find(s => s.id === story.id) ? '#e3f2fd' : 'white',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => {
                      const isSelected = sprintData.selectedStories.find(s => s.id === story.id);
                      if (isSelected) {
                        handleStorySelection(sprintData.selectedStories.filter(s => s.id !== story.id));
                      } else {
                        handleStorySelection([...sprintData.selectedStories, story]);
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Chip 
                            label={`${story.points}SP`} 
                            size="small" 
                            color={story.aiEstimated ? "secondary" : "primary"}
                            sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                          />
                          {story.aiEstimated && (
                            <Chip 
                              label="AI" 
                              size="small" 
                              color="info"
                              sx={{ fontSize: '0.6rem', height: 18 }}
                            />
                          )}
                        </Box>
                        <Chip 
                          label={story.priority} 
                          size="small" 
                          color={story.priority === 'High Priority' ? 'error' : 'warning'}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2, color: '#1976d2' }}>
                        {story.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3, mb: 1 }}>
                        {story.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {story.tags.map((tag, i) => (
                          <Chip 
                            key={i} 
                            label={tag} 
                            size="small" 
                            variant="outlined" 
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 20,
                              color: '#666',
                              borderColor: '#ddd'
                            }} 
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card 
                    key={`empty-${index}`}
                    variant="outlined"
                    sx={{ 
                      border: '2px dashed #e0e0e0',
                      bgcolor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Empty slot
                    </Typography>
                  </Card>
                ))}
              </Box>
              {/* AI Agent Response Display Integration */}
              <Box mt={4}>
                <AIResponseDisplay
                  responses={responses}
                  loading={loading}
                  error={error}
                  onResponseAction={handleResponseAction}
                  title="AI Story Estimation"
                  showActions
                  showAgent
                />
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - AI Story Estimation, AI Agent Capacity, Dependencies & Sprint Commitment */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* AI Story Estimation */}
              <Accordion defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls="ai-estimation-content"
                  id="ai-estimation-header"
                  sx={{ 
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '&.Mui-expanded': {
                      minHeight: 48
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology />
                    <Typography variant="h6">AI Story Estimation</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <AIStoryEstimationPanel
                    stories={sprintData.selectedStories}
                    onEstimationComplete={handleEstimationComplete}
                    onBatchEstimationComplete={handleBatchEstimationComplete}
                    initialConfiguration={{
                      scale: 'fibonacci',
                      includeBreakdown: true,
                      parallelProcessing: true
                    }}
                    showAdvancedOptions={true}
                    showHistory={true}
                    showAnalytics={false}
                    maxHeight={400}
                  />
                </AccordionDetails>
              </Accordion>
              
              {/* AI Agent Capacity */}
              <Paper elevation={1} sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  🤖 AI Agent Capacity
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>78</Typography>
                    <Typography variant="caption">Total Capacity</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>39</Typography>
                    <Typography variant="caption">Available</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>39</Typography>
                    <Typography variant="caption">Allocated</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { name: 'Frontend Agent', load: 90 },
                    { name: 'Backend Agent', load: 85 },
                    { name: 'ML Agent', load: 45 },
                    { name: 'QA Agent', load: 30 }
                  ].map((agent, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{agent.name}</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={agent.load} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.3)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: agent.load > 80 ? '#ff4444' : agent.load > 60 ? '#ffaa00' : '#44ff44'
                            }
                          }} 
                        />
                      </Box>
                      <Typography variant="caption" sx={{ minWidth: 30 }}>{agent.load}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Dependencies & Risks */}
              <Paper elevation={1} sx={{ p: 3 }}>
                <DependencyManager 
                  stories={sprintData.selectedStories}
                  dependencies={sprintData.dependencies}
                  onDependencyUpdate={(updatedDependencies) => {
                    setSprintData(prev => ({
                      ...prev,
                      dependencies: updatedDependencies
                    }));
                  }}
                />
              </Paper>

              {/* Sprint Commitment */}
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  🎯 Sprint Commitment
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }}></Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Good Commitment</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">• Capacity: 45% utilized</Typography>
                  <Typography variant="body2" color="text.secondary">• Risk: 2 blocked dependencies</Typography>
                  <Typography variant="body2" color="text.secondary">• Goal alignment: 95%</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    ✅ Commit Sprint
                  </Button>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    fullWidth
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    🔄 Run Simulation
                  </Button>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ textTransform: 'none', fontWeight: 600, color: 'grey.600', borderColor: 'grey.400' }}
                  >
                    💾 Save Draft
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* Error Display */}
        {errors.general && (
          <Box sx={{ mt: 2 }}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="body2">
                {errors.general}
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

SprintPlanningTab.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.object),
  teamMembers: PropTypes.arrayOf(PropTypes.object),
  existingSprints: PropTypes.arrayOf(PropTypes.object),
  onSprintCreate: PropTypes.func,
  onSprintUpdate: PropTypes.func,
  className: PropTypes.string
};

export default SprintPlanningTab; 