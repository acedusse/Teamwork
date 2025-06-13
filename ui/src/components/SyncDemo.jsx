/**
 * Synchronization Demo Component
 * Demonstrates data synchronization features
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Chip
} from '@mui/material';
import {
  CloudSync as SyncIcon,
  CloudOff as OfflineIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

import useSynchronization from '../hooks/useSynchronization';
import useOfflineStatus from '../hooks/useOfflineStatus';

const SyncDemo = () => {
  const [testMode, setTestMode] = useState(false);

  const {
    syncStatus,
    syncHistory,
    conflictedItems,
    error,
    startSync,
    startAutoSync,
    getSyncStatusMessage,
    getSyncStatistics,
    isSyncActive,
    canStartSync,
    queueLength
  } = useSynchronization();

  const { isOnline, connectionType } = useOfflineStatus();
  const stats = getSyncStatistics();

  const handleStartSync = async () => {
    try {
      await startSync();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleAutoSync = async () => {
    try {
      await startAutoSync();
    } catch (err) {
      console.error('Auto sync failed:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Synchronization Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the data synchronization system with offline support and conflict detection.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Connection Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {isOnline ? (
                  <Chip icon={<SuccessIcon />} label="Online" color="success" />
                ) : (
                  <Chip icon={<OfflineIcon />} label="Offline" color="error" />
                )}
                
                {connectionType && (
                  <Chip label={connectionType} variant="outlined" />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Status: {getSyncStatusMessage()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sync Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sync Statistics
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="h4" color="primary">{stats.totalSyncs}</Typography>
                  <Typography variant="caption">Total Syncs</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">{stats.successRate}%</Typography>
                  <Typography variant="caption">Success Rate</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="info.main">{stats.totalItemsSynced}</Typography>
                  <Typography variant="caption">Items Synced</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="warning.main">{queueLength}</Typography>
                  <Typography variant="caption">Queue Length</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sync Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sync Controls
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {canStartSync && (
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={handleStartSync}
                    disabled={!isOnline}
                  >
                    Start Manual Sync
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={handleAutoSync}
                  disabled={!isOnline || queueLength === 0}
                >
                  Auto Sync ({queueLength})
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Sync Status
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={`Status: ${syncStatus.status}`}
                  color={isSyncActive ? 'primary' : 'default'}
                />
                <Chip
                  label={`Progress: ${syncStatus.progress}%`}
                  variant="outlined"
                />
                <Chip
                  label={`Processed: ${syncStatus.processedItems}`}
                  variant="outlined"
                />
                {syncStatus.failedItems > 0 && (
                  <Chip
                    label={`Failed: ${syncStatus.failedItems}`}
                    color="error"
                    variant="outlined"
                  />
                )}
                {conflictedItems.length > 0 && (
                  <Chip
                    label={`Conflicts: ${conflictedItems.length}`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {getSyncStatusMessage()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SyncDemo; 