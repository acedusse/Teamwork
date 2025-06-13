import React from 'react';
import {
  Chip,
  Tooltip,
  Box,
  Typography,
  Alert,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  SaveAs as SaveAsIcon,
  Autorenew as AutoSaveIcon,
  CheckCircle as SavedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CloudOff as OfflineIcon
} from '@mui/icons-material';

/**
 * AutosaveIndicator Component
 * Displays the current autosave status with appropriate visual indicators
 */
export default function AutosaveIndicator({
  saveStatus = 'saved', // 'saving', 'saved', 'unsaved', 'error'
  lastSaved = null,
  saveError = null,
  hasUnsavedChanges = false,
  isSaving = false,
  variant = 'chip', // 'chip', 'text', 'alert', 'minimal'
  size = 'small', // 'small', 'medium', 'large'
  showTimestamp = true,
  showIcon = true,
  isOffline = false,
  onRetry = null,
  className = '',
  ...props
}) {
  // Get appropriate icon and color based on status
  const getStatusConfig = () => {
    if (isOffline) {
      return {
        icon: OfflineIcon,
        color: 'warning',
        label: 'Offline - Changes saved locally',
        severity: 'warning'
      };
    }

    if (saveError) {
      return {
        icon: ErrorIcon,
        color: 'error',
        label: 'Save failed',
        severity: 'error'
      };
    }

    switch (saveStatus) {
      case 'saving':
        return {
          icon: isSaving ? AutoSaveIcon : SaveIcon,
          color: 'primary',
          label: 'Saving...',
          severity: 'info'
        };
      case 'saved':
        return {
          icon: SavedIcon,
          color: 'success',
          label: 'All changes saved',
          severity: 'success'
        };
      case 'unsaved':
        return {
          icon: SaveAsIcon,
          color: 'warning',
          label: hasUnsavedChanges ? 'Unsaved changes' : 'No changes',
          severity: 'warning'
        };
      default:
        return {
          icon: SaveAsIcon,
          color: 'default',
          label: 'Ready',
          severity: 'info'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const saveTime = new Date(timestamp);
    const diffMs = now - saveTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMs < 1000) return 'just now';
    if (diffMs < 60000) return 'a few seconds ago';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return saveTime.toLocaleDateString();
  };

  // Create tooltip content
  const getTooltipContent = () => {
    let content = config.label;
    
    if (saveError) {
      content += `: ${saveError}`;
    }
    
    if (showTimestamp && lastSaved) {
      content += ` (${formatTimestamp(lastSaved)})`;
    }
    
    if (isOffline) {
      content += ' - Will sync when online';
    }
    
    return content;
  };

  // Render based on variant
  switch (variant) {
    case 'chip':
      return (
        <Tooltip title={getTooltipContent()}>
          <Chip
            icon={
              showIcon ? (
                <Box display="flex" alignItems="center">
                  {isSaving && saveStatus === 'saving' ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <IconComponent />
                  )}
                </Box>
              ) : undefined
            }
            label={config.label}
            size={size}
            color={config.color}
            variant={saveStatus === 'saved' ? 'filled' : 'outlined'}
            className={className}
            {...props}
          />
        </Tooltip>
      );

    case 'text':
      return (
        <Tooltip title={getTooltipContent()}>
          <Box 
            display="flex" 
            alignItems="center" 
            gap={0.5}
            className={className}
            {...props}
          >
            {showIcon && (
              <Box display="flex" alignItems="center">
                {isSaving && saveStatus === 'saving' ? (
                  <CircularProgress size={16} color={config.color} />
                ) : (
                  <IconComponent 
                    fontSize="small" 
                    color={config.color}
                  />
                )}
              </Box>
            )}
            <Typography 
              variant="caption" 
              color={config.color === 'default' ? 'text.secondary' : `${config.color}.main`}
            >
              {config.label}
              {showTimestamp && lastSaved && (
                <span style={{ opacity: 0.7 }}>
                  {' '}({formatTimestamp(lastSaved)})
                </span>
              )}
            </Typography>
          </Box>
        </Tooltip>
      );

    case 'alert':
      if (saveStatus === 'saved' && !saveError && !isOffline) {
        return null; // Don't show alert for normal saved state
      }
      
      return (
        <Fade in timeout={300}>
          <Alert
            severity={config.severity}
            icon={showIcon ? <IconComponent /> : false}
            action={
              saveError && onRetry ? (
                <Typography
                  variant="caption"
                  component="button"
                  sx={{ 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    border: 'none',
                    background: 'none',
                    color: 'inherit'
                  }}
                  onClick={onRetry}
                >
                  Retry
                </Typography>
              ) : undefined
            }
            className={className}
            {...props}
          >
            {config.label}
            {saveError && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {saveError}
              </Typography>
            )}
            {showTimestamp && lastSaved && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                Last saved: {formatTimestamp(lastSaved)}
              </Typography>
            )}
          </Alert>
        </Fade>
      );

    case 'minimal':
      if (saveStatus === 'saved' && !saveError) {
        return null; // Show nothing when everything is saved
      }
      
      return (
        <Tooltip title={getTooltipContent()}>
          <Box 
            display="flex" 
            alignItems="center"
            className={className}
            {...props}
          >
            {isSaving && saveStatus === 'saving' ? (
              <CircularProgress size={12} color={config.color} />
            ) : (
              <IconComponent 
                fontSize="small" 
                color={config.color}
              />
            )}
          </Box>
        </Tooltip>
      );

    default:
      return null;
  }
}

// Export additional utility components
export function AutosaveStatus({ 
  autosaveHook, 
  variant = 'chip',
  isOffline = false,
  onRetry = null,
  ...props 
}) {
  const {
    isSaving,
    isSaved,
    hasUnsavedChanges,
    lastSaved,
    saveError,
    saveStatus
  } = autosaveHook;

  return (
    <AutosaveIndicator
      saveStatus={saveStatus}
      lastSaved={lastSaved}
      saveError={saveError}
      hasUnsavedChanges={hasUnsavedChanges}
      isSaving={isSaving}
      variant={variant}
      isOffline={isOffline}
      onRetry={onRetry}
      {...props}
    />
  );
}

// Simple wrapper for common use cases
export function SaveButton({ 
  autosaveHook,
  onSave,
  children = 'Save',
  variant = 'contained',
  ...props 
}) {
  const { canSave, isSaving, save } = autosaveHook;

  const handleClick = () => {
    if (onSave) {
      onSave();
    } else {
      save();
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <button
        onClick={handleClick}
        disabled={!canSave || isSaving}
        variant={variant}
        {...props}
      >
        {isSaving ? 'Saving...' : children}
      </button>
      <AutosaveStatus autosaveHook={autosaveHook} variant="minimal" />
    </Box>
  );
} 