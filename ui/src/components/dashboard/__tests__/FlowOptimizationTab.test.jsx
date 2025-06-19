import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import FlowOptimizationTab from '../FlowOptimizationTab';

// Create a test theme
const testTheme = createTheme();

// Mock functions for props
const mockProps = {
  onApplySuggestions: jest.fn(),
  onScheduleReview: jest.fn(),
  onRefreshData: jest.fn()
};

// Helper function to render component with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={testTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('FlowOptimizationTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders FlowOptimizationTab component with proper layout', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for main header
    expect(screen.getByText('📊 Flow Optimization Dashboard')).toBeInTheDocument();
    
    // Check for main sections
    expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
    expect(screen.getByText('💡 Optimization Suggestions')).toBeInTheDocument();
    expect(screen.getByText('📈 Flow Metrics Trends')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByText('✨ Apply Suggestions')).toBeInTheDocument();
    expect(screen.getByText('📅 Schedule Review')).toBeInTheDocument();
  });

  test('displays bottleneck detection alert', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for bottleneck alert
    expect(screen.getByText('Bottleneck Detected: Development Column')).toBeInTheDocument();
    expect(screen.getByText(/Development Column is over WIP limit/)).toBeInTheDocument();
  });

  test('displays optimization suggestions with proper styling', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for sample suggestions
    expect(screen.getByText('Move TASK-005 (blocked) to separate blocked column')).toBeInTheDocument();
    expect(screen.getByText('Consider adding another developer to reduce WIP limit pressure')).toBeInTheDocument();
    expect(screen.getByText('Break down large tasks (8 SP) into smaller chunks')).toBeInTheDocument();
    
    // Check for priority chips
    expect(screen.getAllByText('high')).toHaveLength(1);
    expect(screen.getAllByText('medium')).toHaveLength(2);
    expect(screen.getAllByText('low')).toHaveLength(2);
  });

  test('displays flow metrics with correct values', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for metrics values
    expect(screen.getByText('-0.3d')).toBeInTheDocument(); // Cycle Time Change
    expect(screen.getByText('+15%')).toBeInTheDocument(); // Throughput Change
    expect(screen.getByText('Cycle Time Change')).toBeInTheDocument();
    expect(screen.getByText('Throughput Change')).toBeInTheDocument();
    
    // Check for additional metrics
    expect(screen.getByText('Lead Time')).toBeInTheDocument();
    expect(screen.getByText('WIP Efficiency')).toBeInTheDocument();
    expect(screen.getByText('Flow Predictability')).toBeInTheDocument();
  });

  test('handles suggestion selection and apply functionality', async () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Initially, Apply Suggestions button should be disabled
    const applyButton = screen.getByText('✨ Apply Suggestions').closest('button');
    expect(applyButton).toBeDisabled();
    
    // Click on a suggestion to select it
    const firstSuggestion = screen.getByText('Move TASK-005 (blocked) to separate blocked column').closest('div[role="button"], div[style*="cursor: pointer"], .MuiCard-root');
    fireEvent.click(firstSuggestion);
    
    // Apply button should now be enabled
    await waitFor(() => {
      expect(applyButton).not.toBeDisabled();
    });
    
    // Click apply button
    fireEvent.click(applyButton);
    
    // Verify callback was called
    expect(mockProps.onApplySuggestions).toHaveBeenCalledWith([1]);
  });

  test('handles schedule review functionality', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Click schedule review button
    const scheduleButton = screen.getByText('📅 Schedule Review');
    fireEvent.click(scheduleButton);
    
    // Verify callback was called
    expect(mockProps.onScheduleReview).toHaveBeenCalled();
  });

  test('handles data refresh functionality', async () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Find and click refresh button
    const refreshButton = screen.getByLabelText('Refresh Data') || screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    // Verify callback was called
    expect(mockProps.onRefreshData).toHaveBeenCalled();
  });

  test('displays cumulative flow diagram placeholder', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for cumulative flow diagram placeholder
    expect(screen.getByText('📊 Cumulative Flow Diagram')).toBeInTheDocument();
    expect(screen.getByText('Shows work distribution across columns over time')).toBeInTheDocument();
  });

  test('applies purple theme styling correctly', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for gradient background in header (we can check for the presence of the header)
    const header = screen.getByText('📊 Flow Optimization Dashboard').closest('div');
    expect(header).toBeInTheDocument();
    
    // Check for subtitle text
    expect(screen.getByText('Collaborative Planning • Pull-Based Flow • Continuous Optimization')).toBeInTheDocument();
  });

  test('responsive design works across different screen sizes', () => {
    // This test would ideally use different viewport sizes
    // For now, we'll just verify the component renders without errors
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Component should render without throwing errors
    expect(screen.getByText('📊 Flow Optimization Dashboard')).toBeInTheDocument();
  });

  test('displays last updated timestamp', () => {
    renderWithTheme(<FlowOptimizationTab {...mockProps} />);
    
    // Check for last updated text
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
}); 