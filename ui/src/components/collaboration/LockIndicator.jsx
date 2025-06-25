import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Typography,
  Avatar,
  Fade,
  Zoom,
  Badge
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

// Styled components
const StyledLockChip = styled(Chip)(({ theme, variant, lockstatus }) => ({
  '& .MuiChip-icon': {
    color: lockstatus === 'locked' ? theme.palette.error.main : 
           lockstatus === 'owned' ? theme.palette.success.main :
           lockstatus === 'pending' ? theme.palette.warning.main :
           theme.palette.text.secondary,
  },
  ...(lockstatus === 'pending' && {
    animation: `${pulse} 2s ease-in-out infinite`,
  }),
  ...(variant === 'minimal' && {
    minWidth: 'auto',
    height: 24,
    '& .MuiChip-label': {
      padding: '0 4px',
      fontSize: '0.75rem',
    },
  }),
}));

const StyledLockBadge = styled(Badge)(({ theme, lockstatus }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: lockstatus === 'locked' ? theme.palette.error.main : 
                     lockstatus === 'owned' ? theme.palette.success.main :
                     lockstatus === 'pending' ? theme.palette.warning.main :
                     theme.palette.grey[400],
    color: theme.palette.common.white,
    minWidth: 16,
    height: 16,
    fontSize: '0.6rem',
    ...(lockstatus === 'pending' && {
      animation: `${pulse} 2s ease-in-out infinite`,
    }),
  },
}));

const LockedOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(1px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  zIndex: 10,
  background: `
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.5) 60%,
      rgba(255, 255, 255, 0)
    )
  `,
  backgroundSize: '200px 100%',
  animation: `${shimmer} 2s infinite linear`,
}));

/**
 * Generate consistent user colors based on user ID
 */
const getUserColor = (userId) => {
  if (!userId) return '#757575';
  
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Format time remaining for lock expiration
 */
const formatTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 'Unknown';
  
  const now = Date.now();
  const remaining = expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Lock indicator chip component
 */
export const LockChip = ({ 
  lockInfo, 
  variant = 'default', 
  size = 'medium',
  showUser = true,
  onClick,
  onRequestLock,
  onReleaseLock,
  ...props 
}) => {
  const getLockStatus = () => {
    if (!lockInfo) return 'unlocked';
    if (lockInfo.pending) return 'pending';
    if (lockInfo.ownedByCurrentUser) return 'owned';
    return 'locked';
  };

  const lockStatus = getLockStatus();
  
  const getIcon = () => {
    switch (lockStatus) {
      case 'locked':
        return <LockIcon />;
      case 'owned':
        return <EditIcon />;
      case 'pending':
        return <LockOpenIcon />;
      default:
        return <LockOpenIcon />;
    }
  };

  const getLabel = () => {
    switch (lockStatus) {
      case 'locked':
        return showUser && lockInfo?.userName ? 
          `Locked by ${lockInfo.userName}` : 'Locked';
      case 'owned':
        return 'Editing';
      case 'pending':
        return 'Requesting...';
      default:
        return 'Available';
    }
  };

  const getTooltipContent = () => {
    if (!lockInfo) return 'Click to request edit lock';
    
    switch (lockStatus) {
      case 'locked':
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Locked by {lockInfo.userName}
            </Typography>
            {lockInfo.expiresAt && (
              <Typography variant="caption">
                Expires in {formatTimeRemaining(lockInfo.expiresAt)}
              </Typography>
            )}
          </Box>
        );
      case 'owned':
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              You are editing this resource
            </Typography>
            {lockInfo.expiresAt && (
              <Typography variant="caption">
                Lock expires in {formatTimeRemaining(lockInfo.expiresAt)}
              </Typography>
            )}
            <Typography variant="caption" display="block">
              Click to release lock
            </Typography>
          </Box>
        );
      case 'pending':
        return 'Lock request pending...';
      default:
        return 'Click to request edit lock';
    }
  };

  const handleClick = (event) => {
    event.stopPropagation();
    
    if (onClick) {
      onClick(event, lockStatus, lockInfo);
      return;
    }

    // Default click behavior
    switch (lockStatus) {
      case 'unlocked':
        onRequestLock?.();
        break;
      case 'owned':
        onReleaseLock?.();
        break;
      default:
        // No action for locked or pending
        break;
    }
  };

  return (
    <Tooltip title={getTooltipContent()} arrow placement="top">
      <StyledLockChip
        icon={getIcon()}
        label={getLabel()}
        variant={variant === 'outlined' ? 'outlined' : 'filled'}
        size={size}
        lockstatus={lockStatus}
        clickable={lockStatus === 'unlocked' || lockStatus === 'owned'}
        onClick={handleClick}
        color={lockStatus === 'owned' ? 'success' : 
               lockStatus === 'locked' ? 'error' :
               lockStatus === 'pending' ? 'warning' : 'default'}
        {...props}
      />
    </Tooltip>
  );
};

LockChip.propTypes = {
  lockInfo: PropTypes.shape({
    userName: PropTypes.string,
    userId: PropTypes.string,
    expiresAt: PropTypes.number,
    ownedByCurrentUser: PropTypes.bool,
    pending: PropTypes.bool
  }),
  variant: PropTypes.oneOf(['default', 'outlined', 'minimal']),
  size: PropTypes.oneOf(['small', 'medium']),
  showUser: PropTypes.bool,

  onClick: PropTypes.func,
  onRequestLock: PropTypes.func,
  onReleaseLock: PropTypes.func
};

/**
 * Lock badge component for minimal lock indication
 */
