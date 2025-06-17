import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /api/team/performance
 * Returns performance metrics for team members based on task data
 * Optional query parameter: timeRange (day, week, month, quarter)
 */
/**
 * GET /api/team/performance
 * Returns performance metrics for team members merged with agent profiles
 * Optional query parameters: 
 * - timeRange (day, week, month, quarter)
 * - team (filter by team name)
 * - role (filter by role)
 * - startDate (ISO date string for custom date range)
 * - endDate (ISO date string for custom date range)
 */
router.get('/', async (req, res) => {
  try {
    // Get query parameters
    const { timeRange, team, role, startDate, endDate } = req.query;
    console.log('Team performance API called with parameters:', { timeRange, team, role, startDate, endDate });

    // Get agent profiles
    const profiles = await getAgentProfiles();
    console.log(`Retrieved ${profiles.length} agent profiles`);

    // Filter profiles by team and role if provided
    let filteredProfiles = profiles;
    if (team) {
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.department && profile.department.toLowerCase() === team.toLowerCase());
      console.log(`Filtered profiles by team '${team}': ${filteredProfiles.length} results`);
    }
    
    if (role) {
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.role && profile.role.toLowerCase() === role.toLowerCase());
      console.log(`Filtered profiles by role '${role}': ${filteredProfiles.length} results`);
    }

    // Get task data with date filtering if provided
    const taskData = await getRealTimeTaskData(timeRange, startDate, endDate);
    
    // Calculate performance metrics
    const metrics = calculatePerformanceMetrics(taskData, timeRange);
    console.log(`Generated metrics for ${metrics.length} team members`);

    // Merge agent profiles with metrics
    const teamData = mergeProfilesWithMetrics(filteredProfiles, metrics);
    console.log(`Final team data contains ${teamData.length} entries`);
    
    // Show sample of what we're returning (first entry)
    if (teamData.length > 0) {
      console.log('Sample team data entry:', JSON.stringify(teamData[0]).substring(0, 200) + '...');
    }

    res.json(teamData);
  } catch (error) {
    console.error('Error in team performance route:', error);
    res.status(500).json({ error: 'Failed to get team performance data' });
  }
});

/**
 * Get agent profiles from agents.json file
 * @returns {Promise<Array>} - Promise resolving to array of agent profile objects
 */
