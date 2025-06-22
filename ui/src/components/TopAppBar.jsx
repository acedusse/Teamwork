import { AppBar, Toolbar, IconButton, Typography, InputBase, Badge, Box, Breadcrumbs, Link } from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
  Accessibility as AccessibilityIcon
} from '@mui/icons-material';
import ConnectionStatus from './common/ConnectionStatus';
import NotificationSystem from './common/NotificationSystem';
import { styled, alpha } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import ariaManager from '../services/ariaManager';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

// Skip Link Component for Accessibility
const SkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  left: '-9999px',
  zIndex: theme.zIndex.modal + 1,
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  textDecoration: 'none',
  borderRadius: theme.shape.borderRadius,
  '&:focus': {
    left: theme.spacing(1),
    top: theme.spacing(1),
  },
}));

function getBreadcrumbs(pathname) {
  const routes = {
    '/': { label: 'Dashboard', url: '/' },
    '/dashboard': { label: 'Main Dashboard', url: '/dashboard' },
    '/tasks': { label: 'Task Board', url: '/tasks' },
    '/prd': { label: 'PRD Editor', url: '/prd' },
    '/sprints': { label: 'Sprint Planning', url: '/sprints' },
    '/dependencies': { label: 'Dependencies', url: '/dependencies' },
    '/performance': { label: 'Performance', url: '/performance' },
    '/settings': { label: 'Settings', url: '/settings' },
  };

  // Dashboard tab routes
  const dashboardTabs = {
    'collaborative-planning': 'Collaborative Planning',
    'bucket-planning': 'Bucket Planning',
    'sprint-planning': 'Sprint Planning',
    'scrumban-board': 'Scrumban Board',
    'flow-optimization': 'Flow Optimization',
    'continuous-improvement': 'Continuous Improvement'
  };

  const breadcrumbs = [routes['/']]; // Always start with Dashboard

  // Handle dashboard tab routes
  if (pathname.startsWith('/dashboard')) {
    const dashboardMatch = pathname.match(/^\/dashboard(?:\/(.+))?$/);
    if (dashboardMatch) {
      breadcrumbs.push(routes['/dashboard']);
      
      const tabPath = dashboardMatch[1];
      if (tabPath && dashboardTabs[tabPath]) {
        breadcrumbs.push({
          label: dashboardTabs[tabPath],
          url: `/dashboard/${tabPath}`
        });
      }
    }
  } else if (pathname !== '/' && routes[pathname]) {
    breadcrumbs.push(routes[pathname]);
  }

  return breadcrumbs;
}

export default function TopAppBar({ onMenuClick, onCreateTask }) {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Implement search functionality
      console.log('Search for:', event.target.value);
      // Dispatch search event that other components can listen to
      const searchEvent = new CustomEvent('performSearch', {
        detail: { query: event.target.value }
      });
      document.dispatchEvent(searchEvent);
    }
  };

  const handleSkipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <>
      {/* Skip to Content Link for Screen Readers */}
      <SkipLink 
        href="#main-content" 
        onClick={handleSkipToContent}
        aria-label="Skip to main content"
      >
        Skip to main content
      </SkipLink>
      
      <AppBar 
        position="fixed" 
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        role="banner"
      >
        <Toolbar role="toolbar" aria-label="Main toolbar">
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            aria-expanded="false"
            aria-controls="sidebar-navigation"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="h1"
            aria-level="1"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Taskmaster
          </Typography>
          <Search role="search" aria-label="Search tasks">
            <SearchIconWrapper>
              <SearchIcon aria-hidden="true" />
            </SearchIconWrapper>
            <StyledInputBase
              id="search-input"
              placeholder="Search tasks..."
              inputProps={{ 
                'aria-label': 'Search tasks',
                'role': 'searchbox',
                'aria-describedby': 'search-instructions'
              }}
              onKeyDown={handleSearchKeyDown}
            />
            <div 
              id="search-instructions" 
              className="sr-only"
            >
              Press Enter to search, or use search suggestions
            </div>
          </Search>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" aria-hidden="true" />}
              aria-label="Page navigation breadcrumb"
              role="navigation"
              sx={{ 
                color: 'inherit',
                '& .MuiLink-root': {
                  color: 'inherit',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
              }}
            >
              {breadcrumbs.map((breadcrumb, index) => {
                const isCurrentPage = index === breadcrumbs.length - 1;
                return (
                  <Link
                    key={breadcrumb.url}
                    color="inherit"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isCurrentPage) {
                        navigate(breadcrumb.url);
                      }
                    }}
                    href={breadcrumb.url}
                    sx={{ 
                      cursor: isCurrentPage ? 'default' : 'pointer',
                      opacity: isCurrentPage ? 0.7 : 1,
                    }}
                    aria-current={isCurrentPage ? 'page' : undefined}
                    aria-label={isCurrentPage ? `Current page: ${breadcrumb.label}` : `Navigate to ${breadcrumb.label}`}
                    tabIndex={isCurrentPage ? -1 : 0}
                  >
                    {breadcrumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          </Box>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', ml: 2 }}
            role="toolbar"
            aria-label="Action buttons"
          >
            {/* WebSocket Connection Status */}
            <ConnectionStatus />
            
            {/* Real-time Notifications System */}
            <Box sx={{ ml: 1 }}>
              <NotificationSystem />
            </Box>
                        <IconButton
              color="inherit"
              sx={{ ml: 1 }}
              onClick={onCreateTask}
              aria-label="Create new task"
              aria-describedby="create-task-tooltip"
            >
              <AddIcon />
            </IconButton>
            <div
              id="create-task-tooltip"
              className="sr-only"
            >
              Create a new task or project item
            </div>
            <IconButton
              color="inherit"
              sx={{ ml: 1 }}
              onClick={() => window.open('/accessibility-guide.html', '_blank')}
              aria-label="View accessibility guide"
              aria-describedby="accessibility-guide-tooltip"
            >
              <AccessibilityIcon />
            </IconButton>
            <div
              id="accessibility-guide-tooltip"
              className="sr-only"
            >
              View comprehensive accessibility guide and features
            </div>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
} 