import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountTree,
  Link,
  Warning,
  CheckCircle,
  Add,
  Block,
  Settings,
  ErrorOutline,
  InfoOutlined
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const DependencyManager = ({ stories, dependencies, onDependencyUpdate }) => {
  const [manageDependenciesOpen, setManageDependenciesOpen] = useState(false);

  const dependencyCount = dependencies.length;
  const blockedStories = stories.filter(story => 
    dependencies.some(dep => dep.dependentId === story.id)
  );

  // Sample risk data matching the image
  const riskItems = [
    {
      id: 1,
      title: "Critical Path",
      description: "User Authentication → Task Management → AI Communication",
      severity: "critical",
      status: "blocked",
      stories: 3
    },
    {
      id: 2,
      title: "External API Access",
      description: "Needs AI Communication depending",
      severity: "warning",
      status: "at-risk",
      stories: 1
    },
    {
      id: 3,
      title: "Database Migration",
      description: "Task May delay authentication",
      severity: "warning",
      status: "at-risk",
      stories: 1
    },
    {
      id: 4,
      title: "UI Framework Setup",
      description: "Ready Timeline task UI steps",
      severity: "info",
      status: "ready",
      stories: 1
    }
  ];

  // Calculate status counts
  const statusCounts = {
    ready: riskItems.filter(item => item.status === 'ready').length,
    atRisk: riskItems.filter(item => item.status === 'at-risk').length,
    blocked: riskItems.filter(item => item.status === 'blocked').length
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#f44336'; // Red
      case 'warning': return '#ff9800'; // Orange
      case 'info': return '#4caf50'; // Green
      default: return '#9e9e9e'; // Grey
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'at-risk': return <Warning sx={{ color: '#ff9800' }} />;
      case 'blocked': return <Block sx={{ color: '#f44336' }} />;
      default: return <InfoOutlined sx={{ color: '#9e9e9e' }} />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountTree />
        AI Agent Capacity
      </Typography>

      {/* Agent Capacity Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#666' }}>
              78
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Capacity
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#666' }}>
              39
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Allocated
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#666' }}>
              39
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Agent Allocation */}
      <Box sx={{ mb: 3 }}>
        {[
          { name: 'Frontend Agent', allocated: 12, color: '#9c27b0' },
          { name: 'Backend Agent', allocated: 15, color: '#673ab7' },
          { name: 'ML Agent', allocated: 8, color: '#3f51b5' },
          { name: 'QA Agent', allocated: 4, color: '#2196f3' }
        ].map((agent, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ width: 20, height: 20, bgcolor: agent.color, mr: 1, fontSize: '0.7rem' }}>
              {agent.name.charAt(0)}
            </Avatar>
            <Typography variant="body2" sx={{ minWidth: 100, fontSize: '0.8rem' }}>
              {agent.name}
            </Typography>
            <Box sx={{ 
              flex: 1, 
              height: 8, 
              bgcolor: agent.color, 
              borderRadius: 1, 
              mr: 1,
              position: 'relative'
            }}>
              <Box sx={{
                position: 'absolute',
                right: 4,
                top: -2,
                fontSize: '0.7rem',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {agent.allocated}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Dependencies & Risks Section */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
        <ErrorOutline />
        Dependencies & Risks
      </Typography>

      {/* Status Overview */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {statusCounts.ready}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {statusCounts.atRisk}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              At Risk
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Block sx={{ color: '#f44336', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {statusCounts.blocked}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Blocked
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Risk Items List */}
      <List dense sx={{ mb: 2 }}>
        {riskItems.map((item) => (
          <ListItem 
            key={item.id}
            sx={{ 
              px: 0, 
              py: 1,
              borderLeft: `4px solid ${getSeverityColor(item.severity)}`,
              mb: 1,
              bgcolor: 'rgba(0,0,0,0.02)',
              borderRadius: '0 4px 4px 0'
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getStatusIcon(item.status)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {item.title}
                  </Typography>
                  <Chip 
                    label={`${item.stories} ${item.stories === 1 ? 'story' : 'stories'}`}
                    size="small"
                    sx={{ 
                      height: 16, 
                      fontSize: '0.7rem',
                      bgcolor: getSeverityColor(item.severity),
                      color: 'white'
                    }}
                  />
                </Box>
              }
              secondary={item.description}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
            />
          </ListItem>
        ))}
      </List>

      {/* Sprint Commitment Section */}
      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ color: '#4caf50' }} />
          Sprint Commitment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          + Capacity: 40% utilized
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          + Risk: 2 blocked dependencies
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          + Goal alignment: 95%
        </Typography>
        
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              fullWidth
              sx={{ fontSize: '0.7rem', py: 0.5 }}
            >
              Commit Sprint
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button 
              variant="outlined" 
              color="warning" 
              size="small" 
              fullWidth
              sx={{ fontSize: '0.7rem', py: 0.5 }}
            >
              Run Simulation
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="small" 
              fullWidth
              sx={{ fontSize: '0.7rem', py: 0.5 }}
            >
              Save Draft
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Manage Dependencies Button */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Settings />}
          onClick={() => setManageDependenciesOpen(true)}
          sx={{ 
            bgcolor: '#666',
            '&:hover': { bgcolor: '#555' }
          }}
        >
          Manage Dependencies
        </Button>
      </Box>

      {/* Manage Dependencies Dialog */}
      <Dialog 
        open={manageDependenciesOpen} 
        onClose={() => setManageDependenciesOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Dependencies</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure story dependencies and risk management settings
          </Typography>
          
          <Box sx={{ 
            height: 300, 
            border: '2px dashed #ddd', 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f9f9f9'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <AccountTree sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Interactive dependency management interface
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Full implementation coming in subtask 4.3
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageDependenciesOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setManageDependenciesOpen(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

DependencyManager.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.object).isRequired,
  dependencies: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDependencyUpdate: PropTypes.func.isRequired
};

export default DependencyManager; 