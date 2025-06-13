import React, { useState, useEffect } from 'react';
import { useOptimisticUpdates, useOptimisticItem, useConflictResolver } from '../hooks/useOptimisticUpdates';
import ConflictResolutionDialog from './ConflictResolutionDialog';
import './OptimisticUpdateDemo.css';

/**
 * Optimistic Update Demo Component
 * Demonstrates optimistic updates, conflict resolution, and rollback functionality
 */
const OptimisticUpdateDemo = () => {
  const [sampleTasks, setSampleTasks] = useState([
    {
      id: 'task-1',
      title: 'Design new homepage',
      description: 'Create wireframes and mockups for the new homepage design',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Alice Johnson',
      dueDate: '2024-01-15',
      version: 1,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Implement user authentication',
      description: 'Add login/logout functionality with JWT tokens',
      status: 'pending',
      priority: 'medium',
      assignee: 'Bob Smith',
      dueDate: '2024-01-20',
      version: 1,
      updatedAt: new Date().toISOString()
    }
  ]);

  const [selectedTask, setSelectedTask] = useState(sampleTasks[0]);
  const [editForm, setEditForm] = useState({});
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentConflict, setCurrentConflict] = useState(null);
  const [simulateConflicts, setSimulateConflicts] = useState(false);

  // Hooks
  const optimisticHook = useOptimisticUpdates({
    defaultConflictStrategy: 'manual',
    enableRollback: true
  });

  const taskItem = useOptimisticItem(selectedTask.id, selectedTask, {
    defaultConflictStrategy: 'manual'
  });

  const conflictResolver = useConflictResolver({
    autoMergeCompatible: true
  });

  // Update form when selected task changes
  useEffect(() => {
    setEditForm({
      title: taskItem.data.title || '',
      description: taskItem.data.description || '',
      status: taskItem.data.status || 'pending',
      priority: taskItem.data.priority || 'medium',
      assignee: taskItem.data.assignee || '',
      dueDate: taskItem.data.dueDate || ''
    });
  }, [taskItem.data]);

  // Listen for conflicts
  useEffect(() => {
    if (conflictResolver.hasConflicts && conflictResolver.conflicts.length > 0) {
      const firstConflict = conflictResolver.conflicts[0];
      setCurrentConflict(firstConflict);
      setShowConflictDialog(true);
    }
  }, [conflictResolver.hasConflicts, conflictResolver.conflicts]);

  // Handle task selection
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Simulate server conflict
  const simulateServerUpdate = async (taskId) => {
    // Simulate server-side changes that would conflict
    const serverUpdate = {
      title: `[UPDATED] ${selectedTask.title}`,
      description: 'This was updated on the server',
      status: 'completed',
      version: selectedTask.version + 1,
      updatedAt: new Date().toISOString()
    };

    // Simulate conflict by creating a fake conflict in the optimistic update manager
    setTimeout(() => {
      const pendingUpdates = optimisticHook.getPendingUpdatesForItem(taskId);
      if (pendingUpdates.length > 0) {
        const conflict = {
          id: pendingUpdates[0].id,
          itemId: taskId,
          optimisticData: pendingUpdates[0].optimisticData,
          originalData: pendingUpdates[0].originalData,
          state: 'conflicted',
          conflict: {
            serverVersion: { ...selectedTask, ...serverUpdate },
            conflictType: 'version_mismatch',
            severity: 'high'
          }
        };

        setCurrentConflict(conflict);
        setShowConflictDialog(true);
      }
    }, 1000);
  };

  // Handle optimistic update
  const handleOptimisticUpdate = async () => {
    try {
      const updateData = { ...editForm };
      
      const result = await taskItem.updateItem(updateData, {
        conflictStrategy: 'manual',
        immediate: true
      });

      // Simulate server conflict if enabled
      if (simulateConflicts) {
        await simulateServerUpdate(selectedTask.id);
      } else {
        // Simulate successful confirmation after delay
        setTimeout(() => {
          optimisticHook.confirmUpdate(result.updateId);
        }, 2000);
      }

    } catch (error) {
      console.error('Optimistic update failed:', error);
    }
  };

  // Handle conflict resolution
  const handleConflictResolve = async (conflictId, strategy, mergedData) => {
    try {
      await conflictResolver.resolveConflict(conflictId, strategy, mergedData);
      setShowConflictDialog(false);
      setCurrentConflict(null);
    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }
  };

  // Handle conflict cancel
  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setCurrentConflict(null);
  };

  // Manual rollback
  const handleRollback = (updateId) => {
    optimisticHook.rollbackUpdate(updateId);
  };

  // Manual confirm
  const handleConfirm = (updateId) => {
    optimisticHook.confirmUpdate(updateId);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in-progress': return '#3498db';
      case 'completed': return '#2ecc71';
      case 'failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="optimistic-demo">
      <div className="demo-header">
        <h2>Optimistic Updates Demo</h2>
        <p>Demonstrates immediate UI updates with conflict resolution and rollback capabilities</p>
        
        <div className="demo-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={simulateConflicts}
              onChange={(e) => setSimulateConflicts(e.target.checked)}
            />
            Simulate Conflicts
          </label>
          
          <button 
            className="clear-btn"
            onClick={() => optimisticHook.clearAllUpdates()}
            disabled={optimisticHook.pendingCount === 0}
          >
            Clear All Updates
          </button>
        </div>
      </div>

      <div className="demo-content">
        {/* Task List */}
        <div className="task-list">
          <h3>Tasks</h3>
          {sampleTasks.map(task => (
            <div
              key={task.id}
              className={`task-item ${selectedTask.id === task.id ? 'selected' : ''}`}
              onClick={() => handleTaskSelect(task)}
            >
              <div className="task-title">{task.title}</div>
              <div className="task-meta">
                <span className={`status-badge status-${task.status}`}>
                  {task.status}
                </span>
                {optimisticHook.hasPendingUpdates(task.id) && (
                  <span className="pending-badge">
                    {optimisticHook.getPendingUpdatesForItem(task.id).length} pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Task Editor */}
        <div className="task-editor">
          <div className="editor-header">
            <h3>Edit Task: {selectedTask.title}</h3>
            {taskItem.hasPendingUpdates && (
              <div className="optimistic-indicator">
                <span className="pending-icon">⏳</span>
                Optimistic update pending
              </div>
            )}
          </div>

          <form className="edit-form">
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className={taskItem.hasPendingUpdates ? 'optimistic' : ''}
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={editForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className={taskItem.hasPendingUpdates ? 'optimistic' : ''}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className={taskItem.hasPendingUpdates ? 'optimistic' : ''}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  className={taskItem.hasPendingUpdates ? 'optimistic' : ''}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assignee:</label>
                <input
                  type="text"
                  value={editForm.assignee}
                  onChange={(e) => handleFormChange('assignee', e.target.value)}
                  className={taskItem.hasPendingUpdates ? 'optimistic' : ''}
                />
              </div>

              <div className="form-group">
                <label>Due Date:</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                  className={taskItem.hasPendingUpdates ? 'optimistic' : ''}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="update-btn"
                onClick={handleOptimisticUpdate}
                disabled={optimisticHook.isProcessing}
              >
                {optimisticHook.isProcessing ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status Panel */}
      <div className="status-panel">
        <div className="status-section">
          <h4>Optimistic Updates Status</h4>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Pending Updates:</span>
              <span className="status-value">{optimisticHook.pendingCount}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Conflicts:</span>
              <span className="status-value conflict">{conflictResolver.conflictCount}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Confirmed:</span>
              <span className="status-value">{optimisticHook.statistics.confirmedCount || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Failed:</span>
              <span className="status-value">{optimisticHook.statistics.failedCount || 0}</span>
            </div>
          </div>
        </div>

        {optimisticHook.pendingCount > 0 && (
          <div className="status-section">
            <h4>Pending Updates</h4>
            <div className="pending-list">
              {optimisticHook.pendingUpdates.map(update => (
                <div key={update.id} className="pending-item">
                  <div className="pending-info">
                    <span className="item-id">Item: {update.itemId}</span>
                    <span className="update-time">{formatTime(update.timestamp)}</span>
                    <span 
                      className="update-status"
                      style={{ color: getStatusColor(update.state) }}
                    >
                      {update.state}
                    </span>
                  </div>
                  
                  <div className="pending-actions">
                    {update.state === 'pending' && (
                      <>
                        <button
                          className="action-btn confirm"
                          onClick={() => handleConfirm(update.id)}
                          title="Confirm update"
                        >
                          ✓
                        </button>
                        <button
                          className="action-btn rollback"
                          onClick={() => handleRollback(update.id)}
                          title="Rollback update"
                        >
                          ↶
                        </button>
                      </>
                    )}
                    
                    {update.state === 'conflicted' && (
                      <button
                        className="action-btn resolve"
                        onClick={() => {
                          setCurrentConflict(update);
                          setShowConflictDialog(true);
                        }}
                        title="Resolve conflict"
                      >
                        ⚠️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {conflictResolver.hasConflicts && (
          <div className="status-section conflicts">
            <h4>Active Conflicts</h4>
            <div className="conflict-list">
              {conflictResolver.conflicts.map(conflict => (
                <div key={conflict.id} className="conflict-item">
                  <div className="conflict-info">
                    <span className="item-id">Item: {conflict.itemId}</span>
                    <span className="conflict-type">
                      {conflict.conflict?.conflictType || 'Data conflict'}
                    </span>
                  </div>
                  <button
                    className="resolve-conflict-btn"
                    onClick={() => {
                      setCurrentConflict(conflict);
                      setShowConflictDialog(true);
                    }}
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        conflict={currentConflict}
        isOpen={showConflictDialog}
        onResolve={handleConflictResolve}
        onCancel={handleConflictCancel}
        showPreview={true}
        allowCustomMerge={true}
      />
    </div>
  );
};

export default OptimisticUpdateDemo; 