import React from 'react';
import { Box, Typography } from '@mui/material';
import SprintPlanningTab from '../components/dashboard/SprintPlanningTab';

export default function SprintPlanning() {
  // Sample data for the SprintPlanningTab
  const sampleStories = [
    {
      id: 1,
      title: "User Authentication System",
      description: "JWT-based auth with role management and session handling",
      points: 8,
      priority: "High Priority",
      tags: ["auth", "security", "backend"],
      assignee: "John Doe"
    },
    {
      id: 2,
      title: "Task Management UI",
      description: "Kanban board with drag-and-drop functionality",
      points: 5,
      priority: "Medium Priority", 
      tags: ["ui", "frontend", "drag"],
      assignee: "Jane Smith"
    },
    {
      id: 3,
      title: "AI Agent Communication",
      description: "Inter-agent messaging and coordination protocols",
      points: 13,
      priority: "High Priority",
      tags: ["ai", "communication", "protocols"],
      assignee: "AI Team"
    },
    {
      id: 4,
      title: "Database Schema Design",
      description: "Optimized data models for scalability and performance",
      points: 5,
      priority: "Medium Priority",
      tags: ["data", "schema", "performance"],
      assignee: "DB Team"
    }
  ];

  const sampleTeamMembers = [
    { id: 1, name: "John Doe", role: "Frontend Developer" },
    { id: 2, name: "Jane Smith", role: "Backend Developer" },
    { id: 3, name: "AI Team", role: "AI Specialists" },
    { id: 4, name: "DB Team", role: "Database Engineers" }
  ];

  const handleSprintCreate = (sprintData) => {
    console.log('Creating sprint:', sprintData);
    // TODO: Implement sprint creation logic
  };

  const handleSprintUpdate = (sprintData) => {
    console.log('Updating sprint:', sprintData);
    // TODO: Implement sprint update logic
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Sprint Planning
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Plan your sprint with story selection, capacity planning, and dependency management.
        </Typography>
      </Box>

      {/* Sprint Planning Tab Component */}
      <SprintPlanningTab
        stories={sampleStories}
        teamMembers={sampleTeamMembers}
        existingSprints={[]}
        onSprintCreate={handleSprintCreate}
        onSprintUpdate={handleSprintUpdate}
      />
    </Box>
  );
} 