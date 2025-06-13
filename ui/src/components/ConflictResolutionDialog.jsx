import React, { useState, useEffect, useMemo } from 'react';
import './ConflictResolutionDialog.css';

/**
 * Conflict Resolution Dialog Component
 * Provides user-friendly interface for resolving data conflicts
 */
const ConflictResolutionDialog = ({ 
  conflict, 
  isOpen, 
  onResolve, 
  onCancel,
  autoMergePreview = null,
  showPreview = true,
  allowCustomMerge = true
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState('merge');
  const [customMergedData, setCustomMergedData] = useState(null);
  const [activeTab, setActiveTab] = useState('comparison');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergePreview, setMergePreview] = useState(null);

  // Reset state when conflict changes
  useEffect(() => {
    if (conflict) {
      setSelectedStrategy('merge');
      setCustomMergedData(null);
      setActiveTab('comparison');
      setIsProcessing(false);
      
      // Set auto-merge preview if provided
      if (autoMergePreview) {
        setMergePreview(autoMergePreview);
      }
    }
  }, [conflict, autoMergePreview]);

  // Generate merge preview based on selected strategy
  const generateMergePreview = useMemo(() => {
    if (!conflict) return null;

    const { optimisticData: local, conflict: conflictDetails, originalData: original } = conflict;
    const remote = conflictDetails.serverVersion;

    let preview;
    switch (selectedStrategy) {
      case 'local':
        preview = local;
        break;
      case 'remote':
        preview = remote;
        break;
      case 'merge':
        preview = customMergedData || autoMergeData(original, local, remote);
        break;
      default:
        preview = local;
    }

    return {
      preview,
      strategy: selectedStrategy,
      isCustom: selectedStrategy === 'merge' && customMergedData !== null
    };
  }, [conflict, selectedStrategy, customMergedData]);

  // Auto-merge algorithm
  const autoMergeData = (original, local, remote) => {
    const merged = { ...remote }; // Start with remote as base
    
    // Apply local changes that don't conflict with remote changes
    for (const key in local) {
      if (key === 'id' || key === 'version' || key === 'updatedAt') continue;
      
      // If local changed from original and remote didn't change from original
      if (JSON.stringify(local[key]) !== JSON.stringify(original[key]) &&
          JSON.stringify(remote[key]) === JSON.stringify(original[key])) {
        merged[key] = local[key];
      }
    }

    // Update metadata
    merged.version = Math.max(local.version || 0, remote.version || 0) + 1;
    merged.updatedAt = new Date().toISOString();
    merged._autoMerged = true;
    
    return merged;
  };

  // Get changed fields between two objects
  const getChangedFields = (obj1, obj2) => {
    const changes = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    for (const key of allKeys) {
      if (key.startsWith('_')) continue; // Skip metadata
      
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        changes.push({
          field: key,
          from: obj1[key],
          to: obj2[key]
        });
      }
    }
    
    return changes;
  };

  // Get conflicts between local and remote
  const getConflicts = () => {
    if (!conflict) return [];
    
    const { optimisticData: local, conflict: conflictDetails, originalData: original } = conflict;
    const remote = conflictDetails.serverVersion;
    
    const localChanges = getChangedFields(original, local);
    const remoteChanges = getChangedFields(original, remote);
    
    // Find overlapping changes (actual conflicts)
    const conflicts = [];
    
    localChanges.forEach(localChange => {
      const remoteChange = remoteChanges.find(rc => rc.field === localChange.field);
      if (remoteChange && JSON.stringify(localChange.to) !== JSON.stringify(remoteChange.to)) {
        conflicts.push({
          field: localChange.field,
          original: original[localChange.field],
          local: localChange.to,
          remote: remoteChange.to
        });
      }
    });
    
    return conflicts;
  };

  // Handle resolution
  const handleResolve = async () => {
    if (!conflict || !onResolve) return;
    
    setIsProcessing(true);
    
    try {
      const resolvedData = selectedStrategy === 'merge' && customMergedData 
        ? customMergedData 
        : generateMergePreview?.preview;
        
      await onResolve(conflict.id, selectedStrategy, resolvedData);
    } catch (error) {
      console.error('Resolution failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle custom merge field change
  const handleCustomFieldChange = (field, value) => {
    if (!conflict) return;
    
    const baseData = generateMergePreview?.preview || conflict.optimisticData;
    const newCustomData = {
      ...baseData,
      [field]: value,
      _customMerged: true,
      _mergeTimestamp: Date.now()
    };
    
    setCustomMergedData(newCustomData);
  };

  if (!isOpen || !conflict) return null;

  const conflicts = getConflicts();
  const preview = generateMergePreview;
  const { optimisticData: local, conflict: conflictDetails, originalData: original } = conflict;
  const remote = conflictDetails.serverVersion;

  return (
    <div className="conflict-resolution-overlay">
      <div className="conflict-resolution-dialog">
        <div className="dialog-header">
          <h2>Resolve Data Conflict</h2>
          <p>Changes were made locally and remotely. Choose how to resolve the conflict.</p>
        </div>

        <div className="dialog-tabs">
          <button 
            className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            Compare Changes
          </button>
          <button 
            className={`tab-button ${activeTab === 'resolution' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolution')}
          >
            Resolution Strategy
          </button>
          {showPreview && (
            <button 
              className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview Result
            </button>
          )}
        </div>

        <div className="dialog-content">
          {activeTab === 'comparison' && (
            <div className="comparison-view">
              <div className="comparison-header">
                <div className="version-header">
                  <h3>Your Changes (Local)</h3>
                  <p>Modified: {new Date(local.updatedAt || Date.now()).toLocaleString()}</p>
                </div>
                <div className="version-header">
                  <h3>Server Version (Remote)</h3>
                  <p>Modified: {new Date(remote.updatedAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>

              <div className="comparison-content">
                {conflicts.length > 0 ? (
                  <div className="conflicts-list">
                    <h4>Conflicting Fields ({conflicts.length})</h4>
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="conflict-item">
                        <div className="conflict-field">
                          <strong>{conflict.field}</strong>
                        </div>
                        <div className="conflict-values">
                          <div className="value-column">
                            <label>Your Value:</label>
                            <div className="value-box local-value">
                              {JSON.stringify(conflict.local, null, 2)}
                            </div>
                          </div>
                          <div className="value-column">
                            <label>Server Value:</label>
                            <div className="value-box remote-value">
                              {JSON.stringify(conflict.remote, null, 2)}
                            </div>
                          </div>
                        </div>
                        {conflict.original !== undefined && (
                          <div className="original-value">
                            <label>Original Value:</label>
                            <div className="value-box original-value">
                              {JSON.stringify(conflict.original, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-conflicts">
                    <p>No direct conflicts detected. Changes can be merged automatically.</p>
                  </div>
                )}

                <div className="all-changes">
                  <h4>All Changes</h4>
                  <div className="changes-summary">
                    <div className="local-changes">
                      <h5>Your Changes:</h5>
                      <ul>
                        {getChangedFields(original, local).map((change, index) => (
                          <li key={index}>
                            <strong>{change.field}:</strong> {JSON.stringify(change.to)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="remote-changes">
                      <h5>Server Changes:</h5>
                      <ul>
                        {getChangedFields(original, remote).map((change, index) => (
                          <li key={index}>
                            <strong>{change.field}:</strong> {JSON.stringify(change.to)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resolution' && (
            <div className="resolution-view">
              <div className="strategy-options">
                <h3>Resolution Strategy</h3>
                
                <div className="strategy-option">
                  <label className="strategy-label">
                    <input
                      type="radio"
                      name="strategy"
                      value="local"
                      checked={selectedStrategy === 'local'}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="strategy-info">
                      <h4>Keep Your Changes</h4>
                      <p>Keep your local changes and discard server changes</p>
                    </div>
                  </label>
                </div>

                <div className="strategy-option">
                  <label className="strategy-label">
                    <input
                      type="radio"
                      name="strategy"
                      value="remote"
                      checked={selectedStrategy === 'remote'}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="strategy-info">
                      <h4>Accept Server Version</h4>
                      <p>Accept the server version and discard your local changes</p>
                    </div>
                  </label>
                </div>

                <div className="strategy-option">
                  <label className="strategy-label">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={selectedStrategy === 'merge'}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="strategy-info">
                      <h4>Merge Changes</h4>
                      <p>Automatically merge compatible changes, or manually resolve conflicts</p>
                    </div>
                  </label>
                </div>
              </div>

              {selectedStrategy === 'merge' && allowCustomMerge && conflicts.length > 0 && (
                <div className="custom-merge">
                  <h4>Custom Merge Resolution</h4>
                  <p>Choose the value for each conflicting field:</p>
                  
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="merge-field">
                      <label>{conflict.field}:</label>
                      <div className="merge-options">
                        <label className="merge-option">
                          <input
                            type="radio"
                            name={`merge-${conflict.field}`}
                            value="local"
                            onChange={() => handleCustomFieldChange(conflict.field, conflict.local)}
                          />
                          Your Value: {JSON.stringify(conflict.local)}
                        </label>
                        <label className="merge-option">
                          <input
                            type="radio"
                            name={`merge-${conflict.field}`}
                            value="remote"
                            onChange={() => handleCustomFieldChange(conflict.field, conflict.remote)}
                          />
                          Server Value: {JSON.stringify(conflict.remote)}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && showPreview && preview && (
            <div className="preview-view">
              <h3>Resolution Preview</h3>
              <div className="preview-info">
                <p>Strategy: <strong>{preview.strategy}</strong></p>
                {preview.isCustom && <p className="custom-indicator">Custom merge applied</p>}
              </div>
              
              <div className="preview-data">
                <h4>Result:</h4>
                <pre className="data-preview">
                  {JSON.stringify(preview.preview, null, 2)}
                </pre>
              </div>

              <div className="preview-changes">
                <h4>Changes from Original:</h4>
                <ul>
                  {getChangedFields(original, preview.preview).map((change, index) => (
                    <li key={index}>
                      <strong>{change.field}:</strong> 
                      <span className="change-from">{JSON.stringify(change.from)}</span>
                      →
                      <span className="change-to">{JSON.stringify(change.to)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button 
            className="cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="resolve-btn"
            onClick={handleResolve}
            disabled={isProcessing}
          >
            {isProcessing ? 'Resolving...' : 'Resolve Conflict'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionDialog; 