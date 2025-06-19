import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  Button,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  Assessment,
  PictureAsPdf,
  GetApp,
  Compare,
  Insights,
  ExpandMore,
  Timeline,
  ShowChart,
  BarChart,
  AutoGraph,
  Settings,
  Refresh
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import PropTypes from 'prop-types';

/**
 * AdvancedAnalytics Component
 * 
 * Provides advanced analytics features including:
 * - Burndown charts for sprint and epic tracking
 * - Lead time analysis with statistical insights
 * - Predictive flow modeling using historical data
 * - Export functionality for reports (PDF, CSV)
 * - Comparative analysis (sprint-over-sprint, month-over-month)
 * - Customizable dashboard widgets
 */
const AdvancedAnalytics = ({
  flowData = null,
  sprintData = null,
  onExportReport,
  onWidgetCustomization,
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Component state
  const [selectedAnalytic, setSelectedAnalytic] = useState('burndown');
  const [comparisonPeriod, setComparisonPeriod] = useState('sprint');
  const [enablePredictive, setEnablePredictive] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState(['velocity', 'leadTime', 'cycleTime']);
  const [isExporting, setIsExporting] = useState(false);

  // Sample data for advanced analytics
  const sampleBurndownData = useMemo(() => [
    { day: 0, ideal: 100, actual: 100, remaining: 100 },
    { day: 1, ideal: 90, actual: 95, remaining: 95 },
    { day: 2, ideal: 80, actual: 88, remaining: 88 },
    { day: 3, ideal: 70, actual: 82, remaining: 82 },
    { day: 4, ideal: 60, actual: 75, remaining: 75 },
    { day: 5, ideal: 50, actual: 68, remaining: 68 },
    { day: 6, ideal: 40, actual: 58, remaining: 58 },
    { day: 7, ideal: 30, actual: 45, remaining: 45 },
    { day: 8, ideal: 20, actual: 32, remaining: 32 },
    { day: 9, ideal: 10, actual: 18, remaining: 18 },
    { day: 10, ideal: 0, actual: 5, remaining: 5, predicted: 8 }
  ], []);

  const sampleLeadTimeData = useMemo(() => [
    { task: 'TASK-001', leadTime: 3.2, cycleTime: 2.1, waitTime: 1.1, type: 'Feature' },
    { task: 'TASK-002', leadTime: 5.8, cycleTime: 3.4, waitTime: 2.4, type: 'Bug' },
    { task: 'TASK-003', leadTime: 2.1, cycleTime: 1.8, waitTime: 0.3, type: 'Feature' },
    { task: 'TASK-004', leadTime: 7.2, cycleTime: 4.1, waitTime: 3.1, type: 'Epic' },
    { task: 'TASK-005', leadTime: 1.9, cycleTime: 1.5, waitTime: 0.4, type: 'Bug' },
    { task: 'TASK-006', leadTime: 4.3, cycleTime: 2.8, waitTime: 1.5, type: 'Feature' },
    { task: 'TASK-007', leadTime: 6.1, cycleTime: 3.9, waitTime: 2.2, type: 'Feature' },
    { task: 'TASK-008', leadTime: 2.8, cycleTime: 2.2, waitTime: 0.6, type: 'Bug' }
  ], []);

  const sampleVelocityData = useMemo(() => [
    { sprint: 'Sprint 1', planned: 25, completed: 23, velocity: 23, trend: 'stable' },
    { sprint: 'Sprint 2', planned: 28, completed: 26, velocity: 26, trend: 'improving' },
    { sprint: 'Sprint 3', planned: 30, completed: 32, velocity: 32, trend: 'improving' },
    { sprint: 'Sprint 4', planned: 32, completed: 29, velocity: 29, trend: 'declining' },
    { sprint: 'Sprint 5', planned: 30, completed: 31, velocity: 31, trend: 'improving' },
    { sprint: 'Sprint 6', planned: 33, completed: 35, velocity: 35, trend: 'improving' }
  ], []);

  const samplePredictiveData = useMemo(() => [
    { date: '2024-01-01', actual: 15, predicted: 16, confidence: 0.85 },
    { date: '2024-01-02', actual: 18, predicted: 17, confidence: 0.82 },
    { date: '2024-01-03', actual: 22, predicted: 21, confidence: 0.88 },
    { date: '2024-01-04', actual: 19, predicted: 20, confidence: 0.79 },
    { date: '2024-01-05', actual: 25, predicted: 24, confidence: 0.91 },
    { date: '2024-01-06', actual: null, predicted: 27, confidence: 0.76 },
    { date: '2024-01-07', actual: null, predicted: 29, confidence: 0.73 },
    { date: '2024-01-08', actual: null, predicted: 31, confidence: 0.70 }
  ], []);

  // Color palette matching the purple theme
  const chartColors = {
    primary: '#764ba2',
    secondary: '#667eea',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    prediction: '#9c27b0',
    confidence: 'rgba(156, 39, 176, 0.2)'
  };

  // Handle analytic type change
  const handleAnalyticChange = useCallback((analyticType) => {
    setSelectedAnalytic(analyticType);
  }, []);

  // Handle export functionality
  const handleExport = useCallback(async (format) => {
    setIsExporting(true);
    try {
      if (onExportReport) {
        await onExportReport(format, selectedAnalytic, {
          comparisonPeriod,
          selectedMetrics,
          enablePredictive
        });
      }
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
    }
  }, [onExportReport, selectedAnalytic, comparisonPeriod, selectedMetrics, enablePredictive]);

  // Calculate statistical insights
  const calculateStatistics = useCallback((data, metric) => {
    if (!data || data.length === 0) return { mean: 0, median: 0, stdDev: 0, trend: 'stable' };
    
    const values = data.map(item => item[metric]).filter(val => val !== null && val !== undefined);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Simple trend calculation
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';
    
    return { mean: mean.toFixed(2), median: median.toFixed(2), stdDev: stdDev.toFixed(2), trend };
  }, []);

  // Custom tooltips for different chart types
  const BurndownTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, maxWidth: 250 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Day {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="body2">
                {entry.dataKey}: {entry.value} {entry.dataKey === 'predicted' ? '(predicted)' : 'story points'}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const LeadTimeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
              {entry.dataKey === 'leadTime' ? 'Lead Time' : 
               entry.dataKey === 'cycleTime' ? 'Cycle Time' : 'Wait Time'}: {entry.value}d
            </Typography>
          ))}
          <Typography variant="caption" color="text.secondary">
            Type: {payload[0]?.payload?.type}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Render burndown chart
  const renderBurndownChart = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
      <LineChart data={sampleBurndownData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="day" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          label={{ value: 'Sprint Days', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          stroke={theme.palette.text.secondary} 
          fontSize={12}
          label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
        />
        <RechartsTooltip content={<BurndownTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="ideal" 
          stroke={chartColors.info} 
          strokeDasharray="5 5" 
          name="Ideal Burndown"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke={chartColors.primary} 
          strokeWidth={3} 
          name="Actual Burndown"
        />
        {enablePredictive && (
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke={chartColors.prediction} 
            strokeDasharray="3 3" 
            strokeWidth={2}
            name="Predicted"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  // Render lead time analysis
  const renderLeadTimeAnalysis = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
      <ComposedChart data={sampleLeadTimeData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="task" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke={theme.palette.text.secondary} 
          fontSize={12}
          label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
        />
        <RechartsTooltip content={<LeadTimeTooltip />} />
        <Legend />
        <Bar dataKey="waitTime" stackId="a" fill={chartColors.warning} name="Wait Time" />
        <Bar dataKey="cycleTime" stackId="a" fill={chartColors.primary} name="Cycle Time" />
        <Line type="monotone" dataKey="leadTime" stroke={chartColors.error} strokeWidth={3} name="Total Lead Time" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Render velocity trends
  const renderVelocityTrends = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
      <ComposedChart data={sampleVelocityData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="sprint" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
        />
        <YAxis 
          stroke={theme.palette.text.secondary} 
          fontSize={12}
          label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
        />
        <RechartsTooltip />
        <Legend />
        <Bar dataKey="planned" fill={chartColors.info} opacity={0.6} name="Planned" />
        <Bar dataKey="completed" fill={chartColors.success} name="Completed" />
        <Line type="monotone" dataKey="velocity" stroke={chartColors.primary} strokeWidth={3} name="Velocity Trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Render predictive modeling
  const renderPredictiveModeling = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
      <ComposedChart data={samplePredictiveData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          stroke={theme.palette.text.secondary} 
          fontSize={12}
          label={{ value: 'Throughput', angle: -90, position: 'insideLeft' }}
        />
        <RechartsTooltip />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="confidence" 
          fill={chartColors.confidence} 
          stroke="none"
          name="Confidence Interval"
        />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke={chartColors.primary} 
          strokeWidth={3} 
          name="Actual"
          connectNulls={false}
        />
        <Line 
          type="monotone" 
          dataKey="predicted" 
          stroke={chartColors.prediction} 
          strokeDasharray="5 5" 
          strokeWidth={2}
          name="Predicted"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Calculate insights for current analytic
  const getCurrentInsights = () => {
    switch (selectedAnalytic) {
      case 'burndown':
        const burndownStats = calculateStatistics(sampleBurndownData, 'actual');
        return {
          title: 'Sprint Progress',
          insights: [
            'Sprint is 5% behind ideal pace',
            'Predicted completion: 8 story points remaining',
            'Velocity trend: Stable',
            'Risk level: Medium'
          ]
        };
      case 'leadTime':
        const leadTimeStats = calculateStatistics(sampleLeadTimeData, 'leadTime');
        return {
          title: 'Lead Time Analysis',
          insights: [
            `Average lead time: ${leadTimeStats.mean} days`,
            `Median lead time: ${leadTimeStats.median} days`,
            `Standard deviation: ${leadTimeStats.stdDev} days`,
            `Trend: ${leadTimeStats.trend}`
          ]
        };
      case 'velocity':
        return {
          title: 'Velocity Insights',
          insights: [
            'Average velocity: 29.3 story points',
            'Velocity improving over last 3 sprints',
            'Consistency score: 82%',
            'Recommended next sprint capacity: 32-35 points'
          ]
        };
      case 'predictive':
        return {
          title: 'Predictive Analysis',
          insights: [
            'Throughput predicted to increase 15%',
            'Model confidence: 76%',
            'Key factors: Team capacity, complexity',
            'Recommendation: Monitor WIP limits'
          ]
        };
      default:
        return { title: 'Insights', insights: [] };
    }
  };

  const currentInsights = getCurrentInsights();

  return (
    <Box className={className}>
      {/* Controls Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Analytics Type Selector */}
          <Grid item xs={12} md={6}>
            <ButtonGroup size="small" sx={{ flexWrap: 'wrap' }}>
              <Button
                variant={selectedAnalytic === 'burndown' ? 'contained' : 'outlined'}
                onClick={() => handleAnalyticChange('burndown')}
                startIcon={<ShowChart />}
                sx={{ 
                  bgcolor: selectedAnalytic === 'burndown' ? chartColors.primary : 'transparent',
                  '&:hover': { bgcolor: selectedAnalytic === 'burndown' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
                }}
              >
                Burndown
              </Button>
              <Button
                variant={selectedAnalytic === 'leadTime' ? 'contained' : 'outlined'}
                onClick={() => handleAnalyticChange('leadTime')}
                startIcon={<Timeline />}
                sx={{ 
                  bgcolor: selectedAnalytic === 'leadTime' ? chartColors.primary : 'transparent',
                  '&:hover': { bgcolor: selectedAnalytic === 'leadTime' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
                }}
              >
                Lead Time
              </Button>
              <Button
                variant={selectedAnalytic === 'velocity' ? 'contained' : 'outlined'}
                onClick={() => handleAnalyticChange('velocity')}
                startIcon={<BarChart />}
                sx={{ 
                  bgcolor: selectedAnalytic === 'velocity' ? chartColors.primary : 'transparent',
                  '&:hover': { bgcolor: selectedAnalytic === 'velocity' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
                }}
              >
                Velocity
              </Button>
              <Button
                variant={selectedAnalytic === 'predictive' ? 'contained' : 'outlined'}
                onClick={() => handleAnalyticChange('predictive')}
                startIcon={<AutoGraph />}
                sx={{ 
                  bgcolor: selectedAnalytic === 'predictive' ? chartColors.primary : 'transparent',
                  '&:hover': { bgcolor: selectedAnalytic === 'predictive' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
                }}
              >
                Predictive
              </Button>
            </ButtonGroup>
          </Grid>

          {/* Export Controls */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                size="small"
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                size="small"
              >
                Export CSV
              </Button>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Compare</InputLabel>
                <Select
                  value={comparisonPeriod}
                  label="Compare"
                  onChange={(e) => setComparisonPeriod(e.target.value)}
                >
                  <MenuItem value="sprint">Sprint-over-Sprint</MenuItem>
                  <MenuItem value="month">Month-over-Month</MenuItem>
                  <MenuItem value="quarter">Quarter-over-Quarter</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>

        {/* Loading indicator for exports */}
        {isExporting && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress sx={{ 
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
              }
            }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Generating report...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Main Analytics Content */}
      <Grid container spacing={3}>
        {/* Chart Section */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 {selectedAnalytic === 'burndown' ? 'Sprint Burndown Analysis' : 
                      selectedAnalytic === 'leadTime' ? 'Lead Time Distribution' : 
                      selectedAnalytic === 'velocity' ? 'Velocity Trends' : 'Predictive Flow Modeling'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedAnalytic === 'predictive' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enablePredictive}
                        onChange={(e) => setEnablePredictive(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Enable Predictions"
                    sx={{ fontSize: '0.875rem' }}
                  />
                )}
                <Tooltip title="Refresh Data">
                  <IconButton size="small">
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Chart Rendering */}
            {selectedAnalytic === 'burndown' && renderBurndownChart()}
            {selectedAnalytic === 'leadTime' && renderLeadTimeAnalysis()}
            {selectedAnalytic === 'velocity' && renderVelocityTrends()}
            {selectedAnalytic === 'predictive' && renderPredictiveModeling()}
          </Paper>
        </Grid>

        {/* Insights and Controls */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Statistical Insights */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔍 {currentInsights.title}
                </Typography>
                {currentInsights.insights.map((insight, index) => (
                  <Alert 
                    key={index} 
                    severity="info" 
                    sx={{ mb: 1, '& .MuiAlert-message': { fontSize: '0.875rem' } }}
                  >
                    {insight}
                  </Alert>
                ))}
              </Paper>
            </Grid>

            {/* Customization Panel */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings fontSize="small" />
                    Customization
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedMetrics.includes('velocity')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetrics(prev => [...prev, 'velocity']);
                            } else {
                              setSelectedMetrics(prev => prev.filter(m => m !== 'velocity'));
                            }
                          }}
                          size="small"
                        />
                      }
                      label="Show Velocity"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedMetrics.includes('leadTime')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetrics(prev => [...prev, 'leadTime']);
                            } else {
                              setSelectedMetrics(prev => prev.filter(m => m !== 'leadTime'));
                            }
                          }}
                          size="small"
                        />
                      }
                      label="Show Lead Time"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedMetrics.includes('cycleTime')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMetrics(prev => [...prev, 'cycleTime']);
                            } else {
                              setSelectedMetrics(prev => prev.filter(m => m !== 'cycleTime'));
                            }
                          }}
                          size="small"
                        />
                      }
                      label="Show Cycle Time"
                    />
                    <Divider />
                    <Button
                      variant="outlined"
                      startIcon={<Settings />}
                      onClick={() => onWidgetCustomization && onWidgetCustomization()}
                      size="small"
                      fullWidth
                    >
                      Customize Widgets
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

AdvancedAnalytics.propTypes = {
  flowData: PropTypes.object,
  sprintData: PropTypes.object,
  onExportReport: PropTypes.func,
  onWidgetCustomization: PropTypes.func,
  className: PropTypes.string
};

export default AdvancedAnalytics; 