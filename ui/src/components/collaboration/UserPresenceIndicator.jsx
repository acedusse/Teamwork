import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Avatar,
  Badge,
  Tooltip,
  Typography,
  Chip,
  Fade,
  Zoom,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Popover,
  Divider,
  Stack
} from '@mui/material';
import {
  Circle,
  Person,
  LocationOn,
  Schedule,
  Visibility,
  Edit,
  Mouse,
  TouchApp,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

// Status configuration
const PRESENCE_STATUS = {
  online: {
    color: '#4CAF50',
    label: 'Online',
    icon: <Circle sx={{ fontSize: 8 }} />,
    animation: 'none'
  },
  away: {
    color: '#FF9800',
    label: 'Away',
    icon: <Circle sx={{ fontSize: 8 }} />,
    animation: 'pulse 2s infinite'
  },
  busy: {
    color: '#F44336',
    label: 'Busy',
    icon: <Circle sx={{ fontSize: 8 }} />,
    animation: 'none'
  },
  offline: {
    color: '#9E9E9E',
    label: 'Offline',
    icon: <Circle sx={{ fontSize: 8 }} />,
    animation: 'none'
  }
};

const ACTIVITY_TYPES = {
  viewing: { icon: <Visibility />, color: 'primary', label: 'Viewing' },
  editing: { icon: <Edit />, color: 'warning', label: 'Editing' },
  typing: { icon: <Edit />, color: 'info', label: 'Typing' },
  moving: { icon: <Mouse />, color: 'secondary', label: 'Navigating' },
  touching: { icon: <TouchApp />, color: 'secondary', label: 'Interacting' }
};

/**
 * Individual User Presence Avatar Component
 */
const UserAvatar = ({ user, size = 32, showStatus = true, onClick }) => {
  const status = user.presence?.status || 'offline';
  const statusConfig = PRESENCE_STATUS[status];
  const currentActivity = user.presence?.currentActivity;
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getUserColor = (userId) => {
    // Generate consistent color based on user ID
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {user.userName}
          </Typography>
          <Typography variant="caption" color="inherit">
            {statusConfig.label}
            {user.presence?.location && ` • ${user.presence.location}`}
          </Typography>
          {currentActivity && (
            <Typography variant="caption" color="inherit" display="block">
              {ACTIVITY_TYPES[currentActivity.type]?.label || 'Active'}
            </Typography>
          )}
          {user.presence?.lastSeen && (
            <Typography variant="caption" color="inherit" display="block">
              Last seen: {new Date(user.presence.lastSeen).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      }
      arrow
      placement="top"
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          showStatus ? (
            <Box
              sx={{
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: '50%',
                bgcolor: statusConfig.color,
                border: '2px solid white',
                animation: statusConfig.animation,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {statusConfig.icon}
            </Box>
          ) : null
        }
      >
        <Avatar
          sx={{
            width: size,
            height: size,
            bgcolor: getUserColor(user.userId),
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.2s ease',
            '&:hover': onClick ? {
              transform: 'scale(1.1)'
            } : {}
          }}
          onClick={onClick}
        >
          {getInitials(user.userName)}
        </Avatar>
      </Badge>
    </Tooltip>
  );
};

/**
 * User Activity Indicator Component
 */
const UserActivityIndicator = ({ user, compact = false }) => {
  const activity = user.presence?.currentActivity;
  
  if (!activity) return null;

  const activityConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.viewing;
  
  if (compact) {
    return (
      <Chip
        icon={activityConfig.icon}
        label={activityConfig.label}
        size="small"
        variant="outlined"
        color={activityConfig.color}
        sx={{ 
          height: 20,
          fontSize: '0.7rem',
          '& .MuiChip-icon': { fontSize: '0.8rem' }
        }}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {React.cloneElement(activityConfig.icon, { 
        sx: { fontSize: 16, color: `${activityConfig.color}.main` }
      })}
      <Typography variant="caption" color="text.secondary">
        {activityConfig.label}
        {activity.details && ` - ${activity.details}`}
      </Typography>
    </Box>
  );
};

/**
 * Main User Presence Indicator Component
 */
const UserPresenceIndicator = ({ 
  variant = 'avatars', // 'avatars', 'list', 'compact', 'detailed'
  maxVisible = 5,
  showCurrentUser = false,
  showActivity = true,
  onUserClick,
  className
}) => {
  const { 
    connectedUsers, 
    userPresence, 
    currentUser, 
    isConnected 
  } = useWebSocket();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState(false);

  // Combine connected users with presence data
  const usersWithPresence = connectedUsers.map(user => {
    const presence = userPresence.find(p => p.userId === user.userId);
    return {
      ...user,
      presence: presence || { status: 'online', lastSeen: user.joinedAt }
    };
  });

  // Add current user if requested
  const allUsers = showCurrentUser 
    ? [{ ...currentUser, presence: { status: isConnected ? 'online' : 'offline' } }, ...usersWithPresence]
    : usersWithPresence;

  // Sort users by activity and status
  const sortedUsers = allUsers.sort((a, b) => {
    const statusOrder = { online: 0, busy: 1, away: 2, offline: 3 };
    const aStatus = a.presence?.status || 'offline';
    const bStatus = b.presence?.status || 'offline';
    
    if (statusOrder[aStatus] !== statusOrder[bStatus]) {
      return statusOrder[aStatus] - statusOrder[bStatus];
    }
    
    // Sort by last activity
    const aActivity = new Date(a.presence?.lastSeen || 0);
    const bActivity = new Date(b.presence?.lastSeen || 0);
    return bActivity - aActivity;
  });

  const visibleUsers = sortedUsers.slice(0, maxVisible);
  const hiddenUsers = sortedUsers.slice(maxVisible);
  const hasHiddenUsers = hiddenUsers.length > 0;

  const handleUserClick = useCallback((user, event) => {
    if (onUserClick) {
      onUserClick(user);
    } else {
      setSelectedUser(user);
      setAnchorEl(event.currentTarget);
    }
  }, [onUserClick]);

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const renderUserDetails = (user) => (
    <Box sx={{ minWidth: 250, p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <UserAvatar user={user} size={40} showStatus={false} />
        <Box>
          <Typography variant="subtitle2" fontWeight="medium">
            {user.userName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.userId === currentUser.userId ? 'You' : 'Collaborator'}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Circle sx={{ fontSize: 8, color: PRESENCE_STATUS[user.presence?.status || 'offline'].color }} />
          <Typography variant="body2">
            {PRESENCE_STATUS[user.presence?.status || 'offline'].label}
          </Typography>
        </Box>
        
        {user.presence?.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {user.presence.location}
            </Typography>
          </Box>
        )}
        
        {user.presence?.lastSeen && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(user.presence.lastSeen).toLocaleString()}
            </Typography>
          </Box>
        )}
        
        {showActivity && user.presence?.currentActivity && (
          <UserActivityIndicator user={user} />
        )}
      </Stack>
    </Box>
  );

  if (allUsers.length === 0) {
    return null;
  }

  // Render based on variant
  switch (variant) {
    case 'compact':
      return (
        <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {allUsers.length} online
          </Typography>
        </Box>
      );

    case 'list':
      return (
        <Card className={className} sx={{ maxWidth: 300 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Online Users ({allUsers.length})
            </Typography>
            <List dense>
              {allUsers.map((user) => (
                <ListItem 
                  key={user.userId} 
                  button={!!onUserClick}
                  onClick={(e) => handleUserClick(user, e)}
                  sx={{ px: 0 }}
                >
                  <ListItemAvatar>
                    <UserAvatar user={user} size={32} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.userName}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {PRESENCE_STATUS[user.presence?.status || 'offline'].label}
                        </Typography>
                        {showActivity && user.presence?.currentActivity && (
                          <UserActivityIndicator user={user} compact />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      );

    case 'detailed':
      return (
        <Card className={className}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Collaboration ({allUsers.length} users)
              </Typography>
              <IconButton
                size="small"
                onClick={() => setExpandedUsers(!expandedUsers)}
              >
                {expandedUsers ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {visibleUsers.map((user) => (
                <UserAvatar
                  key={user.userId}
                  user={user}
                  size={40}
                  onClick={(e) => handleUserClick(user, e)}
                />
              ))}
              {hasHiddenUsers && (
                <Tooltip title={`${hiddenUsers.length} more users`}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'grey.300',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedUsers(true)}
                  >
                    +{hiddenUsers.length}
                  </Avatar>
                </Tooltip>
              )}
            </Box>
            
            {expandedUsers && hasHiddenUsers && (
              <Fade in={expandedUsers}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {hiddenUsers.map((user) => (
                    <UserAvatar
                      key={user.userId}
                      user={user}
                      size={32}
                      onClick={(e) => handleUserClick(user, e)}
                    />
                  ))}
                </Box>
              </Fade>
            )}
          </CardContent>
        </Card>
      );

    default: // 'avatars'
      return (
        <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {visibleUsers.map((user, index) => (
            <Zoom key={user.userId} in timeout={200 * (index + 1)}>
              <Box>
                <UserAvatar
                  user={user}
                  size={32}
                  onClick={(e) => handleUserClick(user, e)}
                />
              </Box>
            </Zoom>
          ))}
          
          {hasHiddenUsers && (
            <Tooltip title={`${hiddenUsers.length} more users`}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.300',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedUsers(true)}
              >
                +{hiddenUsers.length}
              </Avatar>
            </Tooltip>
          )}

          {/* User Details Popover */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            {selectedUser && renderUserDetails(selectedUser)}
          </Popover>
        </Box>
      );
  }
};

// PropTypes
UserAvatar.propTypes = {
  user: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    presence: PropTypes.object
  }).isRequired,
  size: PropTypes.number,
  showStatus: PropTypes.bool,
  onClick: PropTypes.func
};

UserActivityIndicator.propTypes = {
  user: PropTypes.shape({
    presence: PropTypes.object
  }).isRequired,
  compact: PropTypes.bool
};

UserPresenceIndicator.propTypes = {
  variant: PropTypes.oneOf(['avatars', 'list', 'compact', 'detailed']),
  maxVisible: PropTypes.number,
  showCurrentUser: PropTypes.bool,
  showActivity: PropTypes.bool,
  onUserClick: PropTypes.func,
  className: PropTypes.string
};

export default UserPresenceIndicator;
export { UserAvatar, UserActivityIndicator }; 