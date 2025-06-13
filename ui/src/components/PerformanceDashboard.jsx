import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import performanceMonitor, { 
  getPerformanceReport, 
  sendPerformanceMetrics 
} from '../services/performanceMonitoring';

const PerformanceDashboard = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshMetrics = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newReport = getPerformanceReport();
      setReport(newReport);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    refreshMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMetrics = async () => {
    try {
      await sendPerformanceMetrics();
      alert('Performance metrics sent successfully!');
    } catch (error) {
      console.error('Failed to send metrics:', error);
      alert('Failed to send metrics. Check console for details.');
    }
  };

  const getMetricColor = (value, thresholds) => {
    const { good, poor } = thresholds;
    if (value <= good) return 'success';
    if (value <= poor) return 'warning';
    return 'error';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MetricCard = ({ title, value, unit, threshold, icon: Icon }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Icon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color="primary">
          {value || 'N/A'}
          {unit && <Typography variant="caption" sx={{ ml: 1 }}>{unit}</Typography>}
        </Typography>
        {threshold && value && (
          <Chip
            label={getMetricColor(value, threshold).toUpperCase()}
            color={getMetricColor(value, threshold)}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );

  const ProgressBar = ({ label, value, max, format = (v) => v }) => (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {format(value)} / {format(max)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        color={value / max > 0.8 ? 'error' : value / max > 0.6 ? 'warning' : 'primary'}
      />
    </Box>
  );

  if (isLoading || !report) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const { metrics, coreWebVitals, performance: performanceGrade } = report;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Performance Dashboard
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={refreshMetrics}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<CloudUploadIcon />}
            onClick={handleSendMetrics}
            variant="contained"
          >
            Send Metrics
          </Button>
        </Box>
      </Box>

      {lastUpdated && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Alert>
      )}

      {/* Performance Grade */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Typography variant="h2" component="div" sx={{ mr: 2 }}>
              {performanceGrade}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Performance Grade
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Core Web Vitals
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="First Contentful Paint"
            value={coreWebVitals.fcp}
            unit="ms"
            threshold={{ good: 1800, poor: 3000 }}
            icon={SpeedIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Largest Contentful Paint"
            value={coreWebVitals.lcp}
            unit="ms"
            threshold={{ good: 2500, poor: 4000 }}
            icon={TimelineIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="First Input Delay"
            value={coreWebVitals.fid}
            unit="ms"
            threshold={{ good: 100, poor: 300 }}
            icon={SpeedIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Time to Interactive"
            value={metrics.timeToInteractive}
            unit="ms"
            threshold={{ good: 3800, poor: 7300 }}
            icon={TimelineIcon}
          />
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Loading Performance</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ProgressBar
                label="Page Load Time"
                value={metrics.pageLoadTime || 0}
                max={5000}
                format={(v) => `${v}ms`}
              />
              <ProgressBar
                label="DOM Content Loaded"
                value={metrics.domContentLoaded || 0}
                max={3000}
                format={(v) => `${v}ms`}
              />
              <ProgressBar
                label="Time to First Byte"
                value={metrics.timeToFirstByte || 0}
                max={1000}
                format={(v) => `${v}ms`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ProgressBar
                label="Total Resources"
                value={metrics.totalResources || 0}
                max={100}
              />
              <ProgressBar
                label="Transfer Size"
                value={metrics.totalTransferSize || 0}
                max={5000000}
                format={formatBytes}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Resource Performance */}
      {metrics.resourceTypes && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Resource Breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resource Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Avg Duration (ms)</TableCell>
                    <TableCell align="right">Total Size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(metrics.resourceTypes).map(([type, data]) => (
                    <TableRow key={type}>
                      <TableCell component="th" scope="row">
                        {type}
                      </TableCell>
                      <TableCell align="right">{data.count}</TableCell>
                      <TableCell align="right">
                        {Math.round(data.totalDuration / data.count)}
                      </TableCell>
                      <TableCell align="right">
                        {formatBytes(data.totalSize)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Slow Resources Alert */}
      {metrics.slowResources && metrics.slowResources.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" color="error">
              Slow Resources ({metrics.slowResources.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              These resources took longer than 1 second to load and may impact performance.
            </Alert>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell align="right">Duration (ms)</TableCell>
                    <TableCell align="right">Size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.slowResources.map((resource, index) => (
                    <TableRow key={index}>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          maxWidth: 300, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={resource.name}
                      >
                        {resource.name}
                      </TableCell>
                      <TableCell align="right" color="error">
                        {resource.duration}
                      </TableCell>
                      <TableCell align="right">
                        {formatBytes(resource.size)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Custom Metrics */}
      {metrics.customMetrics && Object.keys(metrics.customMetrics).length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Custom Application Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(metrics.customMetrics, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default PerformanceDashboard; 