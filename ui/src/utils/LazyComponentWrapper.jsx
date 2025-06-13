import React, { Suspense, lazy, useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Stack,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

// Error Boundary for lazy loaded components
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack spacing={2} alignItems="center">
              <ErrorIcon color="error" sx={{ fontSize: 48 }} />
              <Typography variant="h6" color="error">
                Failed to Load Component
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                There was an error loading this feature. This might be due to a network issue or a temporary problem.
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Reload Page
              </Button>
              {this.props.onRetry && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    this.props.onRetry();
                  }}
                >
                  Try Again
                </Button>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Enhanced Loading Component with performance hints
const EnhancedLoadingSpinner = ({ 
  message = 'Loading...', 
  feature = null,
  showPerformanceHint = false,
  size = 'medium'
}) => {
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoadingTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const sizeMap = {
    small: { spinner: 24, minHeight: '200px' },
    medium: { spinner: 36, minHeight: '300px' },
    large: { spinner: 48, minHeight: '400px' }
  };

  const config = sizeMap[size] || sizeMap.medium;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: config.minHeight,
        gap: 2,
        p: 3
      }}
    >
      <CircularProgress size={config.spinner} color="primary" />
      <Stack spacing={1} alignItems="center">
        {feature && (
          <Typography variant="h6" color="text.primary">
            Loading {feature}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        
        {showPerformanceHint && loadingTime > 2000 && (
          <Stack spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <SpeedIcon color="info" fontSize="small" />
            <Typography variant="caption" color="text.secondary" textAlign="center">
              This feature is being loaded for the first time.<br/>
              Subsequent loads will be faster thanks to caching.
            </Typography>
          </Stack>
        )}
        
        {loadingTime > 5000 && (
          <Alert severity="info" sx={{ mt: 2, maxWidth: 400 }}>
            <Typography variant="caption">
              This is taking longer than expected. Please check your network connection.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

// Preloader function for lazy components
export const preloadComponent = (lazyComponent) => {
  // Trigger the lazy loading function to start downloading the chunk
  if (typeof lazyComponent === 'function') {
    lazyComponent();
  }
};

// HOC for enhanced lazy loading with preloading capabilities
export const createLazyComponent = (
  importFunction,
  options = {}
) => {
  const {
    fallback = null,
    errorFallback = null,
    preload = false,
    feature = null,
    size = 'medium',
    showPerformanceHint = true
  } = options;

  const LazyComponent = lazy(importFunction);

  // Preload if requested
  if (preload) {
    preloadComponent(importFunction);
  }

  const WrappedComponent = (props) => {
    const defaultFallback = (
      <EnhancedLoadingSpinner
        message={`Loading ${feature || 'component'}...`}
        feature={feature}
        size={size}
        showPerformanceHint={showPerformanceHint}
      />
    );

    return (
      <LazyLoadErrorBoundary>
        <Suspense fallback={fallback || defaultFallback}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyLoadErrorBoundary>
    );
  };

  // Add preload method to the wrapped component
  WrappedComponent.preload = () => preloadComponent(importFunction);

  return WrappedComponent;
};

// Hook for route-based preloading
export const useRoutePreloader = () => {
  const [preloadedRoutes, setPreloadedRoutes] = useState(new Set());

  const preloadRoute = (routeName, lazyComponent) => {
    if (!preloadedRoutes.has(routeName)) {
      preloadComponent(lazyComponent);
      setPreloadedRoutes(prev => new Set([...prev, routeName]));
    }
  };

  return { preloadRoute, preloadedRoutes };
};

// Hook for intersection-based preloading (preload when element comes into view)
export const useIntersectionPreloader = (lazyComponents = []) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Preload components when their trigger comes into view
            lazyComponents.forEach(component => {
              if (typeof component === 'function') {
                component();
              }
            });
          }
        });
      },
      { rootMargin: '100px' } // Start loading 100px before element comes into view
    );

    // You can use this observer with refs to specific elements
    return () => observer.disconnect();
  }, [lazyComponents]);
};

// Hook for mouse hover preloading
export const useHoverPreloader = () => {
  const createHoverPreloader = (lazyComponent) => ({
    onMouseEnter: () => preloadComponent(lazyComponent),
    onFocus: () => preloadComponent(lazyComponent)
  });

  return { createHoverPreloader };
};

export default {
  LazyLoadErrorBoundary,
  EnhancedLoadingSpinner,
  createLazyComponent,
  preloadComponent,
  useRoutePreloader,
  useIntersectionPreloader,
  useHoverPreloader
}; 