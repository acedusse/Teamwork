import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import BucketPlanningTab from '../components/dashboard/BucketPlanningTab';

// Sample stories data to populate the bucket planning interface
const sampleStories = [
  {
    id: 1,
    title: 'User Authentication System',
    description: 'JWT-based auth with role management and session handling',
    priority: 'high',
    effort: 8,
    tags: ['auth', 'security', 'backend'],
    assignee: 'John Doe',
    status: 'pending'
  },
  {
    id: 2,
    title: 'Dashboard Layout Enhancement',
    description: 'Create responsive dashboard layout with modern UI components',
    priority: 'medium',
    effort: 5,
    tags: ['ui', 'layout', 'frontend'],
    assignee: 'Jane Smith',
    status: 'pending'
  },
  {
    id: 3,
    title: 'Real-time Collaboration Features',
    description: 'WebSocket-based live editing and user presence indicators',
    priority: 'high',
    effort: 13,
    tags: ['websocket', 'collaboration', 'realtime'],
    assignee: 'Mike Johnson',
    status: 'pending'
  },
  {
    id: 4,
    title: 'Advanced Analytics Dashboard',
    description: 'Comprehensive metrics and reporting system with charts',
    priority: 'medium',
    effort: 8,
    tags: ['analytics', 'charts', 'reporting'],
    assignee: 'Sarah Wilson',
    status: 'pending'
  },
  {
    id: 5,
    title: 'API Gateway & Microservices',
    description: 'Scalable backend architecture with service mesh',
    priority: 'high',
    effort: 21,
    tags: ['api', 'microservices', 'architecture'],
    assignee: 'David Chen',
    status: 'pending'
  },
  {
    id: 6,
    title: 'Mobile App Integration',
    description: 'React Native mobile app with offline sync capabilities',
    priority: 'medium',
    effort: 13,
    tags: ['mobile', 'react-native', 'sync'],
    assignee: 'Lisa Park',
    status: 'pending'
  },
  {
    id: 7,
    title: 'AI Agent Communication',
    description: 'Inter-agent messaging and coordination system',
    priority: 'high',
    effort: 8,
    tags: ['ai', 'communication', 'agents'],
    assignee: 'Alex Rodriguez',
    status: 'pending'
  },
  {
    id: 8,
    title: 'Database Schema Optimization',
    description: 'Optimize data models for scalability and performance',
    priority: 'medium',
    effort: 5,
    tags: ['database', 'optimization', 'performance'],
    assignee: 'Emma Thompson',
    status: 'pending'
  },
  {
    id: 9,
    title: 'Security Framework Implementation',
    description: 'Comprehensive security and compliance system',
    priority: 'high',
    effort: 13,
    tags: ['security', 'compliance', 'framework'],
    assignee: 'Robert Kim',
    status: 'pending'
  },
  {
    id: 10,
    title: 'Performance Monitoring Suite',
    description: 'Application performance monitoring and alerting',
    priority: 'low',
    effort: 8,
    tags: ['monitoring', 'performance', 'alerts'],
    assignee: 'Maria Garcia',
    status: 'pending'
  }
];

// Enhanced bucket configuration with pre-populated items
const bucketConfig = {
  year: [
    { 
      id: 'y1', 
      title: '📅 1-Year Bucket', 
      capacity: 50, 
      stories: [
        {
          id: 'y1-1',
          title: 'AI-Powered Development Platform',
          description: 'Complete platform for AI-assisted software development',
          priority: 'high',
          effort: 34,
          tags: ['ai', 'platform', 'development']
        },
        {
          id: 'y1-2',
          title: 'Enterprise Security Framework',
          description: 'Comprehensive security and compliance system',
          priority: 'high',
          effort: 21,
          tags: ['security', 'enterprise', 'compliance']
        }
      ]
    },
    { 
      id: 'y2', 
      title: '📅 6-Month Bucket', 
      capacity: 50, 
      stories: [
        {
          id: 'y2-1',
          title: 'Core AI Agents System',
          description: 'Implement specialized AI agents for development tasks',
          priority: 'high',
          effort: 25,
          tags: ['ai', 'agents', 'core']
        },
        {
          id: 'y2-2',
          title: 'Real-time Collaboration',
          description: 'Live editing and synchronized development environment',
          priority: 'medium',
          effort: 18,
          tags: ['collaboration', 'realtime', 'sync']
        }
      ]
    },
    { 
      id: 'y3', 
      title: '📅 3-Month Bucket', 
      capacity: 30, 
      stories: [
        {
          id: 'y3-1',
          title: 'User Authentication System',
          description: 'JWT-based auth with role management',
          priority: 'high',
          effort: 8,
          tags: ['auth', 'security', 'users']
        },
        {
          id: 'y3-2',
          title: 'Task Management UI',
          description: 'Kanban board with drag-and-drop functionality',
          priority: 'medium',
          effort: 13,
          tags: ['ui', 'kanban', 'tasks']
        },
        {
          id: 'y3-3',
          title: 'Basic Reporting Features',
          description: 'Progress tracking and team metrics',
          priority: 'low',
          effort: 5,
          tags: ['reporting', 'metrics', 'tracking']
        }
      ]
    }
  ],
  quarter: [
    { id: 'q1', title: 'Q1 2024', capacity: 20, stories: [] },
    { id: 'q2', title: 'Q2 2024', capacity: 20, stories: [] },
    { id: 'q3', title: 'Q3 2024', capacity: 15, stories: [] },
    { id: 'q4', title: 'Q4 2024', capacity: 15, stories: [] }
  ],
  month: [
    { id: 'm1', title: 'January', capacity: 8, stories: [] },
    { id: 'm2', title: 'February', capacity: 8, stories: [] },
    { id: 'm3', title: 'March', capacity: 8, stories: [] },
    { id: 'm4', title: 'April', capacity: 6, stories: [] },
    { id: 'm5', title: 'May', capacity: 6, stories: [] },
    { id: 'm6', title: 'June', capacity: 6, stories: [] }
  ]
};

const BucketPlanningPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bucket Planning
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Organize work into time horizons. Items move from long-term to short-term buckets as they become more concrete.
      </Typography>

      <Paper elevation={1} sx={{ p: 0, borderRadius: 2 }}>
        <BucketPlanningTab 
          initialStories={sampleStories}
          bucketConfig={bucketConfig}
        />
      </Paper>
    </Box>
  );
};

export default BucketPlanningPage;
