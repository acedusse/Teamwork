import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Activity log file path
const ACTIVITY_LOG_PATH = path.join(__dirname, '../../.taskmaster/logs/activity.jsonl');

/**
 * Activity types that can be logged
 */
export const ACTIVITY_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_DELETED: 'task_deleted',
  SUBTASK_CREATED: 'subtask_created',
  SUBTASK_UPDATED: 'subtask_updated',
  SUBTASK_STATUS_CHANGED: 'subtask_status_changed',
  SUBTASK_DELETED: 'subtask_deleted',
  DEPENDENCY_ADDED: 'dependency_added',
  DEPENDENCY_REMOVED: 'dependency_removed',
  PROJECT_INITIALIZED: 'project_initialized',
  PRD_PARSED: 'prd_parsed'
};

/**
 * Ensure the activity log directory exists
 */
function ensureLogDirectory() {
  const logDir = path.dirname(ACTIVITY_LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Create a standardized activity log entry
 * @param {string} activityType - Type of activity (from ACTIVITY_TYPES)
 * @param {Object} details - Activity-specific details
 * @param {string} userId - User identifier (optional, defaults to 'system')
 * @param {Object} metadata - Additional metadata (optional)
 * @returns {Object} Formatted activity log entry
 */
function createActivityEntry(activityType, details, userId = 'system', metadata = {}) {
  return {
    id: generateActivityId(),
    timestamp: new Date().toISOString(),
    activityType,
    userId,
    details,
    metadata,
    source: 'backend_api'
  };
}

/**
 * Generate a unique activity ID
 * @returns {string} Unique activity identifier
 */
function generateActivityId() {
  return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Write an activity entry to the log file
 * @param {Object} activityEntry - The activity entry to log
 */
function writeActivityEntry(activityEntry) {
  try {
    ensureLogDirectory();
    
    // Append to JSONL file (one JSON object per line)
    const logLine = JSON.stringify(activityEntry) + '\n';
    fs.appendFileSync(ACTIVITY_LOG_PATH, logLine, 'utf8');
    
    logger.info(`[ACTIVITY] ${activityEntry.activityType}: ${activityEntry.details.taskId || activityEntry.details.id || 'N/A'}`);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

/**
 * Log a task creation activity
 * @param {Object} task - The created task
 * @param {string} userId - User who created the task
 */
export function logTaskCreated(task, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.TASK_CREATED,
    {
      taskId: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority
    },
    userId,
    {
      hasSubtasks: task.subtasks && task.subtasks.length > 0,
      dependencyCount: task.dependencies ? task.dependencies.length : 0
    }
  );
  writeActivityEntry(entry);
}

/**
 * Log a task update activity
 * @param {Object} task - The updated task
 * @param {Object} changes - What changed in the task
 * @param {string} userId - User who updated the task
 */
export function logTaskUpdated(task, changes, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.TASK_UPDATED,
    {
      taskId: task.id,
      title: task.title,
      changes
    },
    userId,
    {
      changeCount: Object.keys(changes).length
    }
  );
  writeActivityEntry(entry);
}

/**
 * Log a task status change activity
 * @param {Object} task - The task whose status changed
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} userId - User who changed the status
 */
export function logTaskStatusChanged(task, oldStatus, newStatus, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.TASK_STATUS_CHANGED,
    {
      taskId: task.id,
      title: task.title,
      oldStatus,
      newStatus
    },
    userId,
    {
      isCompletion: newStatus === 'done',
      isReactivation: oldStatus === 'done' && newStatus !== 'done'
    }
  );
  writeActivityEntry(entry);
}

/**
 * Log a task deletion activity
 * @param {Object} task - The deleted task
 * @param {string} userId - User who deleted the task
 */
export function logTaskDeleted(task, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.TASK_DELETED,
    {
      taskId: task.id,
      title: task.title,
      status: task.status
    },
    userId
  );
  writeActivityEntry(entry);
}

/**
 * Log a subtask creation activity
 * @param {Object} subtask - The created subtask
 * @param {string} parentTaskId - ID of the parent task
 * @param {string} userId - User who created the subtask
 */
export function logSubtaskCreated(subtask, parentTaskId, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.SUBTASK_CREATED,
    {
      subtaskId: subtask.id,
      parentTaskId,
      title: subtask.title,
      status: subtask.status
    },
    userId
  );
  writeActivityEntry(entry);
}

/**
 * Log a subtask update activity
 * @param {Object} subtask - The updated subtask
 * @param {string} parentTaskId - ID of the parent task
 * @param {Object} changes - What changed in the subtask
 * @param {string} userId - User who updated the subtask
 */
export function logSubtaskUpdated(subtask, parentTaskId, changes, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.SUBTASK_UPDATED,
    {
      subtaskId: subtask.id,
      parentTaskId,
      title: subtask.title,
      changes
    },
    userId,
    {
      changeCount: Object.keys(changes).length
    }
  );
  writeActivityEntry(entry);
}

/**
 * Log a subtask status change activity
 * @param {Object} subtask - The subtask whose status changed
 * @param {string} parentTaskId - ID of the parent task
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} userId - User who changed the status
 */
