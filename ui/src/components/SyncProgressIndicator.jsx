/**
 * SyncProgressIndicator Component
 * Visual indicator for data synchronization progress
 * Shows sync status, progress bar, and provides sync controls
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Stop as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import useSynchronization from '../hooks/useSynchronization';

// Main Sync Progress Indicator
const SyncProgressIndicator = ({ 
  variant = 'card', // 'card', 'banner', 'compact', 'floating'
  showControls = true,
  showHistory = false,
  showConflicts = true,
  onConflictResolve
}) => {
  const {
    syncStatus,
    syncHistory,
    conflictedItems,
    error,
    isInitialized,
    startSync,
    startAutoSync,
    pauseSync,
    resumeSync,
    cancelSync,
    getSyncStatusMessage,
    formatSyncDuration,
    formatEstimatedTimeRemaining,
    getSyncStatistics,
    isSyncActive,
    canStartSync,
    canPauseSync,
    canResumeSync,
    canCancelSync,
    hasConflicts,
    hasErrors,
    syncProgress,
    queueLength,
    isOnline
  } = useSynchronization();

  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false);
  const [showConflictsDialog, setShowConflictsDialog] = React.useState(false);
  const [expandedDetails, setExpandedDetails] = React.useState(false);

  if (!isInitialized) {
    return <Box sx={{ p: 2 }}>Loading sync status...</Box>;
  }

  const handleStartSync = async () => {
    try {
      await startSync();
    } catch (err) {
      console.error('Failed to start sync:', err);
    }
  };

  const handleAutoSync = async () => {
    try {
      await startAutoSync();
    } catch (err) {
      console.error('Failed to start auto sync:', err);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <CloudSyncIcon color="primary" className="sync-icon-spinning" />;
      case 'completed':
        return hasErrors ? <WarningIcon color="warning" /> : <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'paused':
        return <PauseIcon color="action" />;
      case 'cancelled':
        return <ErrorIcon color="disabled" />;
      default:
        return <SyncIcon color="action" />;
    }
  };

  const getStatusColor = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'primary';
      case 'completed':
        return hasErrors ? 'warning' : 'success';
      case 'error':
        return 'error';
      case 'paused':
        return 'default';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const renderProgressBar = () => {
    if (!isSyncActive && syncStatus.status !== 'paused') {
      return null;
    }

    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={syncProgress} 
          color={getStatusColor()}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {syncProgress}% complete
          </Typography>
          {syncStatus.estimatedTimeRemaining && (
            <Typography variant="caption" color="text.secondary">
              {formatEstimatedTimeRemaining(syncStatus.estimatedTimeRemaining)} remaining
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderSyncControls = () => {
    if (!showControls) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        {canStartSync && (
          <>
            <Button
              variant="contained"
              size="small"
              startIcon={<SyncIcon />}
              onClick={handleStartSync}
              disabled={!isOnline}
            >
              Start Sync
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudSyncIcon />}
              onClick={handleAutoSync}
              disabled={!isOnline || queueLength === 0}
            >
              Auto Sync ({queueLength})
            </Button>
          </>
        )}
        
        {canPauseSync && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PauseIcon />}
            onClick={pauseSync}
          >
            Pause
          </Button>
        )}
        
        {canResumeSync && (
          <Button
            variant="contained"
            size="small"
            startIcon={<ResumeIcon />}
            onClick={resumeSync}
            disabled={!isOnline}
          >
            Resume
          </Button>
        )}
        
        {canCancelSync && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CancelIcon />}
            onClick={cancelSync}
            color="error"
          >
            Cancel
          </Button>
        )}
      </Box>
    );
  };

  const renderStatusChips = () => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
      <Chip
        size="small"
        label={isOnline ? 'Online' : 'Offline'}
        color={isOnline ? 'success' : 'error'}
        variant="outlined"
      />
      
      {queueLength > 0 && (
        <Chip
          size="small"
          label={`${queueLength} queued`}
          color="primary"
          variant="outlined"
        />
      )}
      
      {hasConflicts && (
        <Chip
          size="small"
          label={`${conflictedItems.length} conflicts`}
          color="warning"
          variant="outlined"
          onClick={() => setShowConflictsDialog(true)}
          clickable
        />
      )}
      
      {syncHistory.length > 0 && (
        <Chip
          size="small"
          label="History"
          color="default"
          variant="outlined"
          icon={<HistoryIcon />}
          onClick={() => setShowHistoryDialog(true)}
          clickable
        />
      )}
    </Box>
  );

  const renderDetails = () => (
    <Collapse in={expandedDetails}>
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sync Details
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Items</Typography>
            <Typography variant="body2">{syncStatus.totalItems}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Processed</Typography>
            <Typography variant="body2">{syncStatus.processedItems}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Failed</Typography>
            <Typography variant="body2" color={syncStatus.failedItems > 0 ? 'error.main' : 'inherit'}>
              {syncStatus.failedItems}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Conflicts</Typography>
            <Typography variant="body2" color={syncStatus.conflictedItems > 0 ? 'warning.main' : 'inherit'}>
              {syncStatus.conflictedItems}
            </Typography>
          </Box>
          
          {syncStatus.startTime && (
            <>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
                <Typography variant="body2">
                  {formatSyncDuration(syncStatus.startTime, syncStatus.endTime)}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Collapse>
  );

  // Render based on variant
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getStatusIcon()}
        <Typography variant="body2">{getSyncStatusMessage()}</Typography>
        {isSyncActive && (
          <LinearProgress 
            variant="determinate" 
            value={syncProgress} 
            sx={{ width: 100, height: 4 }}
          />
        )}
      </Box>
    );
  }

  if (variant === 'banner') {
    return (
      <Alert 
        severity={getStatusColor()} 
        icon={getStatusIcon()}
        action={showControls && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canStartSync && isOnline && queueLength > 0 && (
              <Button size="small" onClick={handleAutoSync}>
                Sync Now
              </Button>
            )}
            {canPauseSync && (
              <IconButton size="small" onClick={pauseSync}>
                <PauseIcon />
              </IconButton>
            )}
            {canResumeSync && (
              <IconButton size="small" onClick={resumeSync} disabled={!isOnline}>
                <ResumeIcon />
              </IconButton>
            )}
          </Box>
        )}
      >
        <Box>
          <Typography variant="body2">{getSyncStatusMessage()}</Typography>
          {renderProgressBar()}
        </Box>
      </Alert>
    );
  }

  if (variant === 'floating') {
    return (
      <Card 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          minWidth: 300,
          zIndex: 1000,
          display: isSyncActive || hasErrors || hasConflicts ? 'block' : 'none'
        }}
        elevation={6}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {getStatusIcon()}
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {getSyncStatusMessage()}
            </Typography>
            <IconButton size="small" onClick={() => setExpandedDetails(!expandedDetails)}>
              {expandedDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          {renderProgressBar()}
          {renderDetails()}
          
          {showControls && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
              {canPauseSync && (
                <IconButton size="small" onClick={pauseSync}>
                  <PauseIcon />
                </IconButton>
              )}
              {canResumeSync && (
                <IconButton size="small" onClick={resumeSync} disabled={!isOnline}>
                  <ResumeIcon />
                </IconButton>
              )}
              {canCancelSync && (
                <IconButton size="small" onClick={cancelSync}>
                  <CancelIcon />
                </IconButton>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default card variant
  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {getStatusIcon()}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Data Synchronization
            </Typography>
            <Tooltip title="Refresh status">
              <IconButton size="small" onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setExpandedDetails(!expandedDetails)}>
              {expandedDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {getSyncStatusMessage()}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {error}
            </Alert>
          )}

          {renderProgressBar()}
          {renderStatusChips()}
          {renderSyncControls()}
          {renderDetails()}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <SyncHistoryDialog 
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        syncHistory={syncHistory}
        getSyncStatistics={getSyncStatistics}
        formatSyncDuration={formatSyncDuration}
      />

      {/* Conflicts Dialog */}
      <SyncConflictsDialog
        open={showConflictsDialog}
        onClose={() => setShowConflictsDialog(false)}
        conflictedItems={conflictedItems}
        onResolve={onConflictResolve}
      />
    </>
  );
};

