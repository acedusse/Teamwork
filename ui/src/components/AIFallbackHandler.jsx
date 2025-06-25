/**
 * AIFallbackHandler.jsx
 * React component to handle AI service unavailability gracefully
 */
import React, { useEffect, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import aiModule from '../ai-module';

/**
 * AIFallbackHandler Component
 * Provides graceful fallback when AI services are unavailable
 */
const AIFallbackHandler = ({ children, showAlert = true }) => {
  const [aiError, setAiError] = useState(null);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const status = aiModule.getStatus();
        
        // If not initialized yet, initialize the module
        if (!status.initialized) {
          await aiModule.init(window.appState || {});
        }
        
        // Check availability
        const isAvailable = await aiModule.checkAvailability();
        
        if (!isAvailable) {
          const serviceStatus = aiModule.getStatus();
          setAiError(serviceStatus.error || 'AI service unavailable');
          setOpen(showAlert);
        } else {
          setAiError(null);
          setOpen(false);
        }
      } catch (error) {
        setAiError(error.message);
        setOpen(showAlert);
      }
    };
    
    checkAIStatus();
    
    // Check availability periodically
    const intervalId = setInterval(checkAIStatus, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [showAlert]);
  
  const handleRetry = async () => {
    setOpen(false);
    
    try {
      const isAvailable = await aiModule.checkAvailability();
      
      if (isAvailable) {
        setAiError(null);
      } else {
        setOpen(true);
      }
    } catch (error) {
      setAiError(error.message);
      setOpen(true);
    }
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  return (
    <>
      <Snackbar
        open={open && !!aiError}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="warning" 
          onClose={handleClose}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          AI features might be limited: {aiError}
        </Alert>
      </Snackbar>
      {children}
    </>
  );
};

export default AIFallbackHandler;
