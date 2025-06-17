import React from 'react';
import {
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper
} from '@mui/material';
import {
  Info as InfoIcon,
  Help as HelpIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

/**
 * InfoModal - Modal component for displaying information, help, and read-only content
 * 
 * Features:
 * - Multiple info types (info, help, success, warning, error)
 * - Rich content support (text, lists, links, code blocks)
 * - Copy-to-clipboard functionality
 * - External link handling
 * - Responsive design
 * - Accessibility compliant
 */
const InfoModal = ({
  open = false,
  onClose,
  title,
  content,
  type = 'info',
  showIcon = true,
  // Content props
  subtitle,
  description,
  items = [],
  links = [],
  codeBlock,
  copyableContent,
  // Button props
  closeText = 'Close',
  primaryAction,
  secondaryAction,
  // Styling props
  maxWidth = 'md',
  sx = {},
  contentSx = {},
  // Additional props
  ...other
}) => {
  // Icon mapping based on type
  const iconMap = {
    info: <InfoIcon color="info" sx={{ fontSize: 48 }} />,
    help: <HelpIcon color="primary" sx={{ fontSize: 48 }} />,
    success: <SuccessIcon color="success" sx={{ fontSize: 48 }} />,
    warning: <WarningIcon color="warning" sx={{ fontSize: 48 }} />,
    error: <ErrorIcon color="error" sx={{ fontSize: 48 }} />
  };

  // Color mapping for different types
  const colorMap = {
    info: 'info',
    help: 'primary',
    success: 'success',
    warning: 'warning',
    error: 'error'
  };

  // Handle copy to clipboard
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  // Handle external link
  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Default actions
  const defaultActions = (
    <Button
      onClick={onClose}
      variant="contained"
      color={colorMap[type]}
      startIcon={<CloseIcon />}
      sx={{ minWidth: 100 }}
    >
      {closeText}
    </Button>
  );

  // Custom actions if provided
  const actions = primaryAction || secondaryAction ? (
    <>
      {secondaryAction && (
        <Button
          onClick={secondaryAction.onClick}
          variant="outlined"
          color={secondaryAction.color || 'inherit'}
          startIcon={secondaryAction.icon}
          sx={{ minWidth: 100 }}
        >
          {secondaryAction.text}
        </Button>
      )}
      {primaryAction && (
        <Button
          onClick={primaryAction.onClick}
          variant="contained"
          color={primaryAction.color || colorMap[type]}
          startIcon={primaryAction.icon}
          sx={{ minWidth: 100 }}
        >
          {primaryAction.text}
        </Button>
      )}
    </>
  ) : defaultActions;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      actions={actions}
      maxWidth={maxWidth}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible',
        },
        ...sx
      }}
      contentSx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...contentSx
      }}
      {...other}
    >
      {/* Header with icon */}
      {showIcon && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2 
        }}>
          {iconMap[type]}
        </Box>
      )}

      {/* Subtitle */}
      {subtitle && (
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 500,
            textAlign: 'center',
            color: `${colorMap[type]}.main`
          }}
        >
          {subtitle}
        </Typography>
      )}

      {/* Main content */}
      {content && (
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.6,
            textAlign: type === 'help' ? 'left' : 'center'
          }}
        >
          {content}
        </Typography>
      )}

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.5,
            textAlign: 'left'
          }}
        >
          {description}
        </Typography>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <List dense>
            {items.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                {item.icon && (
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.primary}
                  secondary={item.secondary}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: item.bold ? 600 : 400
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption'
                  }}
                />
                {item.chip && (
                  <Chip
                    label={item.chip.label}
                    size="small"
                    color={item.chip.color || 'default'}
                    variant={item.chip.variant || 'filled'}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Links */}
      {links.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Related Links
            </Typography>
            {links.map((link, index) => (
              <Button
                key={index}
                variant="text"
                color="primary"
                startIcon={<LaunchIcon />}
                onClick={() => handleExternalLink(link.url)}
                sx={{ 
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  textTransform: 'none'
                }}
              >
                {link.text}
              </Button>
            ))}
          </Box>
        </>
      )}

      {/* Code block */}
      {codeBlock && (
        <>
          <Divider sx={{ my: 1 }} />
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 1 
            }}>
              <Typography variant="caption" color="text.secondary">
                {codeBlock.language || 'Code'}
              </Typography>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={() => handleCopy(codeBlock.content)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                Copy
              </Button>
            </Box>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {codeBlock.content}
            </pre>
          </Paper>
        </>
      )}

      {/* Copyable content */}
      {copyableContent && (
        <>
          <Divider sx={{ my: 1 }} />
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: 'grey.50',
              position: 'relative'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 1 
            }}>
              <Typography variant="caption" color="text.secondary">
                {copyableContent.label || 'Copyable Content'}
              </Typography>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={() => handleCopy(copyableContent.content)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                Copy
              </Button>
            </Box>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {copyableContent.content}
            </Typography>
          </Paper>
        </>
      )}
    </BaseModal>
  );
};

InfoModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  content: PropTypes.node,
  type: PropTypes.oneOf(['info', 'help', 'success', 'warning', 'error']),
  showIcon: PropTypes.bool,
  subtitle: PropTypes.node,
  description: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.shape({
    primary: PropTypes.node.isRequired,
    secondary: PropTypes.node,
    icon: PropTypes.node,
    bold: PropTypes.bool,
    chip: PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string,
      variant: PropTypes.oneOf(['filled', 'outlined'])
    })
  })),
  links: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  })),
  codeBlock: PropTypes.shape({
    content: PropTypes.string.isRequired,
    language: PropTypes.string
  }),
  copyableContent: PropTypes.shape({
    content: PropTypes.string.isRequired,
    label: PropTypes.string
  }),
  closeText: PropTypes.string,
  primaryAction: PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    color: PropTypes.string,
    icon: PropTypes.node
  }),
  secondaryAction: PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    color: PropTypes.string,
    icon: PropTypes.node
  }),
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  sx: PropTypes.object,
  contentSx: PropTypes.object
};

export default InfoModal; 