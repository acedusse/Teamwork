import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Keyboard as KeyboardIcon,
  Navigation as NavigationIcon,
  TouchApp as ActionsIcon,
  Assignment as TasksIcon,
  Help as HelpIcon,
  Accessibility as AccessibilityIcon,
  Settings as GeneralIcon
} from '@mui/icons-material';
import keyboardShortcuts from '../services/keyboardShortcuts';
import focusManager from '../services/focusManagement';

const CATEGORY_ICONS = {
  navigation: <NavigationIcon />,
  actions: <ActionsIcon />,
  tasks: <TasksIcon />,
  help: <HelpIcon />,
  accessibility: <AccessibilityIcon />,
  general: <GeneralIcon />
};

const CATEGORY_DESCRIPTIONS = {
  navigation: 'Navigate between different sections of the application',
  actions: 'Perform common actions and operations',
  tasks: 'Task management and creation shortcuts',
  help: 'Access help and documentation',
  accessibility: 'Accessibility and navigation aids',
  general: 'General application shortcuts'
};

function KeyboardShortcutsHelp({ open, onClose }) {
  const [shortcuts, setShortcuts] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const theme = useTheme();
  const dialogRef = useRef(null);
  const focusTrapRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Get all shortcuts from the service
      const allShortcuts = keyboardShortcuts.getAllShortcuts();
      setShortcuts(allShortcuts);
      
      // Expand all categories by default
      const expanded = {};
      Object.keys(allShortcuts).forEach(category => {
        expanded[category] = true;
      });
      setExpandedCategories(expanded);

      // Create focus trap when dialog opens
      setTimeout(() => {
        if (dialogRef.current) {
          focusTrapRef.current = focusManager.createFocusTrap(dialogRef.current, {
            initialFocus: 'button', // Focus the first button (close button)
            escapeCallback: onClose
          });
        }
      }, 0);
    } else {
      // Remove focus trap when dialog closes
      if (focusTrapRef.current) {
        focusManager.removeFocusTrap();
        focusTrapRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (focusTrapRef.current) {
        focusManager.removeFocusTrap();
        focusTrapRef.current = null;
      }
    };
  }, [open, onClose]);

  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleClose = () => {
    if (focusTrapRef.current) {
      focusManager.removeFocusTrap();
      focusTrapRef.current = null;
    }
    onClose();
  };

  const formatKeyDisplayName = (key) => {
    return key
      .split('+')
      .map(part => {
        // Capitalize and format key names
        const formatted = part.charAt(0).toUpperCase() + part.slice(1);
        const keyMap = {
          'Ctrl': 'Ctrl',
          'Alt': 'Alt',
          'Shift': 'Shift',
          'Meta': 'Cmd',
          'Space': 'Space',
          'Enter': 'Enter',
          'Escape': 'Esc',
          'Tab': 'Tab',
          'Backspace': '⌫',
          'Delete': 'Del',
          'Up': '↑',
          'Down': '↓',
          'Left': '←',
          'Right': '→'
        };
        return keyMap[formatted] || formatted;
      })
      .join(' + ');
  };

  const KeyChip = ({ keyString }) => (
    <Chip
      label={formatKeyDisplayName(keyString)}
      size="small"
      variant="outlined"
      sx={{
        fontFamily: 'monospace',
        fontWeight: 'bold',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
      }}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      ref={dialogRef}
      aria-labelledby="keyboard-shortcuts-title"
      aria-describedby="keyboard-shortcuts-description"
      role="dialog"
      aria-modal="true"
    >
      <DialogTitle
        id="keyboard-shortcuts-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon aria-hidden="true" />
          <Typography variant="h6" component="h2">Keyboard Shortcuts</Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          aria-label="Close keyboard shortcuts help dialog"
          autoFocus
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        id="keyboard-shortcuts-description"
        tabIndex={-1}
        sx={{ '&:focus': { outline: 'none' } }}
      >
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Use these keyboard shortcuts to navigate and interact with Taskmaster more efficiently.
          Shortcuts work globally unless you're typing in an input field.
        </Typography>

        <Box role="region" aria-label="Keyboard shortcuts by category">
          {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
            <Accordion
              key={category}
              expanded={expandedCategories[category]}
              onChange={() => handleCategoryToggle(category)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${category}-shortcuts-content`}
                id={`${category}-shortcuts-header`}
                sx={{
                  '&:focus-visible': {
                    backgroundColor: theme.palette.action.focus
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {CATEGORY_ICONS[category] || <GeneralIcon />}
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {category}
                  </Typography>
                  <Chip
                    label={categoryShortcuts.length}
                    size="small"
                    color="primary"
                    variant="outlined"
                    aria-label={`${categoryShortcuts.length} shortcuts in ${category} category`}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {CATEGORY_DESCRIPTIONS[category] || 'Various application shortcuts'}
                </Typography>
                
                <List 
                  dense 
                  role="list" 
                  aria-label={`${category} category shortcuts`}
                >
                  {categoryShortcuts.map((shortcut, index) => (
                    <React.Fragment key={`${category}-${index}`}>
                      <ListItem 
                        sx={{ px: 0 }}
                        role="listitem"
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <Typography variant="body2">
                                {shortcut.description}
                              </Typography>
                              <KeyChip keyString={shortcut.key} />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < categoryShortcuts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {Object.keys(shortcuts).length === 0 && (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              <KeyboardIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} aria-hidden="true" />
              <Typography variant="h6" color="textSecondary">
                No keyboard shortcuts available
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Keyboard shortcuts will appear here once they are registered.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box 
          sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}
          role="region"
          aria-label="Keyboard shortcuts tips"
        >
          <Typography variant="subtitle2" gutterBottom>
            Tips:
          </Typography>
          <Typography variant="body2" color="textSecondary" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Most shortcuts are disabled when typing in input fields</li>
            <li>Use <KeyChip keyString="?" /> or <KeyChip keyString="F1" /> to open this help dialog</li>
            <li>Use <KeyChip keyString="Escape" /> to close dialogs and panels</li>
            <li>Navigation shortcuts (Ctrl+1-6) work from anywhere in the application</li>
            <li>Use Tab and Shift+Tab to navigate through interface elements</li>
            <li>Use arrow keys to navigate through lists and menus</li>
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          variant="contained"
          sx={{
            '&:focus-visible': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default KeyboardShortcutsHelp; 