import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tooltip
} from '@mui/material';
import {
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Settings as ConfigIcon,
  Security as SecurityIcon,
  Psychology as AIIcon,
  Assessment as AnalyticsIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandMoreIcon,
  FileCopy as CopyIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

// Configuration template for different backup types
const BACKUP_TYPES = {
  full: {
    name: 'Full Configuration',
    description: 'Complete backup including all settings, API keys, and preferences',
    icon: <ConfigIcon />,
    color: 'primary',
    includesApiKeys: true
  },
  models: {
    name: 'AI Models Only',
    description: 'Only AI model configurations and parameters',
    icon: <AIIcon />,
    color: 'secondary',
    includesApiKeys: false
  },
  secure: {
    name: 'Secure (No API Keys)',
    description: 'All settings except sensitive API keys',
    icon: <SecurityIcon />,
    color: 'warning',
    includesApiKeys: false
  }
};

function BackupPreviewDialog({ open, onClose, config, backupType }) {
  const configJson = JSON.stringify(config, null, 2);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewIcon />
          Configuration Preview - {BACKUP_TYPES[backupType]?.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          This preview shows the configuration data that will be exported. You can copy this JSON
          or download it as a file.
        </Alert>
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            maxHeight: 400, 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}
        >
          <pre>{configJson}</pre>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          startIcon={<CopyIcon />} 
          onClick={handleCopy}
          variant="outlined"
        >
          {copied ? 'Copied!' : 'Copy JSON'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SavedBackupsDialog({ open, onClose, savedBackups, onRestore, onDelete, onView }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Saved Configuration Backups
        </Box>
      </DialogTitle>
      <DialogContent>
        {savedBackups.length === 0 ? (
          <Alert severity="info">
            No saved backups found. Create a backup first to see it here.
          </Alert>
        ) : (
          <List>
            {savedBackups.map((backup, index) => (
              <ListItem key={index} divider>
                <ListItemText
                                     primary={
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       {BACKUP_TYPES[backup.metadata?.type]?.icon}
                       {backup.metadata?.name}
                       <Chip 
                         label={BACKUP_TYPES[backup.metadata?.type]?.name} 
                         size="small" 
                         color={BACKUP_TYPES[backup.metadata?.type]?.color}
                       />
                     </Box>
                   }
                  secondary={
                                         <Box>
                       <Typography variant="body2" color="textSecondary">
                         {backup.metadata?.description || 'No description provided'}
                       </Typography>
                       <Typography variant="caption" color="textSecondary">
                         Created: {new Date(backup.metadata?.timestamp).toLocaleString()}
                       </Typography>
                       {backup.metadata?.version && (
                         <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                           Version: {backup.metadata?.version}
                         </Typography>
                       )}
                     </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View configuration">
                    <IconButton onClick={() => onView(backup)} sx={{ mr: 1 }}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Restore configuration">
                    <IconButton onClick={() => onRestore(backup)} color="primary" sx={{ mr: 1 }}>
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete backup">
                    <IconButton onClick={() => onDelete(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
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
}

function RestoreConfirmDialog({ open, onClose, onConfirm, backup }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Configuration Restore
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action will replace your current configuration with the selected backup.
          Your current settings will be lost unless you create a backup first.
        </Alert>
        {backup && (
          <Box>
                         <Typography variant="subtitle2" gutterBottom>
               Restoring: {backup.metadata?.name}
             </Typography>
             <Typography variant="body2" color="textSecondary">
               Type: {BACKUP_TYPES[backup.metadata?.type]?.name}
             </Typography>
             <Typography variant="body2" color="textSecondary">
               Created: {new Date(backup.metadata?.timestamp).toLocaleString()}
             </Typography>
             {backup.metadata?.includesApiKeys && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This backup includes API keys that will be restored to your configuration.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          Restore Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ConfigurationBackup({ currentConfig, onConfigRestore }) {
  const [backupType, setBackupType] = useState('full');
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [includeApiKeys, setIncludeApiKeys] = useState(true);
  const [includeUsageData, setIncludeUsageData] = useState(false);
  const [savedBackups, setSavedBackups] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showSavedBackups, setShowSavedBackups] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const fileInputRef = useRef(null);

  // Load saved backups from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('taskmaster_config_backups');
    if (saved) {
      try {
        setSavedBackups(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved backups:', error);
      }
    }
  }, []);

  // Save backups to localStorage
  const saveBackupsToStorage = (backups) => {
    localStorage.setItem('taskmaster_config_backups', JSON.stringify(backups));
  };

  // Create configuration object based on backup type
  const createConfigBackup = () => {
    const baseConfig = {
      metadata: {
        name: backupName || `Backup-${new Date().toISOString().split('T')[0]}`,
        description: backupDescription,
        type: backupType,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        includesApiKeys: backupType === 'full' || includeApiKeys,
        includesUsageData: includeUsageData
      },
      models: currentConfig?.models || {},
      global: currentConfig?.global || {}
    };

    // Add API keys if requested
    if ((backupType === 'full' || includeApiKeys) && backupType !== 'secure') {
      baseConfig.apiKeys = currentConfig?.apiKeys || {};
    }

    // Add usage data if requested
    if (includeUsageData) {
      const usageData = localStorage.getItem('taskmaster_usage_data');
      if (usageData) {
        try {
          baseConfig.usageData = JSON.parse(usageData);
        } catch (error) {
          console.error('Failed to include usage data:', error);
        }
      }
    }

    // Add saved prompts
    const savedPrompts = localStorage.getItem('taskmaster_saved_prompts');
    if (savedPrompts) {
      try {
        baseConfig.savedPrompts = JSON.parse(savedPrompts);
      } catch (error) {
        console.error('Failed to include saved prompts:', error);
      }
    }

    return baseConfig;
  };

  const handleCreateBackup = () => {
    const backup = createConfigBackup();
    const newBackups = [...savedBackups, backup];
    setSavedBackups(newBackups);
    saveBackupsToStorage(newBackups);
    
    // Reset form
    setBackupName('');
    setBackupDescription('');
    
    setSnackbarMessage('Configuration backup created successfully');
    setSnackbarOpen(true);
  };

  const handleExportBackup = () => {
    const backup = createConfigBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskmaster-config-${backup.metadata.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSnackbarMessage('Configuration exported successfully');
    setSnackbarOpen(true);
  };

  const handleImportConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        
        // Validate the imported configuration
        if (!importedConfig.metadata || !importedConfig.models) {
          throw new Error('Invalid configuration file format');
        }
        
        // Add to saved backups
        const newBackups = [...savedBackups, importedConfig];
        setSavedBackups(newBackups);
        saveBackupsToStorage(newBackups);
        
        setSnackbarMessage(`Configuration "${importedConfig.metadata.name}" imported successfully`);
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage(`Failed to import configuration: ${error.message}`);
        setSnackbarOpen(true);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleRestoreConfig = (backup) => {
    setSelectedBackup(backup);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = () => {
    if (selectedBackup && onConfigRestore) {
      // Restore configuration
      onConfigRestore(selectedBackup);
      
      // Restore additional data if included
      if (selectedBackup.usageData) {
        localStorage.setItem('taskmaster_usage_data', JSON.stringify(selectedBackup.usageData));
      }
      
      if (selectedBackup.savedPrompts) {
        localStorage.setItem('taskmaster_saved_prompts', JSON.stringify(selectedBackup.savedPrompts));
      }
      
      setSnackbarMessage(`Configuration "${selectedBackup.metadata.name}" restored successfully`);
      setSnackbarOpen(true);
    }
    setShowRestoreConfirm(false);
    setSelectedBackup(null);
  };

  const handleDeleteBackup = (index) => {
    const newBackups = savedBackups.filter((_, i) => i !== index);
    setSavedBackups(newBackups);
    saveBackupsToStorage(newBackups);
    setSnackbarMessage('Backup deleted successfully');
    setSnackbarOpen(true);
  };

  const handleViewBackup = (backup) => {
    setSelectedBackup(backup);
    setShowPreview(true);
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ConfigIcon />
        Configuration Backup & Restore
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Create backups of your Task Master configuration to save your settings, restore previous configurations,
        or share settings across different environments.
      </Typography>

      <Grid container spacing={3}>
        {/* Create Backup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Create Backup"
              avatar={<ExportIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Backup Name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="My Configuration Backup"
                    helperText="Optional: Give your backup a descriptive name"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    placeholder="Describe what makes this configuration special..."
                    helperText="Optional: Add notes about this configuration"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Backup Type
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(BACKUP_TYPES).map(([key, type]) => (
                      <Grid item xs={12} key={key}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: backupType === key ? 2 : 1,
                            borderColor: backupType === key ? `${type.color}.main` : 'grey.300'
                          }}
                          onClick={() => setBackupType(key)}
                        >
                          <CardContent sx={{ py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {type.icon}
                              <Box>
                                <Typography variant="subtitle2">
                                  {type.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {type.description}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Advanced Options */}
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">Advanced Options</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={includeUsageData}
                            onChange={(e) => setIncludeUsageData(e.target.checked)}
                          />
                        }
                        label="Include usage tracking data"
                      />
                      {backupType === 'full' && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          Full backups automatically include API keys and all configuration data.
                        </Alert>
                      )}
                      {backupType === 'secure' && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          Secure backups exclude all API keys for security purposes.
                        </Alert>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => setShowPreview(true)}
                      >
                        Preview
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ExportIcon />}
                        onClick={handleCreateBackup}
                      >
                        Create Backup
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportBackup}
                        color="secondary"
                      >
                        Export to File
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Restore Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Restore Configuration"
              avatar={<ImportIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => setShowSavedBackups(true)}
                    disabled={savedBackups.length === 0}
                  >
                    View Saved Backups ({savedBackups.length})
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      OR
                    </Typography>
                  </Divider>
                </Grid>
                
                <Grid item xs={12}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportConfig}
                    style={{ display: 'none' }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ImportIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    color="secondary"
                  >
                    Import from File
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    Import a previously exported configuration file to restore your settings.
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Backups Quick Access */}
        {savedBackups.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Recent Backups" />
              <CardContent>
                <Grid container spacing={2}>
                  {savedBackups.slice(-3).map((backup, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {BACKUP_TYPES[backup.metadata.type]?.icon}
                            <Typography variant="subtitle2" noWrap>
                              {backup.metadata.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {new Date(backup.metadata.timestamp).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<RestoreIcon />}
                              onClick={() => handleRestoreConfig(backup)}
                              variant="outlined"
                            >
                              Restore
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialogs */}
      <BackupPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        config={createConfigBackup()}
        backupType={backupType}
      />

      <SavedBackupsDialog
        open={showSavedBackups}
        onClose={() => setShowSavedBackups(false)}
        savedBackups={savedBackups}
        onRestore={handleRestoreConfig}
        onDelete={handleDeleteBackup}
        onView={handleViewBackup}
      />

      <RestoreConfirmDialog
        open={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={confirmRestore}
        backup={selectedBackup}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
} 