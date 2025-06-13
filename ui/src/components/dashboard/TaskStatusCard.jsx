import { Card, CardContent, Typography, Box, useTheme, Skeleton } from '@mui/material';
import { CircularProgress } from '@mui/material';

export default function TaskStatusCard({ title, value, total, color, loading }) {
  const theme = useTheme();
  const percentage = total > 0 ? (value / total) * 100 : 0;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2, mt: 2 }}>
            <Skeleton variant="circular" width={80} height={80} />
          </Box>
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={80}
            thickness={4}
            sx={{ color: color || theme.palette.primary.main }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4" component="div" color="text.primary">
              {value}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          of {total} total tasks
        </Typography>
      </CardContent>
    </Card>
  );
} 