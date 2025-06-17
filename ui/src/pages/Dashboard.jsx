import { Box, Container, Grid, Paper, Typography, useTheme, useMediaQuery, CircularProgress, Alert } from '@mui/material';
import { useEffect } from 'react';
import TaskStatusCard from '../components/dashboard/TaskStatusCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import TaskOverviewChart from '../components/dashboard/TaskOverviewChart';
import TeamPerformance from '../components/dashboard/TeamPerformance';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines';
import { useTasks } from '../hooks/useTasks';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { stats, activities, dailyStats, currentStats, dailyStatsQuery, currentStatsQuery, isLoading, error, refetch } = useTasks();

  // Auto-refresh functionality - refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refetch]);

  // Fallbacks if stats are not loaded yet
  const completed = stats?.completed ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const pending = stats?.pending ?? 0;
  const total = stats?.total ?? 0;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading dashboard data: {error.message}
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
        backgroundColor: theme.palette.background.default,
        pt: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 }
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Task Status Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <TaskStatusCard
              title="Completed Tasks"
              value={completed}
              total={total}
              color="success"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TaskStatusCard
              title="In Progress"
              value={inProgress}
              total={total}
              color="primary"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TaskStatusCard
              title="Pending Tasks"
              value={pending}
              total={total}
              color="warning"
              loading={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TaskStatusCard
              title="Total Tasks"
              value={total}
              total={total}
              color="info"
              loading={isLoading}
            />
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Task Overview
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <TaskOverviewChart 
                  dailyStats={currentStats}
                  isLoading={currentStatsQuery.isLoading}
                  error={currentStatsQuery.error}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={4}>
            <RecentActivityCard activities={activities} />
          </Grid>

          {/* Additional Widgets */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 300,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <Typography variant="h6" gutterBottom>
                Team Performance
              </Typography>
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <TeamPerformance />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 300,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[1]
              }}
            >
              <Typography variant="h6" gutterBottom>
                Upcoming Deadlines
              </Typography>
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <UpcomingDeadlines />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 