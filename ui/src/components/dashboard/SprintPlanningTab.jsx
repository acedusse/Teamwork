import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Container,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CalendarToday,
  Assignment,
  People,
  AccountTree,
  PlayArrow,
  Save,
  Refresh
} from '@mui/icons-material';
import PropTypes from 'prop-types';

// Subcomponent imports (to be implemented in future subtasks)
import SprintSetup from './SprintSetup';
import StorySelection from './StorySelection';
import CapacityPlanning from './CapacityPlanning';
import DependencyManager from './DependencyManager';

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
  const [activeStep, setActiveStep] = useState(0);
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sprint planning steps
  const steps = [
    {
      label: 'Sprint Setup',
      icon: <CalendarToday />,
      component: 'setup'
    },
    {
      label: 'Story Selection',
      icon: <Assignment />,
      component: 'stories'
    },
    {
      label: 'Capacity Planning',
      icon: <People />,
      component: 'capacity'
    },
    {
      label: 'Dependencies',
      icon: <AccountTree />,
      component: 'dependencies'
    }
  ];

  // State update handlers
  const handleSprintDataUpdate = useCallback((field, value) => {
    setSprintData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const handleStorySelection = useCallback((selectedStories) => {
    handleSprintDataUpdate('selectedStories', selectedStories);
  }, [handleSprintDataUpdate]);

  const handleTeamAllocation = useCallback((allocation) => {
    handleSprintDataUpdate('teamAllocation', allocation);
  }, [handleSprintDataUpdate]);

  const handleDependencyUpdate = useCallback((dependencies) => {
    handleSprintDataUpdate('dependencies', dependencies);
  }, [handleSprintDataUpdate]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, steps.length]);

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  }, [activeStep]);

  const handleStepClick = useCallback((stepIndex) => {
    setActiveStep(stepIndex);
  }, []);

  // Sprint operations
  const handleSaveSprint = useCallback(async () => {
    setIsLoading(true);
    try {
      if (onSprintCreate) {
        await onSprintCreate(sprintData);
      }
      // Reset form or show success message
    } catch (error) {
      console.error('Error creating sprint:', error);
      setErrors({ general: 'Failed to create sprint. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [sprintData, onSprintCreate]);

  const handleResetForm = useCallback(() => {
    setSprintData({
      name: '',
      startDate: null,
      endDate: null,
      goal: '',
      teamCapacity: 0,
      selectedStories: [],
      teamAllocation: {},
      dependencies: []
    });
    setActiveStep(0);
    setErrors({});
  }, []);

  // Calculate sprint metrics
  const totalStoryPoints = sprintData.selectedStories.reduce((sum, story) => sum + (story.points || 0), 0);
  const capacityUtilization = sprintData.teamCapacity > 0 ? (totalStoryPoints / sprintData.teamCapacity) * 100 : 0;

  // Render current step component
  const renderStepContent = () => {
    const currentStep = steps[activeStep];
    
    switch (currentStep.component) {
      case 'setup':
        return (
          <SprintSetup
            sprintData={sprintData}
            onUpdate={handleSprintDataUpdate}
            errors={errors}
            teamMembers={teamMembers}
          />
        );
      case 'stories':
        return (
          <StorySelection
            stories={stories}
            selectedStories={sprintData.selectedStories}
            onSelectionChange={handleStorySelection}
            teamCapacity={sprintData.teamCapacity}
          />
        );
      case 'capacity':
        return (
          <CapacityPlanning
            teamMembers={teamMembers}
            selectedStories={sprintData.selectedStories}
            teamAllocation={sprintData.teamAllocation}
            onAllocationChange={handleTeamAllocation}
            sprintDuration={sprintData.startDate && sprintData.endDate ? 
              Math.ceil((sprintData.endDate - sprintData.startDate) / (1000 * 60 * 60 * 24)) : 0}
          />
        );
      case 'dependencies':
        return (
          <DependencyManager
            stories={sprintData.selectedStories}
            dependencies={sprintData.dependencies}
            onDependencyUpdate={handleDependencyUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" className={className}>
      <Box sx={{ py: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sprint Planning
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Plan and organize your next sprint with story selection, capacity planning, and dependency management
          </Typography>
          
          {/* Sprint Metrics Overview */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {sprintData.selectedStories.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stories Selected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {totalStoryPoints}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Story Points
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {sprintData.teamCapacity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team Capacity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color={capacityUtilization > 100 ? 'error' : 'primary'}>
                    {capacityUtilization.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capacity Utilization
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Sprint Planning Stepper */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Stepper 
              activeStep={activeStep} 
              orientation={isMobile ? 'vertical' : 'horizontal'}
              sx={{ mb: 3 }}
            >
              {steps.map((step, index) => (
                <Step 
                  key={step.label}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleStepClick(index)}
                >
                  <StepLabel 
                    icon={step.icon}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: activeStep === index ? 'bold' : 'normal'
                      }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={(activeStep / (steps.length - 1)) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Step Content */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Box sx={{ p: 3, minHeight: 400 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <LinearProgress sx={{ width: '50%' }} />
              </Box>
            ) : (
              renderStepContent()
            )}
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Paper elevation={1}>
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Button
                onClick={handleResetForm}
                startIcon={<Refresh />}
                variant="outlined"
                color="secondary"
              >
                Reset Form
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  onClick={handleSaveSprint}
                  disabled={isLoading || sprintData.selectedStories.length === 0}
                  startIcon={<Save />}
                  variant="contained"
                  color="primary"
                >
                  Create Sprint
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  color="primary"
                  endIcon={<PlayArrow />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

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