import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';

// Performance monitoring hook
export function usePerformanceMonitor(componentName) {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTimes, setRenderTimes] = useState([]);
  const [lastRenderTime, setLastRenderTime] = useState(null);

  useEffect(() => {
    const startTime = performance.now();
    setRenderCount(prev => prev + 1);
    
    // Measure render time
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      setLastRenderTime(renderTime);
      setRenderTimes(prev => [...prev.slice(-9), renderTime]); // Keep last 10 renders
    });
  });

  const averageRenderTime = useMemo(() => {
    if (renderTimes.length === 0) return 0;
    return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  }, [renderTimes]);

  const resetMetrics = useCallback(() => {
    setRenderCount(0);
    setRenderTimes([]);
    setLastRenderTime(null);
  }, []);

  return {
    renderCount,
    lastRenderTime,
    averageRenderTime,
    renderTimes,
    resetMetrics
  };
}

// Main Performance Monitor Component
const PerformanceMonitor = React.memo(function PerformanceMonitor({
  components = [],
  showDetailedMetrics = false,
  onExportMetrics = null
}) {
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Track memory usage if available
  useEffect(() => {
    if (!performance.memory) return;

    const updateMemoryUsage = () => {
      if (performance.memory) {
        setMemoryUsage({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExportMetrics = useCallback(() => {
    const metricsData = {
      timestamp: new Date().toISOString(),
      components,
      memoryUsage,
      userAgent: navigator.userAgent
    };
    
    onExportMetrics?.(metricsData);
    
    // Also create downloadable JSON
    const dataStr = JSON.stringify(metricsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [components, memoryUsage, onExportMetrics]);

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getPerformanceColor = useCallback((value, threshold = 16) => {
    if (value < threshold * 0.5) return 'success';
    if (value < threshold) return 'warning';
    return 'error';
  }, []);

  const totalRenderCount = useMemo(() => 
    components.reduce((sum, comp) => sum + (comp.renderCount || 0), 0), 
    [components]
  );

  const averageRenderTime = useMemo(() => {
    const validComponents = components.filter(comp => comp.averageRenderTime > 0);
    if (validComponents.length === 0) return 0;
    return validComponents.reduce((sum, comp) => sum + comp.averageRenderTime, 0) / validComponents.length;
  }, [components]);

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <SpeedIcon color="primary" />
            <Typography variant="h6">Performance Monitor</Typography>
            <Chip 
              label={isMonitoring ? 'Active' : 'Paused'} 
              color={isMonitoring ? 'success' : 'default'}
              size="small"
            />
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Toggle Monitoring">
              <IconButton onClick={() => setIsMonitoring(!isMonitoring)}>
                <SpeedIcon />
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<AssessmentIcon />}
              onClick={handleExportMetrics}
              variant="outlined"
              size="small"
            >
              Export Metrics
            </Button>
          </Stack>
        </Stack>

        {/* Overall Statistics */}
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            icon={<RefreshIcon />}
            label={`Total Renders: ${totalRenderCount}`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            icon={<SpeedIcon />}
            label={`Avg Render: ${averageRenderTime.toFixed(2)}ms`}
            color={getPerformanceColor(averageRenderTime)}
            variant="outlined"
          />
          {memoryUsage && (
            <Chip 
              icon={<MemoryIcon />}
              label={`Memory: ${formatBytes(memoryUsage.used)}`}
              color="info"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Performance Alerts */}
        {averageRenderTime > 16 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Some components are rendering slower than the 16ms target for 60fps. 
              Consider optimizing with React.memo, useMemo, or useCallback.
            </Typography>
          </Alert>
        )}

        {memoryUsage && memoryUsage.used / memoryUsage.total > 0.8 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              High memory usage detected ({((memoryUsage.used / memoryUsage.total) * 100).toFixed(1)}%). 
              Consider checking for memory leaks or large object references.
            </Typography>
          </Alert>
        )}

        {/* Component Performance Table */}
        {components.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Component</strong></TableCell>
                  <TableCell align="right"><strong>Renders</strong></TableCell>
                  <TableCell align="right"><strong>Last Render (ms)</strong></TableCell>
                  <TableCell align="right"><strong>Avg Render (ms)</strong></TableCell>
                  <TableCell align="right"><strong>Performance</strong></TableCell>
                  <TableCell align="center"><strong>Trend</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {components.map((component, index) => {
                  const performanceColor = getPerformanceColor(component.averageRenderTime || 0);
                  const trend = component.renderTimes?.length >= 2 
                    ? component.renderTimes[component.renderTimes.length - 1] - component.renderTimes[component.renderTimes.length - 2]
                    : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{component.name}</TableCell>
                      <TableCell align="right">{component.renderCount || 0}</TableCell>
                      <TableCell align="right">
                        {component.lastRenderTime ? component.lastRenderTime.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {component.averageRenderTime ? component.averageRenderTime.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={performanceColor === 'success' ? 'Good' : performanceColor === 'warning' ? 'Fair' : 'Poor'}
                          color={performanceColor}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {trend !== 0 && (
                          <Tooltip title={`${trend > 0 ? 'Slower' : 'Faster'} by ${Math.abs(trend).toFixed(2)}ms`}>
                            {trend > 0 ? 
                              <TrendingUpIcon color="error" fontSize="small" /> : 
                              <TrendingDownIcon color="success" fontSize="small" />
                            }
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Memory Usage Details */}
        {showDetailedMetrics && memoryUsage && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Memory Usage</Typography>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {formatBytes(memoryUsage.used)} / {formatBytes(memoryUsage.total)} 
                ({((memoryUsage.used / memoryUsage.total) * 100).toFixed(1)}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(memoryUsage.used / memoryUsage.total) * 100}
              color={memoryUsage.used / memoryUsage.total > 0.8 ? 'error' : 'primary'}
            />
          </Box>
        )}

        {/* Performance Tips */}
        {showDetailedMetrics && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" component="div">
              <strong>Performance Optimization Tips:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Use React.memo for components that render with the same props</li>
                <li>Apply useMemo for expensive calculations</li>
                <li>Use useCallback for event handlers passed as props</li>
                <li>Consider code splitting for large components</li>
                <li>Monitor render times &lt; 16ms for smooth 60fps experience</li>
              </ul>
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
});

export default PerformanceMonitor; 