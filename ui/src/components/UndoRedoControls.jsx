/**
 * Undo/Redo Controls Component
 * Provides UI controls for undo/redo operations with keyboard shortcuts
 */

import React, { useState, useEffect } from 'react';
import { useUndoRedo, useUndoRedoHistory, useUndoRedoKeyboard } from '../hooks/useUndoRedo';
import './UndoRedoControls.css';

const UndoRedoControls = ({ 
  className = '',
  showHistory = false,
  showKeyboardHints = true,
  position = 'top-right' // top-right, top-left, bottom-right, bottom-left, inline
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    canUndo,
    canRedo,
    isExecuting,
    error,
    statistics,
    nextUndoDescription,
    nextRedoDescription,
    undo,
    redo,
    clearHistory,
    setKeyboardShortcutsEnabled,
    setMaxHistorySize,
    clearError
  } = useUndoRedo();

  const {
    undoHistory,
    redoHistory,
    getFormattedHistory
  } = useUndoRedoHistory();

  const {
    shortcutsEnabled,
    toggleShortcuts
  } = useUndoRedoKeyboard();

  const formattedHistory = getFormattedHistory();

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleUndoClick = async () => {
    try {
      await undo();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  const handleRedoClick = async () => {
    try {
      await redo();
    } catch (error) {
      console.error('Redo failed:', error);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the undo/redo history? This cannot be undone.')) {
      clearHistory();
      setShowHistoryDropdown(false);
    }
  };

  const handleMaxHistorySizeChange = (event) => {
    const size = parseInt(event.target.value, 10);
    if (size > 0) {
      setMaxHistorySize(size);
    }
  };

  const getControlsClassName = () => {
    const baseClass = 'undo-redo-controls';
    const positionClass = position === 'inline' ? '' : `undo-redo-controls--${position}`;
    return `${baseClass} ${positionClass} ${className}`.trim();
  };

  return (
    <div className={getControlsClassName()}>
      {/* Error Display */}
      {error && (
        <div className="undo-redo-error">
          <span>⚠️ {error}</span>
          <button onClick={clearError} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Main Controls */}
      <div className="undo-redo-buttons">
        <button
          className={`undo-button ${canUndo ? 'enabled' : 'disabled'}`}
          onClick={handleUndoClick}
          disabled={!canUndo || isExecuting}
          title={nextUndoDescription ? `Undo: ${nextUndoDescription}` : 'Nothing to undo'}
          aria-label={`Undo ${nextUndoDescription || ''}`}
        >
          <span className="button-icon">↶</span>
          {showKeyboardHints && <span className="keyboard-hint">Ctrl+Z</span>}
        </button>

        <button
          className={`redo-button ${canRedo ? 'enabled' : 'disabled'}`}
          onClick={handleRedoClick}
          disabled={!canRedo || isExecuting}
          title={nextRedoDescription ? `Redo: ${nextRedoDescription}` : 'Nothing to redo'}
          aria-label={`Redo ${nextRedoDescription || ''}`}
        >
          <span className="button-icon">↷</span>
          {showKeyboardHints && <span className="keyboard-hint">Ctrl+Y</span>}
        </button>

        {/* History Dropdown Toggle */}
        {showHistory && (
          <button
            className={`history-button ${showHistoryDropdown ? 'active' : ''}`}
            onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
            title="Show history"
            aria-label="Show undo/redo history"
          >
            <span className="button-icon">📋</span>
          </button>
        )}

        {/* Settings Toggle */}
        <button
          className={`settings-button ${showSettings ? 'active' : ''}`}
          onClick={() => setShowSettings(!showSettings)}
          title="Undo/Redo settings"
          aria-label="Undo/Redo settings"
        >
          <span className="button-icon">⚙️</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isExecuting && (
        <div className="execution-indicator">
          <span className="spinner">⏳</span>
          <span>Processing...</span>
        </div>
      )}

      {/* Statistics Display */}
      {statistics && (
        <div className="undo-redo-stats">
          <span className="stat-item" title="Total commands in history">
            📊 {statistics.totalCommands}
          </span>
          <span className="stat-item" title="Commands today">
            📅 {statistics.todayCommands}
          </span>
        </div>
      )}

      {/* History Dropdown */}
      {showHistory && showHistoryDropdown && (
        <div className="history-dropdown">
          <div className="history-header">
            <h4>Command History</h4>
            <button
              onClick={handleClearHistory}
              className="clear-history-button"
              disabled={undoHistory.length === 0 && redoHistory.length === 0}
              title="Clear all history"
            >
              🗑️
            </button>
          </div>

          <div className="history-content">
            {/* Undo History */}
            {formattedHistory.undo.length > 0 && (
              <div className="history-section">
                <h5>Undo History ({formattedHistory.undo.length})</h5>
                <div className="history-list">
                  {formattedHistory.undo.slice(0, 10).map((cmd, index) => (
                    <div key={cmd.id} className="history-item undo-item">
                      <div className="history-item-content">
                        <span className="history-description">{cmd.description}</span>
                        <span className="history-time">{formatTimeAgo(cmd.timestamp)}</span>
                      </div>
                      <span className="history-type">{cmd.type.replace('Command', '')}</span>
                    </div>
                  ))}
                  {formattedHistory.undo.length > 10 && (
                    <div className="history-more">
                      +{formattedHistory.undo.length - 10} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Redo History */}
            {formattedHistory.redo.length > 0 && (
              <div className="history-section">
                <h5>Redo History ({formattedHistory.redo.length})</h5>
                <div className="history-list">
                  {formattedHistory.redo.slice(0, 10).map((cmd, index) => (
                    <div key={cmd.id} className="history-item redo-item">
                      <div className="history-item-content">
                        <span className="history-description">{cmd.description}</span>
                        <span className="history-time">{formatTimeAgo(cmd.timestamp)}</span>
                      </div>
                      <span className="history-type">{cmd.type.replace('Command', '')}</span>
                    </div>
                  ))}
                  {formattedHistory.redo.length > 10 && (
                    <div className="history-more">
                      +{formattedHistory.redo.length - 10} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {formattedHistory.undo.length === 0 && formattedHistory.redo.length === 0 && (
              <div className="history-empty">
                <p>No command history</p>
                <span>Perform some actions to see them here</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h4>Undo/Redo Settings</h4>
            <button
              onClick={() => setShowSettings(false)}
              className="close-settings-button"
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={shortcutsEnabled}
                  onChange={toggleShortcuts}
                  className="setting-checkbox"
                />
                <span>Enable keyboard shortcuts</span>
              </label>
              <div className="setting-description">
                Use Ctrl+Z/Ctrl+Y for undo/redo
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                Max history size:
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={statistics?.maxHistorySize || 100}
                  onChange={handleMaxHistorySizeChange}
                  className="setting-number-input"
                />
              </label>
              <div className="setting-description">
                Maximum number of commands to remember
              </div>
            </div>

            {statistics && (
              <div className="setting-item">
                <div className="statistics-display">
                  <h5>Statistics</h5>
                  <div className="stat-grid">
                    <div className="stat">
                      <span className="stat-label">Total Commands:</span>
                      <span className="stat-value">{statistics.totalCommands}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Recent (1h):</span>
                      <span className="stat-value">{statistics.recentCommands}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Today:</span>
                      <span className="stat-value">{statistics.todayCommands}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Redo Available:</span>
                      <span className="stat-value">{statistics.redoCommands}</span>
                    </div>
                  </div>
                  
                  {statistics.commandTypes && Object.keys(statistics.commandTypes).length > 0 && (
                    <div className="command-types">
                      <h6>Command Types:</h6>
                      {Object.entries(statistics.commandTypes).map(([type, count]) => (
                        <div key={type} className="command-type-stat">
                          <span>{type.replace('Command', '')}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {(showHistoryDropdown || showSettings) && (
        <div
          className="overlay-backdrop"
          onClick={() => {
            setShowHistoryDropdown(false);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
};

export default UndoRedoControls; 