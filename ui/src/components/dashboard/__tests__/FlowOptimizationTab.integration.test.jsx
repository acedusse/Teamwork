import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import FlowOptimizationTab from '../FlowOptimizationTab';

// Create a test theme
const testTheme = createTheme();

// Helper function to render component with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={testTheme}>
      {component}
    </ThemeProvider>
  );
};

// Mock functions for props
const mockOnApplySuggestions = jest.fn();
const mockOnScheduleReview = jest.fn();
const mockOnRefreshData = jest.fn();

describe('FlowOptimizationTab Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('BottleneckDetection Integration', () => {
    test('renders BottleneckDetection component within FlowOptimizationTab', async () => {
      renderWithTheme(
        <FlowOptimizationTab 
          onApplySuggestions={mockOnApplySuggestions}
          onScheduleReview={mockOnScheduleReview}
          onRefreshData={mockOnRefreshData}
        />
      );

      // Check that the main FlowOptimizationTab renders
      expect(screen.getByText('📊 Flow Optimization Dashboard')).toBeInTheDocument();

      // Wait for BottleneckDetection to complete its analysis
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Check that BottleneckDetection component is rendered and shows bottlenecks
      await waitFor(() => {
        expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });
    });

    test('BottleneckDetection shows expected bottleneck alerts', async () => {
      renderWithTheme(
        <FlowOptimizationTab 
          onApplySuggestions={mockOnApplySuggestions}
          onScheduleReview={mockOnScheduleReview}
          onRefreshData={mockOnRefreshData}
        />
      );

      // Wait for BottleneckDetection analysis to complete
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Check for the specific bottleneck mentioned in the task requirements
        expect(screen.getByText(/Development Column is over WIP limit/)).toBeInTheDocument();
        
        // Check for severity indicators
        expect(screen.getByText('CRITICAL')).toBeInTheDocument();
        
        // Check for other bottleneck types
        expect(screen.getByText('Blocked Tasks Accumulation: Code Review Column')).toBeInTheDocument();
        expect(screen.getByText('Resource Constraint: Testing Column')).toBeInTheDocument();
      });
    });

    test('BottleneckDetection receives flowData prop from FlowOptimizationTab', async () => {
      const sampleFlowData = {
        columns: [
          { name: 'Development', wipLimit: 3, tasks: 4 },
          { name: 'Code Review', wipLimit: 2, tasks: 3 }
        ]
      };

      renderWithTheme(
        <FlowOptimizationTab 
          flowData={sampleFlowData}
          onApplySuggestions={mockOnApplySuggestions}
          onScheduleReview={mockOnScheduleReview}
          onRefreshData={mockOnRefreshData}
        />
      );

      // Wait for analysis to complete
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // BottleneckDetection should render with the provided flow data
        expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
      });
    });

    test('BottleneckDetection and OptimizationSuggestions work together', async () => {
      renderWithTheme(
        <FlowOptimizationTab 
          onApplySuggestions={mockOnApplySuggestions}
          onScheduleReview={mockOnScheduleReview}
          onRefreshData={mockOnRefreshData}
        />
      );

      // Wait for analysis to complete
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Both components should be present
        expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
        expect(screen.getByText('💡 Optimization Suggestions')).toBeInTheDocument();
        
        // Check for related suggestions that address bottlenecks
        expect(screen.getByText(/Move TASK-005.*to separate blocked column/)).toBeInTheDocument();
        expect(screen.getByText(/Consider adding another developer/)).toBeInTheDocument();
      });
    });

    test('FlowOptimizationTab layout includes BottleneckDetection in correct position', () => {
      renderWithTheme(
        <FlowOptimizationTab 
          onApplySuggestions={mockOnApplySuggestions}
          onScheduleReview={mockOnScheduleReview}
          onRefreshData={mockOnRefreshData}
        />
      );

      // Check that BottleneckDetection is in the left column with suggestions
      const leftColumn = screen.getByText('Bottleneck Detection').closest('[class*="MuiGrid-item"]');
      const suggestionsSection = screen.getByText('💡 Optimization Suggestions').closest('[class*="MuiGrid-item"]');
      
      // Both should be in the same grid column
      expect(leftColumn).toContain(screen.getByText('Bottleneck Detection'));
      expect(leftColumn).toContain(screen.getByText('💡 Optimization Suggestions'));
    });
  });

  describe('Complete Flow Optimization Integration', () => {
    test('all main sections render together correctly', async () => {
      renderWithTheme(
        <FlowOptimizationTab 
          onApplySuggestions={mockOnApplySuggestions}
          onScheduleReview={mockOnScheduleReview}
          onRefreshData={mockOnRefreshData}
        />
      );

      // Check main dashboard title
      expect(screen.getByText('📊 Flow Optimization Dashboard')).toBeInTheDocument();

      // Wait for bottleneck analysis
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Check all main sections are present
        expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
        expect(screen.getByText('💡 Optimization Suggestions')).toBeInTheDocument();
        expect(screen.getByText('📈 Flow Metrics Trends')).toBeInTheDocument();
        
        // Check action buttons
        expect(screen.getByText('✨ Apply Suggestions')).toBeInTheDocument();
        expect(screen.getByText('📅 Schedule Review')).toBeInTheDocument();
      });
    });
  });
}); 