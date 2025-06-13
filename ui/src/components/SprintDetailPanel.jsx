import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListSubheader
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import FlagIcon from '@mui/icons-material/Flag';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function SprintDetailPanel({ open, sprint, tasks = [], onClose }) {
  if (!sprint) {
    return null;
  }

  const assignedTasks = tasks.filter(t => t.sprintId === sprint.id);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420, md: 480 } } }}
    >
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold">{sprint.name}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Chip label={sprint.status} color="primary" size="small" />
          <EventIcon sx={{ fontSize: 18, ml: 1, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {sprint.startDate} - {sprint.endDate}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <FlagIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="subtitle2" color="text.secondary">Goals:</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mb: 2 }}>{sprint.goals}</Typography>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <AssignmentIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="subtitle2" color="text.secondary">Assigned Tasks ({assignedTasks.length})</Typography>
        </Stack>
        <List dense subheader={<ListSubheader>Tasks</ListSubheader>}>
          {assignedTasks.length === 0 && (
            <ListItem>
              <ListItemText primary="No tasks assigned to this sprint." />
            </ListItem>
          )}
          {assignedTasks.map(task => (
            <ListItem key={task.id}>
              <ListItemText
                primary={task.title}
                secondary={`Status: ${task.status} | Priority: ${task.priority}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
} 