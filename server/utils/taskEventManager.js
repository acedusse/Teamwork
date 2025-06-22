import { broadcast } from '../websocket.js';
import logger from './logger.js';

/**
 * Task Event Manager for Real-time Updates and Notifications
 * Handles broadcasting task changes and notifications to all connected clients
 */

// Event Types
export const TASK_EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated', 
  TASK_DELETED: 'task:deleted',
  TASK_STATUS_CHANGED: 'task:status_changed',
  TASK_ASSIGNED: 'task:assigned',
  TASK_MOVED: 'task:moved',
  SUBTASK_ADDED: 'task:subtask_added',
  SUBTASK_UPDATED: 'task:subtask_updated',
  SUBTASK_DELETED: 'task:subtask_deleted',
  TASKS_BULK_UPDATE: 'tasks:bulk_update'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  TASK_UPDATE: 'task_update'
};

/**
 * Create a standardized task event payload
 */
function createTaskEventPayload(eventType, task, metadata = {}) {
  return {
    eventType,
    task,
    timestamp: new Date().toISOString(),
    metadata: {
      userId: metadata.userId || 'system',
      userAgent: metadata.userAgent || 'server',
      source: metadata.source || 'api',
      ...metadata
    }
  };
}

/**
 * Create a notification payload
 */
function createNotificationPayload(type, message, metadata = {}) {
  return {
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    metadata: {
      userId: metadata.userId || 'system',
      taskId: metadata.taskId,
      source: metadata.source || 'system',
      ...metadata
    }
  };
}

/**
 * Detect what changed between old and new task
 */
function detectTaskChanges(oldTask, newTask) {
  const changes = {};
  
  if (!oldTask) {
    return { type: 'created', changes: { task: newTask } };
  }
  
  // Check status change
  if (oldTask.status !== newTask.status) {
    changes.status = { from: oldTask.status, to: newTask.status };
  }
  
  // Check assignment change
  if (oldTask.assignee !== newTask.assignee) {
    changes.assignee = { from: oldTask.assignee, to: newTask.assignee };
  }
  
  // Check priority change
  if (oldTask.priority !== newTask.priority) {
    changes.priority = { from: oldTask.priority, to: newTask.priority };
  }
  
  // Check title change
  if (oldTask.title !== newTask.title) {
    changes.title = { from: oldTask.title, to: newTask.title };
  }
  
  // Check description change
  if (oldTask.description !== newTask.description) {
    changes.description = { from: oldTask.description, to: newTask.description };
  }
  
  // Check dependencies change
  const oldDeps = JSON.stringify(oldTask.dependencies || []);
  const newDeps = JSON.stringify(newTask.dependencies || []);
  if (oldDeps !== newDeps) {
    changes.dependencies = { from: oldTask.dependencies, to: newTask.dependencies };
  }
  
  // Check due date change
  if (oldTask.dueDate !== newTask.dueDate) {
    changes.dueDate = { from: oldTask.dueDate, to: newTask.dueDate };
  }
  
  return { type: 'updated', changes };
}

/**
 * Generate human-readable notification message for task changes
 */
