import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Groups as CollaborativeIcon,
  ViewColumn as BucketIcon,
  Timeline as SprintIcon,
  Dashboard as ScrumbanIcon,
  TrendingUp as FlowIcon,
  AutoFixHigh as ImprovementIcon
} from '@mui/icons-material';

// Import modal system
import { ModalManagerProvider } from '../modals/ModalManager';
import { useModalIntegration } from '../../hooks/useModalIntegration';

// Import all tab components
import CollaborativePlanningTab from './CollaborativePlanningTab';
import BucketPlanningTab from './BucketPlanningTab';
import SprintPlanningTab from './SprintPlanningTab';
import ScrumbanBoardTab from './ScrumbanBoardTab';
import FlowOptimizationTab from './FlowOptimizationTab';
import ContinuousImprovementTab from './ContinuousImprovementTab';

// Dashboard Modal Context for sharing modal actions across tabs
const DashboardModalContext = createContext();

export const useDashboardModals = () => {
  const context = useContext(DashboardModalContext);
  if (!context) {
    throw new Error('useDashboardModals must be used within a DashboardModalProvider');
  }
  return context;
};

// Styled components matching planning-workflow.html design
const DashboardContainer = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  color: '#333333',
  lineHeight: 1.5,
});

const ContentContainer = styled(Container)({
  maxWidth: '1600px',
  margin: '0 auto',
  padding: '1rem',
  width: '100%',
  '@media (max-width: 767px)': {
    padding: '0.75rem',
  },
});

const Header = styled(Box)({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: '1.25rem',
  borderRadius: '12px',
  marginBottom: '1.25rem',
  textAlign: 'center',
  '@media (max-width: 767px)': {
    padding: '1rem',
    marginBottom: '1rem',
  },
});

const HeaderTitle = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 700,
  color: '#2c3e50',
  marginBottom: '0.5rem',
  textAlign: 'center',
  
  // Tablet optimizations
  '@media (min-width: 768px) and (max-width: 1024px)': {
    fontSize: '1.75rem',
  },
  
  // Mobile optimizations
  '@media (max-width: 767px)': {
    fontSize: '1.5rem',
    marginBottom: '0.375rem',
  },
  
  // Very small screens
  '@media (max-width: 575px)': {
    fontSize: '1.25rem',
    lineHeight: 1.3,
  },
});

const HeaderSubtitle = styled(Typography)({
  color: '#666666',
  textAlign: 'center',
  fontSize: '1rem',
  marginBottom: '1rem',
  
  // Tablet optimizations
  '@media (min-width: 768px) and (max-width: 1024px)': {
    fontSize: '0.9rem',
  },
  
  // Mobile optimizations
  '@media (max-width: 767px)': {
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
  
  // Very small screens
  '@media (max-width: 575px)': {
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    // Break subtitle into multiple lines on very small screens
    '&::after': {
      content: '"\\A"',
      whiteSpace: 'pre',
    },
  },
});

const FlowMetrics = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem',
  
  // Desktop optimizations
  '@media (min-width: 1025px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
  },
  
  // Tablet optimizations
  '@media (min-width: 768px) and (max-width: 1024px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
  },
  
  // Mobile optimizations
  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  
  // Very small screens
  '@media (max-width: 575px)': {
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
});

const MetricCard = styled(Box)({
  background: '#ffffff',
  borderRadius: '8px',
  padding: '1rem',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  borderLeft: '4px solid #667eea',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  
  // Mobile optimizations
  '@media (max-width: 767px)': {
    padding: '0.75rem',
    borderRadius: '6px',
  },
  
  // Very small screens
  '@media (max-width: 575px)': {
    padding: '0.625rem',
  },
});

const MetricValue = styled(Typography)({
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#2c3e50',
  marginBottom: '0.5rem',
});

const MetricLabel = styled(Typography)({
  color: '#666666',
  fontSize: '0.875rem',
});

