import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Divider
} from '@mui/material';
import {
  Assessment as AnalyticsIcon,
  Download as ExportIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as CostIcon,
  Speed as PerformanceIcon,
  Schedule as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Mock usage data - in production, this would come from your analytics service
const generateMockUsageData = () => {
  const providers = ['anthropic', 'openai', 'perplexity', 'google'];
  const models = {
    anthropic: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219'],
    openai: ['gpt-4o', 'gpt-4o-mini'],
    perplexity: ['sonar-pro', 'sonar'],
    google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro']
  };
  
  const data = [];
  const now = new Date();
  
  // Generate 30 days of mock data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    providers.forEach(provider => {
      models[provider].forEach(model => {
        // Generate 1-5 API calls per model per day
        const callCount = Math.floor(Math.random() * 5) + 1;
        for (let j = 0; j < callCount; j++) {
          data.push({
            id: `${date.toISOString()}-${provider}-${model}-${j}`,
            timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
            provider,
            model,
            operation: ['task-generation', 'task-update', 'expansion', 'analysis'][Math.floor(Math.random() * 4)],
            inputTokens: Math.floor(Math.random() * 2000) + 100,
            outputTokens: Math.floor(Math.random() * 1000) + 50,
            responseTime: Math.floor(Math.random() * 2000) + 200,
            cost: (Math.random() * 0.5 + 0.01),
            success: Math.random() > 0.1, // 90% success rate
            errorType: Math.random() > 0.1 ? null : ['rate_limit', 'auth_error', 'timeout'][Math.floor(Math.random() * 3)]
          });
        }
      });
    });
  }
  
  return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Simple chart component using CSS and divs (in production, use Chart.js or Recharts)
