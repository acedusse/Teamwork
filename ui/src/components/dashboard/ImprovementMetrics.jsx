import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
  Divider,
  LinearProgress,
  Stack,
  ButtonGroup
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Timeline,
  Assessment,
  GetApp,
  Refresh,
  FilterList,
  DateRange,
  CheckCircle,
  Schedule,
  Group,
  Psychology,
  Assignment,
  Speed,
  ShowChart,
  BarChart,
  PieChart
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
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Legend,
  Pie
} from 'recharts';
import PropTypes from 'prop-types';

/**
 * TypeScript-like interfaces for data structures (using JSDoc for prop validation)
 * 
 * @typedef {Object} MetricData
 * @property {string} id - Unique identifier
 * @property {string} name - Metric name
 * @property {number} value - Current value
 * @property {number} previousValue - Previous period value
 * @property {string} trend - 'improving', 'declining', 'stable'
 * @property {string} unit - Unit of measurement
 * @property {string} category - Metric category
 * @property {Array} historicalData - Time series data
 * 
 * @typedef {Object} ChartDataPoint
 * @property {string} period - Time period label
 * @property {number} value - Metric value
 * @property {string} date - ISO date string
 */

/**
 * Color palette for charts
 */
const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  info: '#0288d1',
  error: '#d32f2f',
  purple: '#7b1fa2',
  orange: '#f57c00',
  teal: '#00695c',
  indigo: '#303f9f'
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.teal
];

/**
 * MetricCard component for displaying individual metrics
 */
const MetricCard = ({ metric, onClick }) => {
  const theme = useTheme();
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp sx={{ color: theme.palette.success.main }} />;
      case 'declining':
        return <TrendingDown sx={{ color: theme.palette.error.main }} />;
      default:
        return <TrendingFlat sx={{ color: theme.palette.warning.main }} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return theme.palette.success.main;
      case 'declining':
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const change = metric.value - metric.previousValue;
  const changePercent = metric.previousValue !== 0 
    ? ((change / metric.previousValue) * 100).toFixed(1)
    : '0';

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {metric.value}{metric.unit}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {metric.name}
            </Typography>
            <Chip 
              label={metric.category} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {getTrendIcon(metric.trend)}
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                color: getTrendColor(metric.trend),
                fontWeight: 500,
                mt: 0.5
              }}
            >
              {change > 0 ? '+' : ''}{changePercent}%
            </Typography>
          </Box>
        </Box>
        
        {/* Mini trend chart */}
        {metric.historicalData && metric.historicalData.length > 0 && (
          <Box sx={{ height: 60, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.historicalData.slice(-7)}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={getTrendColor(metric.trend)}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

MetricCard.propTypes = {
  metric: PropTypes.object.isRequired,
  onClick: PropTypes.func
};

/**
 * ChartSection component for displaying detailed charts
 */
const ChartSection = ({ title, children, actions }) => (
  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6" component="h3">
        {title}
      </Typography>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions}
        </Box>
      )}
    </Box>
    {children}
  </Paper>
);

ChartSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node
};

/**
 * ImprovementMetrics Component
 * 
 * Comprehensive metrics component with charts and trend analysis for tracking
 * team improvement over time including:
 * - Action item completion rates
 * - Retrospective participation metrics
 * - Improvement velocity tracking
 * - Trend analysis and comparisons
 * - Customizable dashboards and export capabilities
 */