const NavTabs = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  padding: '0.75rem',
  marginBottom: '1.25rem',
  display: 'flex',
  gap: '0.5rem',
  position: 'relative',
  
  // Desktop and tablet styles
  '@media (min-width: 768px)': {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  
  // Mobile styles with horizontal scrolling
  '@media (max-width: 767px)': {
    flexDirection: 'row',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '0.5rem',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
      display: 'none', // Chrome, Safari, Edge
    },
    // Add scroll indicators
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '20px',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 1,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '20px',
      background: 'linear-gradient(270deg, rgba(255,255,255,0.95) 0%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 1,
    },
  },
  
  // Very small screens
  '@media (max-width: 575px)': {
    padding: '0.375rem',
    gap: '0.375rem',
  },
}));

const NavTab = styled(Box)(({ active, theme }) => ({
  padding: '1rem',
  border: 'none',
  borderRadius: '8px',
  background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
  color: active ? '#ffffff' : '#666666',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontWeight: 500,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  position: 'relative',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  
  // Enhanced hover and focus states
  '&:hover': {
    background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(102, 126, 234, 0.1)',
    color: active ? '#ffffff' : '#667eea',
    transform: 'translateY(-1px)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
  
  '&:focus-visible': {
    outline: '2px solid #667eea',
    outlineOffset: '2px',
  },
  
  // Desktop styles
  '@media (min-width: 1025px)': {
    flex: 1,
    minWidth: 'auto',
  },
  
  // Tablet styles
  '@media (min-width: 768px) and (max-width: 1024px)': {
    flex: '1 1 calc(50% - 0.25rem)',
    minWidth: '200px',
  },
  
  // Mobile styles
  '@media (max-width: 767px)': {
    flex: '0 0 auto',
    minWidth: '120px',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    // Larger touch targets for mobile
    minHeight: '44px',
  },
  
  // Very small screens - icon only with minimal padding
  '@media (max-width: 575px)': {
    minWidth: '60px',
    padding: '0.625rem 0.5rem',
    fontSize: '0.75rem',
    minHeight: '40px',
    
    // Hide text, show only icons
    '& span': {
      display: 'none',
    },
  },
  
  // Touch device optimizations
  '@media (hover: none) and (pointer: coarse)': {
    minHeight: '48px', // Larger touch targets
    '&:hover': {
      transform: 'none', // Disable hover animations on touch devices
    },
  },
}));

const TabContent = styled(Box)({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  padding: '1.25rem',
  minHeight: '600px',
  '@media (max-width: 767px)': {
    padding: '1rem',
    minHeight: '400px',
  },
});

// Tab configuration with icons, labels, and route paths
const tabConfig = [
  {
    id: 'collaborative-planning',
    path: 'collaborative-planning',
    label: 'Collaborative Planning',
    icon: <CollaborativeIcon />,
    component: CollaborativePlanningTab,
    description: 'AI-powered collaborative planning with phase tracking and ideation'
  },
  {
    id: 'bucket-planning',
    path: 'bucket-planning',
    label: 'Bucket Planning',
    icon: <BucketIcon />,
    component: BucketPlanningTab,
    description: 'Time horizon planning with drag-and-drop story allocation'
  },
  {
    id: 'sprint-planning',
    path: 'sprint-planning',
    label: 'Sprint Planning',
    icon: <SprintIcon />,
    component: SprintPlanningTab,
    description: 'Sprint setup, story selection, and capacity planning'
  },
  {
    id: 'scrumban-board',
    path: 'scrumban-board',
    label: 'Scrumban Board',
    icon: <ScrumbanIcon />,
    component: ScrumbanBoardTab,
    description: 'Kanban board with WIP limits and real-time collaboration'
  },
  {
    id: 'flow-optimization',
    path: 'flow-optimization',
    label: 'Flow Optimization',
    icon: <FlowIcon />,
    component: FlowOptimizationTab,
    description: 'Metrics, bottleneck detection, and optimization insights'
  },
  {
    id: 'continuous-improvement',
    path: 'continuous-improvement',
    label: 'Continuous Improvement',
    icon: <ImprovementIcon />,
    component: ContinuousImprovementTab,
    description: 'Retrospectives, action items, and improvement tracking'
  }
];

// Custom hook for tab state management with React Router integration and persistence
const useTabState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Constants for localStorage
  const STORAGE_KEY = 'dashboard-active-tab';
  const STORAGE_TIMESTAMP_KEY = 'dashboard-tab-timestamp';
  const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Determine active tab from URL parameter
  const getActiveTabFromUrl = () => {
    if (!tab) return 0; // Default to first tab
    
    const tabIndex = tabConfig.findIndex(config => config.path === tab);
    return tabIndex !== -1 ? tabIndex : 0;
  };

  // Get stored tab from localStorage with validation
  const getStoredTab = () => {
    try {
      const storedTab = localStorage.getItem(STORAGE_KEY);
      const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      if (!storedTab || !storedTimestamp) return null;
      
      // Check if stored data is expired
      const isExpired = Date.now() - parseInt(storedTimestamp) > STORAGE_EXPIRY_MS;
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        return null;
      }
      
      const tabIndex = parseInt(storedTab);
      
      // Validate stored tab index
      if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabConfig.length) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        return null;
      }
      
      return tabIndex;
    } catch (error) {
      console.warn('Failed to retrieve stored tab state:', error);
      return null;
    }
  };

  // Initialize active tab with proper priority: URL > localStorage > default
  const initializeActiveTab = () => {
    // Priority 1: URL parameter (deep linking)
    if (tab) {
      return getActiveTabFromUrl();
    }
    
    // Priority 2: localStorage (session restoration)
    const storedTab = getStoredTab();
    if (storedTab !== null) {
      return storedTab;
    }
    
    // Priority 3: Default to first tab
    return 0;
  };

  const [activeTab, setActiveTab] = useState(initializeActiveTab);

  // Update active tab when URL changes (handles browser navigation)
  useEffect(() => {
    const newActiveTab = getActiveTabFromUrl();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [tab, activeTab]);

  // Persist active tab to localStorage with timestamp
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTab.toString());
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to persist tab state:', error);
    }
  }, [activeTab]);

  // Handle initial navigation when component mounts without URL tab parameter
  useEffect(() => {
    // Only navigate if there's no tab in URL but we have a stored/default tab
    if (!tab && activeTab !== 0) {
      const targetTab = tabConfig[activeTab];
      if (targetTab) {
        navigate(`/dashboard/${targetTab.path}`, { replace: true });
      }
    }
  }, []); // Only run on mount

  const handleTabChange = (event, newValue) => {
    if (newValue === activeTab) return; // No change needed
    
    // Validate new tab index
    if (newValue < 0 || newValue >= tabConfig.length) {
      console.warn('Invalid tab index:', newValue);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Navigate to the new tab URL
    const targetTab = tabConfig[newValue];
    if (targetTab) {
      navigate(`/dashboard/${targetTab.path}`, { replace: false });
    }
    
    // Simulate component loading delay for better UX
    setTimeout(() => {
      setActiveTab(newValue);
      setLoading(false);
    }, 150);
  };

  // Method to clear stored tab state (useful for testing or reset)
  const clearStoredState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear stored tab state:', error);
    }
  };

  return {
    activeTab,
    loading,
    error,
    handleTabChange,
    setError,
    clearStoredState
  };
};

