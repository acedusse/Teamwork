import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TaskCreationForm from '../components/TaskCreationForm';
import TaskService from '../services/taskService';

const TaskCreation = () => {
  const navigate = useNavigate();

  const handleTaskSubmit = async (taskData) => {
    let optimisticTask = null;
    
    try {
      // Call the API service with optimistic update callbacks
      const createdTask = await TaskService.createTask(taskData, {
        // Optimistic update: immediately show task in UI
        onOptimisticUpdate: (tempTask) => {
          optimisticTask = tempTask;
          console.log('Optimistic update: Task temporarily added to UI:', tempTask);
          
          // Here you could dispatch to a global state manager (Redux, Context, etc.)
          // to immediately show the task in lists before the API call completes
          // Example: dispatch({ type: 'ADD_OPTIMISTIC_TASK', payload: tempTask });
        },
        
        // Success: replace optimistic task with real task
        onOptimisticSuccess: (tempTask, realTask) => {
          console.log('Task created successfully - replacing optimistic task:', {
            optimistic: tempTask,
            real: realTask
          });
          
          // Here you could update the global state to replace the temporary task
          // Example: dispatch({ type: 'REPLACE_OPTIMISTIC_TASK', 
          //   payload: { tempId: tempTask.id, realTask } });
        },
        
        // Error: remove optimistic task and show error
        onOptimisticError: (tempTask, error) => {
          console.error('Task creation failed - removing optimistic task:', {
            optimistic: tempTask,
            error: error
          });
          
          // Here you could remove the optimistic task from global state
          // Example: dispatch({ type: 'REMOVE_OPTIMISTIC_TASK', 
          //   payload: tempTask.id });
        }
      });
      
      console.log('Task created successfully:', createdTask);
      
      // Return the created task so the form can handle navigation
      return createdTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      
      // Provide enhanced error context to the form
      const enhancedError = {
        ...error,
        optimisticTask,
        userMessage: error.message || 'Failed to create task. Please try again.',
        canRetry: !['AuthenticationError', 'AuthorizationError'].includes(error.name),
        shouldRefresh: error.name === 'ConflictError'
      };
      
      throw enhancedError; // Re-throw to let the form handle the error
    }
  };

  const handleCancel = () => {
    navigate('/tasks');
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <TaskCreationForm 
        onSubmit={handleTaskSubmit}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default TaskCreation; 