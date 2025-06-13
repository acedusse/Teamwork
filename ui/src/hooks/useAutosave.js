import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for implementing autosave functionality with debouncing
 * @param {Object} options - Configuration options
 * @param {*} options.data - The data to autosave
 * @param {Function} options.onSave - Function to call when saving (should return a Promise)
 * @param {number} options.delay - Debounce delay in milliseconds (default: 2000)
 * @param {boolean} options.enabled - Whether autosave is enabled (default: true)
 * @param {*} options.initialData - Initial data to compare against for detecting changes
 * @param {Function} options.onError - Error callback
 * @param {Function} options.onSuccess - Success callback
 * @returns {Object} Autosave state and controls
 */
export const useAutosave = ({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  initialData = null,
  onError = null,
  onSuccess = null,
  skipEmptyData = true
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const autosaveTimeoutRef = useRef(null);
  const lastDataRef = useRef(initialData);
  const isFirstRender = useRef(true);

  // Check if data has changed
  const hasDataChanged = useCallback(() => {
    if (data === lastDataRef.current) return false;
    if (initialData !== null && data === initialData) return false;
    if (skipEmptyData && (!data || (typeof data === 'string' && !data.trim()))) return false;
    return true;
  }, [data, initialData, skipEmptyData]);

  // Manual save function
  const save = useCallback(async (isAutoSave = false) => {
    if (!onSave || isSaving) return;

    // Skip if data is empty and skipEmptyData is true
    if (skipEmptyData && (!data || (typeof data === 'string' && !data.trim()))) {
      setSaveError('Cannot save empty data');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(data, isAutoSave);
      setIsSaved(true);
      setLastSaved(new Date());
      lastDataRef.current = data;
      
      if (onSuccess) {
        onSuccess(data, isAutoSave);
      }
    } catch (error) {
      setSaveError(error.message || 'Save failed');
      setIsSaved(false);
      
      if (onError) {
        onError(error, data, isAutoSave);
      }
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, isSaving, skipEmptyData, onSuccess, onError]);

  // Auto-save effect
  useEffect(() => {
    // Skip on first render to avoid saving initial data
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled || !hasDataChanged()) {
      return;
    }

    setIsSaved(false);
    setSaveError(null);

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for autosave
    autosaveTimeoutRef.current = setTimeout(() => {
      save(true); // isAutoSave = true
    }, delay);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [data, enabled, delay, hasDataChanged, save]);

  // Force save (bypass debouncing)
  const forceSave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    return save(false);
  }, [save]);

  // Reset saved state (useful when data changes externally)
  const resetSavedState = useCallback(() => {
    setIsSaved(true);
    setSaveError(null);
    lastDataRef.current = data;
    setLastSaved(new Date());
  }, [data]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = !isSaved && hasDataChanged();

  return {
    // State
    isSaving,
    isSaved,
    hasUnsavedChanges,
    lastSaved,
    saveError,
    
    // Actions
    save: forceSave,
    resetSavedState,
    
    // Computed state
    saveStatus: isSaving ? 'saving' : (isSaved ? 'saved' : 'unsaved'),
    canSave: !isSaving && hasDataChanged()
  };
}; 