// Flow metrics data (can be moved to a service later)
const getFlowMetrics = () => {
  return [
    { value: '76%', label: 'Flow Efficiency', color: '#28a745' },
    { value: '4.1d', label: 'Lead Time', color: '#ffc107' },
    { value: '8.2', label: 'Throughput', color: '#667eea' },
  ];
};

// Dashboard Modal Provider Component
const DashboardModalProvider = ({ children }) => {
  const modalActions = useModalIntegration();
  
  // Enhanced modal actions specific to dashboard functionality
  const dashboardModalActions = {
    ...modalActions,
    
    // Session management
    createBrainstormingSession: (sessionData = {}) => {
      return modalActions.manageSession({
        ...sessionData,
        type: 'brainstorming',
        title: 'Create Brainstorming Session'
      });
    },
    
    schedulePlanningSession: (sessionData = {}) => {
      return modalActions.manageSession({
        ...sessionData,
        type: 'planning',
        title: 'Schedule Planning Session'
      });
    },
    
    // Agent management
    addAIAgent: (agentData = {}) => {
      return modalActions.configureAgent({
        ...agentData,
        title: 'Add AI Agent to Session'
      });
    },
    
    configureAgentCapabilities: (agent) => {
      return modalActions.configureAgent({
        agent,
        title: 'Configure Agent Capabilities'
      });
    },
    
    // Task management
    createTaskFromIdea: (ideaData) => {
      return modalActions.createTask({
        initialData: {
          title: ideaData.title || '',
          description: ideaData.description || '',
          type: 'feature',
          source: 'brainstorming'
        },
        title: 'Create Task from Idea'
      });
    },
    
    pullTaskFromBacklog: () => {
      return modalActions.openTask({
        mode: 'select',
        title: 'Pull Task from Backlog',
        showBacklogTasks: true
      });
    },
    
    // Sprint management
    commitSprint: (sprintData) => {
      return modalActions.confirm(
        'Are you sure you want to commit this sprint? This will lock the sprint scope and start the development cycle.',
        {
          title: 'Commit Sprint',
          confirmText: 'Commit Sprint',
          cancelText: 'Continue Planning',
          type: 'warning'
        }
      );
    },
    
    runSprintSimulation: (sprintData) => {
      return modalActions.openForm({
        title: 'Sprint Simulation Parameters',
        fields: [
          { name: 'iterations', label: 'Simulation Iterations', type: 'number', defaultValue: 1000 },
          { name: 'velocityVariance', label: 'Velocity Variance (%)', type: 'number', defaultValue: 15 },
          { name: 'includeRisks', label: 'Include Risk Factors', type: 'checkbox', defaultValue: true }
        ]
      });
    },
    
    // Dependency management
    showDependencyGraph: (tasks = []) => {
      return modalActions.manageDependencies(tasks, null);
    },
    
    // Retrospective management
    createRetrospective: () => {
      return modalActions.openForm({
        title: 'Create Sprint Retrospective',
        fields: [
          { name: 'sprintName', label: 'Sprint Name', type: 'text', required: true },
          { name: 'facilitator', label: 'Facilitator', type: 'select', options: ['Product Owner', 'Scrum Master', 'Team Lead'] },
          { name: 'duration', label: 'Duration (minutes)', type: 'number', defaultValue: 90 },
          { name: 'format', label: 'Format', type: 'select', options: ['Start/Stop/Continue', 'What Went Well/What Didn\'t/Actions', 'Mad/Sad/Glad'] }
        ]
      });
    },
    
    // Flow optimization
    showOptimizationSuggestions: (metrics) => {
      return modalActions.showInfo({
        title: 'Flow Optimization Suggestions',
        content: 'Based on your current metrics, here are some optimization suggestions...',
        actions: [
          { label: 'Apply Suggestions', action: 'apply' },
          { label: 'Schedule Review', action: 'schedule' },
          { label: 'Export Report', action: 'export' }
        ]
      });
    }
  };
  
  return (
    <DashboardModalContext.Provider value={dashboardModalActions}>
      {children}
    </DashboardModalContext.Provider>
  );
};

