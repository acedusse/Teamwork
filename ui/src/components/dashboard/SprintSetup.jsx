import React from 'react';
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
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PropTypes from 'prop-types';

const SprintSetup = ({ sprintData, onUpdate, errors, teamMembers }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Sprint Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your sprint details, timeline, and team capacity
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Sprint Name"
                  value={sprintData.name || ''}
                  onChange={(e) => onUpdate('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Sprint Goal"
                  multiline
                  rows={3}
                  value={sprintData.goal || ''}
                  onChange={(e) => onUpdate('goal', e.target.value)}
                  error={!!errors.goal}
                  helperText={errors.goal}
                  placeholder="What do you want to achieve in this sprint?"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Timeline & Capacity
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={sprintData.startDate}
                      onChange={(date) => onUpdate('startDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.startDate}
                          helperText={errors.startDate}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date"
                      value={sprintData.endDate}
                      onChange={(date) => onUpdate('endDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.endDate}
                          helperText={errors.endDate}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                
                <TextField
                  fullWidth
                  label="Team Capacity (Story Points)"
                  type="number"
                  value={sprintData.teamCapacity || ''}
                  onChange={(e) => onUpdate('teamCapacity', parseInt(e.target.value) || 0)}
                  error={!!errors.teamCapacity}
                  helperText={errors.teamCapacity || 'Total story points the team can handle'}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Placeholder for future enhancements */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            📝 This component will be fully implemented in subtask 4.2
          </Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

SprintSetup.propTypes = {
  sprintData: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  errors: PropTypes.object,
  teamMembers: PropTypes.arrayOf(PropTypes.object)
};

export default SprintSetup; 