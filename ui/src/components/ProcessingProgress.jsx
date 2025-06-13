import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Collapse
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as ProcessIcon,
  TaskAlt as CompleteIcon,
  Error as ErrorIcon,
  AutorenewRounded as ProcessingIcon
} from '@mui/icons-material';

const PROCESSING_STEPS = [
  {
    id: 'upload',
    label: 'Uploading File',
    description: 'Transferring your PRD file to the server...',
    icon: <UploadIcon />,
    duration: 2000
  },
  {
    id: 'validation',
    label: 'Validating Content',
    description: 'Checking file format and content structure...',
    icon: <ProcessIcon />,
    duration: 1500
  },
  {
    id: 'parsing',
    label: 'Parsing Requirements',
    description: 'Analyzing requirements and extracting key information...',
    icon: <ProcessingIcon />,
    duration: 8000
  },
  {
    id: 'generation',
    label: 'Generating Tasks',
    description: 'Creating tasks based on the requirements...',
    icon: <ProcessingIcon />,
    duration: 5000
  },
  {
    id: 'completion',
    label: 'Finalizing',
    description: 'Saving tasks and preparing the task board...',
    icon: <CompleteIcon />,
    duration: 1000
  }
];

export default function ProcessingProgress({ 
  isVisible = false,
  currentStep = 0,
  progress = 0,
  error = null,
  customSteps = null,
  onComplete = null,
  title = "Processing PRD"
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepProgress, setStepProgress] = useState(0);
  const [currentStepData, setCurrentStepData] = useState(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(null);

  const steps = customSteps || PROCESSING_STEPS;

  useEffect(() => {
    if (isVisible && !startTime) {
      setStartTime(Date.now());
    }
  }, [isVisible, startTime]);

  useEffect(() => {
    setActiveStep(currentStep);
    
    if (currentStep < steps.length) {
      setCurrentStepData(steps[currentStep]);
    }

    // Mark previous steps as completed
    const completed = new Set();
    for (let i = 0; i < currentStep; i++) {
      completed.add(i);
    }
    setCompletedSteps(completed);
  }, [currentStep, steps]);

  useEffect(() => {
    // Calculate step progress based on overall progress
    if (currentStep < steps.length) {
      const stepSize = 100 / steps.length;
      const currentStepStart = currentStep * stepSize;
      const stepProgress = Math.max(0, Math.min(100, ((progress - currentStepStart) / stepSize) * 100));
      setStepProgress(stepProgress);

      // Estimate time remaining
      if (startTime && progress > 0) {
        const elapsed = Date.now() - startTime;
        const estimated = (elapsed / progress) * (100 - progress);
        setEstimatedTimeRemaining(Math.round(estimated / 1000));
      }
    }
  }, [progress, currentStep, steps.length, startTime]);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      setTimeout(() => onComplete(), 1000);
    }
  }, [progress, onComplete]);

  const getStepStatus = (stepIndex) => {
    if (error && stepIndex === activeStep) return 'error';
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === activeStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (step, stepIndex) => {
    const status = getStepStatus(stepIndex);
    
    switch (status) {
      case 'completed':
        return <CompleteIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'active':
        return <CircularProgress size={20} />;
      default:
        return step.icon;
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isVisible) return null;

  return (
    <Fade in={isVisible}>
      <Paper 
        elevation={4} 
        sx={{ 
          p: 3, 
          maxWidth: 600, 
          mx: 'auto',
          mt: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
            <Typography variant="h4" color="primary" fontWeight="bold">
              {Math.round(progress)}%
            </Typography>
            
            {estimatedTimeRemaining > 0 && progress < 100 && (
              <Chip 
                label={`~${formatTime(estimatedTimeRemaining)} remaining`}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Overall Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                background: error 
                  ? 'linear-gradient(90deg, #ff6b6b, #ee5a52)' 
                  : 'linear-gradient(90deg, #667eea, #764ba2)',
                transition: 'transform 0.3s ease-in-out'
              }
            }}
          />
        </Box>

        {/* Error Display */}
        <Collapse in={!!error}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Collapse>

        {/* Step-by-step Progress */}
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isActive = index === activeStep;
            
            return (
              <Step key={step.id}>
                <StepLabel
                  icon={getStepIcon(step, index)}
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: status === 'completed' ? 'success.main' : 
                             status === 'error' ? 'error.main' :
                             status === 'active' ? 'primary.main' : 'text.secondary',
                      fontWeight: isActive ? 600 : 400
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
                
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {step.description}
                  </Typography>
                  
                  {isActive && !error && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stepProgress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #4fc3f7, #29b6f6)'
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {Math.round(stepProgress)}% complete
                      </Typography>
                    </Box>
                  )}
                  
                  {status === 'completed' && (
                    <Chip 
                      label="Completed" 
                      size="small" 
                      color="success" 
                      variant="filled"
                      sx={{ mt: 1 }}
                    />
                  )}
                  
                  {status === 'error' && (
                    <Chip 
                      label="Failed" 
                      size="small" 
                      color="error" 
                      variant="filled"
                      sx={{ mt: 1 }}
                    />
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>

        {/* Completion Message */}
        {progress >= 100 && !error && (
          <Fade in={true}>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <CompleteIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" color="success.main">
                Processing Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your PRD has been successfully processed and tasks have been generated.
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Processing Animation */}
        {progress > 0 && progress < 100 && !error && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <CircularProgress size={16} />
              <Typography variant="caption">
                {currentStepData?.label || 'Processing...'}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Fade>
  );
} 