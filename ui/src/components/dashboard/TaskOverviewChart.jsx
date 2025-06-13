import { Box, Typography, useTheme } from '@mui/material';
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

// Mock data for demonstration
const data = [
  { name: 'Mon', completed: 4, inProgress: 2, pending: 3 },
  { name: 'Tue', completed: 3, inProgress: 3, pending: 2 },
  { name: 'Wed', completed: 5, inProgress: 1, pending: 4 },
  { name: 'Thu', completed: 2, inProgress: 4, pending: 1 },
  { name: 'Fri', completed: 4, inProgress: 2, pending: 3 },
  { name: 'Sat', completed: 1, inProgress: 1, pending: 2 },
  { name: 'Sun', completed: 2, inProgress: 2, pending: 1 },
];

export default function TaskOverviewChart() {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="completed"
            name="Completed"
            fill={theme.palette.success.main}
            stackId="a"
          />
          <Bar
            dataKey="inProgress"
            name="In Progress"
            fill={theme.palette.primary.main}
            stackId="a"
          />
          <Bar
            dataKey="pending"
            name="Pending"
            fill={theme.palette.warning.main}
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
} 