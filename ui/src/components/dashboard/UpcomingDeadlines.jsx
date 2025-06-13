import { Box, Typography, Chip, useTheme } from '@mui/material';
import {
  Event as EventIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

// Mock data for demonstration
const deadlines = [
  {
    id: 1,
    title: 'Complete Navigation System',
    dueDate: '2024-03-20',
    priority: 'high',
    status: 'in-progress',
    assignee: 'John Doe'
  },
  {
    id: 2,
    title: 'Implement Dashboard Widgets',
    dueDate: '2024-03-22',
    priority: 'medium',
    status: 'pending',
    assignee: 'Jane Smith'
  },
  {
    id: 3,
    title: 'Setup Authentication',
    dueDate: '2024-03-25',
    priority: 'high',
    status: 'pending',
    assignee: 'Mike Johnson'
  },
  {
    id: 4,
    title: 'API Integration',
    dueDate: '2024-03-28',
    priority: 'medium',
    status: 'in-progress',
    assignee: 'John Doe'
  }
];

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'in-progress':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
};

export default function UpcomingDeadlines() {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      {deadlines.map((deadline) => (
        <Box
          key={deadline.id}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.background.default,
            '&:last-child': { mb: 0 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <AssignmentIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {deadline.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  icon={<EventIcon />}
                  label={formatDate(deadline.dueDate)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<FlagIcon />}
                  label={deadline.priority}
                  size="small"
                  color={getPriorityColor(deadline.priority)}
                />
                <Chip
                  label={deadline.status}
                  size="small"
                  color={getStatusColor(deadline.status)}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Assigned to: {deadline.assignee}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
} 