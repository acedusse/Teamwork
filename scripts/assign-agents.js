// assign-agents.js - Utility script to assign agents to tasks
// Compatible with TaskMaster workflow

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readJSON, writeJSON } from './modules/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const TASKS_FILE = path.join(__dirname, '../.taskmaster/tasks/tasks.json');
const AGENTS_FILE = path.join(__dirname, '../.taskmaster/agents.json');

// Default agents if none exist
const DEFAULT_AGENTS = [
  { id: 'agent1', name: 'Alex Chen', role: 'Senior Developer', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 'agent2', name: 'Samira Patel', role: 'DevOps Engineer', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: 'agent3', name: 'Jordan Rivera', role: 'Junior Developer', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: 'agent4', name: 'Taylor Kim', role: 'Designer', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: 'agent5', name: 'Morgan Singh', role: 'Project Manager', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' }
];

// Load tasks
function loadTasks() {
  console.log(`Loading tasks from ${TASKS_FILE}`);
  try {
    const data = readJSON(TASKS_FILE);
    if (!data || !Array.isArray(data.tasks)) {
      console.error('Invalid or empty tasks data');
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return null;
  }
}

// Save tasks
function saveTasks(data) {
  console.log(`Saving tasks to ${TASKS_FILE}`);
  try {
    writeJSON(TASKS_FILE, data);
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
}

// Load or create agents
function loadOrCreateAgents() {
  console.log(`Loading agents from ${AGENTS_FILE}`);
  try {
    let agents = [];
    if (fs.existsSync(AGENTS_FILE)) {
      const data = readJSON(AGENTS_FILE);
      agents = data?.agents || [];
    }
    
    if (!agents || agents.length === 0) {
      console.log('No agents found, using default agents');
      agents = DEFAULT_AGENTS;
      
      // Save default agents
      writeJSON(AGENTS_FILE, { agents });
    }
    
    return agents;
  } catch (error) {
    console.error('Error loading agents:', error);
    return DEFAULT_AGENTS;
  }
}

// Assign agents to tasks
function assignAgentsToTasks() {
  // Load data
  const tasksData = loadTasks();
  if (!tasksData) return false;
  
  const agents = loadOrCreateAgents();
  if (!agents || agents.length === 0) {
    console.error('No agents available for assignment');
    return false;
  }
  
  console.log(`Found ${agents.length} agents for assignment`);
  
  // Count tasks before assignment
  let tasksWithAssignees = 0;
  tasksData.tasks.forEach(task => {
    if (task.assignee) tasksWithAssignees++;
  });
  
  console.log(`Found ${tasksData.tasks.length} tasks total, ${tasksWithAssignees} with assignees`);
  
  // Assign agents to tasks without assignees
  let assignedCount = 0;
  tasksData.tasks = tasksData.tasks.map(task => {
    if (!task.assignee) {
      // Deterministic assignment based on task ID
      const agentIndex = (task.id % agents.length);
      const agent = agents[agentIndex];
      
      assignedCount++;
      return {
        ...task,
        assignee: agent.id || agent.name,
        updatedAt: new Date().toISOString()
      };
    }
    return task;
  });
  
  console.log(`Assigned agents to ${assignedCount} tasks`);
  
  // Save updated tasks
  if (saveTasks(tasksData)) {
    console.log('Successfully saved task assignments');
    return true;
  }
  
  return false;
}

// Execute the assignment
console.log('Starting agent assignment process...');
if (assignAgentsToTasks()) {
  console.log('✓ Successfully assigned agents to tasks');
  process.exit(0);
} else {
  console.error('✗ Failed to assign agents to tasks');
  process.exit(1);
}
