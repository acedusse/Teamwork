import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CollaborativePlanningTab from '../components/dashboard/CollaborativePlanningTab';

const CollaborativePlanningPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Collaborative Planning
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Collaborate with your team to brainstorm ideas, plan sprints, and track progress through different phases of development.
      </Typography>
      
      <Paper elevation={1} sx={{ p: 0, borderRadius: 2 }}>
        <CollaborativePlanningTab />
      </Paper>
    </Box>
  );
};

export default CollaborativePlanningPage; 