function generateTaskChangeMessage(task, changes, userId = 'Someone') {
  const taskTitle = task.title || `Task #${task.id}`;
  
  if (changes.type === 'created') {
    return `${userId} created "${taskTitle}"`;
  }
  
  const changeMessages = [];
  
  if (changes.changes.status) {
    const { from, to } = changes.changes.status;
    changeMessages.push(`status changed from "${from}" to "${to}"`);
  }
  
  if (changes.changes.assignee) {
    const { from, to } = changes.changes.assignee;
    if (!from && to) {
      changeMessages.push(`assigned to ${to}`);
    } else if (from && !to) {
      changeMessages.push(`unassigned from ${from}`);
    } else if (from && to) {
      changeMessages.push(`reassigned from ${from} to ${to}`);
    }
  }
  
  if (changes.changes.priority) {
    const { from, to } = changes.changes.priority;
    changeMessages.push(`priority changed from "${from}" to "${to}"`);
  }
  
  if (changes.changes.title) {
    changeMessages.push(`title updated`);
  }
  
  if (changes.changes.description) {
    changeMessages.push(`description updated`);
  }
  
  if (changes.changes.dependencies) {
    changeMessages.push(`dependencies updated`);
  }
  
  if (changes.changes.dueDate) {
    const { from, to } = changes.changes.dueDate;
    if (!from && to) {
      changeMessages.push(`due date set to ${new Date(to).toLocaleDateString()}`);
    } else if (from && !to) {
      changeMessages.push(`due date removed`);
    } else if (from && to) {
      changeMessages.push(`due date changed to ${new Date(to).toLocaleDateString()}`);
    }
  }
  
  if (changeMessages.length === 0) {
    return `${userId} updated "${taskTitle}"`;
  }
  
  return `${userId} updated "${taskTitle}": ${changeMessages.join(', ')}`;
}

/**
 * Broadcast task creation event
 */
export function broadcastTaskCreated(task, metadata = {}) {
  try {
    const eventPayload = createTaskEventPayload(TASK_EVENTS.TASK_CREATED, task, metadata);
    const notificationPayload = createNotificationPayload(
      NOTIFICATION_TYPES.SUCCESS,
      generateTaskChangeMessage(task, { type: 'created' }, metadata.userName || metadata.userId),
      { ...metadata, taskId: task.id }
    );
    
    // Broadcast the task event
    broadcast(TASK_EVENTS.TASK_CREATED, eventPayload);
    
    // Broadcast the notification
    broadcast('notification', notificationPayload);
    
    logger.info(`Task created: ${task.id} - ${task.title}`, { 
      taskId: task.id, 
      userId: metadata.userId 
    });
    
    return { eventPayload, notificationPayload };
  } catch (error) {
    logger.error('Failed to broadcast task creation', error);
    throw error;
  }
}

/**
 * Broadcast task update event
 */
export function broadcastTaskUpdated(oldTask, newTask, metadata = {}) {
  try {
    const changes = detectTaskChanges(oldTask, newTask);
    const eventPayload = createTaskEventPayload(TASK_EVENTS.TASK_UPDATED, newTask, {
      ...metadata,
      changes: changes.changes
    });
    
    // Create specific event for status changes
    if (changes.changes.status) {
      const statusEventPayload = createTaskEventPayload(TASK_EVENTS.TASK_STATUS_CHANGED, newTask, {
        ...metadata,
        statusChange: changes.changes.status
      });
      broadcast(TASK_EVENTS.TASK_STATUS_CHANGED, statusEventPayload);
    }
    
    // Create specific event for assignments
    if (changes.changes.assignee) {
      const assignmentEventPayload = createTaskEventPayload(TASK_EVENTS.TASK_ASSIGNED, newTask, {
        ...metadata,
        assignmentChange: changes.changes.assignee
      });
      broadcast(TASK_EVENTS.TASK_ASSIGNED, assignmentEventPayload);
    }
    
    // Broadcast the general update event
    broadcast(TASK_EVENTS.TASK_UPDATED, eventPayload);
    
    // Create and broadcast notification if there are meaningful changes
    if (Object.keys(changes.changes).length > 0) {
      const notificationPayload = createNotificationPayload(
        NOTIFICATION_TYPES.TASK_UPDATE,
        generateTaskChangeMessage(newTask, changes, metadata.userName || metadata.userId),
        { ...metadata, taskId: newTask.id, changes: changes.changes }
      );
      
      broadcast('notification', notificationPayload);
    }
    
    logger.info(`Task updated: ${newTask.id} - ${newTask.title}`, { 
      taskId: newTask.id, 
      userId: metadata.userId,
      changes: Object.keys(changes.changes)
    });
    
    return { eventPayload, changes };
  } catch (error) {
    logger.error('Failed to broadcast task update', error);
    throw error;
  }
}