const MainDashboard = () => {
  // Enhanced responsive breakpoints for better device targeting
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isSmallScreen = useMediaQuery('(max-width: 575px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const isLargeScreen = useMediaQuery('(min-width: 1025px)');
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');
  
  const { activeTab, loading, error, handleTabChange, setError, clearStoredState } = useTabState();

  // State for mobile navigation patterns
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [tabScrollPosition, setTabScrollPosition] = useState(0);

  // Enhanced keyboard navigation support with modal shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + number keys to switch tabs
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '6') {
        event.preventDefault();
        const tabIndex = parseInt(event.key) - 1;
        if (tabIndex < tabConfig.length) {
          handleTabChange(null, tabIndex);
        }
      }
      
      // Arrow key navigation for accessibility
      if (event.target.closest('[role="tablist"]')) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const direction = event.key === 'ArrowLeft' ? -1 : 1;
          const newIndex = Math.max(0, Math.min(tabConfig.length - 1, activeTab + direction));
          handleTabChange(null, newIndex);
        }
      }
      
      // Modal shortcuts (only when not in input fields)
      if (!event.target.matches('input, textarea, select, [contenteditable]')) {
        // Escape key to close all modals
        if (event.key === 'Escape') {
          // The ModalManager will handle this automatically
          return;
        }
        
        // Quick modal shortcuts (Ctrl/Cmd + key combinations)
        if (event.ctrlKey || event.metaKey) {
          switch (event.key.toLowerCase()) {
            case 't':
              event.preventDefault();
              // Quick task creation
              break;
            case 'a':
              event.preventDefault();
              // Quick agent addition
              break;
            case 's':
              event.preventDefault();
              // Quick session creation
              break;
            case 'd':
              event.preventDefault();
              // Quick dependency view
              break;
            default:
              break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange, activeTab]);

  // Touch gesture support for mobile tab switching
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let isScrolling = false;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
    };

    const handleTouchMove = (e) => {
      if (!startX || !startY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - startX);
      const diffY = Math.abs(currentY - startY);

      // Determine if user is scrolling vertically
      if (diffY > diffX) {
        isScrolling = true;
      }
    };

    const handleTouchEnd = (e) => {
      if (!startX || isScrolling) return;

      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      const threshold = 50; // Minimum swipe distance

      // Swipe left (next tab) or right (previous tab)
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && activeTab < tabConfig.length - 1) {
          // Swipe left - next tab
          handleTabChange(null, activeTab + 1);
        } else if (diffX < 0 && activeTab > 0) {
          // Swipe right - previous tab
          handleTabChange(null, activeTab - 1);
        }
      }

      startX = 0;
      startY = 0;
    };

    const tabContent = document.querySelector('[data-tab-content="true"]');
    if (tabContent) {
      tabContent.addEventListener('touchstart', handleTouchStart, { passive: true });
      tabContent.addEventListener('touchmove', handleTouchMove, { passive: true });
      tabContent.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        tabContent.removeEventListener('touchstart', handleTouchStart);
        tabContent.removeEventListener('touchmove', handleTouchMove);
        tabContent.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, activeTab, handleTabChange]);

  // Enhanced tab change handler with mobile optimizations
  const handleEnhancedTabChange = (event, newValue) => {
    // Close mobile dropdown if open
    setShowMobileDropdown(false);
    
    // Handle the tab change
    handleTabChange(event, newValue);
    
    // Scroll active tab into view on mobile
    if (isMobile) {
      setTimeout(() => {
        const activeTabElement = document.querySelector(`[data-tab-index="${newValue}"]`);
        if (activeTabElement) {
          activeTabElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'center' 
          });
        }
      }, 100);
    }
  };

  // Error boundary for tab components
  const handleComponentError = (error, errorInfo) => {
    console.error('Tab component error:', error, errorInfo);
    setError(`Error loading ${tabConfig[activeTab]?.label}: ${error.message}`);
  };

  // Get flow metrics data
  const flowMetrics = getFlowMetrics();

  return (
    <ModalManagerProvider
      enableDeepLinking={true}
      enableHistory={true}
      enableNotifications={true}
      maxStackSize={10}
    >
      <DashboardModalProvider>
        <DashboardContainer>
          <ContentContainer>
        {/* Header */}
        <Header>
          <HeaderTitle component="h1">
            🚀 Scrumban AI Development Dashboard
          </HeaderTitle>
          <HeaderSubtitle>
            Collaborative Planning • Pull-Based Flow • Continuous Optimization
          </HeaderSubtitle>
          
          {/* Flow Metrics */}
          <FlowMetrics>
            {flowMetrics.map((metric, index) => (
              <MetricCard key={index} sx={{ borderLeftColor: metric.color }}>
                <MetricValue>{metric.value}</MetricValue>
                <MetricLabel>{metric.label}</MetricLabel>
              </MetricCard>
            ))}
          </FlowMetrics>
        </Header>

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <NavTabs role="tablist" aria-label="Dashboard navigation tabs">
          {tabConfig.map((tab, index) => (
            <NavTab
              key={tab.id}
              data-tab-index={index}
              active={activeTab === index}
              onClick={() => handleEnhancedTabChange(null, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEnhancedTabChange(null, index);
                }
              }}
              role="tab"
              tabIndex={activeTab === index ? 0 : -1}
              aria-selected={activeTab === index}
              aria-controls={`tabpanel-${tab.id}`}
              aria-label={`${tab.label} tab`}
              title={tab.description}
            >
              {tab.icon}
              {!isSmallScreen && <span>{tab.label}</span>}
              
              {/* Mobile: Show active indicator */}
              {isMobile && activeTab === index && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px',
                    height: '3px',
                    backgroundColor: '#ffffff',
                    borderRadius: '2px',
                  }}
                />
              )}
            </NavTab>
          ))}
          
          {/* Mobile: Tab position indicator */}
          {isMobile && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '4px',
                zIndex: 2,
              }}
            >
              {tabConfig.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: activeTab === index ? '#667eea' : 'rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>
          )}
        </NavTabs>

        {/* Loading Indicator */}
        {loading && (
          <TabContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
                flexDirection: 'column',
                gap: 2
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body2">
                Loading {tabConfig[activeTab]?.label}...
              </Typography>
            </Box>
          </TabContent>
        )}

        {/* Tab Content */}
        {!loading && (
          <TabContent 
            data-tab-content="true"
            role="tabpanel"
            id={`tabpanel-${tabConfig[activeTab].id}`}
            aria-labelledby={`tab-${tabConfig[activeTab].id}`}
          >
            <Fade in={true} timeout={300}>
              <Box>
                {/* Mobile: Swipe hint */}
                {isMobile && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      mb: 2,
                      padding: '8px 16px',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      color: '#667eea',
                      margin: '0 auto 16px',
                      width: 'fit-content',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      ← Swipe to navigate tabs →
                    </Typography>
                  </Box>
                )}
                
                <ErrorBoundary onError={handleComponentError}>
                  {React.createElement(tabConfig[activeTab].component)}
                </ErrorBoundary>
              </Box>
            </Fade>
          </TabContent>
        )}

        {/* Enhanced Navigation Help */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: isMobile ? 1.5 : 1,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            fontSize: '0.75rem',
            color: '#666666',
            maxWidth: isMobile ? '280px' : '220px',
            zIndex: 1000,
          }}
        >
          {!isMobile ? (
            // Desktop/Tablet shortcuts
            <>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                ⌨️ Keyboard Shortcuts
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Ctrl/Cmd + 1-6: Switch tabs
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                ← → Arrow keys: Navigate tabs
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Esc: Close modals
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Ctrl/Cmd + T: Quick task
              </Typography>
              {process.env.NODE_ENV === 'development' && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    cursor: 'pointer', 
                    color: '#1976d2',
                    mt: 0.5,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={clearStoredState}
                  title="Clear stored tab state (dev only)"
                >
                  🔧 Clear Tab State
                </Typography>
              )}
            </>
          ) : (
            // Mobile navigation tips
            <>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                📱 Navigation Tips
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Swipe left/right to switch tabs
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Scroll tab bar horizontally
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Tap dots below for quick access
              </Typography>
              {process.env.NODE_ENV === 'development' && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    cursor: 'pointer', 
                    color: '#1976d2',
                    mt: 0.5,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={clearStoredState}
                  title="Clear stored tab state (dev only)"
                >
                  🔧 Clear State
                </Typography>
              )}
            </>
          )}
        </Box>
          </ContentContainer>
        </DashboardContainer>
      </DashboardModalProvider>
    </ModalManagerProvider>
  );
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6">Something went wrong</Typography>
          <Typography variant="body2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default MainDashboard; 