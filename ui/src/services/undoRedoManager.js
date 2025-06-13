/**
 * Undo/Redo Manager
 * Implements command pattern for reversible operations
 * Handles operation history, keyboard shortcuts, and state management
 */

import dataBackupManager from './dataBackupManager';

/**
 * Base Command class
 */
class Command {
  constructor(description = '') {
    this.id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.description = description;
    this.timestamp = Date.now();
    this.executed = false;
    this.undone = false;
  }

  /**
   * Execute the command
   * @returns {Promise<any>} Execution result
   */
  async execute() {
    throw new Error('Execute method must be implemented');
  }

  /**
   * Undo the command
   * @returns {Promise<any>} Undo result
   */
  async undo() {
    throw new Error('Undo method must be implemented');
  }

  /**
   * Get command summary
   * @returns {Object} Command summary
   */
  getSummary() {
    return {
      id: this.id,
      description: this.description,
      timestamp: this.timestamp,
      executed: this.executed,
      undone: this.undone,
      type: this.constructor.name
    };
  }
}

/**
 * Task Create Command
 */
class CreateTaskCommand extends Command {
  constructor(taskData, onExecute, onUndo) {
    super(`Create task: ${taskData.title || 'Untitled'}`);
    this.taskData = taskData;
    this.onExecute = onExecute;
    this.onUndo = onUndo;
    this.createdTaskId = null;
  }

  async execute() {
    try {
      const result = await this.onExecute(this.taskData);
      this.createdTaskId = result?.id || result;
      this.executed = true;
      return result;
    } catch (error) {
      console.error('Failed to execute CreateTaskCommand:', error);
      throw error;
    }
  }

  async undo() {
    if (!this.executed || !this.createdTaskId) {
      throw new Error('Cannot undo: command not executed or no task ID');
    }

    try {
      const result = await this.onUndo(this.createdTaskId);
      this.undone = true;
      return result;
    } catch (error) {
      console.error('Failed to undo CreateTaskCommand:', error);
      throw error;
    }
  }
}

/**
 * Task Update Command
 */
class UpdateTaskCommand extends Command {
  constructor(taskId, newData, oldData, onExecute, onUndo) {
    super(`Update task: ${taskId}`);
    this.taskId = taskId;
    this.newData = newData;
    this.oldData = oldData;
    this.onExecute = onExecute;
    this.onUndo = onUndo;
  }

  async execute() {
    try {
      const result = await this.onExecute(this.taskId, this.newData);
      this.executed = true;
      return result;
    } catch (error) {
      console.error('Failed to execute UpdateTaskCommand:', error);
      throw error;
    }
  }

  async undo() {
    if (!this.executed) {
      throw new Error('Cannot undo: command not executed');
    }

    try {
      const result = await this.onUndo(this.taskId, this.oldData);
      this.undone = true;
      return result;
    } catch (error) {
      console.error('Failed to undo UpdateTaskCommand:', error);
      throw error;
    }
  }
}

/**
 * Task Delete Command
 */
class DeleteTaskCommand extends Command {
  constructor(taskId, taskData, onExecute, onUndo) {
    super(`Delete task: ${taskId}`);
    this.taskId = taskId;
    this.taskData = taskData; // Store original data for undo
    this.onExecute = onExecute;
    this.onUndo = onUndo;
  }

  async execute() {
    try {
      const result = await this.onExecute(this.taskId);
      this.executed = true;
      return result;
    } catch (error) {
      console.error('Failed to execute DeleteTaskCommand:', error);
      throw error;
    }
  }

  async undo() {
    if (!this.executed) {
      throw new Error('Cannot undo: command not executed');
    }

    try {
      const result = await this.onUndo(this.taskData);
      this.undone = true;
      return result;
    } catch (error) {
      console.error('Failed to undo DeleteTaskCommand:', error);
      throw error;
    }
  }
}

/**
 * Task Status Change Command
 */
class ChangeStatusCommand extends Command {
  constructor(taskId, newStatus, oldStatus, onExecute, onUndo) {
    super(`Change status: ${taskId} to ${newStatus}`);
    this.taskId = taskId;
    this.newStatus = newStatus;
    this.oldStatus = oldStatus;
    this.onExecute = onExecute;
    this.onUndo = onUndo;
  }

  async execute() {
    try {
      const result = await this.onExecute(this.taskId, this.newStatus);
      this.executed = true;
      return result;
    } catch (error) {
      console.error('Failed to execute ChangeStatusCommand:', error);
      throw error;
    }
  }

  async undo() {
    if (!this.executed) {
      throw new Error('Cannot undo: command not executed');
    }

    try {
      const result = await this.onUndo(this.taskId, this.oldStatus);
      this.undone = true;
      return result;
    } catch (error) {
      console.error('Failed to undo ChangeStatusCommand:', error);
      throw error;
    }
  }
}

/**
 * Batch Command - Execute multiple commands as one unit
 */
