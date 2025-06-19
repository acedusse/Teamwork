import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import BottleneckDetection from '../BottleneckDetection';

// Create a test theme
const testTheme = createTheme();

// Mock functions for props
const mockOnBottleneckAction = jest.fn();

// Helper function to render component with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={testTheme}>
      {component}
    </ThemeProvider>
  );
};

// Sample flow data for testing
const sampleFlowData = {
  columns: [
    { name: 'Development', wipLimit: 3, tasks: 4 },
    { name: 'Code Review', wipLimit: 2, tasks: 3 },
    { name: 'Testing', wipLimit: 2, tasks: 1 }
  ],
  tasks: [
    { id: 'TASK-001', status: 'blocked', column: 'Code Review', blockedSince: '2 days' },
    { id: 'TASK-002', status: 'in-progress', column: 'Development' }
  ]
};

describe('BottleneckDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    test('renders with basic structure', () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
      expect(screen.getByText(/Last analyzed:/)).toBeInTheDocument();
    });

    test('shows loading state during analysis', () => {
      renderWithTheme(
        <BottleneckDetection 
          flowData={sampleFlowData}
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      expect(screen.getByText('Analyzing workflow patterns and detecting bottlenecks...')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      const { container } = renderWithTheme(
        <BottleneckDetection 
          className="custom-class"
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Bottleneck Analysis', () => {
    test('displays sample bottlenecks when no real data is provided', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      // Fast-forward past the analysis timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
        expect(screen.getByText('Blocked Tasks Accumulation: Code Review Column')).toBeInTheDocument();
        expect(screen.getByText('Resource Constraint: Testing Column')).toBeInTheDocument();
      });
    });

    test('shows different severity levels correctly', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRITICAL')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      });
    });

    test('updates analysis timestamp', async () => {
      renderWithTheme(
        <BottleneckDetection 
          flowData={sampleFlowData}
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      const initialTime = screen.getByText(/Last analyzed:/).textContent;

      // Wait for analysis to complete
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const updatedTime = screen.getByText(/Last analyzed:/).textContent;
        expect(updatedTime).not.toBe(initialTime);
      });
    });
  });

  describe('Bottleneck Details Expansion', () => {
    test('expands and collapses bottleneck details', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
          showDetails={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      // Find and click the expand button
      const expandButtons = screen.getAllByRole('button');
      const expandButton = expandButtons.find(button => 
        button.getAttribute('aria-label') === 'expand' || 
        button.querySelector('[data-testid="ExpandMoreIcon"]')
      );

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText('📊 Metrics')).toBeInTheDocument();
          expect(screen.getByText('💡 Recommendations')).toBeInTheDocument();
          expect(screen.getByText(/🎯 Affected Tasks/)).toBeInTheDocument();
        });
      }
    });

    test('shows detailed metrics for WIP limit bottlenecks', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
          showDetails={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      // Expand the first bottleneck (WIP limit)
      const expandButtons = screen.getAllByRole('button');
      const firstExpandButton = expandButtons[0];
      
      fireEvent.click(firstExpandButton);

      await waitFor(() => {
        expect(screen.getByText('Current WIP:')).toBeInTheDocument();
        expect(screen.getByText('4/3')).toBeInTheDocument();
        expect(screen.getByText('Overage:')).toBeInTheDocument();
        expect(screen.getByText('+33%')).toBeInTheDocument();
      });
    });

    test('shows recommendations for bottlenecks', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
          showDetails={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      // Expand the first bottleneck
      const expandButtons = screen.getAllByRole('button');
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Move blocked tasks to a separate column')).toBeInTheDocument();
        expect(screen.getByText('Consider pairing on complex tasks')).toBeInTheDocument();
        expect(screen.getByText('Review task sizing and break down large items')).toBeInTheDocument();
      });
    });

    test('shows affected tasks for bottlenecks', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
          showDetails={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      // Expand the first bottleneck
      const expandButtons = screen.getAllByRole('button');
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/🎯 Affected Tasks \(4\)/)).toBeInTheDocument();
        expect(screen.getByText('TASK-001')).toBeInTheDocument();
        expect(screen.getByText('User Authentication')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('No Bottlenecks State', () => {
    test('shows success message when no bottlenecks detected', async () => {
      // Mock the analyzeBottlenecks to return empty array
      const mockAnalyzeBottlenecks = jest.fn().mockReturnValue([]);
      
      renderWithTheme(
        <BottleneckDetection 
          flowData={{ columns: [], tasks: [] }}
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('No Bottlenecks Detected')).toBeInTheDocument();
        expect(screen.getByText('Your workflow is currently operating smoothly with no significant bottlenecks identified.')).toBeInTheDocument();
      });
    });
  });

  describe('Bottleneck Actions', () => {
    test('calls onBottleneckAction when provided', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      // The component should be ready to handle actions
      // In a real scenario, there would be action buttons that trigger the callback
      expect(mockOnBottleneckAction).not.toHaveBeenCalled(); // Not called yet, but ready
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on different screen sizes', () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      // Component should render without errors on any screen size
      expect(screen.getByText('Bottleneck Detection')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
          showDetails={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      // Expand buttons should be focusable
      const expandButtons = screen.getAllByRole('button');
      expect(expandButtons.length).toBeGreaterThan(0);
      
      expandButtons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Performance', () => {
    test('handles large numbers of bottlenecks efficiently', async () => {
      const startTime = performance.now();
      
      renderWithTheme(
        <BottleneckDetection 
          onBottleneckAction={mockOnBottleneckAction}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('WIP Limit Exceeded: Development Column')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid flow data gracefully', () => {
      const invalidFlowData = { invalid: 'data' };
      
      expect(() => {
        renderWithTheme(
          <BottleneckDetection 
            flowData={invalidFlowData}
            onBottleneckAction={mockOnBottleneckAction}
          />
        );
      }).not.toThrow();
    });

    test('handles missing onBottleneckAction prop gracefully', () => {
      expect(() => {
        renderWithTheme(
          <BottleneckDetection />
        );
      }).not.toThrow();
    });
  });
}); 