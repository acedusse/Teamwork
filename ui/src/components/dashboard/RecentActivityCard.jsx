import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  useTheme,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Add as AddedIcon,
  Edit as EditedIcon,
  Delete as DeletedIcon,
  PlayArrow as InProgressIcon
} from '@mui/icons-material';

const activityIcons = {
  completed: <CompletedIcon color="success" />,
  added: <AddedIcon color="primary" />,
  edited: <EditedIcon color="info" />,
  deleted: <DeletedIcon color="error" />,
  'in-progress': <InProgressIcon color="warning" />
};

const activityColors = {
  completed: 'success',
  added: 'primary',
  edited: 'info',
  deleted: 'error',
  'in-progress': 'warning'
};

export default function RecentActivityCard({ activities = [], isLoading = false }) {  
  // Ensure activities is always an array with default empty array
  const activityList = Array.isArray(activities) ? activities : [];
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Recent Activity
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            Recent Activity
          </Typography>
          <Chip 
            label={`${activityList.length} activities`} 
            size="small" 
            variant="outlined"
            color="primary"
          />
        </Box>
        <List sx={{ maxHeight: 350, overflow: 'auto' }}>
          {activityList.map((activity, index) => {
            const activityType = activity?.type || 'edited';
            const icon = activityIcons[activityType] || <EditedIcon color="default" />;
            
            return (
              <ListItem
                key={`${activity?.taskId || 'unknown'}-${index}`}
                sx={{
                  borderBottom: index < activityList.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  py: 1.5,
                  px: 0,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: 1
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.primary" sx={{ flexGrow: 1 }}>
                        {activity?.description || "Unknown activity"}
                      </Typography>
                      <Chip 
                        label={activityType} 
                        size="small" 
                        color={activityColors[activityType] || 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {activity?.timestamp || ""}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
          {activityList.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No recent activity
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Activity will appear here as you work with tasks
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}