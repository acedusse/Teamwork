import React, { useEffect, useRef } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, useTheme, useMediaQuery, Tooltip, Divider, Avatar, Box, Typography } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ViewKanban as TaskBoardIcon,
  Upload as PRDIcon,
  Timeline as SprintIcon,
  AccountTree as DependenciesIcon,
  Settings as SettingsIcon,
  Speed as PerformanceIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  GroupWork as GroupWorkIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import focusManager from '../services/focusManagement';
import ariaManager from '../services/ariaManager';
import { useHoverPreloader } from '../utils/LazyComponentWrapper';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 65;

// Route preloading functions - these match the lazy imports in App.jsx
const routePreloaders = {
  dashboard: () => import('../pages/Dashboard'),
  tasks: () => import('../pages/TaskBoard'),
  prd: () => [
    import('../components/PRDUpload'),
    import('../components/PRDPreview'),
    import('../components/PRDEditor')
  ],
  sprints: () => import('../pages/SprintPlanning'),
  dependencies: () => import('../components/DependencyGraph'),
  performance: () => import('../components/PerformanceDashboard'),
  'bucket-planning': () => import('../pages/BucketPlanningPage'),
  settings: () => import('../pages/Settings')
};

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', key: 'dashboard' },
  { text: 'Task Board', icon: <TaskBoardIcon />, path: '/tasks', key: 'tasks' },
  { text: 'PRD Editor', icon: <PRDIcon />, path: '/prd', key: 'prd' },
  { text: 'Sprint Planning', icon: <SprintIcon />, path: '/sprints', key: 'sprints' },
  { text: 'Dependencies', icon: <DependenciesIcon />, path: '/dependencies', key: 'dependencies' },
  { text: 'Performance', icon: <PerformanceIcon />, path: '/performance', key: 'performance' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', key: 'settings' },
  { text: 'Collaborative Planning', icon: <GroupWorkIcon />, path: '/collaborative-planning', key: 'collaborative-planning' },
  { text: 'Bucket Planning', icon: <TaskBoardIcon />, path: '/bucket-planning', key: 'bucket-planning' }
];

// Demo/Development menu items (only shown in development)
const demoMenuItems = [
  { text: 'Modal Demo', icon: <PersonIcon />, path: '/demo/modals', key: 'modal-demo' }
];