class BatchCommand extends Command {
  constructor(commands, description = 'Batch operation') {
    super(description);
    this.commands = commands;
    this.executedCommands = [];
  }

  async execute() {
    this.executedCommands = [];
    
    for (const command of this.commands) {
      try {
        await command.execute();
        this.executedCommands.push(command);
      } catch (error) {
        // If one command fails, undo all previously executed commands
        await this.undoExecutedCommands();
        throw error;
      }
    }
    
    this.executed = true;
    return this.executedCommands.length;
  }

  async undo() {
    if (!this.executed) {
      throw new Error('Cannot undo: batch command not executed');
    }

    await this.undoExecutedCommands();
    this.undone = true;
    return this.executedCommands.length;
  }

  async undoExecutedCommands() {
    // Undo in reverse order
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      try {
        await this.executedCommands[i].undo();
      } catch (error) {
        console.error('Failed to undo command in batch:', error);
      }
    }
  }

  getSummary() {
    return {
      ...super.getSummary(),
      commandCount: this.commands.length,
      executedCount: this.executedCommands.length
    };
  }
}

/**
 * Main Undo/Redo Manager
 */
class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = 100;
    this.listeners = new Map();
    this.keyboardShortcutsEnabled = true;
    this.isExecuting = false; // Prevent infinite loops
    
    this.init();
  }

  init() {
    // Set up keyboard shortcuts
    if (typeof window !== 'undefined') {
      this.setupKeyboardShortcuts();
    }
    
    // Create periodic backup of history
    setInterval(() => {
      this.backupHistory();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Set up keyboard shortcuts for undo/redo
   */
  setupKeyboardShortcuts() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', (event) => {
      if (!this.keyboardShortcutsEnabled) return;
      
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      
      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
          ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        this.redo();
        return;
      }
    });
  }

  /**
   * Execute a command and add it to history
   * @param {Command} command - Command to execute
   * @returns {Promise<any>} Execution result
   */
  async executeCommand(command) {
    if (this.isExecuting) return; // Prevent nested execution
    
    this.isExecuting = true;
    
    try {
      const result = await command.execute();
      
      // Add to undo stack
      this.undoStack.push(command);
      
      // Clear redo stack (new action invalidates redo history)
      this.redoStack = [];
      
      // Limit history size
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }
      
      // Notify listeners
      this.notifyListeners('commandExecuted', {
        command: command.getSummary(),
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      return result;
    } catch (error) {
      console.error('Failed to execute command:', error);
      this.notifyListeners('commandError', {
        command: command.getSummary(),
        error: error.message,
        type: 'execute'
      });
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Undo the last command
   * @returns {Promise<any>} Undo result
   */
  async undo() {
    if (!this.canUndo() || this.isExecuting) return;
    
    this.isExecuting = true;
    
    try {
      const command = this.undoStack.pop();
      const result = await command.undo();
      
      // Add to redo stack
      this.redoStack.push(command);
      
      // Notify listeners
      this.notifyListeners('commandUndone', {
        command: command.getSummary(),
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      return result;
    } catch (error) {
      console.error('Failed to undo command:', error);
      this.notifyListeners('commandError', {
        error: error.message,
        type: 'undo'
      });
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Redo the last undone command
   * @returns {Promise<any>} Redo result
   */
  async redo() {
    if (!this.canRedo() || this.isExecuting) return;
    
    this.isExecuting = true;
    
    try {
      const command = this.redoStack.pop();
      const result = await command.execute();
      
      // Add back to undo stack
      this.undoStack.push(command);
      
      // Notify listeners
      this.notifyListeners('commandRedone', {
        command: command.getSummary(),
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      return result;
    } catch (error) {
      console.error('Failed to redo command:', error);
      this.notifyListeners('commandError', {
        error: error.message,
        type: 'redo'
      });
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Check if undo is possible
   * @returns {boolean} Can undo
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is possible
   * @returns {boolean} Can redo
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get undo stack summary
   * @returns {Array} Undo stack summary
   */
  getUndoHistory() {
    return this.undoStack.map(command => command.getSummary());
  }

  /**
   * Get redo stack summary
   * @returns {Array} Redo stack summary
   */
  getRedoHistory() {
    return this.redoStack.map(command => command.getSummary());
  }

  /**
   * Get next undo command description
   * @returns {string|null} Next undo description
   */
  getNextUndoDescription() {
    if (!this.canUndo()) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  /**
   * Get next redo command description
   * @returns {string|null} Next redo description
   */
  getNextRedoDescription() {
    if (!this.canRedo()) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }

  /**
   * Clear all history
   */
  clearHistory() {
    const undoCount = this.undoStack.length;
    const redoCount = this.redoStack.length;
    
    this.undoStack = [];
    this.redoStack = [];
    
    this.notifyListeners('historyCleared', {
      undoCount,
      redoCount
    });
  }

  /**
   * Get history statistics
   * @returns {Object} History statistics
   */
  getStatistics() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const recentCommands = this.undoStack.filter(cmd => 
      now - cmd.timestamp < oneHour
    ).length;
    
    const todayCommands = this.undoStack.filter(cmd => 
      now - cmd.timestamp < oneDay
    ).length;
    
    const commandTypes = {};
    this.undoStack.forEach(cmd => {
      const type = cmd.constructor.name;
      commandTypes[type] = (commandTypes[type] || 0) + 1;
    });
    
    return {
      totalCommands: this.undoStack.length,
      redoCommands: this.redoStack.length,
      recentCommands,
      todayCommands,
      commandTypes,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      maxHistorySize: this.maxHistorySize,
      keyboardShortcutsEnabled: this.keyboardShortcutsEnabled
    };
  }

  /**
   * Backup history to storage
   */
  backupHistory() {
    try {
      const historyData = {
        undoStack: this.undoStack.map(cmd => cmd.getSummary()),
        redoStack: this.redoStack.map(cmd => cmd.getSummary()),
        timestamp: Date.now()
      };
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('taskmaster_undo_history', JSON.stringify(historyData));
      }
    } catch (error) {
      console.error('Failed to backup undo history:', error);
    }
  }

  /**
   * Restore history from storage
   */
  restoreHistory() {
    try {
      if (typeof localStorage === 'undefined') return;
      
      const stored = localStorage.getItem('taskmaster_undo_history');
      if (!stored) return;
      
      const historyData = JSON.parse(stored);
      
      // Note: We can only restore command summaries, not executable commands
      // This is mainly for displaying history, not for actual undo/redo
      this.notifyListeners('historyRestored', {
        undoCount: historyData.undoStack?.length || 0,
        redoCount: historyData.redoStack?.length || 0,
        timestamp: historyData.timestamp
      });
    } catch (error) {
      console.error('Failed to restore undo history:', error);
    }
  }

  /**
   * Enable/disable keyboard shortcuts
   * @param {boolean} enabled - Whether to enable shortcuts
   */
  setKeyboardShortcutsEnabled(enabled) {
    this.keyboardShortcutsEnabled = enabled;
    
    this.notifyListeners('keyboardShortcutsChanged', {
      enabled
    });
  }

  /**
   * Set maximum history size
   * @param {number} size - Maximum number of commands to keep
   */
  setMaxHistorySize(size) {
    this.maxHistorySize = Math.max(1, size);
    
    // Trim history if necessary
    while (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners('maxHistorySizeChanged', {
      size: this.maxHistorySize
    });
  }

  /**
   * Create a task creation command
   * @param {Object} taskData - Task data
   * @param {Function} onExecute - Execute function
   * @param {Function} onUndo - Undo function
   * @returns {CreateTaskCommand} Command instance
   */
  createTaskCommand(taskData, onExecute, onUndo) {
    return new CreateTaskCommand(taskData, onExecute, onUndo);
  }

  /**
   * Create a task update command
   * @param {string} taskId - Task ID
   * @param {Object} newData - New task data
   * @param {Object} oldData - Original task data
   * @param {Function} onExecute - Execute function
   * @param {Function} onUndo - Undo function
   * @returns {UpdateTaskCommand} Command instance
   */
  createUpdateCommand(taskId, newData, oldData, onExecute, onUndo) {
    return new UpdateTaskCommand(taskId, newData, oldData, onExecute, onUndo);
  }

  /**
   * Create a task deletion command
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Task data (for undo)
   * @param {Function} onExecute - Execute function
   * @param {Function} onUndo - Undo function
   * @returns {DeleteTaskCommand} Command instance
   */
  createDeleteCommand(taskId, taskData, onExecute, onUndo) {
    return new DeleteTaskCommand(taskId, taskData, onExecute, onUndo);
  }

  /**
   * Create a status change command
   * @param {string} taskId - Task ID
   * @param {string} newStatus - New status
   * @param {string} oldStatus - Old status
   * @param {Function} onExecute - Execute function
   * @param {Function} onUndo - Undo function
   * @returns {ChangeStatusCommand} Command instance
   */
  createStatusCommand(taskId, newStatus, oldStatus, onExecute, onUndo) {
    return new ChangeStatusCommand(taskId, newStatus, oldStatus, onExecute, onUndo);
  }

  /**
   * Create a batch command
   * @param {Array<Command>} commands - Commands to batch
   * @param {string} description - Batch description
   * @returns {BatchCommand} Batch command instance
   */
  createBatchCommand(commands, description) {
    return new BatchCommand(commands, description);
  }

  /**
   * Add event listener
   * @param {string} id - Listener ID
   * @param {Function} callback - Callback function
   */
  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  /**
   * Remove event listener
   * @param {string} id - Listener ID
   */
  removeListener(id) {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in undo/redo manager listener:', error);
      }
    });
  }
}

// Export command classes for external use
export {
  Command,
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  ChangeStatusCommand,
  BatchCommand
};

// Create and export singleton instance
const undoRedoManager = new UndoRedoManager();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.undoRedoManager = undoRedoManager;
}

export default undoRedoManager; 