// Sync History Dialog
const SyncHistoryDialog = ({ 
  open, 
  onClose, 
  syncHistory, 
  getSyncStatistics, 
  formatSyncDuration 
}) => {
  const stats = getSyncStatistics();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Synchronization History</DialogTitle>
      <DialogContent>
        {/* Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Statistics</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
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
              <Typography variant="h4" color="text.secondary">
                {stats.averageSyncDuration ? `${Math.round(stats.averageSyncDuration / 1000)}s` : 'N/A'}
              </Typography>
              <Typography variant="caption">Avg Duration</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* History List */}
        <Typography variant="h6" gutterBottom>Recent Syncs</Typography>
        {syncHistory.length === 0 ? (
          <Typography color="text.secondary">No sync history available</Typography>
        ) : (
          <List>
            {syncHistory.map((sync, index) => (
              <ListItem key={sync.id || index} divider={index < syncHistory.length - 1}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {sync.status === 'completed' ? (
                        <SuccessIcon color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body1">
                        {sync.status === 'completed' ? 'Completed' : 'Failed'}
                      </Typography>
                      <Chip size="small" label={`${sync.processedItems} items`} />
                      {sync.failedItems > 0 && (
                        <Chip size="small" label={`${sync.failedItems} failed`} color="error" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Duration: {formatSyncDuration(sync.startTime, sync.endTime)}
                      </Typography>
                      {sync.endTime && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(sync.endTime).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Sync Conflicts Dialog
const SyncConflictsDialog = ({ 
  open, 
  onClose, 
  conflictedItems, 
  onResolve 
}) => {
  const handleResolve = (itemId, resolution) => {
    if (onResolve) {
      onResolve(itemId, resolution);
    }
    // For now, just close the dialog
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sync Conflicts</DialogTitle>
      <DialogContent>
        {conflictedItems.length === 0 ? (
          <Typography>No conflicts to resolve</Typography>
        ) : (
          <List>
            {conflictedItems.map((conflictItem, index) => (
              <ListItem key={conflictItem.item.id || index} divider={index < conflictedItems.length - 1}>
                <ListItemText
                  primary={`Item ${conflictItem.item.id}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Conflict Type: {conflictItem.conflict.type}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          onClick={() => handleResolve(conflictItem.item.id, 'local')}
                        >
                          Use Local
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => handleResolve(conflictItem.item.id, 'remote')}
                        >
                          Use Remote
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => handleResolve(conflictItem.item.id, 'merge')}
                        >
                          Merge
                        </Button>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SyncProgressIndicator;

// Additional CSS for spinning animation
const syncStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .sync-icon-spinning {
    animation: spin 2s linear infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = syncStyles;
  document.head.appendChild(styleSheet);
} 