async function getAgentProfiles() {
  try {
    // Read agent profiles from JSON file
    const agentProfilesPath = path.join(__dirname, '../data/agents.json');
    try {
      const profilesData = await fsPromises.readFile(agentProfilesPath, 'utf8');
      return JSON.parse(profilesData);
    } catch (fileError) {
      console.log('Agent profiles file not found, using fallback profiles');
      // Return some basic agent profiles if file not found
      return [
        { id: 'agent1', name: 'Alex Chen', role: 'Senior Developer', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
        { id: 'agent2', name: 'Samira Patel', role: 'DevOps Engineer', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
        { id: 'agent3', name: 'Jordan Rivera', role: 'Junior Developer', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
        { id: 'agent4', name: 'Taylor Kim', role: 'Designer', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
        { id: 'agent5', name: 'Morgan Singh', role: 'Project Manager', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' }
      ];
    }
  } catch (error) {
    console.error('Error in getAgentProfiles:', error);
    // Final fallback
    return [
      { id: 'agent1', name: 'Alex Chen', role: 'Developer', avatar: '' },
      { id: 'agent2', name: 'Samira Patel', role: 'Engineer', avatar: '' },
      { id: 'agent3', name: 'Jordan Rivera', role: 'Developer', avatar: '' },
      { id: 'agent4', name: 'Team Member 4', role: 'Support', avatar: '' },
      { id: 'agent5', name: 'Team Member 5', role: 'Manager', avatar: '' }
    ];
  }
}

/**
 * Get real-time task data from task management system
 * @param {String} timeRange - The time range to filter tasks (day, week, month, quarter)
 * @param {String} startDate - Optional ISO date string for custom date range start
 * @param {String} endDate - Optional ISO date string for custom date range end
 * @returns {Promise<Array>} - Promise resolving to array of task objects
 */
async function getRealTimeTaskData(timeRange, startDate, endDate) {
  try {
    // Get all tasks from the task management system
    const tasksFilePath = path.resolve(__dirname, '../../.taskmaster/tasks/tasks.json');
    console.log(`Reading tasks from: ${tasksFilePath}`);
    const tasksData = await fsPromises.readFile(tasksFilePath, 'utf8');
    const parsedData = JSON.parse(tasksData);
    
    console.log(`Task data structure keys: ${Object.keys(parsedData)}`);
    const allTasks = parsedData.tasks || [];
    console.log(`Total tasks found: ${allTasks.length}`);
    
    if (allTasks.length === 0) {
      console.warn('No tasks found in tasks.json!');
      return [];
    }
    
    // Log sample task to understand structure
    if (allTasks.length > 0) {
      console.log('Sample task structure:', JSON.stringify(allTasks[0], null, 2).substring(0, 500) + '...');
    }
    
    // Default to 'week' if timeRange is not provided
    const range = timeRange || 'week';
    const now = new Date();
    
    // Define the date range variables
    let filterStartDate;
    let filterEndDate = new Date(); // Default end date is now
    
    // If custom date range is provided, use it
    if (startDate && endDate) {
      filterStartDate = new Date(startDate);
      filterEndDate = new Date(endDate);
      console.log(`Using custom date range: ${filterStartDate.toISOString()} to ${filterEndDate.toISOString()}`);
    } else {
      // Otherwise use timeRange
      switch(range) { // Use 'range' instead of 'timeRange' to respect the default value
        case 'day':
          // Tasks from today
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          // Tasks from last 7 days
          filterStartDate = new Date();
          filterStartDate.setDate(filterStartDate.getDate() - 7);
          break;
        case 'month':
          // Tasks from last 30 days
          filterStartDate = new Date();
          filterStartDate.setDate(filterStartDate.getDate() - 30);
          break;
        case 'quarter':
          // Tasks from last 90 days
          filterStartDate = new Date();
          filterStartDate.setDate(filterStartDate.getDate() - 90);
          break;
        default:
          // Default to last 7 days
          filterStartDate = new Date();
          filterStartDate.setDate(filterStartDate.getDate() - 7);
          break;
      }
      console.log(`Using timeRange filter: ${range}, from ${filterStartDate.toISOString()} to ${filterEndDate.toISOString()}`);
    }
    console.log(`Current time reference: ${now.toISOString()}`);
    
    // Filter tasks based on timestamp/date if available
    // Track task date fields for debugging
    let tasksWithCreatedAt = 0;
    let tasksWithCompletedAt = 0;
    let tasksWithDueDate = 0;
    let tasksWithUpdatedAt = 0;
    let tasksInDateRange = 0;
    let skippedTasks = 0;
    let addedTasks = 0;
    
    const filteredTasks = [];
    for (const task of allTasks) {
      // Skip tasks without ID
      if (!task.id) {
        skippedTasks++;
        continue; 
      }
      
      // Try to find a date field to use for filtering
      let taskDate = null;
      
      // First check the most important date fields in priority order
      if (task.updatedAt) {
        taskDate = new Date(task.updatedAt);
        tasksWithUpdatedAt++;
      } else if (task.completedAt) {
        taskDate = new Date(task.completedAt);
        tasksWithCompletedAt++;
      } else if (task.createdAt) {
        taskDate = new Date(task.createdAt);
        tasksWithCreatedAt++;
      } else if (task.dueDate) {
        taskDate = new Date(task.dueDate);
        tasksWithDueDate++;
      }
      
      // If we couldn't determine a date, add the task regardless of time filter
      if (!taskDate) {
        filteredTasks.push(task);
        addedTasks++;
        continue;
      }
      
      // Add task if it's within the date range (filterStartDate <= taskDate <= filterEndDate)
      if (taskDate >= filterStartDate && taskDate <= filterEndDate) {
        filteredTasks.push(task);
        tasksInDateRange++;
        addedTasks++;
      } else {
        skippedTasks++;
      }
    }
    
    console.log(`Date filtering statistics:`);
    console.log(`- Tasks with valid dates: ${tasksWithCreatedAt + tasksWithCompletedAt + tasksWithDueDate + tasksWithUpdatedAt}`);
    console.log(`- Tasks with no date fields: ${allTasks.length - (tasksWithCreatedAt + tasksWithCompletedAt + tasksWithDueDate + tasksWithUpdatedAt)}`);
    console.log(`- Tasks skipped: ${skippedTasks}`);
    console.log(`- Tasks in date range: ${tasksInDateRange}`);
    console.log(`- Total tasks added: ${addedTasks}`);
    console.log(`Retrieved ${filteredTasks.length} tasks for time range: ${range} (from ${filterStartDate.toISOString()} to ${filterEndDate.toISOString()})`);
    return filteredTasks;
  } catch (error) {
    console.error('Error getting real-time task data:', error);
    return [];
  }
}

/**
 * Calculate performance metrics from real task data
 * @param {Array} taskData - Array of task objects from the task management system
 * @param {String} timeRange - The time range filter
 * @returns {Array} - Array of performance metric objects with enhanced metrics
 */
function calculatePerformanceMetrics(taskData, timeRange) {
  console.log('\n==================== CALCULATING PERFORMANCE METRICS ====================');
  console.log(`Input: ${taskData.length} tasks, time range: ${timeRange}`);
  
  // Create a default set of agent IDs if we need them
  const defaultAgentIds = ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'];
  
  // Count what fields are available for task assignment
  let tasksWithAssignee = 0;
  let tasksWithSubtaskAssignees = 0;
  let tasksWithCreatedBy = 0;
  let tasksUsingId = 0;
  
  // Get unique assignees from task data - extracting from various possible fields
  const uniqueAssignees = new Set();
  
  // First pass: Check if any tasks have assignee information
  // This will be useful for future when tasks might have assignees
  taskData.forEach(task => {
    // Check for direct assignee field
    if (task.assignee) {
      tasksWithAssignee++;
      uniqueAssignees.add(task.assignee);
    }
    
    // Check subtasks for assignees
    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach(subtask => {
        if (subtask.assignee) {
          tasksWithSubtaskAssignees++;
          uniqueAssignees.add(subtask.assignee);
        }
      });
    }
    
    // Check for createdBy field
    if (task.createdBy) {
      tasksWithCreatedBy++;
      uniqueAssignees.add(task.createdBy);
    }
  });
  
  // If no explicit assignees found in any tasks, add default agent IDs
  if (uniqueAssignees.size === 0) {
    console.log('No explicit assignee information found in tasks. Using default agent IDs.');
    defaultAgentIds.forEach(id => uniqueAssignees.add(id));
    tasksUsingId = taskData.length; // All tasks will use ID distribution
  } else {
    // If we found some assignees, make sure all default agent IDs are included
    // This ensures we always have metrics for all team members
    defaultAgentIds.forEach(id => uniqueAssignees.add(id));
    console.log(`Found ${uniqueAssignees.size} unique assignees in tasks (including defaults).`);
  }
  
  console.log('Task assignment field statistics:');
  console.log(`- Tasks with direct assignee: ${tasksWithAssignee}`);
  console.log(`- Tasks with subtask assignees: ${tasksWithSubtaskAssignees}`);
  console.log(`- Tasks with createdBy: ${tasksWithCreatedBy}`);
  console.log(`- Tasks using ID fallback: ${tasksUsingId}`);
  
  // Final fallback: if still no assignees, use the default agent IDs
  if (uniqueAssignees.size === 0) {
    console.log('Using default agent IDs as no assignment information was found.');
    defaultAgentIds.forEach(id => uniqueAssignees.add(id));
  }
  
  console.log(`Found ${uniqueAssignees.size} unique assignees in task data:`);
  console.log([...uniqueAssignees]);
  
  // Map to store metrics by agent ID
  const metricsMap = new Map();
  
  // Initialize metrics for all assignees
  Array.from(uniqueAssignees).forEach(id => {
    metricsMap.set(id, {
      id,
      tasksCompleted: 0,
      tasksInProgress: 0,
      totalTasks: 0,
      productivity: 0, // Basic productivity percentage
      efficiency: 0, // New: Efficiency score (tasks completed / time spent)
      completionRate: 0, // New: Task completion rate over time
      focusScore: 0, // New: Measure of focus on priority tasks
      avgTaskComplexity: 0, // New: Average complexity of assigned tasks
      avgResolutionTime: 0, // New: Average time to complete tasks
      lastCompletionDate: null, // New: Date of last task completion
      lastActiveDate: null, // New: Date last active on any task
      tasksByComplexity: { // New: Distribution of tasks by complexity
        low: 0,
        medium: 0,
        high: 0
      },
      tasksByPriority: { // New: Distribution of tasks by priority
        low: 0,
        medium: 0,
        high: 0
      },
      timeRange: timeRange // Store the time range for reference
    });
  });
  
  // Process tasks and update metrics
  let taskAssignmentCount = 0;
  let tasksSkipped = 0;
  
  // Count occurrences of different task statuses
  let doneCount = 0;
  let pendingCount = 0;
  let inProgressCount = 0;
  let otherStatusCount = 0;
  let otherStatuses = new Set();
  
  // Helper function to determine task complexity
  const getTaskComplexity = (task) => {
    // Try to get complexity from task properties
    if (task.complexity) {
      const complexityValue = typeof task.complexity === 'string' 
        ? task.complexity.toLowerCase() 
        : task.complexity;
        
      if (complexityValue === 'high' || complexityValue >= 8) return 'high';
      if (complexityValue === 'medium' || (complexityValue >= 4 && complexityValue < 8)) return 'medium';
      return 'low';
    }
    
    // Estimate complexity based on subtasks count if available
    if (task.subtasks && Array.isArray(task.subtasks)) {
      if (task.subtasks.length >= 5) return 'high';
      if (task.subtasks.length >= 2) return 'medium';
      return 'low';
    }
    
    // Default to medium complexity
    return 'medium';
  };
  
  // Helper function to determine task priority
  const getTaskPriority = (task) => {
    if (task.priority) {
      const priorityValue = typeof task.priority === 'string' 
        ? task.priority.toLowerCase() 
        : task.priority;
        
      if (priorityValue === 'high' || priorityValue === 'urgent' || priorityValue === 'critical') return 'high';
      if (priorityValue === 'medium' || priorityValue === 'normal') return 'medium';
      return 'low';
    }
    
    // Default to medium priority
    return 'medium';
  };
  
  // Helper function to calculate task resolution time (in days)
  const getResolutionTime = (task) => {
    if (task.completedAt && task.createdAt) {
      const completed = new Date(task.completedAt);
      const created = new Date(task.createdAt);
      return (completed - created) / (1000 * 60 * 60 * 24); // Convert ms to days
    }
    return null; // Unable to determine
  };
  
  taskData.forEach(task => {
    // Determine assignee with a prioritized approach
    let assignee;
    
    // 1. Use direct assignee field if it exists (future-proof)
    if (task.assignee) {
      assignee = task.assignee;
    }
    // 2. Check assignees in subtasks
    else if (task.subtasks && Array.isArray(task.subtasks)) {
      const subtaskWithAssignee = task.subtasks.find(subtask => subtask.assignee);
      if (subtaskWithAssignee) {
        assignee = subtaskWithAssignee.assignee;
      }
    }
    // 3. Use createdBy as fallback
    else if (task.createdBy) {
      assignee = task.createdBy;
    }
    // 4. If no assignee found, distribute by ID
    else if (task.id !== undefined) {
      const agentIndex = (task.id % defaultAgentIds.length);
      assignee = defaultAgentIds[agentIndex];
    }
    // 5. Last resort: random assignment
    else {
      const randomIndex = Math.floor(Math.random() * defaultAgentIds.length);
      assignee = defaultAgentIds[randomIndex];
    }
    
    // Skip if somehow assignee is still not in our map
    if (!assignee || !metricsMap.has(assignee)) {
      console.log(`Task ${task.id} could not be assigned to any agent`);
      tasksSkipped++;
      return;
    }
    
    const taskStatus = task.status || 'pending';
    const agentMetrics = metricsMap.get(assignee);
    
    // Get task complexity and priority
    const complexity = getTaskComplexity(task);
    const priority = getTaskPriority(task);
    
    // Update metrics based on task status
    agentMetrics.totalTasks++;
    taskAssignmentCount++;
    
    // Update task distribution by complexity and priority
    agentMetrics.tasksByComplexity[complexity]++;
    agentMetrics.tasksByPriority[priority]++;
    
    // Count status for stats - handle more variations of status values
    const lowerStatus = taskStatus.toLowerCase();
    
    if (lowerStatus === 'done' || lowerStatus === 'completed') {
      doneCount++;
      agentMetrics.tasksCompleted++;
      
      // Update completion metrics
      if (task.completedAt) {
        const completionDate = new Date(task.completedAt);
        
        // Update last completion date if this is more recent
        if (!agentMetrics.lastCompletionDate || completionDate > agentMetrics.lastCompletionDate) {
          agentMetrics.lastCompletionDate = completionDate;
        }
        
        // Calculate resolution time if possible
        const resolutionTime = getResolutionTime(task);
        if (resolutionTime !== null) {
          // Update average resolution time with running average
          if (agentMetrics.avgResolutionTime === 0) {
            agentMetrics.avgResolutionTime = resolutionTime;
          } else {
            // Running average calculation
            const completedSoFar = agentMetrics.tasksCompleted;
            agentMetrics.avgResolutionTime = 
              ((agentMetrics.avgResolutionTime * (completedSoFar - 1)) + resolutionTime) / completedSoFar;
          }
        }
        
        // High priority and complex tasks completion increases focus score
        if (priority === 'high') {
          agentMetrics.focusScore += 2;
        } else if (complexity === 'high') {
          agentMetrics.focusScore += 1;
        }
      }
    } else if (lowerStatus === 'pending' || lowerStatus === 'backlog' || lowerStatus === 'todo' || lowerStatus === 'to do' || lowerStatus === 'new') {
      pendingCount++;
      agentMetrics.tasksInProgress++;
    } else if (lowerStatus === 'in-progress' || lowerStatus === 'in progress' || lowerStatus === 'active' || lowerStatus === 'started' || lowerStatus === 'working') {
      inProgressCount++;
      agentMetrics.tasksInProgress++;
      
      // Update last active date if this task has recent activity
      if (task.updatedAt) {
        const activeDate = new Date(task.updatedAt);
        if (!agentMetrics.lastActiveDate || activeDate > agentMetrics.lastActiveDate) {
          agentMetrics.lastActiveDate = activeDate;
        }
      }
    } else {
      // Handle other statuses like 'deferred' or 'blocked' as in-progress by default
      otherStatusCount++;
      otherStatuses.add(taskStatus);
      agentMetrics.tasksInProgress++; // Count as in-progress by default
    }
  });
  
  console.log('Task processing statistics:');
  console.log(`- Tasks successfully assigned and counted: ${taskAssignmentCount}`);
  console.log(`- Tasks skipped: ${tasksSkipped}`);
  console.log('Task status counts:');
  console.log(`- Done: ${doneCount}`);
  console.log(`- Pending: ${pendingCount}`);
  console.log(`- In Progress: ${inProgressCount}`);
  console.log(`- Other statuses: ${otherStatusCount} (${Array.from(otherStatuses).join(', ')})`);
  
  // Calculate productivity percentages and advanced metrics
  metricsMap.forEach((metrics, id) => {
    // Calculate basic productivity percentage
    if (metrics.totalTasks > 0) {
      metrics.productivity = Math.round((metrics.tasksCompleted / metrics.totalTasks) * 100);
    } else {
      // If no tasks, productivity is 0%
      metrics.productivity = 0;
    }
    
    // Calculate completion rate (tasks completed per day)
    // Use the timeRange to estimate the period duration in days
    let periodDays;
    switch(timeRange) {
      case 'day': periodDays = 1; break;
      case 'week': periodDays = 7; break;
      case 'month': periodDays = 30; break;
      case 'quarter': periodDays = 90; break;
      default: periodDays = 7; // Default to week
    }
    
    metrics.completionRate = periodDays > 0 ? 
      parseFloat((metrics.tasksCompleted / periodDays).toFixed(2)) : 0;
    
    // Calculate efficiency score based on resolution time and complexity
    // Lower resolution time = higher efficiency
    if (metrics.tasksCompleted > 0) {
      // Base efficiency on inverse of resolution time (faster = more efficient)
      // Normalize to 0-100 scale with diminishing returns for very fast times
      if (metrics.avgResolutionTime > 0) {
        // Efficiency formula: 100 * (1 - min(avgTime, 14) / 14)
        // This gives 100% for immediate completion, scaling down to 0% for 14+ days
        const cappedTime = Math.min(metrics.avgResolutionTime, 14); // Cap at 14 days
        metrics.efficiency = Math.round(100 * (1 - cappedTime / 14));
      } else {
        metrics.efficiency = 100; // If we can't calculate, assume perfect efficiency
      }
    } else {
      metrics.efficiency = 0;
    }
    
    // Normalize focus score based on total tasks and high-priority tasks completed
    if (metrics.totalTasks > 0) {
      // Cap focus score at max of 100
      metrics.focusScore = Math.min(Math.round((metrics.focusScore / metrics.totalTasks) * 50), 100);
      
      // Boost focus score if proportion of high priority tasks is high
      const highPriorityRatio = metrics.tasksByPriority.high / metrics.totalTasks;
      if (highPriorityRatio > 0.5) {
        metrics.focusScore += 20; // Bonus for focusing on high priority tasks
      }
      
      metrics.focusScore = Math.min(metrics.focusScore, 100); // Cap at 100
    } else {
      metrics.focusScore = 0;
    }
    
    // Calculate average task complexity (weighted score)
    if (metrics.totalTasks > 0) {
      const weightedComplexity = 
        (metrics.tasksByComplexity.low * 1 + 
         metrics.tasksByComplexity.medium * 2 + 
         metrics.tasksByComplexity.high * 3) / metrics.totalTasks;
      
      metrics.avgTaskComplexity = parseFloat(weightedComplexity.toFixed(1));
    }
    
    // Log the enhanced metrics
    console.log(`Agent ${id}: ${metrics.tasksCompleted} completed, ${metrics.tasksInProgress} in progress, ` + 
      `${metrics.totalTasks} total, ${metrics.productivity}% productivity, ` + 
      `${metrics.efficiency}% efficiency, ${metrics.focusScore}% focus score`);
  });
  
  console.log(`Calculated performance metrics for ${metricsMap.size} team members based on ${taskData.length} tasks`);
  console.log('===============================================================================\n');
  
  // Convert map to array
  return Array.from(metricsMap.values());
}

/**
 * Merge agent profiles with performance metrics
 * @param {Array} profiles - Array of agent profile objects
 * @param {Array} metrics - Array of performance metric objects
 * @returns {Array} - Array of merged profile and metric objects
 */
function mergeProfilesWithMetrics(profiles, metrics) {
  console.log('\n=================== MERGING PROFILES WITH METRICS ===================');
  console.log(`Input: ${profiles.length} profiles, ${metrics.length} metrics`);
  
  if (!profiles || profiles.length === 0) {
    console.warn('No agent profiles found.');
    return [];
  }
  
  if (!metrics || metrics.length === 0) {
    console.log('No metrics found. Returning profiles with zero values.');
    return profiles.map(profile => ({
      ...profile,
      tasksCompleted: 0,
      tasksInProgress: 0,
      productivity: 0
    }));
  }
  
  // Create maps for quick lookup
  const metricsMap = {};
  metrics.forEach(metric => {
    if (metric.id) {
      metricsMap[metric.id] = metric;
    }
  });
  
  console.log(`Metrics map contains ${Object.keys(metricsMap).length} entries`);
  console.log('Available metric IDs:', Object.keys(metricsMap).join(', '));
  console.log('Available profile IDs:', profiles.map(p => p.id).join(', '));
  
  // Merge profiles with metrics
  const result = profiles.map(profile => {
    const agentMetrics = metricsMap[profile.id] || {
      tasksCompleted: 0,
      tasksInProgress: 0,
      productivity: 0
    };
    
    const mergedData = {
      ...profile,
      tasksCompleted: agentMetrics.tasksCompleted || 0,
      tasksInProgress: agentMetrics.tasksInProgress || 0,
      productivity: agentMetrics.productivity || 0
    };
    
    console.log(`Profile ${profile.id} merged with metrics: completed=${mergedData.tasksCompleted}, inProgress=${mergedData.tasksInProgress}, productivity=${mergedData.productivity}%`);
    return mergedData;
  });
  
  console.log(`Returned ${result.length} merged profiles+metrics entries`);
  console.log('==============================================================\n');
  return result;
}

// Export the router for use in app.js

export default router;
