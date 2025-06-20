import React, { useState, useEffect } from 'react';
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
  Sprint as SprintIcon,
  Dashboard as ScrumbanIcon,
  TrendingUp as FlowIcon,
  AutoFixHigh as ImprovementIcon
} from '@mui/icons-material';

// Import all tab components
import CollaborativePlanningTab from './CollaborativePlanningTab';
import BucketPlanningTab from './BucketPlanningTab';
import SprintPlanningTab from './SprintPlanningTab';
import ScrumbanBoardTab from './ScrumbanBoardTab';
import FlowOptimizationTab from './FlowOptimizationTab';
import ContinuousImprovementTab from './ContinuousImprovementTab';

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
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '0.75rem',
  '@media (max-width: 767px)': {
    fontSize: '1.5rem',
  },
});

const HeaderSubtitle = styled(Typography)({
  color: '#666666',
  marginBottom: '1.25rem',
  '@media (max-width: 767px)': {
    marginBottom: '1rem',
  },
});

const FlowMetrics = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem',
  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
    gap: '0.75rem',
    marginTop: '1rem',
  },
});

const MetricCard = styled(Box)({
  background: '#ffffff',
  borderRadius: '8px',
  padding: '1rem',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  borderLeft: '4px solid #667eea',
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

const NavTabs = styled(Box)({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  padding: '0.75rem',
  marginBottom: '1.25rem',
  display: 'flex',
  gap: '0.5rem',
  '@media (max-width: 767px)': {
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
});

const NavTab = styled(Box)(({ active, theme }) => ({
  flex: 1,
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
  '&:hover': {
    background: active ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(102, 126, 234, 0.1)',
    color: active ? '#ffffff' : '#667eea',
  },
  '@media (max-width: 767px)': {
    padding: '0.75rem',
    fontSize: '0.875rem',
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

// Custom hook for tab state management with React Router integration
const useTabState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine active tab from URL parameter
  const getActiveTabFromUrl = () => {
    if (!tab) return 0; // Default to first tab
    
    const tabIndex = tabConfig.findIndex(config => config.path === tab);
    return tabIndex !== -1 ? tabIndex : 0;
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl);

  // Update active tab when URL changes
  useEffect(() => {
    const newActiveTab = getActiveTabFromUrl();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [tab, activeTab]);

  // Persist active tab to localStorage for session restoration
  useEffect(() => {
    localStorage.setItem('dashboard-active-tab', activeTab.toString());
  }, [activeTab]);

  const handleTabChange = (event, newValue) => {
    if (newValue === activeTab) return; // No change needed
    
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

  return {
    activeTab,
    loading,
    error,
    handleTabChange,
    setError
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

const MainDashboard = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isSmallScreen = useMediaQuery('(max-width: 575px)');
  
  const { activeTab, loading, error, handleTabChange, setError } = useTabState();

  // Keyboard navigation support
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  // Error boundary for tab components
  const handleComponentError = (error, errorInfo) => {
    console.error('Tab component error:', error, errorInfo);
    setError(`Error loading ${tabConfig[activeTab]?.label}: ${error.message}`);
  };

  // Get flow metrics data
  const flowMetrics = getFlowMetrics();

  return (
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
        <NavTabs>
          {tabConfig.map((tab, index) => (
            <NavTab
              key={tab.id}
              active={activeTab === index}
              onClick={() => handleTabChange(null, index)}
              aria-label={`${tab.label} tab`}
              title={tab.description}
            >
              {tab.icon}
              {!isSmallScreen && <span>{tab.label}</span>}
            </NavTab>
          ))}
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
          <TabContent>
            <Fade in={true} timeout={300}>
              <Box>
                <ErrorBoundary onError={handleComponentError}>
                  {React.createElement(tabConfig[activeTab].component)}
                </ErrorBoundary>
              </Box>
            </Fade>
          </TabContent>
        )}

        {/* Keyboard Shortcuts Help */}
        {!isMobile && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.9)',
              padding: 1,
              borderRadius: 1,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              fontSize: '0.75rem',
              color: '#666666',
            }}
          >
            <Typography variant="caption">
              Tip: Use Ctrl/Cmd + 1-6 to switch tabs
            </Typography>
          </Box>
        )}
      </ContentContainer>
    </DashboardContainer>
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