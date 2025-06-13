/**
 * React hooks for Undo/Redo Manager
 * Provides state management and command handling for reversible operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import undoRedoManager from '../services/undoRedoManager';

/**
 * Main undo/redo hook
 */
export function useUndoRedo() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [nextUndoDescription, setNextUndoDescription] = useState(null);
  const [nextRedoDescription, setNextRedoDescription] = useState(null);
  const listenerIdRef = useRef(`undo_${Date.now()}`);

  useEffect(() => {
    const listenerId = listenerIdRef.current;
    
    undoRedoManager.addListener(listenerId, handleUndoRedoEvent);
    
    updateState();
    
    return () => {
      undoRedoManager.removeListener(listenerId);
    };
  }, []);

  const handleUndoRedoEvent = useCallback((event, data) => {
    switch (event) {
      case 'commandExecuted':
      case 'commandUndone':
      case 'commandRedone':
        setCanUndo(data.canUndo);
        setCanRedo(data.canRedo);
        setError(null);
        updateState();
        break;
      
      case 'commandError':
        setError(data.error);
        setIsExecuting(false);
        break;
      
      case 'historyCleared':
        setCanUndo(false);
        setCanRedo(false);
        setNextUndoDescription(null);
        setNextRedoDescription(null);
        updateState();
        break;
      
      case 'keyboardShortcutsChanged':
      case 'maxHistorySizeChanged':
        updateState();
        break;
    }
  }, []);

  const updateState = useCallback(() => {
    setCanUndo(undoRedoManager.canUndo());
    setCanRedo(undoRedoManager.canRedo());
    setNextUndoDescription(undoRedoManager.getNextUndoDescription());
    setNextRedoDescription(undoRedoManager.getNextRedoDescription());
    setStatistics(undoRedoManager.getStatistics());
  }, []);

  const executeCommand = useCallback(async (command) => {
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await undoRedoManager.executeCommand(command);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const undo = useCallback(async () => {
    if (!canUndo || isExecuting) return;
    
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await undoRedoManager.undo();
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [canUndo, isExecuting]);

  const redo = useCallback(async () => {
    if (!canRedo || isExecuting) return;
    
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await undoRedoManager.redo();
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [canRedo, isExecuting]);

  const clearHistory = useCallback(() => {
    undoRedoManager.clearHistory();
  }, []);

  const setKeyboardShortcutsEnabled = useCallback((enabled) => {
    undoRedoManager.setKeyboardShortcutsEnabled(enabled);
  }, []);

  const setMaxHistorySize = useCallback((size) => {
    undoRedoManager.setMaxHistorySize(size);
  }, []);

  return {
    // State
    canUndo,
    canRedo,
    isExecuting,
    error,
    statistics,
    nextUndoDescription,
    nextRedoDescription,
    
    // Actions
    executeCommand,
    undo,
    redo,
    clearHistory,
    setKeyboardShortcutsEnabled,
    setMaxHistorySize,
    
    // Utilities
    clearError: () => setError(null),
    updateState
  };
}

/**
 * Hook for creating and managing task commands
 */
export function useTaskCommands() {
  const { executeCommand } = useUndoRedo();

  const createTaskCommand = useCallback((taskData, onExecute, onUndo) => {
    return undoRedoManager.createTaskCommand(taskData, onExecute, onUndo);
  }, []);

  const createUpdateCommand = useCallback((taskId, newData, oldData, onExecute, onUndo) => {
    return undoRedoManager.createUpdateCommand(taskId, newData, oldData, onExecute, onUndo);
  }, []);

  const createDeleteCommand = useCallback((taskId, taskData, onExecute, onUndo) => {
    return undoRedoManager.createDeleteCommand(taskId, taskData, onExecute, onUndo);
  }, []);

  const createStatusCommand = useCallback((taskId, newStatus, oldStatus, onExecute, onUndo) => {
    return undoRedoManager.createStatusCommand(taskId, newStatus, oldStatus, onExecute, onUndo);
  }, []);

  const createBatchCommand = useCallback((commands, description) => {
    return undoRedoManager.createBatchCommand(commands, description);
  }, []);

  const executeTaskCreate = useCallback(async (taskData, onExecute, onUndo) => {
    const command = createTaskCommand(taskData, onExecute, onUndo);
    return await executeCommand(command);
  }, [createTaskCommand, executeCommand]);

  const executeTaskUpdate = useCallback(async (taskId, newData, oldData, onExecute, onUndo) => {
    const command = createUpdateCommand(taskId, newData, oldData, onExecute, onUndo);
    return await executeCommand(command);
  }, [createUpdateCommand, executeCommand]);

  const executeTaskDelete = useCallback(async (taskId, taskData, onExecute, onUndo) => {
    const command = createDeleteCommand(taskId, taskData, onExecute, onUndo);
    return await executeCommand(command);
  }, [createDeleteCommand, executeCommand]);

  const executeStatusChange = useCallback(async (taskId, newStatus, oldStatus, onExecute, onUndo) => {
    const command = createStatusCommand(taskId, newStatus, oldStatus, onExecute, onUndo);
    return await executeCommand(command);
  }, [createStatusCommand, executeCommand]);

  const executeBatch = useCallback(async (commands, description) => {
    const batchCommand = createBatchCommand(commands, description);
    return await executeCommand(batchCommand);
  }, [createBatchCommand, executeCommand]);

  return {
    // Command creators
    createTaskCommand,
    createUpdateCommand,
    createDeleteCommand,
    createStatusCommand,
    createBatchCommand,
    
    // Execute helpers
    executeTaskCreate,
    executeTaskUpdate,
    executeTaskDelete,
    executeStatusChange,
    executeBatch
  };
}

/**
 * Hook for undo/redo history management
 */
export function useUndoRedoHistory() {
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const listenerIdRef = useRef(`history_${Date.now()}`);

  useEffect(() => {
    const listenerId = listenerIdRef.current;
    
    undoRedoManager.addListener(listenerId, (event) => {
      if (['commandExecuted', 'commandUndone', 'commandRedone', 'historyCleared'].includes(event)) {
        updateHistory();
      }
    });
    
    updateHistory();
    
    return () => {
      undoRedoManager.removeListener(listenerId);
    };
  }, []);

  const updateHistory = useCallback(() => {
    setUndoHistory(undoRedoManager.getUndoHistory());
    setRedoHistory(undoRedoManager.getRedoHistory());
  }, []);

  const getFormattedHistory = useCallback(() => {
    return {
      undo: undoHistory.map(cmd => ({
        ...cmd,
        formattedTime: new Date(cmd.timestamp).toLocaleTimeString(),
        formattedDate: new Date(cmd.timestamp).toLocaleDateString(),
        age: Date.now() - cmd.timestamp
      })),
      redo: redoHistory.map(cmd => ({
        ...cmd,
        formattedTime: new Date(cmd.timestamp).toLocaleTimeString(),
        formattedDate: new Date(cmd.timestamp).toLocaleDateString(),
        age: Date.now() - cmd.timestamp
      }))
    };
  }, [undoHistory, redoHistory]);

  return {
    undoHistory,
    redoHistory,
    updateHistory,
    getFormattedHistory
  };
}

/**
 * Hook for keyboard shortcuts management
 */
export function useUndoRedoKeyboard() {
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const toggleShortcuts = useCallback(() => {
    const newEnabled = !shortcutsEnabled;
    setShortcutsEnabled(newEnabled);
    undoRedoManager.setKeyboardShortcutsEnabled(newEnabled);
  }, [shortcutsEnabled]);

  const handleKeyDown = useCallback((event) => {
    if (!shortcutsEnabled) return;
    
    // Ctrl+Z or Cmd+Z for undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (canUndo) {
        undo();
      }
      return;
    }
    
    // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
    if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z')) {
      event.preventDefault();
      if (canRedo) {
        redo();
      }
      return;
    }
  }, [shortcutsEnabled, canUndo, canRedo, undo, redo]);

  return {
    shortcutsEnabled,
    toggleShortcuts,
    handleKeyDown
  };
}

/**
 * Hook for managing undo/redo with React state
 */
export function useUndoRedoState(initialValue) {
  const [value, setValue] = useState(initialValue);
  const [history, setHistory] = useState([initialValue]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const updateValue = useCallback((newValue, description = 'State change') => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newValue);
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setValue(newValue);
  }, [history, currentIndex]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setValue(history[newIndex]);
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setValue(history[newIndex]);
  }, [canRedo, currentIndex, history]);

  const reset = useCallback((newInitialValue = initialValue) => {
    setValue(newInitialValue);
    setHistory([newInitialValue]);
    setCurrentIndex(0);
  }, [initialValue]);

  const getHistoryInfo = useCallback(() => {
    return {
      totalSteps: history.length,
      currentStep: currentIndex + 1,
      canUndo,
      canRedo,
      history: history.map((item, index) => ({
        value: item,
        isCurrent: index === currentIndex,
        index
      }))
    };
  }, [history, currentIndex, canUndo, canRedo]);

  return {
    value,
    setValue: updateValue,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    getHistoryInfo
  };
} 