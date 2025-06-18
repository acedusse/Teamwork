import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  CalendarToday, 
  People, 
  Person, 
  Edit, 
  TrendingUp,
  Timeline,
  AssignmentTurnedIn
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { addDays, differenceInDays, format, isValid } from 'date-fns';

const SprintSetup = ({ sprintData, onUpdate, errors, teamMembers, existingSprints }) => {
  const [localErrors, setLocalErrors] = useState({});
  const [velocityData, setVelocityData] = useState(null);

  // Calculate sprint duration
  const sprintDuration = sprintData.startDate && sprintData.endDate && 
    isValid(sprintData.startDate) && isValid(sprintData.endDate)
    ? differenceInDays(sprintData.endDate, sprintData.startDate) + 1
    : 0;

  // Calculate team velocity based on historical data
  useEffect(() => {
    if (existingSprints && existingSprints.length > 0) {
      const recentSprints = existingSprints.slice(-3); // Last 3 sprints
      const avgVelocity = recentSprints.reduce((sum, sprint) => 
        sum + (sprint.completedPoints || 0), 0) / recentSprints.length;
      
      setVelocityData({
        averageVelocity: Math.round(avgVelocity),
        sprintsAnalyzed: recentSprints.length,
        lastSprintVelocity: recentSprints[recentSprints.length - 1]?.completedPoints || 0
      });
    }
  }, [existingSprints]);

  // Auto-calculate team capacity based on selected team members
  useEffect(() => {
    if (sprintData.selectedTeamMembers && sprintData.selectedTeamMembers.length > 0 && sprintDuration > 0) {
      const totalCapacity = sprintData.selectedTeamMembers.reduce((sum, member) => {
        const dailyCapacity = member.dailyCapacity || 6; // Default 6 story points per day
        const availability = member.availability || 1; // Default 100% availability
        return sum + (dailyCapacity * sprintDuration * availability);
      }, 0);
      
      if (totalCapacity !== sprintData.teamCapacity) {
        onUpdate('teamCapacity', Math.round(totalCapacity));
      }
    }
  }, [sprintData.selectedTeamMembers, sprintDuration, onUpdate, sprintData.teamCapacity]);

  // Validation
  const validateField = (field, value) => {
    const newErrors = { ...localErrors };
    
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 3) {
          newErrors.name = 'Sprint name must be at least 3 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'startDate':
        if (!value || !isValid(value)) {
          newErrors.startDate = 'Please select a valid start date';
        } else if (value < new Date().setHours(0, 0, 0, 0)) {
          newErrors.startDate = 'Start date cannot be in the past';
        } else {
          delete newErrors.startDate;
        }
        break;
      case 'endDate':
        if (!value || !isValid(value)) {
          newErrors.endDate = 'Please select a valid end date';
        } else if (sprintData.startDate && value <= sprintData.startDate) {
          newErrors.endDate = 'End date must be after start date';
        } else {
          delete newErrors.endDate;
        }
        break;
      case 'goal':
        if (!value || value.trim().length < 10) {
          newErrors.goal = 'Sprint goal should be at least 10 characters';
        } else {
          delete newErrors.goal;
        }
        break;
    }
    
    setLocalErrors(newErrors);
  };

  const handleUpdate = (field, value) => {
    validateField(field, value);
    onUpdate(field, value);
  };

  const handleTeamMemberSelection = (event, newValue) => {
    onUpdate('selectedTeamMembers', newValue);
  };

  const handleMemberCapacityChange = (memberId, field, value) => {
    const updatedMembers = sprintData.selectedTeamMembers.map(member => 
      member.id === memberId 
        ? { ...member, [field]: parseFloat(value) || 0 }
        : member
    );
    onUpdate('selectedTeamMembers', updatedMembers);
  };

  const allErrors = { ...errors, ...localErrors };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday />
          Sprint Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your sprint details, timeline, and team capacity
        </Typography>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentTurnedIn />
                  Basic Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Sprint Name"
                  value={sprintData.name || ''}
                  onChange={(e) => handleUpdate('name', e.target.value)}
                  error={!!allErrors.name}
                  helperText={allErrors.name}
                  sx={{ mb: 2 }}
                  placeholder="e.g., Sprint 1: Authentication & Core Features"
                />
                
                <TextField
                  fullWidth
                  label="Sprint Goal"
                  multiline
                  rows={4}
                  value={sprintData.goal || ''}
                  onChange={(e) => handleUpdate('goal', e.target.value)}
                  error={!!allErrors.goal}
                  helperText={allErrors.goal}
                  placeholder="What do you want to achieve in this sprint? Be specific about the business value and outcomes."
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Timeline & Duration */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline />
                  Timeline & Duration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={sprintData.startDate}
                      onChange={(date) => handleUpdate('startDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!allErrors.startDate}
                          helperText={allErrors.startDate}
                        />
                      )}
                      minDate={new Date()}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date"
                      value={sprintData.endDate}
                      onChange={(date) => handleUpdate('endDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!allErrors.endDate}
                          helperText={allErrors.endDate}
                        />
                      )}
                      minDate={sprintData.startDate ? addDays(sprintData.startDate, 1) : new Date()}
                    />
                  </Grid>
                </Grid>
                
                {sprintDuration > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary.contrastText">
                      <strong>Sprint Duration:</strong> {sprintDuration} days
                      {sprintDuration < 7 && (
                        <Chip 
                          label="Short Sprint" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                      {sprintDuration > 21 && (
                        <Chip 
                          label="Long Sprint" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Team Selection */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People />
                  Team Members
                </Typography>
                
                <Autocomplete
                  multiple
                  options={teamMembers || []}
                  getOptionLabel={(option) => option.name || 'Unknown'}
                  value={sprintData.selectedTeamMembers || []}
                  onChange={handleTeamMemberSelection}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.name}
                        {...getTagProps({ index })}
                        avatar={<Avatar sx={{ width: 24, height: 24 }}><Person /></Avatar>}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Select Team Members"
                      placeholder="Choose team members for this sprint"
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                {sprintData.selectedTeamMembers && sprintData.selectedTeamMembers.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Team Member Capacity Settings
                    </Typography>
                    <List>
                      {sprintData.selectedTeamMembers.map((member, index) => (
                        <React.Fragment key={member.id}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar>
                                <Person />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={member.name}
                              secondary={member.role || 'Developer'}
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                  size="small"
                                  label="Daily SP"
                                  type="number"
                                  value={member.dailyCapacity || 6}
                                  onChange={(e) => handleMemberCapacityChange(member.id, 'dailyCapacity', e.target.value)}
                                  sx={{ width: 80 }}
                                  inputProps={{ min: 1, max: 20 }}
                                />
                                <TextField
                                  size="small"
                                  label="Availability"
                                  type="number"
                                  value={(member.availability || 1) * 100}
                                  onChange={(e) => handleMemberCapacityChange(member.id, 'availability', e.target.value / 100)}
                                  sx={{ width: 90 }}
                                  inputProps={{ min: 10, max: 100 }}
                                  InputProps={{ endAdornment: '%' }}
                                />
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < sprintData.selectedTeamMembers.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Capacity Overview */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp />
                  Capacity Overview
                </Typography>
                
                <TextField
                  fullWidth
                  label="Team Capacity (Story Points)"
                  type="number"
                  value={sprintData.teamCapacity || ''}
                  onChange={(e) => handleUpdate('teamCapacity', parseInt(e.target.value) || 0)}
                  error={!!allErrors.teamCapacity}
                  helperText={allErrors.teamCapacity || 'Total story points the team can handle this sprint'}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: 'SP'
                  }}
                />

                {sprintData.teamCapacity > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Capacity Breakdown:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Daily Average:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {sprintDuration > 0 ? Math.round(sprintData.teamCapacity / sprintDuration) : 0} SP/day
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Team Members:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {sprintData.selectedTeamMembers?.length || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">SP per Member:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {sprintData.selectedTeamMembers?.length > 0 
                          ? Math.round(sprintData.teamCapacity / sprintData.selectedTeamMembers.length)
                          : 0} SP
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Velocity Analysis */}
          {velocityData && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Velocity Analysis
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Average Velocity:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {velocityData.averageVelocity} SP
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Last Sprint:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {velocityData.lastSprintVelocity} SP
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Based on:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {velocityData.sprintsAnalyzed} sprints
                    </Typography>
                  </Box>

                  {sprintData.teamCapacity > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Capacity vs Historical Velocity:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((velocityData.averageVelocity / sprintData.teamCapacity) * 100, 100)}
                        color={
                          velocityData.averageVelocity > sprintData.teamCapacity * 1.1 ? 'error' :
                          velocityData.averageVelocity < sprintData.teamCapacity * 0.8 ? 'warning' : 'success'
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {velocityData.averageVelocity > sprintData.teamCapacity * 1.1 && 'Capacity may be too low'}
                        {velocityData.averageVelocity < sprintData.teamCapacity * 0.8 && 'Capacity may be too high'}
                        {velocityData.averageVelocity >= sprintData.teamCapacity * 0.8 && 
                         velocityData.averageVelocity <= sprintData.teamCapacity * 1.1 && 'Capacity looks realistic'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Validation Summary */}
        {Object.keys(allErrors).length > 0 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Please fix the following issues:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {Object.values(allErrors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

SprintSetup.propTypes = {
  sprintData: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  errors: PropTypes.object,
  teamMembers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string,
    dailyCapacity: PropTypes.number,
    availability: PropTypes.number
  })),
  existingSprints: PropTypes.arrayOf(PropTypes.shape({
    completedPoints: PropTypes.number
  }))
};

export default SprintSetup; 