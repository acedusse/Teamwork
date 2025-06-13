import { Box, Typography, LinearProgress, useTheme } from '@mui/material';

// Mock data for demonstration
const teamData = [
  {
    name: 'John Doe',
    role: 'Project Manager',
    tasksCompleted: 15,
    tasksInProgress: 3,
    productivity: 85,
    avatar: 'JD'
  },
  {
    name: 'Jane Smith',
    role: 'Frontend Developer',
    tasksCompleted: 12,
    tasksInProgress: 2,
    productivity: 90,
    avatar: 'JS'
  },
  {
    name: 'Mike Johnson',
    role: 'Backend Developer',
    tasksCompleted: 10,
    tasksInProgress: 4,
    productivity: 75,
    avatar: 'MJ'
  }
];

export default function TeamPerformance() {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      {teamData.map((member, index) => (
        <Box
          key={member.name}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.background.default,
            '&:last-child': { mb: 0 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              {member.avatar}
            </Box>
            <Box>
              <Typography variant="subtitle1">{member.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {member.role}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Productivity</Typography>
              <Typography variant="body2" color="primary">
                {member.productivity}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={member.productivity}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="body2">
                {member.tasksCompleted}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                In Progress
              </Typography>
              <Typography variant="body2">
                {member.tasksInProgress}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
} 