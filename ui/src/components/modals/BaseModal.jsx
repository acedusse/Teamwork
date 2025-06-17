import React, { useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Typography,
  Backdrop,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * BaseModal - Foundation modal component with accessibility and responsive features
 * 
 * Features:
 * - Keyboard navigation (Escape to close, Tab trapping)
 * - Responsive design (mobile-friendly)
 * - Accessibility compliance (ARIA labels, focus management)
 * - Customizable animations and styling
 * - Click-outside-to-close functionality
 * - Scroll lock when open
 */
const BaseModal = ({
  open = false,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true,
  fullScreen = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  closeButtonAriaLabel = 'Close modal',
  titleId,
  contentId,
  className,
  sx = {},
  PaperProps = {},
  BackdropProps = {},
  TransitionComponent = Fade,
  TransitionProps = {},
  keepMounted = false,
  scroll = 'paper',
  dividers = false,
  // Accessibility props
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  role = 'dialog',
  // Custom styling
  headerSx = {},
  contentSx = {},
  actionsSx = {},
  // Event handlers
  onEnter,
  onExit,
  onExited,
  onEntered,
  // Focus management
  autoFocus = true,
  restoreFocus = true,
  disableAutoFocus = false,
  disableRestoreFocus = false,
  // Animation
  transitionDuration = 225,
  ...other
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Refs for focus management
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastFocusedElement = useRef(null);

  // Auto-generate IDs if not provided
  const generatedTitleId = titleId || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  const generatedContentId = contentId || `modal-content-${Math.random().toString(36).substr(2, 9)}`;

  // Handle escape key
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && !disableEscapeKeyDown) {
      event.stopPropagation();
      onClose?.(event, 'escapeKeyDown');
    }
  }, [disableEscapeKeyDown, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event) => {
    if (!disableBackdropClick) {
      onClose?.(event, 'backdropClick');
    }
  }, [disableBackdropClick, onClose]);

  // Handle close button click
  const handleCloseClick = useCallback((event) => {
    onClose?.(event, 'closeButton');
  }, [onClose]);

  // Focus management
  useEffect(() => {
    if (open) {
      // Store the currently focused element
      lastFocusedElement.current = document.activeElement;
      
      // Set initial focus
      if (autoFocus && !disableAutoFocus) {
        const focusTarget = closeButtonRef.current || titleRef.current || dialogRef.current;
        if (focusTarget) {
          // Delay focus to ensure modal is fully rendered
          setTimeout(() => {
            focusTarget.focus();
          }, 100);
        }
      }
    } else if (restoreFocus && !disableRestoreFocus && lastFocusedElement.current) {
      // Restore focus when modal closes
      setTimeout(() => {
        if (lastFocusedElement.current && typeof lastFocusedElement.current.focus === 'function') {
          lastFocusedElement.current.focus();
        }
      }, 100);
    }
  }, [open, autoFocus, disableAutoFocus, restoreFocus, disableRestoreFocus]);

  // Responsive fullScreen logic
  const shouldBeFullScreen = fullScreen || (isMobile && maxWidth !== 'xs');

  // Enhanced PaperProps with responsive styling
  const enhancedPaperProps = {
    ...PaperProps,
    sx: {
      minHeight: shouldBeFullScreen ? '100vh' : '200px',
      maxHeight: shouldBeFullScreen ? '100vh' : '90vh',
      borderRadius: shouldBeFullScreen ? 0 : theme.shape.borderRadius * 1.5,
      margin: shouldBeFullScreen ? 0 : theme.spacing(2),
      width: shouldBeFullScreen ? '100%' : 'auto',
      ...PaperProps.sx
    }
  };

  // Enhanced BackdropProps
  const enhancedBackdropProps = {
    ...BackdropProps,
    sx: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      ...BackdropProps.sx
    }
  };

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={handleBackdropClick}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={shouldBeFullScreen}
      keepMounted={keepMounted}
      scroll={scroll}
      onKeyDown={handleKeyDown}
      className={className}
      sx={{
        '& .MuiDialog-paper': {
          backgroundImage: 'none', // Remove default MUI gradient
        },
        ...sx
      }}
      PaperProps={enhancedPaperProps}
      BackdropComponent={Backdrop}
      BackdropProps={enhancedBackdropProps}
      TransitionComponent={TransitionComponent}
      TransitionProps={{
        timeout: transitionDuration,
        onEnter,
        onExit,
        onExited,
        onEntered,
        ...TransitionProps
      }}
      aria-labelledby={ariaLabelledBy || (title ? generatedTitleId : undefined)}
      aria-describedby={ariaDescribedBy || generatedContentId}
      role={role}
      aria-modal="true"
      {...other}
    >
      {/* Header */}
      {(title || showCloseButton) && (
        <DialogTitle
          id={generatedTitleId}
          ref={titleRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: title ? 2 : 1,
            pr: showCloseButton ? 1 : 3,
            ...headerSx
          }}
        >
          {title && (
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                flex: 1,
                pr: showCloseButton ? 2 : 0
              }}
            >
              {title}
            </Typography>
          )}
          
          {showCloseButton && (
            <IconButton
              ref={closeButtonRef}
              aria-label={closeButtonAriaLabel}
              onClick={handleCloseClick}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
                '&:focus': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {/* Content */}
      <DialogContent
        id={generatedContentId}
        dividers={dividers}
        sx={{
          flex: 1,
          overflow: 'auto',
          '&:focus': {
            outline: 'none'
          },
          ...contentSx
        }}
        tabIndex={-1}
      >
        {children}
      </DialogContent>

      {/* Actions */}
      {actions && (
        <DialogActions
          sx={{
            p: 3,
            gap: 1,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            '& > *': {
              flex: isMobile ? '1 1 auto' : '0 0 auto',
              minWidth: isMobile ? 'auto' : 'fit-content'
            },
            ...actionsSx
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

BaseModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  actions: PropTypes.node,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  fullWidth: PropTypes.bool,
  fullScreen: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
  disableEscapeKeyDown: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  closeButtonAriaLabel: PropTypes.string,
  titleId: PropTypes.string,
  contentId: PropTypes.string,
  className: PropTypes.string,
  sx: PropTypes.object,
  PaperProps: PropTypes.object,
  BackdropProps: PropTypes.object,
  TransitionComponent: PropTypes.elementType,
  TransitionProps: PropTypes.object,
  keepMounted: PropTypes.bool,
  scroll: PropTypes.oneOf(['body', 'paper']),
  dividers: PropTypes.bool,
  'aria-labelledby': PropTypes.string,
  'aria-describedby': PropTypes.string,
  role: PropTypes.string,
  headerSx: PropTypes.object,
  contentSx: PropTypes.object,
  actionsSx: PropTypes.object,
  onEnter: PropTypes.func,
  onExit: PropTypes.func,
  onExited: PropTypes.func,
  onEntered: PropTypes.func,
  autoFocus: PropTypes.bool,
  restoreFocus: PropTypes.bool,
  disableAutoFocus: PropTypes.bool,
  disableRestoreFocus: PropTypes.bool,
  transitionDuration: PropTypes.number
};

export default BaseModal; 