export default function Sidebar({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const navigationCleanupRef = useRef(null);
  const { createHoverPreloader } = useHoverPreloader();

  // Set up keyboard navigation for the sidebar
  useEffect(() => {
    if (sidebarRef.current && open) {
      // Clean up previous navigation setup
      if (navigationCleanupRef.current) {
        navigationCleanupRef.current();
      }

      // Enable arrow key navigation for menu items
      navigationCleanupRef.current = focusManager.enableArrowNavigation(sidebarRef.current, {
        selector: '[role="menuitem"]',
        orientation: 'vertical',
        wrap: true,
        homeEndKeys: true,
        onItemSelect: (item) => {
          // Trigger navigation when item is selected with Enter or Space
          item.click();
        }
      });
    }

    // Cleanup on unmount or when closed
    return () => {
      if (navigationCleanupRef.current) {
        navigationCleanupRef.current();
        navigationCleanupRef.current = null;
      }
    };
  }, [open]);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const drawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const handleKeyDown = (event, path) => {
    // Additional keyboard support for menu items
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigation(path);
    }
  };

  const isItemActive = (path) => {
    return location.pathname === path;
  };

  // Create hover preloader for a specific route
  const createRoutePreloader = (routeKey) => {
    const preloader = routePreloaders[routeKey];
    if (!preloader) return {};

    return createHoverPreloader(() => {
      const result = preloader();
      // Handle both single imports and array of imports (like PRD page)
      if (Array.isArray(result)) {
        result.forEach(importPromise => {
          if (importPromise && typeof importPromise.then === 'function') {
            importPromise.catch(() => {}); // Silently handle preload errors
          }
        });
      } else if (result && typeof result.then === 'function') {
        result.catch(() => {}); // Silently handle preload errors
      }
    });
  };

  const drawerContent = (
    <Box
      ref={sidebarRef}
      sx={{ 
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      role="navigation"
      aria-label="Main navigation menu"
      id="sidebar-navigation"
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 1,
        minHeight: '64px' // Match AppBar height
      }}
      role="banner"
      >
        {!collapsed && (
          <Typography 
            variant="h6" 
            noWrap 
            sx={{ ml: 1 }}
            component="div"
            role="text"
            aria-label="Application name"
          >
            Taskmaster
          </Typography>
        )}
        <IconButton 
          onClick={isMobile ? onClose : toggleCollapse}
          aria-label={isMobile ? 'Close navigation menu' : (collapsed ? 'Expand navigation menu' : 'Collapse navigation menu')}
          aria-expanded={!collapsed}
          aria-controls="navigation-menu"
        >
          {isMobile ? <ChevronLeftIcon /> : (collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />)}
        </IconButton>
      </Box>
      <Divider role="separator" />
      <List 
        id="navigation-menu"
        role="menu"
        aria-orientation="vertical"
        aria-label="Main navigation links"
      >
        {menuItems.map((item, index) => {
          // Get hover preloader for this route
          const preloaderProps = createRoutePreloader(item.key);
          
          return (
            <Tooltip 
              key={item.key}
              title={collapsed ? item.text : ''}
              placement="right"
              aria-hidden={!collapsed}
            >
              <ListItem
                button
                component={item.path ? Link : null}
                to={item.path}
                onClick={() => handleNavigation(item.path)}
                onKeyDown={(event) => handleKeyDown(event, item.path)}
                selected={isItemActive(item.path)}
                role="menuitem"
                tabIndex={0}
                aria-current={isItemActive(item.path) ? 'page' : undefined}
                aria-label={`Navigate to ${item.text}`}
                aria-posinset={index + 1}
                aria-setsize={menuItems.length}
                {...preloaderProps} // Add hover preloading
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                    },
                  },
                  '&:focus-visible': {
                    backgroundColor: theme.palette.action.focus,
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: isItemActive(item.path) ? theme.palette.primary.main : 'inherit'
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      'aria-hidden': 'true' // Since the aria-label on the item provides the text
                    }}
                  />
                )}
              </ListItem>
            </Tooltip>
          );
        })}
        
        {/* Demo/Development menu items - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Divider sx={{ my: 1 }} role="separator" />
            {!collapsed && (
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="Development"
                  primaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    sx: { fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }
                  }}
                />
              </ListItem>
            )}
            {demoMenuItems.map((item, index) => (
              <Tooltip 
                key={item.key}
                title={collapsed ? item.text : ''}
                placement="right"
                aria-hidden={!collapsed}
              >
                <ListItem
                  button
                  onClick={() => handleNavigation(item.path)}
                  onKeyDown={(event) => handleKeyDown(event, item.path)}
                  selected={isItemActive(item.path)}
                  role="menuitem"
                  tabIndex={0}
                  aria-current={isItemActive(item.path) ? 'page' : undefined}
                  aria-label={`Navigate to ${item.text}`}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.secondary.light,
                      '&:hover': {
                        backgroundColor: theme.palette.secondary.light,
                      },
                    },
                    '&:focus-visible': {
                      backgroundColor: theme.palette.action.focus,
                      outline: `2px solid ${theme.palette.secondary.main}`,
                      outlineOffset: 2
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 'auto' : 3,
                      justifyContent: 'center',
                      color: isItemActive(item.path) ? theme.palette.secondary.main : 'inherit'
                    }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        'aria-hidden': 'true'
                      }}
                    />
                  )}
                </ListItem>
              </Tooltip>
            ))}
          </>
        )}
      </List>
      <Box sx={{ flexGrow: 1 }} aria-hidden="true" />
      <Divider role="separator" />
      <Box 
        sx={{ p: 2 }}
        role="region"
        aria-label="User profile information"
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1
        }}>
          <Avatar 
            sx={{ bgcolor: theme.palette.primary.main }}
            aria-label="User avatar"
          >
            <PersonIcon aria-hidden="true" />
          </Avatar>
          {!collapsed && (
            <Box>
              <Typography 
                variant="subtitle2"
                component="div"
                id="user-name"
              >
                John Doe
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                component="div"
                id="user-role"
                aria-describedby="user-name"
              >
                Project Manager
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        PaperProps={{
          'aria-label': 'Navigation drawer',
          'aria-modal': 'true',
          'role': 'dialog',
        }}
        BackdropProps={{
          'aria-hidden': 'true'
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop drawer
  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        },
      }}
      PaperProps={{
        'aria-label': 'Main navigation sidebar',
        'aria-hidden': !open,
        'role': 'complementary',
      }}
    >
      {drawerContent}
    </Drawer>
  );
} 