export const LockBadge = ({ 
  lockInfo, 
  children, 
  showTooltip = true,
  badgeContent,
  ...props 
}) => {
  const getLockStatus = () => {
    if (!lockInfo) return 'unlocked';
    if (lockInfo.pending) return 'pending';
    if (lockInfo.ownedByCurrentUser) return 'owned';
    return 'locked';
  };

  const lockStatus = getLockStatus();
  
  if (lockStatus === 'unlocked') {
    return children;
  }

  const getBadgeIcon = () => {
    switch (lockStatus) {
      case 'locked':
        return <LockIcon sx={{ fontSize: 10 }} />;
      case 'owned':
        return <EditIcon sx={{ fontSize: 10 }} />;
      case 'pending':
        return <TimeIcon sx={{ fontSize: 10 }} />;
      default:
        return null;
    }
  };

  const getTooltipContent = () => {
    switch (lockStatus) {
      case 'locked':
        return `Locked by ${lockInfo?.userName || 'Another user'}`;
      case 'owned':
        return 'You are editing this';
      case 'pending':
        return 'Lock request pending';
      default:
        return '';
    }
  };

  const badge = (
    <StyledLockBadge
      badgeContent={badgeContent || getBadgeIcon()}
      lockstatus={lockStatus}
      {...props}
    >
      {children}
    </StyledLockBadge>
  );

  return showTooltip ? (
    <Tooltip title={getTooltipContent()} arrow>
      {badge}
    </Tooltip>
  ) : badge;
};

LockBadge.propTypes = {
  lockInfo: PropTypes.shape({
    userName: PropTypes.string,
    userId: PropTypes.string,
    ownedByCurrentUser: PropTypes.bool,
    pending: PropTypes.bool
  }),
  children: PropTypes.node.isRequired,
  showTooltip: PropTypes.bool,
  badgeContent: PropTypes.node
};

/**
 * Lock overlay component for blocking interaction with locked content
 */
export const LockOverlay = ({ 
  lockInfo, 
  show = true,
  children,
  message,
  showLockInfo = true,
  ...props 
}) => {
  if (!show || !lockInfo || lockInfo.ownedByCurrentUser) {
    return children;
  }

  const defaultMessage = `This content is being edited by ${lockInfo.userName || 'another user'}`;

  return (
    <Box position="relative" {...props}>
      {children}
      <Fade in={true}>
        <LockedOverlay>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            p={2}
          >
            <Avatar
              sx={{ 
                bgcolor: getUserColor(lockInfo.userId),
                mb: 1,
                width: 32,
                height: 32
              }}
            >
              <LockIcon fontSize="small" />
            </Avatar>
            {showLockInfo && (
              <Box>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {message || defaultMessage}
                </Typography>
                {lockInfo.expiresAt && (
                  <Typography variant="caption" color="text.secondary">
                    Lock expires in {formatTimeRemaining(lockInfo.expiresAt)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </LockedOverlay>
      </Fade>
    </Box>
  );
};

LockOverlay.propTypes = {
  lockInfo: PropTypes.shape({
    userName: PropTypes.string,
    userId: PropTypes.string,
    expiresAt: PropTypes.number,
    ownedByCurrentUser: PropTypes.bool
  }),
  show: PropTypes.bool,
  children: PropTypes.node.isRequired,
  message: PropTypes.string,
  showLockInfo: PropTypes.bool,

};

/**
 * Lock status display component
 */
export const LockStatus = ({ 
  activeLocks = [], 
  ownedLocks = [], 
  variant = 'compact',
  maxDisplay = 3,
  ...props 
}) => {
  if (activeLocks.length === 0) {
    return null;
  }

  const displayLocks = activeLocks.slice(0, maxDisplay);
  const remainingCount = Math.max(0, activeLocks.length - maxDisplay);

  if (variant === 'minimal') {
    return (
      <Tooltip 
        title={`${activeLocks.length} active locks, ${ownedLocks.length} owned by you`}
        arrow
      >
        <Chip
          icon={<LockIcon />}
          label={activeLocks.length}
          size="small"
          color={ownedLocks.length > 0 ? 'success' : 'default'}
          {...props}
        />
      </Tooltip>
    );
  }

  return (
    <Box display="flex" flexWrap="wrap" gap={0.5} {...props}>
      {displayLocks.map((lock) => (
        <Chip
          key={lock.lockId}
          avatar={
            <Avatar 
              sx={{ 
                bgcolor: getUserColor(lock.userId),
                width: 20,
                height: 20,
                fontSize: '0.7rem'
              }}
            >
              {lock.userName?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          }
          label={
            variant === 'detailed' ? 
              `${lock.userName} - ${lock.resourceType}` :
              lock.userName
          }
          size="small"
          variant="outlined"
          color={ownedLocks.includes(lock.lockId) ? 'success' : 'default'}
        />
      ))}
      {remainingCount > 0 && (
        <Chip
          label={`+${remainingCount}`}
          size="small"
          variant="outlined"
          color="default"
        />
      )}
    </Box>
  );
};

LockStatus.propTypes = {
  activeLocks: PropTypes.arrayOf(PropTypes.shape({
    lockId: PropTypes.string.isRequired,
    userName: PropTypes.string,
    userId: PropTypes.string,
    resourceType: PropTypes.string
  })),
  ownedLocks: PropTypes.arrayOf(PropTypes.string),
  variant: PropTypes.oneOf(['minimal', 'compact', 'detailed']),
  maxDisplay: PropTypes.number
};

export default LockChip; 