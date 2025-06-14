import { Box, Typography, useTheme, CircularProgress, Alert } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PropTypes from 'prop-types';
import { transformDailyStatsForChart, calculateDailyMetrics } from '../../utils/chartDataTransforms.js';

export default function TaskOverviewChart({ 
  dailyStats, 
  isLoading = false, 
  error = null,
  height = '100%',
  timePeriod = 'daily',
  showMetrics = false
}) {
  const theme = useTheme();
  
  // Transform the data for chart consumption using the utility functions
  const chartData = transformDailyStatsForChart(dailyStats, {
    dateFormat: 'short',
    includeTotal: true
  });

  // Calculate additional metrics if requested
  const metrics = showMetrics ? calculateDailyMetrics(chartData) : null;

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            Loading chart data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <Box sx={{ width: '100%', height: height, p: 2 }}>
        <Alert 
          severity="error"
          sx={{ height: '100%', display: 'flex', alignItems: 'center' }}
        >
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Failed to load chart data
            </Typography>
            <Typography variant="body2">
              {error.message || 'An unexpected error occurred while loading the task statistics.'}
            </Typography>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Empty state with helpful message
  if (!chartData || chartData.length === 0) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          p: 3
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          No Task Data Available
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
          Task completion statistics will appear here once you have tasks in your project. 
          Start by creating some tasks to see your progress trends.
        </Typography>
      </Box>
    );
  }

  // Custom tooltip formatter for better data display
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2,
            boxShadow: theme.shadows[4]
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {data.date}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  borderRadius: '50%',
                  mr: 1
                }}
              />
              <Typography variant="body2">
                {entry.name}: {entry.value}
              </Typography>
            </Box>
          ))}
          {data.total && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              Total: {data.total}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: height }}>
      {/* Optional metrics display */}
      {showMetrics && metrics && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Summary Metrics
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              Completion Rate: {metrics.completionRate}%
            </Typography>
            <Typography variant="body2">
              Trend: {metrics.trend}
            </Typography>
            <Typography variant="body2">
              Avg Daily: {metrics.averageDaily}
            </Typography>
          </Box>
        </Box>
      )}

      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60, // Increased for rotated labels
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.palette.divider}
            opacity={0.5}
          />
          <XAxis 
            dataKey="name" 
            tick={{ 
              fontSize: 12, 
              fill: theme.palette.text.secondary 
            }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            stroke={theme.palette.text.secondary}
          />
          <YAxis 
            tick={{ 
              fontSize: 12, 
              fill: theme.palette.text.secondary 
            }}
            stroke={theme.palette.text.secondary}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: theme.palette.action.hover }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px'
            }}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill={theme.palette.success.main}
            stackId="a"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="inProgress"
            name="In Progress"
            fill={theme.palette.primary.main}
            stackId="a"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="pending"
            name="Pending"
            fill={theme.palette.warning.main}
            stackId="a"
            radius={[4, 4, 0, 0]} // Rounded top corners for the top bar
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

// Enhanced PropTypes for better type safety
TaskOverviewChart.propTypes = {
  dailyStats: PropTypes.shape({
    dateRange: PropTypes.shape({
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
    }),
    statistics: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string.isRequired,
        completed: PropTypes.number.isRequired,
        inProgress: PropTypes.number.isRequired,
        pending: PropTypes.number.isRequired,
        total: PropTypes.number,
      })
    ).isRequired,
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  timePeriod: PropTypes.oneOf(['daily', 'weekly', 'monthly']),
  showMetrics: PropTypes.bool,
}; 