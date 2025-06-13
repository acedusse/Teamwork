/**
 * Backup & Restore Dialog Component
 * Comprehensive interface for managing backups, exports, imports, and recovery
 */

import React, { useState, useEffect, useRef } from 'react';
import { useBackupManager, useBackupImport, useCrashRecovery } from '../hooks/useBackupManager';
import './BackupRestoreDialog.css';

const BackupRestoreDialog = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('backups');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const fileInputRef = useRef(null);

  const {
    backups,
    isLoading,
    error,
    configuration,
    storageStats,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportData,
    updateConfiguration,
    clearAllBackups,
    cleanupOldBackups,
    clearError
  } = useBackupManager();

  const {
    isImporting,
    importError,
    importResult,
    importData,
    resetImport
  } = useBackupImport();

  const {
    crashDetected,
    availableBackup,
    acceptRecovery,
    dismissRecovery
  } = useCrashRecovery();

  useEffect(() => {
    if (crashDetected && availableBackup) {
      setActiveTab('recovery');
    }
  }, [crashDetected, availableBackup]);

  const handleCreateBackup = async () => {
    try {
      await createBackup(newBackupDescription || 'Manual backup');
      setNewBackupDescription('');
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const handleRestoreBackup = async (backupId, options = {}) => {
    try {
      setShowConfirmDialog(false);
      await restoreBackup(backupId, options);
      onClose();
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      setShowConfirmDialog(false);
      await deleteBackup(backupId);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  const handleExportData = async (format) => {
    try {
      await exportData(format);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await importData(file, { mergeWithExisting: false });
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
      setConfirmAction(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getBackupTypeIcon = (type) => {
    switch (type) {
      case 'automatic':
        return '⏰';
      case 'manual':
        return '👤';
      case 'crash_recovery':
        return '🚨';
      case 'export':
        return '📤';
      case 'import':
        return '📥';
      default:
        return '💾';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="backup-restore-overlay">
      <div className="backup-restore-dialog">
        <div className="dialog-header">
          <h2>Backup & Restore Manager</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="dialog-tabs">
          <button 
            className={`tab-button ${activeTab === 'backups' ? 'active' : ''}`}
            onClick={() => setActiveTab('backups')}
          >
            📁 Backups
          </button>
          <button 
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📤 Export
          </button>
          <button 
            className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📥 Import
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
          {crashDetected && (
            <button 
              className={`tab-button recovery-tab ${activeTab === 'recovery' ? 'active' : ''}`}
              onClick={() => setActiveTab('recovery')}
            >
              🚨 Recovery
            </button>
          )}
        </div>

        <div className="dialog-content">
          {/* Error Display */}
          {(error || importError) && (
            <div className="error-banner">
              <span>⚠️ {error || importError}</span>
              <button onClick={() => {
                clearError();
                resetImport();
              }}>
                ×
              </button>
            </div>
          )}

          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="backups-tab">
              <div className="tab-section">
                <div className="section-header">
                  <h3>Create New Backup</h3>
                </div>
                <div className="create-backup-form">
                  <input
                    type="text"
                    placeholder="Optional description..."
                    value={newBackupDescription}
                    onChange={(e) => setNewBackupDescription(e.target.value)}
                    className="backup-description-input"
                  />
                  <button 
                    onClick={handleCreateBackup}
                    disabled={isLoading}
                    className="create-backup-button"
                  >
                    {isLoading ? '⏳ Creating...' : '💾 Create Backup'}
                  </button>
                </div>
              </div>

              <div className="tab-section">
                <div className="section-header">
                  <h3>Available Backups ({backups.length})</h3>
                  {backups.length > 0 && (
                    <div className="bulk-actions">
                      <button 
                        onClick={() => cleanupOldBackups(false)}
                        className="cleanup-button"
                      >
                        🧹 Cleanup Old
                      </button>
                      <button 
                        onClick={() => {
                          setConfirmAction(() => clearAllBackups);
                          setShowConfirmDialog(true);
                        }}
                        className="clear-all-button"
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  )}
                </div>

                <div className="backups-list">
                  {backups.length === 0 ? (
                    <div className="empty-state">
                      <p>No backups available</p>
                      <span>Create your first backup above</span>
                    </div>
                  ) : (
                    backups.map((backup) => (
                      <div 
                        key={backup.id}
                        className={`backup-item ${selectedBackup?.id === backup.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBackup(backup)}
                      >
                        <div className="backup-header">
                          <span className="backup-icon">
                            {getBackupTypeIcon(backup.type)}
                          </span>
                          <div className="backup-info">
                            <div className="backup-title">
                              {backup.description || `${backup.type} backup`}
                            </div>
                            <div className="backup-meta">
                              {formatDate(backup.timestamp)} • {backup.formattedSize}
                            </div>
                          </div>
                          <div className="backup-actions">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction(() => () => handleRestoreBackup(backup.id));
                                setShowConfirmDialog(true);
                              }}
                              className="restore-button"
                              title="Restore this backup"
                            >
                              ↻
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction(() => () => handleDeleteBackup(backup.id));
                                setShowConfirmDialog(true);
                              }}
                              className="delete-button"
                              title="Delete this backup"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="export-tab">
              <div className="tab-section">
                <div className="section-header">
                  <h3>Export Data</h3>
                  <p>Download your data for backup or migration</p>
                </div>
                
                <div className="export-options">
                  <div className="export-option">
                    <div className="option-info">
                      <h4>📄 JSON Format</h4>
                      <p>Complete data export with all metadata</p>
                    </div>
                    <button 
                      onClick={() => handleExportData('json')}
                      disabled={isLoading}
                      className="export-button"
                    >
                      {isLoading ? '⏳ Exporting...' : 'Export JSON'}
                    </button>
                  </div>
                  
                  <div className="export-option">
                    <div className="option-info">
                      <h4>📊 CSV Format</h4>
                      <p>Simplified data export for spreadsheets</p>
                    </div>
                    <button 
                      onClick={() => handleExportData('csv')}
                      disabled={isLoading}
                      className="export-button"
                    >
                      {isLoading ? '⏳ Exporting...' : 'Export CSV'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="import-tab">
              <div className="tab-section">
                <div className="section-header">
                  <h3>Import Data</h3>
                  <p>Restore data from exported files</p>
                </div>
                
                <div className="import-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="import-button"
                  >
                    {isImporting ? '⏳ Importing...' : '📁 Select File to Import'}
                  </button>
                  
                  <div className="import-info">
                    <p>Supported formats: JSON, CSV</p>
                    <p>⚠️ This will overwrite existing data</p>
                  </div>
                </div>

                {importResult && (
                  <div className="import-result">
                    <h4>✅ Import Completed</h4>
                    <div className="result-details">
                      <p>Imported: {importResult.imported.length} items</p>
                      <p>Skipped: {importResult.skipped.length} items</p>
                      <p>Errors: {importResult.errors.length} items</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="tab-section">
                <div className="section-header">
                  <h3>Backup Settings</h3>
                </div>
                
                {configuration && (
                  <div className="settings-form">
                    <div className="setting-item">
                      <label>Automatic Backups</label>
                      <div className="setting-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={configuration.isRunning}
                            onChange={(e) => updateConfiguration({
                              enabled: e.target.checked
                            })}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span>{configuration.isRunning ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>

                    <div className="setting-item">
                      <label>Backup Frequency</label>
                      <select 
                        value={configuration.backupFrequency}
                        onChange={(e) => updateConfiguration({
                          backupFrequency: parseInt(e.target.value, 10)
                        })}
                        className="frequency-select"
                      >
                        <option value={5 * 60 * 1000}>Every 5 minutes</option>
                        <option value={15 * 60 * 1000}>Every 15 minutes</option>
                        <option value={30 * 60 * 1000}>Every 30 minutes</option>
                        <option value={60 * 60 * 1000}>Every hour</option>
                        <option value={4 * 60 * 60 * 1000}>Every 4 hours</option>
                      </select>
                    </div>

                    <div className="setting-item">
                      <label>Storage Usage</label>
                      <div className="storage-info">
                        {storageStats && (
                          <>
                            <div className="storage-bar">
                              <div 
                                className="storage-used"
                                style={{ 
                                  width: `${Math.min(storageStats.backupPercentage, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="storage-details">
                              <span>Backups: {storageStats.formattedBackupSize}</span>
                              <span>Total: {storageStats.formattedTotalSize}</span>
                              <span>({storageStats.backupPercentage}%)</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recovery Tab */}
          {activeTab === 'recovery' && crashDetected && availableBackup && (
            <div className="recovery-tab">
              <div className="tab-section">
                <div className="section-header">
                  <h3>🚨 Crash Recovery</h3>
                  <p>We detected an unexpected shutdown. Would you like to recover your data?</p>
                </div>
                
                <div className="recovery-info">
                  <div className="recovery-backup-info">
                    <h4>Available Recovery Backup:</h4>
                    <div className="backup-details">
                      <p><strong>Date:</strong> {formatDate(availableBackup.timestamp)}</p>
                      <p><strong>Size:</strong> {availableBackup.formattedSize}</p>
                      <p><strong>Type:</strong> {availableBackup.type}</p>
                    </div>
                  </div>

                  <div className="recovery-actions">
                    <button 
                      onClick={acceptRecovery}
                      className="accept-recovery-button"
                    >
                      ✅ Recover Data
                    </button>
                    <button 
                      onClick={dismissRecovery}
                      className="dismiss-recovery-button"
                    >
                      ❌ Continue Without Recovery
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Confirm Action</h3>
              <p>Are you sure you want to proceed? This action cannot be undone.</p>
              <div className="confirmation-actions">
                <button 
                  onClick={() => setShowConfirmDialog(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmAction}
                  className="confirm-button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestoreDialog; 