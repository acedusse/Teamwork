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
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  BarChart,
  ShowChart,
  Refresh,
  GetApp,
  Fullscreen
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
  ComposedChart
} from 'recharts';
import PropTypes from 'prop-types';

/**
 * FlowMetricsCharts Component
 * 
 * Provides comprehensive flow metrics visualization including:
 * - Cumulative Flow Diagram showing work distribution across columns over time
 * - Cycle time tracking with trend indicators
 * - Throughput metrics with percentage changes
 * - Interactive date range selectors and metric filters
 * - Responsive chart design for mobile devices
 */
const FlowMetricsCharts = ({
  flowData = null,
  onDateRangeChange,
  onMetricFilterChange,
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Component state
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [selectedChart, setSelectedChart] = useState('cumulative');

  // Sample data for charts (in real implementation, this would come from props or API)
  const sampleCumulativeFlowData = useMemo(() => [
    { date: '2024-01-01', Backlog: 15, Ready: 8, Development: 5, Review: 3, Testing: 2, Done: 12 },
    { date: '2024-01-02', Backlog: 14, Ready: 9, Development: 6, Review: 2, Testing: 3, Done: 14 },
    { date: '2024-01-03', Backlog: 13, Ready: 8, Development: 7, Review: 4, Testing: 2, Done: 16 },
    { date: '2024-01-04', Backlog: 12, Ready: 10, Development: 5, Review: 3, Testing: 4, Done: 18 },
    { date: '2024-01-05', Backlog: 11, Ready: 9, Development: 6, Review: 5, Testing: 3, Done: 20 },
    { date: '2024-01-06', Backlog: 10, Ready: 11, Development: 4, Review: 4, Testing: 5, Done: 22 },
    { date: '2024-01-07', Backlog: 9, Ready: 10, Development: 7, Review: 3, Testing: 4, Done: 24 },
    { date: '2024-01-08', Backlog: 8, Ready: 12, Development: 6, Review: 5, Testing: 3, Done: 26 },
    { date: '2024-01-09', Backlog: 7, Ready: 11, Development: 8, Review: 4, Testing: 4, Done: 28 },
    { date: '2024-01-10', Backlog: 6, Ready: 13, Development: 5, Review: 6, Testing: 5, Done: 30 }
  ], []);

  const sampleCycleTimeData = useMemo(() => [
    { date: '2024-01-01', cycleTime: 3.2, target: 3.0 },
    { date: '2024-01-02', cycleTime: 2.8, target: 3.0 },
    { date: '2024-01-03', cycleTime: 3.5, target: 3.0 },
    { date: '2024-01-04', cycleTime: 2.6, target: 3.0 },
    { date: '2024-01-05', cycleTime: 2.4, target: 3.0 },
    { date: '2024-01-06', cycleTime: 2.9, target: 3.0 },
    { date: '2024-01-07', cycleTime: 2.3, target: 3.0 },
    { date: '2024-01-08', cycleTime: 2.7, target: 3.0 },
    { date: '2024-01-09', cycleTime: 2.1, target: 3.0 },
    { date: '2024-01-10', cycleTime: 2.4, target: 3.0 }
  ], []);

  const sampleThroughputData = useMemo(() => [
    { date: '2024-01-01', throughput: 12, target: 15 },
    { date: '2024-01-02', throughput: 14, target: 15 },
    { date: '2024-01-03', throughput: 16, target: 15 },
    { date: '2024-01-04', throughput: 18, target: 15 },
    { date: '2024-01-05', throughput: 20, target: 15 },
    { date: '2024-01-06', throughput: 22, target: 15 },
    { date: '2024-01-07', throughput: 24, target: 15 },
    { date: '2024-01-08', throughput: 26, target: 15 },
    { date: '2024-01-09', throughput: 28, target: 15 },
    { date: '2024-01-10', throughput: 30, target: 15 }
  ], []);

  // Color palette for charts matching the purple theme
  const chartColors = {
    primary: '#764ba2',
    secondary: '#667eea',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    columns: {
      Backlog: '#e3f2fd',
      Ready: '#bbdefb',
      Development: '#90caf9',
      Review: '#64b5f6',
      Testing: '#42a5f5',
      Done: '#2196f3'
    }
  };

  // Handle date range change
  const handleDateRangeChange = useCallback((range) => {
    setSelectedDateRange(range);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  }, [onDateRangeChange]);

  // Handle chart type change
  const handleChartChange = useCallback((chartType) => {
    setSelectedChart(chartType);
  }, []);

  // Custom tooltip for cumulative flow diagram
  const CumulativeFlowTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
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
                {entry.dataKey}: {entry.value} items
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Custom tooltip for trend charts
  const TrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="body2" color={data.value > data.payload.target ? 'error.main' : 'success.main'}>
            {data.dataKey === 'cycleTime' ? 'Cycle Time' : 'Throughput'}: {data.value}
            {data.dataKey === 'cycleTime' ? 'd' : ' items'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Target: {data.payload.target}{data.dataKey === 'cycleTime' ? 'd' : ' items'}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Render cumulative flow diagram
  const renderCumulativeFlowDiagram = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
      <AreaChart data={sampleCumulativeFlowData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
        <RechartsTooltip content={<CumulativeFlowTooltip />} />
        <Legend />
        <Area type="monotone" dataKey="Done" stackId="1" stroke={chartColors.columns.Done} fill={chartColors.columns.Done} />
        <Area type="monotone" dataKey="Testing" stackId="1" stroke={chartColors.columns.Testing} fill={chartColors.columns.Testing} />
        <Area type="monotone" dataKey="Review" stackId="1" stroke={chartColors.columns.Review} fill={chartColors.columns.Review} />
        <Area type="monotone" dataKey="Development" stackId="1" stroke={chartColors.columns.Development} fill={chartColors.columns.Development} />
        <Area type="monotone" dataKey="Ready" stackId="1" stroke={chartColors.columns.Ready} fill={chartColors.columns.Ready} />
        <Area type="monotone" dataKey="Backlog" stackId="1" stroke={chartColors.columns.Backlog} fill={chartColors.columns.Backlog} />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Render cycle time chart
  const renderCycleTimeChart = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
      <ComposedChart data={sampleCycleTimeData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
        <RechartsTooltip content={<TrendTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="target" stroke={chartColors.warning} strokeDasharray="5 5" name="Target" />
        <Line type="monotone" dataKey="cycleTime" stroke={chartColors.primary} strokeWidth={3} name="Cycle Time (days)" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Render throughput chart
  const renderThroughputChart = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
      <ComposedChart data={sampleThroughputData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
        <RechartsTooltip content={<TrendTooltip />} />
        <Legend />
        <Bar dataKey="target" fill={chartColors.warning} opacity={0.3} name="Target" />
        <Line type="monotone" dataKey="throughput" stroke={chartColors.secondary} strokeWidth={3} name="Throughput (items)" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Calculate trend indicators
  const calculateTrend = (data, key) => {
    if (data.length < 2) return { change: 0, trend: 'stable' };
    const latest = data[data.length - 1][key];
    const previous = data[data.length - 2][key];
    const change = latest - previous;
    const percentChange = ((change / previous) * 100).toFixed(1);
    return {
      change: change.toFixed(1),
      percentChange,
      trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable'
    };
  };

  const cycleTimeTrend = calculateTrend(sampleCycleTimeData, 'cycleTime');
  const throughputTrend = calculateTrend(sampleThroughputData, 'throughput');

  return (
    <Box className={className}>
      {/* Controls Section */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: isMobile ? 'stretch' : 'center' }}>
        {/* Date Range Selector */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={selectedDateRange}
            label="Time Range"
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>

        {/* Chart Type Selector */}
        <ButtonGroup size="small" sx={{ flexWrap: 'wrap' }}>
          <Button
            variant={selectedChart === 'cumulative' ? 'contained' : 'outlined'}
            onClick={() => handleChartChange('cumulative')}
            startIcon={<BarChart />}
            sx={{ 
              bgcolor: selectedChart === 'cumulative' ? chartColors.primary : 'transparent',
              '&:hover': { bgcolor: selectedChart === 'cumulative' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
            }}
          >
            Cumulative Flow
          </Button>
          <Button
            variant={selectedChart === 'cycle' ? 'contained' : 'outlined'}
            onClick={() => handleChartChange('cycle')}
            startIcon={<Timeline />}
            sx={{ 
              bgcolor: selectedChart === 'cycle' ? chartColors.primary : 'transparent',
              '&:hover': { bgcolor: selectedChart === 'cycle' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
            }}
          >
            Cycle Time
          </Button>
          <Button
            variant={selectedChart === 'throughput' ? 'contained' : 'outlined'}
            onClick={() => handleChartChange('throughput')}
            startIcon={<ShowChart />}
            sx={{ 
              bgcolor: selectedChart === 'throughput' ? chartColors.primary : 'transparent',
              '&:hover': { bgcolor: selectedChart === 'throughput' ? chartColors.primary : 'rgba(118, 75, 162, 0.04)' }
            }}
          >
            Throughput
          </Button>
        </ButtonGroup>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Chart">
            <IconButton size="small">
              <GetApp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton size="small">
              <Fullscreen />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Chart Section */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📊 {selectedChart === 'cumulative' ? 'Cumulative Flow Diagram' : 
                  selectedChart === 'cycle' ? 'Cycle Time Trends' : 'Throughput Analysis'}
          </Typography>
          {selectedChart !== 'cumulative' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${selectedChart === 'cycle' ? cycleTimeTrend.change : throughputTrend.change}${selectedChart === 'cycle' ? 'd' : '%'}`}
                color={selectedChart === 'cycle' 
                  ? (parseFloat(cycleTimeTrend.change) < 0 ? 'success' : 'error')
                  : (parseFloat(throughputTrend.change) > 0 ? 'success' : 'error')
                }
                icon={selectedChart === 'cycle' 
                  ? (parseFloat(cycleTimeTrend.change) < 0 ? <TrendingDown /> : <TrendingUp />)
                  : (parseFloat(throughputTrend.change) > 0 ? <TrendingUp /> : <TrendingDown />)
                }
                size="small"
              />
            </Box>
          )}
        </Box>

        {/* Chart Rendering */}
        {selectedChart === 'cumulative' && renderCumulativeFlowDiagram()}
        {selectedChart === 'cycle' && renderCycleTimeChart()}
        {selectedChart === 'throughput' && renderThroughputChart()}
      </Paper>

      {/* Metrics Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ 
              color: parseFloat(cycleTimeTrend.change) < 0 ? 'success.main' : 'error.main',
              fontWeight: 600
            }}>
              {cycleTimeTrend.change}d
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cycle Time Change
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({cycleTimeTrend.percentChange}%)
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ 
              color: parseFloat(throughputTrend.change) > 0 ? 'success.main' : 'error.main',
              fontWeight: 600
            }}>
              +{throughputTrend.change}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Throughput Change
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({throughputTrend.percentChange}%)
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 600 }}>
              4.2d
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Lead Time
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (-0.8d)
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 600 }}>
              82%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Flow Predictability
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (+5%)
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

FlowMetricsCharts.propTypes = {
  flowData: PropTypes.object,
  onDateRangeChange: PropTypes.func,
  onMetricFilterChange: PropTypes.func,
  className: PropTypes.string
};

export default FlowMetricsCharts; 