import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../api/taskService';

export const useTasks = () => {
  const queryClient = useQueryClient();

  // Get all tasks
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getTasks,
    onError: (error) => {
      console.error('Error fetching tasks:', error);
    }
  });

  // Get task statistics
  const statsQuery = useQuery({
    queryKey: ['taskStats'],
    queryFn: taskService.getTaskStats,
    onError: (error) => {
      console.error('Error fetching task stats:', error);
    }
  });

  // Get recent activities
  const activitiesQuery = useQuery({
    queryKey: ['taskActivities'],
    queryFn: taskService.getRecentActivities,
    onError: (error) => {
      console.error('Error fetching activities:', error);
    }
  });

  // Get daily statistics (for charts)
  const dailyStatsQuery = useQuery({
    queryKey: ['dailyTaskStats'],
    queryFn: () => taskService.getDailyStatistics(),
    onError: (error) => {
      console.error('Error fetching daily statistics:', error);
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      queryClient.invalidateQueries({ queryKey: ['taskActivities'] });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => taskService.updateTask(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      queryClient.invalidateQueries({ queryKey: ['taskActivities'] });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      queryClient.invalidateQueries({ queryKey: ['taskActivities'] });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
    }
  });

  return {
    // Raw data
    tasks: tasksQuery.data?.tasks || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    stats: statsQuery.data,
    activities: activitiesQuery.data || [],
    dailyStats: dailyStatsQuery.data,
    lastUpdated: dailyStatsQuery.dataUpdatedAt,
    
    // Query objects (for components that need more control)
    tasksQuery,
    statsQuery,
    activitiesQuery,
    dailyStatsQuery,
    
    // Mutation functions
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    
    // Mutation objects (for components that need more control)
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    
    // Mutation status
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    
    // Refetch functionality
    refetch: () => {
      tasksQuery.refetch();
      statsQuery.refetch();
      activitiesQuery.refetch();
      dailyStatsQuery.refetch();
    }
  };
}; 