function SimpleBarChart({ data, title, yAxisLabel, color = '#1976d2' }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 200 }}>
          {data.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <Tooltip title={`${item.label}: ${item.value} ${yAxisLabel}`}>
                <Box
                  sx={{
                    width: '100%',
                    backgroundColor: color,
                    opacity: 0.8,
                    height: `${(item.value / maxValue) * 160}px`,
                    minHeight: '2px',
                    borderRadius: '2px 2px 0 0',
                    cursor: 'pointer',
                    '&:hover': { opacity: 1 }
                  }}
                />
              </Tooltip>
              <Typography variant="caption" sx={{ mt: 1, fontSize: '0.7rem' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, subtitle, trend, icon, color = 'primary' }) {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUpIcon color="success" fontSize="small" />;
    if (trend < 0) return <TrendingDownIcon color="error" fontSize="small" />;
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {getTrendIcon()}
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function UsageFilters({ filters, onFilterChange }) {
  const [dateRange, setDateRange] = useState(filters.dateRange);
  const [provider, setProvider] = useState(filters.provider);
  const [model, setModel] = useState(filters.model);
  const [operation, setOperation] = useState(filters.operation);

  const handleFilterUpdate = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    onFilterChange(newFilters);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader 
        title="Filters & Controls"
        avatar={<FilterIcon />}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => {
                  setDateRange(e.target.value);
                  handleFilterUpdate('dateRange', e.target.value);
                }}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="quarter">Last 90 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={provider}
                label="Provider"
                onChange={(e) => {
                  setProvider(e.target.value);
                  handleFilterUpdate('provider', e.target.value);
                }}
              >
                <MenuItem value="all">All Providers</MenuItem>
                <MenuItem value="anthropic">Anthropic</MenuItem>
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="perplexity">Perplexity</MenuItem>
                <MenuItem value="google">Google</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Operation Type</InputLabel>
              <Select
                value={operation}
                label="Operation Type"
                onChange={(e) => {
                  setOperation(e.target.value);
                  handleFilterUpdate('operation', e.target.value);
                }}
              >
                <MenuItem value="all">All Operations</MenuItem>
                <MenuItem value="task-generation">Task Generation</MenuItem>
                <MenuItem value="task-update">Task Updates</MenuItem>
                <MenuItem value="expansion">Task Expansion</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              fullWidth
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function ExportDialog({ open, onClose, onExport }) {
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('month');
  const [includeDetails, setIncludeDetails] = useState(true);

  const handleExport = () => {
    onExport({ format, dateRange, includeDetails });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Usage Data</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={format}
                label="Export Format"
                onChange={(e) => setFormat(e.target.value)}
              >
                <MenuItem value="csv">CSV (Spreadsheet)</MenuItem>
                <MenuItem value="json">JSON (Raw Data)</MenuItem>
                <MenuItem value="pdf">PDF (Report)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="quarter">Last 90 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                />
              }
              label="Include detailed API call logs"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} variant="contained" startIcon={<ExportIcon />}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BudgetAlerts({ usageData, budgetSettings }) {
  const totalCost = usageData.reduce((sum, item) => sum + item.cost, 0);
  const monthlyBudget = budgetSettings.monthlyLimit || 100;
  const percentUsed = (totalCost / monthlyBudget) * 100;
  
  const getAlertSeverity = () => {
    if (percentUsed >= 90) return 'error';
    if (percentUsed >= 75) return 'warning';
    return 'info';
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader 
        title="Budget Monitoring"
        avatar={<CostIcon />}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Monthly Usage: ${totalCost.toFixed(2)} / ${monthlyBudget.toFixed(2)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(percentUsed, 100)} 
              color={getAlertSeverity() === 'error' ? 'error' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="textSecondary">
              {percentUsed.toFixed(1)}% of monthly budget used
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Alert severity={getAlertSeverity()}>
              {percentUsed >= 90 && "⚠️ Budget limit almost reached!"}
              {percentUsed >= 75 && percentUsed < 90 && "📊 Approaching budget limit"}
              {percentUsed < 75 && "✅ Budget usage is within normal range"}
            </Alert>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function UsageTrackingDashboard() {
  const [usageData] = useState(() => generateMockUsageData());
  const [filters, setFilters] = useState({
    dateRange: 'month',
    provider: 'all',
    model: 'all',
    operation: 'all'
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [budgetSettings] = useState({
    monthlyLimit: 100,
    alertThreshold: 75,
    notificationsEnabled: true
  });

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    let filtered = [...usageData];
    
    // Date range filtering
    const now = new Date();
    const cutoffDate = new Date();
    switch (filters.dateRange) {
      case 'today':
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setFullYear(2020); // Include all data
    }
    filtered = filtered.filter(item => new Date(item.timestamp) >= cutoffDate);
    
    // Provider filtering
    if (filters.provider !== 'all') {
      filtered = filtered.filter(item => item.provider === filters.provider);
    }
    
    // Operation filtering
    if (filters.operation !== 'all') {
      filtered = filtered.filter(item => item.operation === filters.operation);
    }
    
    return filtered;
  }, [usageData, filters]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCalls = filteredData.length;
    const totalCost = filteredData.reduce((sum, item) => sum + item.cost, 0);
    const totalTokens = filteredData.reduce((sum, item) => sum + item.inputTokens + item.outputTokens, 0);
    const avgResponseTime = filteredData.reduce((sum, item) => sum + item.responseTime, 0) / totalCalls || 0;
    const successRate = (filteredData.filter(item => item.success).length / totalCalls) * 100 || 0;
    
    return {
      totalCalls,
      totalCost,
      totalTokens,
      avgResponseTime,
      successRate
    };
  }, [filteredData]);

  // Prepare chart data
  const dailyUsageData = useMemo(() => {
    const dailyStats = {};
    filteredData.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = { calls: 0, cost: 0, tokens: 0 };
      }
      dailyStats[date].calls++;
      dailyStats[date].cost += item.cost;
      dailyStats[date].tokens += item.inputTokens + item.outputTokens;
    });
    
    return Object.entries(dailyStats)
      .slice(-7) // Last 7 days
      .map(([date, stats]) => ({
        label: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
        value: stats.calls
      }));
  }, [filteredData]);

  const providerCostData = useMemo(() => {
    const providerStats = {};
    filteredData.forEach(item => {
      if (!providerStats[item.provider]) {
        providerStats[item.provider] = 0;
      }
      providerStats[item.provider] += item.cost;
    });
    
    return Object.entries(providerStats).map(([provider, cost]) => ({
      label: provider.charAt(0).toUpperCase() + provider.slice(1),
      value: cost
    }));
  }, [filteredData]);

  const handleExport = (exportOptions) => {
    // In production, this would trigger actual export functionality
    console.log('Exporting data with options:', exportOptions);
    
    // Mock export - in reality you'd generate and download the file
    const mockExport = {
      format: exportOptions.format,
      data: filteredData,
      summary: metrics,
      timestamp: new Date().toISOString()
    };
    
    // Simulate file download
    const dataStr = JSON.stringify(mockExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `taskmaster-usage-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon />
          Usage Analytics Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={() => setExportDialogOpen(true)}
        >
          Export Data
        </Button>
      </Box>

      {/* Budget Alerts */}
      <BudgetAlerts usageData={filteredData} budgetSettings={budgetSettings} />

      {/* Filters */}
      <UsageFilters filters={filters} onFilterChange={setFilters} />

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Total API Calls"
            value={metrics.totalCalls.toLocaleString()}
            subtitle="This period"
            trend={5}
            icon={<ChartIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Total Cost"
            value={`$${metrics.totalCost.toFixed(2)}`}
            subtitle="This period"
            trend={-2}
            icon={<CostIcon fontSize="large" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Success Rate"
            value={`${metrics.successRate.toFixed(1)}%`}
            subtitle="API calls"
            trend={1}
            icon={<SuccessIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Avg Response"
            value={`${Math.round(metrics.avgResponseTime)}ms`}
            subtitle="Response time"
            trend={-5}
            icon={<PerformanceIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Total Tokens"
            value={metrics.totalTokens.toLocaleString()}
            subtitle="Input + Output"
            trend={8}
            icon={<TimelineIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <SimpleBarChart
            data={dailyUsageData}
            title="Daily API Usage (Last 7 Days)"
            yAxisLabel="API Calls"
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SimpleBarChart
            data={providerCostData}
            title="Cost by Provider"
            yAxisLabel="USD"
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader 
          title="Recent API Calls"
          subheader={`Showing ${Math.min(10, filteredData.length)} of ${filteredData.length} total calls`}
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Response Time</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(0, 10).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {new Date(row.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.provider} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.model}</TableCell>
                    <TableCell>{row.operation}</TableCell>
                    <TableCell align="right">
                      {(row.inputTokens + row.outputTokens).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">{row.responseTime}ms</TableCell>
                    <TableCell align="right">${row.cost.toFixed(3)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.success ? 'Success' : row.errorType} 
                        size="small"
                        color={row.success ? 'success' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
      />
    </Box>
  );
} 