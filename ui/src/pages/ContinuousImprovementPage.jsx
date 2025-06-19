import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ContinuousImprovementTab from '../components/dashboard/ContinuousImprovementTab';

/**
 * ContinuousImprovementPage - Page wrapper for the ContinuousImprovementTab component
 * 
 * This page provides the main interface for continuous improvement features including:
 * - Retrospective management with Start/Stop/Continue format
 * - Action item tracking with status and assignee management  
 * - Improvement metrics with trend analysis
 * - Export functionality for retrospective reports
 */
const ContinuousImprovementPage = () => {
  const handleRetrospectiveCreate = (retrospectiveData) => {
    // TODO: Implement retrospective creation logic
    console.log('Creating retrospective:', retrospectiveData);
  };

  const handleActionItemUpdate = (actionItemData) => {
    // TODO: Implement action item update logic
    console.log('Updating action item:', actionItemData);
  };

  const handleExportReport = (exportOptions) => {
    // TODO: Implement report export logic
    console.log('Exporting report:', exportOptions);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: 1
          }}
        >
          Continuous Improvement
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Track team retrospectives, manage action items, and monitor improvement metrics to drive continuous enhancement of your development process.
        </Typography>
      </Paper>

      <ContinuousImprovementTab
        onRetrospectiveCreate={handleRetrospectiveCreate}
        onActionItemUpdate={handleActionItemUpdate}
        onExportReport={handleExportReport}
      />
    </Box>
  );
};

export default ContinuousImprovementPage; 