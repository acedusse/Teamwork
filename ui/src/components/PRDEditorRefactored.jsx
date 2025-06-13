import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as BulletIcon,
  FormatListNumbered as NumberedIcon,
  Code as CodeIcon,
  Undo as UndoIcon,
  Redo as RedoIcon
} from '@mui/icons-material';

// Import our new autosave system
import { useAutosave } from '../hooks/useAutosave';
import autosaveService from '../services/autosaveService';
import AutosaveIndicator, { AutosaveStatus, SaveButton } from './AutosaveIndicator';

const MARKDOWN_SHORTCUTS = [
  { label: '# Heading 1', value: '# ' },
  { label: '## Heading 2', value: '## ' },
  { label: '### Heading 3', value: '### ' },
  { label: '**Bold**', value: '**text**' },
  { label: '*Italic*', value: '*text*' },
  { label: '`Code`', value: '`code`' },
  { label: '- List item', value: '- ' },
  { label: '1. Numbered', value: '1. ' }
];

const parseMarkdown = (text) => {
  if (!text) return '';
  
  return text
    .replace(/^### (.*$)/gim, '<h3 style="color: #1976d2; margin: 16px 0 8px 0; font-weight: 600;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1976d2; margin: 20px 0 12px 0; font-weight: 600;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #1976d2; margin: 24px 0 16px 0; font-weight: 700;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li style="margin: 4px 0; list-style-type: decimal;">$1</li>')
    .replace(/```([\s\S]*?)```/g, '<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 12px 0;"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
    .replace(/\n/g, '<br/>');
};

export default function PRDEditorRefactored({ 
  file, 
  initialContent = '', 
  onSave, 
  onContentChange, 
  autoSaveEnabled = true,
  autosaveDelay = 2000,
  contextId = null // For localStorage backup identification
}) {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState(0); // 0: Edit, 1: Preview
  const [history, setHistory] = useState([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [showBackupAlert, setShowBackupAlert] = useState(false);
  const textAreaRef = useRef(null);

  // Generate context ID for autosave service
  const autosaveContextId = contextId || (file ? `prd-${file.name}` : 'prd-editor');

  // Enhanced save function with backup support
  const enhancedSave = useCallback(async (data, isAutoSave = false) => {
    if (onSave) {
      // Use autosave service to create backup-enabled save function
      const backupSaveFunction = autosaveService.createBackupSaveFunction(
        autosaveContextId,
        async (content, isAuto) => {
          await onSave(content, isAuto);
        }
      );
      
      return await backupSaveFunction(data, isAutoSave);
    }
  }, [onSave, autosaveContextId]);

  // Use our new autosave hook
  const autosave = useAutosave({
    data: content,
    onSave: enhancedSave,
    delay: autosaveDelay,
    enabled: autoSaveEnabled,
    initialData: initialContent,
    onSuccess: (data, isAutoSave) => {
      console.log(`Content ${isAutoSave ? 'auto-' : ''}saved successfully`);
    },
    onError: (error, data, isAutoSave) => {
      console.error(`${isAutoSave ? 'Auto-s' : 'S'}ave failed:`, error);
    }
  });

  // Check for backup on component mount
  useEffect(() => {
    const backup = autosaveService.restoreFromBackup(autosaveContextId);
    if (backup && backup !== initialContent) {
      setShowBackupAlert(true);
    }
  }, [autosaveContextId, initialContent]);

  // Update content when initialContent changes
  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent);
      setHistory([initialContent]);
      setHistoryIndex(0);
      autosave.resetSavedState();
    }
  }, [initialContent, content, autosave]);

  // Calculate word and line counts
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    setWordCount(words);
    setLineCount(lines);
  }, [content]);

  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Add to history for undo/redo (limit to 50 entries)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);

    // Notify parent component
    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [history, historyIndex, onContentChange]);

  const handleRestoreFromBackup = () => {
    const backup = autosaveService.restoreFromBackup(autosaveContextId);
    if (backup) {
      setContent(backup);
      setShowBackupAlert(false);
    }
  };

  const handleDismissBackup = () => {
    autosaveService.removeFromStorage(autosaveContextId);
    setShowBackupAlert(false);
  };

  const insertMarkdown = (markdown) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText;
    if (markdown.includes('text')) {
      newText = markdown.replace('text', selectedText || 'text');
    } else {
      newText = markdown;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
  };

  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          autosave.save();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('**text**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*text*');
          break;
      }
    }
  };

  if (!file && !initialContent) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        {/* Backup Alert */}
        {showBackupAlert && (
          <Alert 
            severity="info" 
            sx={{ m: 2 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleRestoreFromBackup}>
                  Restore
                </Button>
                <Button size="small" onClick={handleDismissBackup}>
                  Dismiss
                </Button>
              </Stack>
            }
          >
            A backup was found for this document. Would you like to restore it?
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h6">
              Edit PRD Content (Enhanced Autosave)
            </Typography>
            {file && (
              <Typography variant="body2" color="text.secondary">
                {file.name}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Enhanced autosave indicator */}
            <AutosaveStatus 
              autosaveHook={autosave} 
              variant="chip" 
              onRetry={() => autosave.save()}
            />
            
            {/* Manual save button with integrated status */}
            <SaveButton 
              autosaveHook={autosave}
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
            />
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<EditIcon />} label="Edit" />
            <Tab icon={<PreviewIcon />} label="Preview" />
          </Tabs>
        </Box>

        {/* Toolbar for Edit mode */}
        {activeTab === 0 && (
          <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              {/* Undo/Redo */}
              <Tooltip title="Undo (Ctrl+Z)">
                <IconButton 
                  size="small" 
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Redo (Ctrl+Shift+Z)">
                <IconButton 
                  size="small" 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <RedoIcon />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />

              {/* Quick markdown buttons */}
              <Tooltip title="Bold (Ctrl+B)">
                <IconButton size="small" onClick={() => insertMarkdown('**text**')}>
                  <BoldIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italic (Ctrl+I)">
                <IconButton size="small" onClick={() => insertMarkdown('*text*')}>
                  <ItalicIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Code">
                <IconButton size="small" onClick={() => insertMarkdown('`code`')}>
                  <CodeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bullet List">
                <IconButton size="small" onClick={() => insertMarkdown('- ')}>
                  <BulletIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Numbered List">
                <IconButton size="small" onClick={() => insertMarkdown('1. ')}>
                  <NumberedIcon />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />

              {/* Quick insert shortcuts */}
              {MARKDOWN_SHORTCUTS.slice(0, 4).map((shortcut) => (
                <Button
                  key={shortcut.label}
                  size="small"
                  variant="outlined"
                  onClick={() => insertMarkdown(shortcut.value)}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {shortcut.label.split(' ')[0]}
                </Button>
              ))}

              <Divider orientation="vertical" flexItem />
              
              {/* Autosave status in toolbar */}
              <AutosaveStatus 
                autosaveHook={autosave} 
                variant="text" 
                showTimestamp={false}
              />
            </Stack>
          </Box>
        )}

        {/* Content area */}
        <Box sx={{ p: 2, minHeight: 400 }}>
          {activeTab === 0 ? (
            /* Edit Mode */
            <TextField
              ref={textAreaRef}
              fullWidth
              multiline
              minRows={15}
              maxRows={25}
              variant="outlined"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Edit your PRD content here... You can use Markdown formatting. Changes are automatically saved."
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: 1.5,
                },
                '& .MuiInputBase-input': {
                  resize: 'vertical'
                }
              }}
            />
          ) : (
            /* Preview Mode */
            <Box
              sx={{
                minHeight: 400,
                p: 2,
                border: 1,
                borderColor: 'grey.300',
                borderRadius: 1,
                bgcolor: 'grey.50',
                '& h1, & h2, & h3': { mt: 2, mb: 1 },
                '& p': { mb: 1 },
                '& ul, & ol': { pl: 2 },
                '& pre': { 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto'
                },
                lineHeight: 1.6
              }}
              dangerouslySetInnerHTML={{ 
                __html: content ? parseMarkdown(content) : '<em style="color: #666;">No content to preview</em>'
              }}
            />
          )}
        </Box>

        {/* Error display */}
        {autosave.saveError && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button size="small" onClick={() => autosave.save()}>
                Retry
              </Button>
            }
          >
            Save failed: {autosave.saveError}
          </Alert>
        )}

        {/* Footer with stats */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Stack direction="row" spacing={3}>
            <Typography variant="caption" color="text.secondary">
              <strong>Words:</strong> {wordCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Lines:</strong> {lineCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Characters:</strong> {content.length.toLocaleString()}
            </Typography>
          </Stack>
          
          {/* Additional autosave info */}
          <AutosaveIndicator
            saveStatus={autosave.saveStatus}
            lastSaved={autosave.lastSaved}
            hasUnsavedChanges={autosave.hasUnsavedChanges}
            variant="minimal"
          />
        </Box>
      </Paper>
    </Box>
  );
} 