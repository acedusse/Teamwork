import React from 'react';
import { Box, Paper, Typography, Grid, Button, useTheme } from '@mui/material';
import { BarChart, Timeline, Assessment } from '@mui/icons-material';

const SprintMetrics = ({ onBurndownChart, onCumulativeFlow }) => {
  const theme = useTheme();

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          📊 Sprint Metrics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<Assessment />} onClick={onBurndownChart}>
            Burndown Chart
          </Button>
          <Button variant="outlined" size="small" startIcon={<Timeline />} onClick={onCumulativeFlow}>
            Cumulative Flow
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>67</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Story Points Completed</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>+12% vs last sprint</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>2.1</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Avg Cycle Time (days)</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>-0.4d improvement</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>89%</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Sprint Goal Achievement</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>On track</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>1</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Blocked Items</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Needs attention</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SprintMetrics;
 