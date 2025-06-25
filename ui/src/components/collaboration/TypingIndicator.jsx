import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Fade,
  Zoom,
  Stack
} from '@mui/material';
import { Edit, Keyboard } from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

/**
 * Animated Typing Dots Component
 */
const TypingDots = ({ size = 'small', color = 'primary' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        '& .dot': {
          width: size === 'small' ? 4 : 6,
          height: size === 'small' ? 4 : 6,
          borderRadius: '50%',
          bgcolor: `${color}.main`,
          animation: 'typing-pulse 1.4s infinite ease-in-out',
          '&:nth-of-type(1)': { animationDelay: '0s' },
          '&:nth-of-type(2)': { animationDelay: '0.2s' },
          '&:nth-of-type(3)': { animationDelay: '0.4s' }
        },
        '@keyframes typing-pulse': {
          '0%, 80%, 100%': {
            transform: 'scale(0.8)',
            opacity: 0.5
          },
          '40%': {
            transform: 'scale(1)',
            opacity: 1
          }
        }
      }}
    >
      <Box className="dot" />
      <Box className="dot" />
      <Box className="dot" />
    </Box>
  );
};

/**
 * Individual User Typing Indicator
 */
const UserTypingBubble = ({ user, context, compact = false }) => {
  const getUserColor = (userId) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (compact) {
    return (
      <Chip
        avatar={
          <Avatar sx={{ bgcolor: getUserColor(user.userId), width: 20, height: 20, fontSize: '0.6rem' }}>
            {getInitials(user.userName)}
          </Avatar>
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption">typing</Typography>
            <TypingDots size="small" />
          </Box>
        }
        size="small"
        variant="outlined"
        sx={{ 
          height: 24,
          '& .MuiChip-label': { px: 1 }
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'grey.100',
        borderRadius: 2,
        px: 2,
        py: 1,
        maxWidth: 200
      }}
    >
      <Avatar sx={{ bgcolor: getUserColor(user.userId), width: 24, height: 24, fontSize: '0.7rem' }}>
        {getInitials(user.userName)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {user.userName} is typing
          {context && ` in ${context}`}
        </Typography>
        <TypingDots />
      </Box>
    </Box>
  );
};

/**
 * Main Typing Indicator Component
 */
const TypingIndicator = ({ 
  variant = 'bubble', // 'bubble', 'chip', 'minimal', 'detailed'
  position = 'bottom', // 'top', 'bottom', 'inline'
  maxVisible = 3,
  showContext = true,
  hideAfterMs = 3000,
  className
}) => {
  const { 
    socket, 
    isConnected, 
    connectedUsers, 
    currentUser,
    on
  } = useWebSocket();
  
  const [typingUsers, setTypingUsers] = useState(new Map());

  // Handle incoming typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserTyping = (data) => {
      // Don't show our own typing indicator
      if (data.userId === currentUser.userId) return;

      const user = connectedUsers.find(u => u.userId === data.userId);
      if (!user) return;

      setTypingUsers(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          user,
          context: data.context,
          timestamp: Date.now()
        });
        return updated;
      });

      // Remove typing indicator after timeout
      setTimeout(() => {
        setTypingUsers(prev => {
          const updated = new Map(prev);
          const typing = updated.get(data.userId);
          if (typing && Date.now() - typing.timestamp >= hideAfterMs) {
            updated.delete(data.userId);
          }
          return updated;
        });
      }, hideAfterMs);
    };

    const cleanup = on('userTyping', handleUserTyping);
    return cleanup;
  }, [socket, isConnected, connectedUsers, currentUser.userId, hideAfterMs, on]);



  // Clean up old typing indicators
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const updated = new Map();
        prev.forEach((typing, userId) => {
          if (now - typing.timestamp < hideAfterMs) {
            updated.set(userId, typing);
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, [hideAfterMs]);

  const typingArray = Array.from(typingUsers.values());
  const visibleTyping = typingArray.slice(0, maxVisible);
  const hiddenCount = typingArray.length - maxVisible;

  if (typingArray.length === 0) {
    return null;
  }

  const renderTypingIndicators = () => {
    switch (variant) {
      case 'chip':
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {visibleTyping.map(({ user, context }) => (
              <Zoom key={user.userId} in timeout={200}>
                <Box>
                  <UserTypingBubble 
                    user={user} 
                    context={showContext ? context : null} 
                    compact 
                  />
                </Box>
              </Zoom>
            ))}
            {hiddenCount > 0 && (
              <Chip
                label={`+${hiddenCount} more typing`}
                size="small"
                variant="outlined"
                icon={<Keyboard />}
              />
            )}
          </Stack>
        );

      case 'minimal':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Keyboard sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {typingArray.length === 1 
                ? `${visibleTyping[0].user.userName} is typing`
                : `${typingArray.length} people are typing`
              }
            </Typography>
            <TypingDots size="small" />
          </Box>
        );

      case 'detailed':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Currently Typing ({typingArray.length})
            </Typography>
            <Stack spacing={1}>
              {visibleTyping.map(({ user, context }) => (
                <Fade key={user.userId} in timeout={300}>
                  <Box>
                    <UserTypingBubble 
                      user={user} 
                      context={showContext ? context : null} 
                    />
                  </Box>
                </Fade>
              ))}
              {hiddenCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  and {hiddenCount} more...
                </Typography>
              )}
            </Stack>
          </Box>
        );

      default: // 'bubble'
        return (
          <Stack spacing={1}>
            {visibleTyping.map(({ user, context }) => (
              <Fade key={user.userId} in timeout={300}>
                <Box>
                  <UserTypingBubble 
                    user={user} 
                    context={showContext ? context : null} 
                  />
                </Box>
              </Fade>
            ))}
            {hiddenCount > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }}
              >
                <Keyboard sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {hiddenCount} more typing
                </Typography>
                <TypingDots size="small" />
              </Box>
            )}
          </Stack>
        );
    }
  };

  return (
    <Box 
      className={className}
      sx={{
        position: position === 'inline' ? 'relative' : 'fixed',
        bottom: position === 'bottom' ? 20 : 'auto',
        top: position === 'top' ? 20 : 'auto',
        left: position !== 'inline' ? 20 : 'auto',
        zIndex: position !== 'inline' ? 1000 : 'auto',
        maxWidth: 300
      }}
    >
      {renderTypingIndicators()}
    </Box>
  );
};

/**
 * Hook for managing typing state
 */
const useTypingIndicator = (context = null) => {
  const { isConnected, sendTypingIndicator } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef(null);

  const startTyping = useCallback(() => {
    if (!isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator({ context, timestamp: Date.now() });
    }

    // Reset timer
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [isConnected, isTyping, context, sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, []);

  return { isTyping, startTyping, stopTyping };
};

// PropTypes
TypingDots.propTypes = {
  size: PropTypes.oneOf(['small', 'medium']),
  color: PropTypes.string
};

UserTypingBubble.propTypes = {
  user: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired
  }).isRequired,
  context: PropTypes.string,
  compact: PropTypes.bool
};

TypingIndicator.propTypes = {
  variant: PropTypes.oneOf(['bubble', 'chip', 'minimal', 'detailed']),
  position: PropTypes.oneOf(['top', 'bottom', 'inline']),
  maxVisible: PropTypes.number,
  showContext: PropTypes.bool,
  hideAfterMs: PropTypes.number,
  className: PropTypes.string
};

export default TypingIndicator;
export { TypingDots, UserTypingBubble, useTypingIndicator }; 