export function logSubtaskStatusChanged(subtask, parentTaskId, oldStatus, newStatus, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.SUBTASK_STATUS_CHANGED,
    {
      subtaskId: subtask.id,
      parentTaskId,
      title: subtask.title,
      oldStatus,
      newStatus
    },
    userId,
    {
      isCompletion: newStatus === 'done',
      isReactivation: oldStatus === 'done' && newStatus !== 'done'
    }
  );
  writeActivityEntry(entry);
}

/**
 * Log a subtask deletion activity
 * @param {Object} subtask - The deleted subtask
 * @param {string} parentTaskId - ID of the parent task
 * @param {string} userId - User who deleted the subtask
 */
export function logSubtaskDeleted(subtask, parentTaskId, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.SUBTASK_DELETED,
    {
      subtaskId: subtask.id,
      parentTaskId,
      title: subtask.title,
      status: subtask.status
    },
    userId
  );
  writeActivityEntry(entry);
}

/**
 * Log a dependency addition activity
 * @param {string} taskId - ID of the task that gained a dependency
 * @param {string} dependencyId - ID of the dependency task
 * @param {string} userId - User who added the dependency
 */
export function logDependencyAdded(taskId, dependencyId, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.DEPENDENCY_ADDED,
    {
      taskId,
      dependencyId
    },
    userId
  );
  writeActivityEntry(entry);
}

/**
 * Log a dependency removal activity
 * @param {string} taskId - ID of the task that lost a dependency
 * @param {string} dependencyId - ID of the removed dependency task
 * @param {string} userId - User who removed the dependency
 */
export function logDependencyRemoved(taskId, dependencyId, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.DEPENDENCY_REMOVED,
    {
      taskId,
      dependencyId
    },
    userId
  );
  writeActivityEntry(entry);
}

/**
 * Log project initialization activity
 * @param {Object} projectInfo - Information about the initialized project
 * @param {string} userId - User who initialized the project
 */
export function logProjectInitialized(projectInfo, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.PROJECT_INITIALIZED,
    {
      projectName: projectInfo.name,
      description: projectInfo.description,
      version: projectInfo.version
    },
    userId
  );
  writeActivityEntry(entry);
}

/**
 * Log PRD parsing activity
 * @param {Object} prdInfo - Information about the parsed PRD
 * @param {number} tasksGenerated - Number of tasks generated from PRD
 * @param {string} userId - User who parsed the PRD
 */
export function logPrdParsed(prdInfo, tasksGenerated, userId = 'system') {
  const entry = createActivityEntry(
    ACTIVITY_TYPES.PRD_PARSED,
    {
      fileName: prdInfo.fileName,
      fileSize: prdInfo.fileSize,
      tasksGenerated
    },
    userId,
    {
      processingTime: prdInfo.processingTime
    }
  );
  writeActivityEntry(entry);
}

/**
 * Read activity log entries within a date range
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {Array} Array of activity entries
 */
export function readActivityLog(startDate = null, endDate = null) {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_PATH)) {
      return [];
    }

    const logContent = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    let activities = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error('Failed to parse activity log line:', line);
        return null;
      }
    }).filter(Boolean);

    // Filter by date range if provided
    if (startDate || endDate) {
      activities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        if (startDate && activityDate < startDate) return false;
        if (endDate && activityDate > endDate) return false;
        return true;
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Failed to read activity log:', error);
    return [];
  }
}

/**
 * Get activity statistics for a date range in dashboard-compatible format
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @param {string} period - Period type ('daily' or 'weekly')
 * @returns {Object} Activity statistics in dashboard format
 */
export function getActivityStatistics(startDate, endDate, period = 'daily') {
  const activities = readActivityLog(startDate, endDate);
  
  // Generate array of dates in the range
  const dateRange = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Initialize statistics for each date
  const dailyStats = dateRange.map(date => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return {
      date: dateStr,
      completed: 0,
      inProgress: 0,
      pending: 0,
      total: 0
    };
  });

  // Helper function to get date string from timestamp
  const getDateString = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toISOString().split('T')[0];
  };

  // Helper function to find stats object for a given date
  const findStatsForDate = (dateStr) => {
    return dailyStats.find(stat => stat.date === dateStr);
  };

  // Process activities and count them by type and date
  activities.forEach(activity => {
    const activityDate = getDateString(activity.timestamp);
    const stats = findStatsForDate(activityDate);
    
    if (stats) {
      // Count different types of activities
      switch (activity.activityType) {
        case 'task_created':
          stats.pending++; // New tasks start as pending
          stats.total++;
          break;
        case 'task_status_changed':
          if (activity.details.newStatus === 'done') {
            stats.completed++;
          } else if (activity.details.newStatus === 'in-progress') {
            stats.inProgress++;
          } else if (activity.details.newStatus === 'pending') {
            stats.pending++;
          }
          stats.total++;
          break;
        case 'task_updated':
        case 'subtask_created':
        case 'subtask_updated':
        case 'subtask_status_changed':
        case 'dependency_added':
        case 'dependency_removed':
          stats.total++; // Count all other activities as general activity
          break;
        default:
          stats.total++;
      }
    }
  });

  return {
    dateRange: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    },
    statistics: dailyStats
  };
}

/**
 * Initialize activity logging by creating initial log entry
 */
export function initializeActivityLogging() {
  const entry = createActivityEntry(
    'activity_logging_initialized',
    {
      message: 'Activity logging system initialized',
      logPath: ACTIVITY_LOG_PATH
    },
    'system'
  );
  writeActivityEntry(entry);
} 