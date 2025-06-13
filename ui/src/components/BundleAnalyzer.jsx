import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload as FileDownloadIcon,
  Memory as MemoryIcon,
  Schedule as ScheduleIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

// Hook to track bundle loading performance
const useBundleTracker = () => {
  const [loadedChunks, setLoadedChunks] = useState(new Map());
  const [loadingTimes, setLoadingTimes] = useState([]);
  const [networkStats, setNetworkStats] = useState({
    totalTransferred: 0,
    totalSize: 0,
    chunkCount: 0
  });

  useEffect(() => {
    // Track dynamic imports and chunk loading
    const originalFetch = window.fetch;
    const loadTimes = new Map();

    window.fetch = async function(...args) {
      const url = args[0];
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        // Track JS chunk loads
        if (typeof url === 'string' && (url.includes('.js') || url.includes('.chunk'))) {
          const contentLength = response.headers.get('content-length');
          const chunkInfo = {
            url,
            loadTime,
            size: contentLength ? parseInt(contentLength) : null,
            timestamp: new Date(),
            cached: response.headers.get('cache-control')?.includes('max-age')
          };

          setLoadedChunks(prev => new Map(prev.set(url, chunkInfo)));
          setLoadingTimes(prev => [...prev.slice(-19), { url, loadTime, timestamp: new Date() }]);
          
          // Update network stats
          setNetworkStats(prev => ({
            totalTransferred: prev.totalTransferred + (chunkInfo.size || 0),
            totalSize: prev.totalSize + (chunkInfo.size || 0),
            chunkCount: prev.chunkCount + 1
          }));
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        if (typeof url === 'string' && (url.includes('.js') || url.includes('.chunk'))) {
          setLoadingTimes(prev => [...prev.slice(-19), { 
            url, 
            loadTime, 
            timestamp: new Date(),
            error: true 
          }]);
        }
        
        throw error;
      }
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const resetStats = useCallback(() => {
    setLoadedChunks(new Map());
    setLoadingTimes([]);
    setNetworkStats({
      totalTransferred: 0,
      totalSize: 0,
      chunkCount: 0
    });
  }, []);

  return {
    loadedChunks,
    loadingTimes,
    networkStats,
    resetStats
  };
};

// Main Bundle Analyzer Component
const BundleAnalyzer = React.memo(function BundleAnalyzer({
  showDetailedView = false,
  onExportData = null
}) {
  const { loadedChunks, loadingTimes, networkStats, resetStats } = useBundleTracker();
  const [performanceEntries, setPerformanceEntries] = useState([]);

  // Track Navigation Timing API data
  useEffect(() => {
    const updatePerformanceEntries = () => {
      if (performance.getEntriesByType) {
        const entries = performance.getEntriesByType('navigation');
        setPerformanceEntries(entries);
      }
    };

    updatePerformanceEntries();
    const interval = setInterval(updatePerformanceEntries, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const chunks = Array.from(loadedChunks.values());
    const avgLoadTime = chunks.length > 0 
      ? chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / chunks.length 
      : 0;
    
    const totalSize = chunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0);
    const cachedChunks = chunks.filter(chunk => chunk.cached).length;
    
    const recentLoadTimes = loadingTimes.slice(-10);
    const avgRecentLoadTime = recentLoadTimes.length > 0
      ? recentLoadTimes.reduce((sum, entry) => sum + entry.loadTime, 0) / recentLoadTimes.length
      : 0;

    return {
      totalChunks: chunks.length,
      avgLoadTime,
      totalSize,
      cachedChunks,
      cacheHitRate: chunks.length > 0 ? (cachedChunks / chunks.length) * 100 : 0,
      avgRecentLoadTime,
      failedLoads: loadingTimes.filter(entry => entry.error).length
    };
  }, [loadedChunks, loadingTimes]);

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatTime = useCallback((ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  const getPerformanceColor = useCallback((value, thresholds = { good: 100, fair: 500 }) => {
    if (value < thresholds.good) return 'success';
    if (value < thresholds.fair) return 'warning';
    return 'error';
  }, []);

  const handleExportData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      loadedChunks: Array.from(loadedChunks.entries()),
      loadingTimes,
      networkStats,
      performanceEntries,
      userAgent: navigator.userAgent
    };

    onExportData?.(data);

    // Create downloadable JSON
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bundle-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metrics, loadedChunks, loadingTimes, networkStats, performanceEntries, onExportData]);

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Assessment Icon color="primary" />
            <Typography variant="h6">Bundle Performance Analyzer</Typography>
            <Chip 
              label={`${metrics.totalChunks} Chunks Loaded`} 
              color="primary"
              size="small"
            />
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Reset Statistics">
              <IconButton onClick={resetStats}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={handleExportData}
              variant="outlined"
              size="small"
            >
              Export Data
            </Button>
          </Stack>
        </Stack>

        {/* Key Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CloudDownloadIcon color="primary" />
                  <Typography variant="h6">{metrics.totalChunks}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Total Chunks Loaded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleIcon color={getPerformanceColor(metrics.avgLoadTime)} />
                  <Typography variant="h6">{formatTime(metrics.avgLoadTime)}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Avg Load Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MemoryIcon color="info" />
                  <Typography variant="h6">{formatBytes(metrics.totalSize)}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Total Bundle Size
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SpeedIcon color="success" />
                  <Typography variant="h6">{metrics.cacheHitRate.toFixed(1)}%</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Cache Hit Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Alerts */}
        {metrics.avgLoadTime > 1000 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Average chunk load time is over 1 second. Consider optimizing chunk sizes or implementing better caching strategies.
          </Alert>
        )}

        {metrics.failedLoads > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {metrics.failedLoads} chunk load(s) failed. Check network connectivity and chunk availability.
          </Alert>
        )}

        {metrics.cacheHitRate < 50 && metrics.totalChunks > 3 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Low cache hit rate detected. Implementing proper cache headers could improve performance.
          </Alert>
        )}

        {/* Detailed View */}
        {showDetailedView && (
          <>
            {/* Load Times Chart */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Recent Load Times</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  {loadingTimes.slice(-10).map((entry, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                          {entry.url.split('/').pop()}
                        </Typography>
                        <Chip 
                          label={formatTime(entry.loadTime)}
                          size="small"
                          color={getPerformanceColor(entry.loadTime)}
                          variant="outlined"
                        />
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((entry.loadTime / 2000) * 100, 100)}
                        color={getPerformanceColor(entry.loadTime)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Loaded Chunks Table */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Loaded Chunks Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Chunk</strong></TableCell>
                        <TableCell align="right"><strong>Size</strong></TableCell>
                        <TableCell align="right"><strong>Load Time</strong></TableCell>
                        <TableCell align="center"><strong>Cached</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from(loadedChunks.values()).map((chunk, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {chunk.url.split('/').pop()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {chunk.size ? formatBytes(chunk.size) : 'Unknown'}
                          </TableCell>
                          <TableCell align="right">
                            {formatTime(chunk.loadTime)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={chunk.cached ? 'Yes' : 'No'}
                              size="small"
                              color={chunk.cached ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={chunk.loadTime < 500 ? 'Fast' : chunk.loadTime < 1000 ? 'Good' : 'Slow'}
                              size="small"
                              color={getPerformanceColor(chunk.loadTime)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* Optimization Tips */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" component="div">
            <strong>Code Splitting Optimization Tips:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Target chunk load times under 500ms for optimal user experience</li>
              <li>Implement proper cache headers for better cache hit rates</li>
              <li>Use route-based splitting for logical code boundaries</li>
              <li>Consider preloading critical chunks on user interaction</li>
              <li>Monitor bundle size growth and split large components</li>
            </ul>
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
});

export default BundleAnalyzer; 