/**
 * Broadcast task deletion event
 */
export function broadcastTaskDeleted(task, metadata = {}) {
  try {
    const eventPayload = createTaskEventPayload(TASK_EVENTS.TASK_DELETED, task, metadata);
    const notificationPayload = createNotificationPayload(
      NOTIFICATION_TYPES.WARNING,
      `${metadata.userName || metadata.userId || 'Someone'} deleted "${task.title || `Task #${task.id}`}"`,
      { ...metadata, taskId: task.id }
    );
    
    // Broadcast the task deletion event
    broadcast(TASK_EVENTS.TASK_DELETED, eventPayload);
    
    // Broadcast the notification
    broadcast('notification', notificationPayload);
    
    logger.info(`Task deleted: ${task.id} - ${task.title}`, { 
      taskId: task.id, 
      userId: metadata.userId 
    });
    
    return { eventPayload, notificationPayload };
  } catch (error) {
    logger.error('Failed to broadcast task deletion', error);
    throw error;
  }
}

/**
 * Broadcast subtask events
 */
export function broadcastSubtaskAdded(parentTask, subtask, metadata = {}) {
  try {
    const eventPayload = createTaskEventPayload(TASK_EVENTS.SUBTASK_ADDED, parentTask, {
      ...metadata,
      subtask
    });
    
    const notificationPayload = createNotificationPayload(
      NOTIFICATION_TYPES.INFO,
      `${metadata.userName || metadata.userId || 'Someone'} added subtask "${subtask.title}" to "${parentTask.title}"`,
      { ...metadata, taskId: parentTask.id, subtaskId: subtask.id }
    );
    
    broadcast(TASK_EVENTS.SUBTASK_ADDED, eventPayload);
    broadcast('notification', notificationPayload);
    
    logger.info(`Subtask added: ${subtask.id} to task ${parentTask.id}`, { 
      taskId: parentTask.id,
      subtaskId: subtask.id,
      userId: metadata.userId 
    });
    
    return { eventPayload, notificationPayload };
  } catch (error) {
    logger.error('Failed to broadcast subtask addition', error);
    throw error;
  }
}

/**
 * Broadcast bulk task updates (for performance)
 */
export function broadcastBulkTaskUpdate(tasks, metadata = {}) {
  try {
    const eventPayload = {
      eventType: TASK_EVENTS.TASKS_BULK_UPDATE,
      tasks,
      timestamp: new Date().toISOString(),
      metadata: {
        userId: metadata.userId || 'system',
        source: metadata.source || 'bulk_operation',
        ...metadata
      }
    };
    
    // Use the legacy format for backward compatibility
    broadcast('tasksUpdated', {
      tasks,
      timestamp: new Date().toISOString()
    });
    
    // Also broadcast the new format
    broadcast(TASK_EVENTS.TASKS_BULK_UPDATE, eventPayload);
    
    logger.info(`Bulk task update: ${tasks.length} tasks`, { 
      taskCount: tasks.length,
      userId: metadata.userId 
    });
    
    return eventPayload;
  } catch (error) {
    logger.error('Failed to broadcast bulk task update', error);
    throw error;
  }
}

/**
 * Send a custom notification
 */
export function sendNotification(type, message, metadata = {}) {
  try {
    const notificationPayload = createNotificationPayload(type, message, metadata);
    broadcast('notification', notificationPayload);
    
    logger.debug(`Notification sent: ${type} - ${message}`, { 
      type,
      userId: metadata.userId 
    });
    
    return notificationPayload;
  } catch (error) {
    logger.error('Failed to send notification', error);
    throw error;
  }
}

export default {
  TASK_EVENTS,
  NOTIFICATION_TYPES,
  broadcastTaskCreated,
  broadcastTaskUpdated,
  broadcastTaskDeleted,
  broadcastSubtaskAdded,
  broadcastBulkTaskUpdate,
  sendNotification
}; 