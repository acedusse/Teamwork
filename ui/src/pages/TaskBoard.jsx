import React, { useState, useCallback, useEffect } from 'react';
import { Box, Alert, CircularProgress, Snackbar } from '@mui/material';
import { useLocation } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailPanel from '../components/TaskDetailPanel';
import { useTasks } from '../hooks/useTasks';

export default function TaskBoard({ onEditTask }) {
  const location = useLocation();
  const { 
    tasks,
    isLoading,
    error,
    createTask, 
    updateTask, 
    deleteTask,
    isCreating,
    isUpdating,
    isDeleting,
    refetch
  } = useTasks();
  
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle navigation state from task creation
  useEffect(() => {
    if (location.state) {
      const { message, openTaskId, openDetailPanel } = location.state;
      
      if (message) {
        setSuccessMessage(message);
        setShowSuccessMessage(true);
      }
      
      if (openTaskId && openDetailPanel) {
        // Wait for tasks to load before opening detail panel
        const openDetailWhenReady = () => {
          if (tasks && tasks.find(t => t.id === openTaskId)) {
            setSelectedTaskId(openTaskId);
            setDetailPanelOpen(true);
          } else if (!isLoading) {
            // If task not found after loading, still show success message
            console.log('Newly created task not found in current tasks list');
          }
        };

        if (tasks) {
          openDetailWhenReady();
        } else {
          // Wait a bit for tasks to load
          const timeout = setTimeout(openDetailWhenReady, 1000);
          return () => clearTimeout(timeout);
        }
      }
      
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tasks, isLoading]);

  // Handle task actions from the Kanban board
  const handleTaskAction = useCallback((action, taskId, actionData = {}) => {
    console.log('Task action:', action, taskId, actionData);
    
    switch (action) {
      case 'view':
        setSelectedTaskId(taskId);
        setDetailPanelOpen(true);
        break;
        
      case 'edit':
        if (onEditTask) {
          const taskToEdit = tasks.find(t => t.id === taskId);
          onEditTask(taskToEdit);
        } else {
          // Fallback to detail panel
          setSelectedTaskId(taskId);
          setDetailPanelOpen(true);
        }
        break;
        
      case 'start':
        updateTask({
          id: taskId,
          taskData: { status: 'in-progress' }
        });
        break;
        
      case 'complete':
        updateTask({
          id: taskId,
          taskData: { status: 'done' }
        });
        break;
        
      case 'pause':
        updateTask({
          id: taskId,
          taskData: { status: 'pending' }
        });
        break;
        
      case 'reopen':
        updateTask({
          id: taskId,
          taskData: { status: 'pending' }
        });
        break;
        
      case 'block':
        updateTask({
          id: taskId,
          taskData: { status: 'blocked' }
        });
        break;
        
      case 'priority-high':
        updateTask({
          id: taskId,
          taskData: { priority: 'high' }
        });
        break;
        
      case 'priority-low':
        updateTask({
          id: taskId,
          taskData: { priority: 'low' }
        });
        break;
        
      case 'delete':
        if (window.confirm('Are you sure you want to delete this task?')) {
          deleteTask(taskId);
        }
        break;
        
      default:
        console.log('Unhandled action:', action);
    }
  }, [updateTask, deleteTask]);

  // Handle task movement between columns
  const handleTaskMove = useCallback((taskId, newStatus) => {
    console.log('Moving task:', taskId, 'to status:', newStatus);
    updateTask({
      id: taskId,
      taskData: { status: newStatus }
    });
  }, [updateTask]);

  // Handle task updates from detail panel
  const handleTaskUpdate = useCallback((taskId, taskData) => {
    console.log('Updating task:', taskId, taskData);
    updateTask({
      id: taskId,
      taskData
    });
  }, [updateTask]);

  // Handle task creation
  const handleTaskCreate = useCallback((taskData) => {
    console.log('Creating task:', taskData);
    createTask(taskData);
  }, [createTask]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    console.log('Refreshing tasks...');
    refetch();
  }, [refetch]);

  // Handle detail panel close
  const handleDetailPanelClose = useCallback(() => {
    setDetailPanelOpen(false);
    setSelectedTaskId(null);
  }, []);

  // Get selected task data
  const selectedTask = selectedTaskId 
    ? tasks.find(t => t.id === selectedTaskId)
    : null;

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading tasks: {error?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main Kanban Board */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <KanbanBoard
          tasks={tasks || []}
          loading={isLoading}
          onTaskMove={handleTaskMove}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onRefresh={handleRefresh}
          onTaskAction={handleTaskAction}
        />
      </Box>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        open={detailPanelOpen}
        task={selectedTask}
        allTasks={tasks || []}
        onClose={handleDetailPanelClose}
        onTaskUpdate={(taskData) => handleTaskUpdate(selectedTaskId, taskData)}
        onTaskDelete={(taskId) => {
          if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTask(taskId);
            handleDetailPanelClose();
          }
        }}
        onTaskAction={handleTaskAction}
      />

      {/* Loading indicator for mutations */}
      {(isUpdating || isCreating || isDeleting) && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress size={24} />
          Updating...
        </Box>
      )}

      {/* Success Message Snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
} 