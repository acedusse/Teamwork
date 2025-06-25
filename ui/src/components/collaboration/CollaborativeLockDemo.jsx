import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Paper,
  Avatar,
  Divider
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import { 
  CollaborativeTextField, 
  CollaborativeForm,
  useCollaborativeField 
} from './CollaborativeField.jsx';
import { LockChip, LockStatus } from './LockIndicator.jsx';
import useCollaborativeLocks from '../../hooks/useCollaborativeLocks.js';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx';

export const CollaborativeLockDemo = () => {
  const { currentUser, connectedUsers } = useWebSocket();
  const { activeLocks, ownedLocks } = useCollaborativeLocks();
  
  const [demoData, setDemoData] = useState({
    title: 'Sample Task Title',
    description: 'This is a sample task description that can be collaboratively edited.',
    priority: 'high',
    status: 'in-progress'
  });

  const [autoLock, setAutoLock] = useState(false);

  const customField = useCollaborativeField('task', 'demo-1', 'custom', {
    lockTimeout: 30000
  });

  const handleFormChange = (field) => (event) => {
    setDemoData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Collaborative Editing Locks Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the collaborative editing lock system that prevents conflicts 
        when multiple users are editing the same content simultaneously.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Connection Status" 
          avatar={<Avatar><PeopleIcon /></Avatar>}
        />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Current User: <strong>{currentUser?.userName || 'Anonymous'}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Connected Users: <strong>{connectedUsers?.length || 0}</strong>
              </Typography>
              <Typography variant="body2">
                Active Locks: <strong>{activeLocks.length}</strong> | 
                Owned Locks: <strong>{ownedLocks.length}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <LockStatus 
                activeLocks={activeLocks} 
                ownedLocks={ownedLocks}
                variant="detailed"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Demo Controls" />
        <CardContent>
          <FormControlLabel
            control={
              <Switch 
                checked={autoLock} 
                onChange={(e) => setAutoLock(e.target.checked)}
              />
            }
            label="Auto-lock on focus"
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Collaborative Form" 
              subheader="Try editing these fields while another user is also editing"
            />
            <CardContent>
              <CollaborativeForm
                resourceType="task"
                resourceId="demo-1"
                autoLock={autoLock}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <CollaborativeTextField
                      field="title"
                      label="Task Title"
                      value={demoData.title}
                      onChange={handleFormChange('title')}
                      fullWidth
                      variant="outlined"
                      helperText="Click to request edit lock"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <CollaborativeTextField
                      field="description"
                      label="Description"
                      value={demoData.description}
                      onChange={handleFormChange('description')}
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      helperText="Multi-line text field with collaborative locks"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <CollaborativeTextField
                      field="priority"
                      label="Priority"
                      value={demoData.priority}
                      onChange={handleFormChange('priority')}
                      fullWidth
                      variant="outlined"
                      lockIndicatorPosition="top-left"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <CollaborativeTextField
                      field="status"
                      label="Status"
                      value={demoData.status}
                      onChange={handleFormChange('status')}
                      fullWidth
                      variant="outlined"
                      lockIndicatorPosition="bottom-right"
                    />
                  </Grid>
                </Grid>
              </CollaborativeForm>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Lock Indicators" />
            <CardContent>
              <Typography variant="body2" gutterBottom>
                Different ways to display lock status:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Lock Chips:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <LockChip 
                    lockInfo={null}
                    size="small"
                  />
                  <LockChip 
                    lockInfo={{ 
                      userName: 'John Doe', 
                      ownedByCurrentUser: true,
                      expiresAt: Date.now() + 25000
                    }}
                    size="small"
                  />
                  <LockChip 
                    lockInfo={{ 
                      userName: 'Jane Smith', 
                      ownedByCurrentUser: false,
                      expiresAt: Date.now() + 15000
                    }}
                    size="small"
                  />
                  <LockChip 
                    lockInfo={{ pending: true }}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" gutterBottom>
                Custom field using useCollaborativeField hook:
              </Typography>
              
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    minHeight: 80,
                    backgroundColor: customField.isDisabled ? 'action.disabled' : 'background.paper',
                    cursor: customField.isDisabled ? 'not-allowed' : 'text'
                  }}
                  onClick={customField.canEdit ? customField.requestLock : undefined}
                >
                  <Typography variant="body2">
                    {customField.ownedByCurrentUser ? 
                      'You are editing this field' :
                      customField.locked ?
                      `Locked by ${customField.lockInfo?.userName}` :
                      'Click to start editing'
                    }
                  </Typography>
                </Paper>
                
                <LockChip
                  lockInfo={customField.lockInfo}
                  size="small"
                  onRequestLock={customField.requestLock}
                  onReleaseLock={customField.releaseLock}
                  sx={{ position: 'absolute', top: -8, right: -8 }}
                />
              </Box>

              {customField.lockError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {customField.lockError}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardHeader title="How to Test" />
        <CardContent>
          <Typography variant="body2" paragraph>
            <strong>To test collaborative editing locks:</strong>
          </Typography>
          <ol>
            <li>Open this page in multiple browser tabs or windows</li>
            <li>Try editing the same field from different tabs</li>
            <li>Observe how locks prevent conflicts and show who is editing</li>
            <li>Test the auto-lock feature by enabling it in the controls</li>
            <li>Watch lock indicators update in real-time</li>
          </ol>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Locks automatically expire after 30 seconds of inactivity 
              or when the user disconnects. You can extend locks by continuing to type.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CollaborativeLockDemo; 