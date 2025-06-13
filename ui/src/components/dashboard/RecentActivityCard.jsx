import { Card, CardContent, Typography, List, ListItem, ListItemText, ListItemIcon, useTheme } from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Add as AddedIcon,
  Edit as EditedIcon,
  Delete as DeletedIcon
} from '@mui/icons-material';

const activityIcons = {
  completed: <CompletedIcon color="success" />,
  added: <AddedIcon color="primary" />,
  edited: <EditedIcon color="info" />,
  deleted: <DeletedIcon color="error" />
};

export default function RecentActivityCard({ activities = [] }) {  
  // Ensure activities is always an array with default empty array
  const activityList = Array.isArray(activities) ? activities : [];
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {activityList.map((activity, index) => (
            <ListItem
              key={index}
              sx={{
                borderBottom: index < activityList.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                py: 1
              }}
            >
              <ListItemIcon>
                {activity && activity.type && activityIcons[activity.type] ? activityIcons[activity.type] : <EditedIcon color="default" />}
              </ListItemIcon>
              <ListItemText
                primary={activity && activity.description ? activity.description : "Unknown activity"}
                secondary={activity && activity.timestamp ? activity.timestamp : ""}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.primary'
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary'
                }}
              />
            </ListItem>
          ))}
          {activityList.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No recent activity"
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                  fontStyle: 'italic'
                }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}