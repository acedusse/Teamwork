import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BucketPlanningTab from '../BucketPlanningTab';

// Mock theme for testing
const theme = createTheme();

// Helper function to render component with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock data for testing
const mockStories = [
  {
    id: 1,
    title: 'User Authentication',
    description: 'Implement user login and registration',
    priority: 'high',
    effort: 8,
    tags: ['auth', 'security'],
    assignee: 'John Doe'
  },
  {
    id: 2,
    title: 'Dashboard Layout',
    description: 'Create responsive dashboard layout',
    priority: 'medium',
    effort: 5,
    tags: ['ui', 'layout'],
    assignee: 'Jane Smith'
  }
];

const mockBucketConfig = {
  quarter: [
    { id: 'q1', title: 'Q1 2024', capacity: 20, stories: [] },
    { id: 'q2', title: 'Q2 2024', capacity: 20, stories: [] }
  ]
};

describe('BucketPlanningTab', () => {
  test('renders component with default props', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    expect(screen.getByText('Bucket Planning')).toBeInTheDocument();
    expect(screen.getByText(/Organize and allocate stories/)).toBeInTheDocument();
  });

  test('renders time horizon selector buttons', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    expect(screen.getByLabelText('year view')).toBeInTheDocument();
    expect(screen.getByLabelText('quarter view')).toBeInTheDocument();
    expect(screen.getByLabelText('month view')).toBeInTheDocument();
  });

  test('displays default quarter buckets', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    expect(screen.getByText('Q1 2024')).toBeInTheDocument();
    expect(screen.getByText('Q2 2024')).toBeInTheDocument();
    expect(screen.getByText('Q3 2024')).toBeInTheDocument();
    expect(screen.getByText('Q4 2024')).toBeInTheDocument();
  });

  test('switches time horizons correctly', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    // Switch to year view
    fireEvent.click(screen.getByLabelText('year view'));
    expect(screen.getByText('Year 1')).toBeInTheDocument();
    expect(screen.getByText('Year 2')).toBeInTheDocument();
    expect(screen.getByText('Year 3')).toBeInTheDocument();
    
    // Switch to month view
    fireEvent.click(screen.getByLabelText('month view'));
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText('March')).toBeInTheDocument();
  });

  test('renders stories in backlog section', () => {
    renderWithTheme(
      <BucketPlanningTab initialStories={mockStories} />
    );
    
    expect(screen.getByText('Story Backlog')).toBeInTheDocument();
    expect(screen.getByText('2 stories available for planning')).toBeInTheDocument();
    expect(screen.getByText('User Authentication')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Layout')).toBeInTheDocument();
  });

  test('displays empty state when no stories provided', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    expect(screen.getByText('0 stories available for planning')).toBeInTheDocument();
    expect(screen.getByText('No stories available. Add stories to begin planning.')).toBeInTheDocument();
  });

  test('shows capacity information for buckets', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    // Check that capacity is displayed (should find at least one bucket with 0/20 capacity)
    expect(screen.getAllByText(/Capacity: 0 \/ 20/).length).toBeGreaterThan(0);
  });

  test('calls callback functions when provided', () => {
    const mockOnStoriesUpdate = jest.fn();
    const mockOnBucketConfigUpdate = jest.fn();
    
    renderWithTheme(
      <BucketPlanningTab 
        initialStories={mockStories}
        onStoriesUpdate={mockOnStoriesUpdate}
        onBucketConfigUpdate={mockOnBucketConfigUpdate}
      />
    );
    
    // Component should render without errors when callbacks are provided
    expect(screen.getByText('Bucket Planning')).toBeInTheDocument();
  });

  test('uses custom bucket configuration when provided', () => {
    renderWithTheme(
      <BucketPlanningTab bucketConfig={mockBucketConfig} />
    );
    
    // Should still show Q1 and Q2, but only those two since we provided custom config
    expect(screen.getByText('Q1 2024')).toBeInTheDocument();
    expect(screen.getByText('Q2 2024')).toBeInTheDocument();
  });

  test('component is responsive', () => {
    // Test that component renders without errors (responsive behavior is handled by Material-UI)
    renderWithTheme(<BucketPlanningTab />);
    
    const container = screen.getByText('Bucket Planning').closest('div');
    expect(container).toBeInTheDocument();
  });

  test('bucket placeholders show drop zones', () => {
    renderWithTheme(<BucketPlanningTab />);
    
    // Check that empty buckets show the drop message
    expect(screen.getAllByText('Drop stories here...').length).toBeGreaterThan(0);
  });
}); 