const ImprovementMetrics = ({ 
  initialMetrics = [],
  timeRange = '3months',
  onTimeRangeChange,
  onExportReport,
  onRefreshData,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [metrics, setMetrics] = useState(initialMetrics);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [chartType, setChartType] = useState('line');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Initialize with comprehensive sample data
  useEffect(() => {
    if (initialMetrics.length === 0) {
      const sampleMetrics = [
        {
          id: 'action-completion-rate',
          name: 'Action Item Completion Rate',
          value: 78,
          previousValue: 65,
          trend: 'improving',
          unit: '%',
          category: 'Action Items',
          historicalData: [
            { period: 'Week 1', value: 45, date: '2024-11-01' },
            { period: 'Week 2', value: 52, date: '2024-11-08' },
            { period: 'Week 3', value: 58, date: '2024-11-15' },
            { period: 'Week 4', value: 65, date: '2024-11-22' },
            { period: 'Week 5', value: 72, date: '2024-11-29' },
            { period: 'Week 6', value: 75, date: '2024-12-06' },
            { period: 'Week 7', value: 78, date: '2024-12-13' }
          ]
        },
        {
          id: 'retro-participation',
          name: 'Retrospective Participation',
          value: 92,
          previousValue: 88,
          trend: 'improving',
          unit: '%',
          category: 'Retrospectives',
          historicalData: [
            { period: 'Week 1', value: 80, date: '2024-11-01' },
            { period: 'Week 2', value: 85, date: '2024-11-08' },
            { period: 'Week 3', value: 88, date: '2024-11-15' },
            { period: 'Week 4', value: 88, date: '2024-11-22' },
            { period: 'Week 5', value: 90, date: '2024-11-29' },
            { period: 'Week 6', value: 91, date: '2024-12-06' },
            { period: 'Week 7', value: 92, date: '2024-12-13' }
          ]
        },
        {
          id: 'improvement-velocity',
          name: 'Improvement Velocity',
          value: 2.4,
          previousValue: 1.8,
          trend: 'improving',
          unit: ' items/sprint',
          category: 'Velocity',
          historicalData: [
            { period: 'Sprint 1', value: 1.2, date: '2024-10-01' },
            { period: 'Sprint 2', value: 1.5, date: '2024-10-15' },
            { period: 'Sprint 3', value: 1.8, date: '2024-11-01' },
            { period: 'Sprint 4', value: 2.1, date: '2024-11-15' },
            { period: 'Sprint 5', value: 2.2, date: '2024-12-01' },
            { period: 'Sprint 6', value: 2.4, date: '2024-12-15' }
          ]
        },
        {
          id: 'avg-resolution-time',
          name: 'Average Resolution Time',
          value: 5.2,
          previousValue: 7.1,
          trend: 'improving',
          unit: ' days',
          category: 'Action Items',
          historicalData: [
            { period: 'Week 1', value: 8.5, date: '2024-11-01' },
            { period: 'Week 2', value: 7.8, date: '2024-11-08' },
            { period: 'Week 3', value: 7.1, date: '2024-11-15' },
            { period: 'Week 4', value: 6.5, date: '2024-11-22' },
            { period: 'Week 5', value: 5.9, date: '2024-11-29' },
            { period: 'Week 6', value: 5.5, date: '2024-12-06' },
            { period: 'Week 7', value: 5.2, date: '2024-12-13' }
          ]
        },
        {
          id: 'team-satisfaction',
          name: 'Team Satisfaction Score',
          value: 4.2,
          previousValue: 3.8,
          trend: 'improving',
          unit: '/5',
          category: 'Team Health',
          historicalData: [
            { period: 'Month 1', value: 3.2, date: '2024-10-01' },
            { period: 'Month 2', value: 3.5, date: '2024-11-01' },
            { period: 'Month 3', value: 3.8, date: '2024-12-01' },
            { period: 'Month 4', value: 4.2, date: '2024-12-15' }
          ]
        },
        {
          id: 'process-improvements',
          name: 'Process Improvements Implemented',
          value: 12,
          previousValue: 8,
          trend: 'improving',
          unit: '',
          category: 'Process',
          historicalData: [
            { period: 'Q1', value: 3, date: '2024-03-31' },
            { period: 'Q2', value: 5, date: '2024-06-30' },
            { period: 'Q3', value: 8, date: '2024-09-30' },
            { period: 'Q4', value: 12, date: '2024-12-31' }
          ]
        }
      ];
      setMetrics(sampleMetrics);
    }
  }, [initialMetrics]);

  // Filtered metrics based on category
  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'all') return metrics;
    return metrics.filter(metric => metric.category === selectedCategory);
  }, [metrics, selectedCategory]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = [...new Set(metrics.map(metric => metric.category))];
    return ['all', ...cats];
  }, [metrics]);

  // Prepare data for combined trend chart
  const combinedTrendData = useMemo(() => {
    if (filteredMetrics.length === 0) return [];
    
    const maxLength = Math.max(...filteredMetrics.map(m => m.historicalData?.length || 0));
    const result = [];
    
    for (let i = 0; i < maxLength; i++) {
      const dataPoint = { period: '' };
      filteredMetrics.forEach(metric => {
        if (metric.historicalData && metric.historicalData[i]) {
          dataPoint.period = metric.historicalData[i].period;
          dataPoint[metric.name] = metric.historicalData[i].value;
        }
      });
      if (dataPoint.period) result.push(dataPoint);
    }
    
    return result;
  }, [filteredMetrics]);

  // Prepare data for category distribution
  const categoryDistribution = useMemo(() => {
    const distribution = {};
    metrics.forEach(metric => {
      distribution[metric.category] = (distribution[metric.category] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count
    }));
  }, [metrics]);

  // Event handlers
  const handleTimeRangeChange = (event) => {
    const newRange = event.target.value;
    setSelectedTimeRange(newRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleChartTypeChange = (newType) => {
    setChartType(newType);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (onExportReport) {
      onExportReport({
        metrics: filteredMetrics,
        timeRange: selectedTimeRange,
        category: selectedCategory,
        exportType: 'pdf'
      });
    }
  };

  const handleMetricClick = (metric) => {
    setSelectedMetric(selectedMetric?.id === metric.id ? null : metric);
  };

  return (
    <Box className={className}>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            📊 Improvement Metrics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track team improvement trends and analyze performance over time
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="1month">1 Month</MenuItem>
              <MenuItem value="3months">3 Months</MenuItem>
              <MenuItem value="6months">6 Months</MenuItem>
              <MenuItem value="1year">1 Year</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
            >
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Report">
            <IconButton onClick={handleExport}>
              <GetApp />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={metric.id}>
            <MetricCard 
              metric={metric} 
              onClick={() => handleMetricClick(metric)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Detailed Charts Section */}
      {filteredMetrics.length > 0 && (
        <>
          {/* Combined Trend Chart */}
          <ChartSection 
            title="Trend Analysis"
            actions={
              <ButtonGroup size="small" variant="outlined">
                <Button 
                  onClick={() => handleChartTypeChange('line')}
                  variant={chartType === 'line' ? 'contained' : 'outlined'}
                  startIcon={<ShowChart />}
                >
                  Line
                </Button>
                <Button 
                  onClick={() => handleChartTypeChange('area')}
                  variant={chartType === 'area' ? 'contained' : 'outlined'}
                  startIcon={<Timeline />}
                >
                  Area
                </Button>
                <Button 
                  onClick={() => handleChartTypeChange('bar')}
                  variant={chartType === 'bar' ? 'contained' : 'outlined'}
                  startIcon={<BarChart />}
                >
                  Bar
                </Button>
              </ButtonGroup>
            }
          >
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={combinedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {filteredMetrics.map((metric, index) => (
                      <Area
                        key={metric.id}
                        type="monotone"
                        dataKey={metric.name}
                        stackId="1"
                        stroke={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                        fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                ) : chartType === 'bar' ? (
                  <RechartsBarChart data={combinedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {filteredMetrics.map((metric, index) => (
                      <Bar
                        key={metric.id}
                        dataKey={metric.name}
                        fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                      />
                    ))}
                  </RechartsBarChart>
                ) : (
                  <LineChart data={combinedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {filteredMetrics.map((metric, index) => (
                      <Line
                        key={metric.id}
                        type="monotone"
                        dataKey={metric.name}
                        stroke={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Box>
          </ChartSection>

          {/* Category Distribution and Performance Summary */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartSection title="Metrics by Category">
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
              </ChartSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartSection title="Performance Summary">
                <Stack spacing={2}>
                  <Alert severity="success">
                    <AlertTitle>Improving Trends</AlertTitle>
                    {filteredMetrics.filter(m => m.trend === 'improving').length} metrics showing improvement
                  </Alert>
                  
                  {filteredMetrics.filter(m => m.trend === 'declining').length > 0 && (
                    <Alert severity="warning">
                      <AlertTitle>Areas for Attention</AlertTitle>
                      {filteredMetrics.filter(m => m.trend === 'declining').length} metrics need attention
                    </Alert>
                  )}
                  
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>Quick Stats</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Metrics
                        </Typography>
                        <Typography variant="h6">
                          {filteredMetrics.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Improvement
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          +{Math.round(filteredMetrics.reduce((acc, m) => acc + ((m.value - m.previousValue) / m.previousValue * 100), 0) / filteredMetrics.length)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              </ChartSection>
            </Grid>
          </Grid>
        </>
      )}

      {/* Selected Metric Detail */}
      {selectedMetric && (
        <ChartSection title={`Detailed View: ${selectedMetric.name}`}>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedMetric.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.primary}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </ChartSection>
      )}

      {/* Empty State */}
      {filteredMetrics.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No metrics available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start tracking your team's improvement by conducting retrospectives and managing action items.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

ImprovementMetrics.propTypes = {
  initialMetrics: PropTypes.array,
  timeRange: PropTypes.string,
  onTimeRangeChange: PropTypes.func,
  onExportReport: PropTypes.func,
  onRefreshData: PropTypes.func,
  className: PropTypes.string,
};

export default ImprovementMetrics; 