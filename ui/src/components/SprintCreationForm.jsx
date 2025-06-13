import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Add as AddIcon,
  Event as EventIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';

export default function SprintCreationForm({ onSprintCreate, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: null,
    endDate: null,
    goals: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validate sprint name
    if (!formData.name.trim()) {
      newErrors.name = 'Sprint name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Sprint name must be at least 3 characters long';
    }

    // Validate start date
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (formData.startDate < new Date()) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    // Validate end date
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate goals
    if (!formData.goals.trim()) {
      newErrors.goals = 'Sprint goals are required';
    } else if (formData.goals.trim().length < 10) {
      newErrors.goals = 'Sprint goals should be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sprintData = {
        ...formData,
        name: formData.name.trim(),
        goals: formData.goals.trim(),
        createdAt: new Date(),
        status: 'planned'
      };

      if (onSprintCreate) {
        await onSprintCreate(sprintData);
      }

      // Reset form on success
      setFormData({
        name: '',
        startDate: null,
        endDate: null,
        goals: ''
      });
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to create sprint. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      startDate: null,
      endDate: null,
      goals: ''
    });
    setErrors({});
    
    if (onCancel) {
      onCancel();
    }
  };

  const calculateSprintDuration = () => {
    if (formData.startDate && formData.endDate) {
      const diffTime = Math.abs(formData.endDate - formData.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  const sprintDuration = calculateSprintDuration();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={2}
        sx={{
          p: 4,
          maxWidth: 600,
          mx: 'auto',
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Sprint
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up a new sprint with timeline and objectives
          </Typography>
        </Box>

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {/* Sprint Name */}
            <FormControl fullWidth error={!!errors.name}>
              <InputLabel htmlFor="sprint-name">Sprint Name</InputLabel>
              <OutlinedInput
                id="sprint-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name')(e.target.value)}
                label="Sprint Name"
                placeholder="e.g., Sprint 1 - User Authentication"
                disabled={isSubmitting}
              />
              {errors.name && (
                <FormHelperText>{errors.name}</FormHelperText>
              )}
            </FormControl>

            {/* Date Range */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={handleInputChange('startDate')}
                disabled={isSubmitting}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={handleInputChange('endDate')}
                disabled={isSubmitting}
                minDate={formData.startDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDate,
                    helperText: errors.endDate
                  }
                }}
              />
            </Stack>

            {/* Duration Display */}
            {sprintDuration && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2">
                  Sprint Duration: <strong>{sprintDuration} days</strong>
                </Typography>
              </Box>
            )}

            {/* Sprint Goals */}
            <FormControl fullWidth error={!!errors.goals}>
              <TextField
                label="Sprint Goals"
                multiline
                rows={4}
                value={formData.goals}
                onChange={(e) => handleInputChange('goals')(e.target.value)}
                placeholder="Describe the main objectives and outcomes for this sprint..."
                disabled={isSubmitting}
                error={!!errors.goals}
                helperText={errors.goals || `${formData.goals.length}/500 characters`}
                inputProps={{ maxLength: 500 }}
              />
            </FormControl>

            {/* Form Actions */}
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? null : <AddIcon />}
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              >
                {isSubmitting ? 'Creating Sprint...' : 'Create Sprint'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
} 