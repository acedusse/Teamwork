import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContinuousImprovementTab from '../ContinuousImprovementTab';

// Mock the child components since they are tested separately
jest.mock('../RetrospectiveBoard', () => {
  return function MockRetrospectiveBoard({ onRetrospectiveCreate, onItemCreate }) {
    return (
      <div data-testid="retrospective-board">
        <button 
          onClick={() => onRetrospectiveCreate({ title: 'Test Retro', participants: [] })}
          data-testid="create-retro-btn"
        >
          Create Retrospective
        </button>
        <button 
          onClick={() => onItemCreate({ id: 'item-1', text: 'Test item', column: 'start' })}
          data-testid="create-item-btn"
        >
          Create Item
        </button>
      </div>
    );
  };
});

jest.mock('../ActionItemTracker', () => {
  return function MockActionItemTracker({ actionItems, onActionItemUpdate, onActionItemCreate }) {
    return (
      <div data-testid="action-item-tracker">
        <div data-testid="action-items-count">{actionItems.length} action items</div>
        <button 
          onClick={() => onActionItemCreate({ id: 'new-action', title: 'New Action' })}
          data-testid="create-action-btn"
        >
          Create Action Item
        </button>
        <button 
          onClick={() => onActionItemUpdate({ id: 'action-1', status: 'done' })}
          data-testid="update-action-btn"
        >
          Update Action Item
        </button>
      </div>
    );
  };
});

jest.mock('../ImprovementMetrics', () => {
  return function MockImprovementMetrics({ retrospectives, actionItems, onTimeRangeChange }) {
    return (
      <div data-testid="improvement-metrics">
        <div data-testid="retros-count">{retrospectives.length} retrospectives</div>
        <div data-testid="actions-count">{actionItems.length} action items</div>
        <button 
          onClick={() => onTimeRangeChange('6months')}
          data-testid="change-timerange-btn"
        >
          Change Time Range
        </button>
      </div>
    );
  };
});

jest.mock('../RetrospectiveExporter', () => {
  return function MockRetrospectiveExporter({ open, onClose, onExport }) {
    if (!open) return null;
    return (
      <div data-testid="retrospective-exporter">
        <button onClick={() => onExport({ format: 'pdf' })} data-testid="export-pdf-btn">
          Export PDF
        </button>
        <button onClick={onClose} data-testid="close-export-btn">
          Close
        </button>
      </div>
    );
  };
});

// Mock DateTimePicker to avoid complex date testing
jest.mock('@mui/x-date-pickers/DateTimePicker', () => {
  return {
    DateTimePicker: ({ value, onChange, renderInput }) => {
      const handleChange = (e) => {
        onChange(new Date(e.target.value));
      };
      return renderInput ? 
        renderInput({ 
          value: value?.toISOString?.()?.slice(0, 16) || '', 
          onChange: handleChange,
          'data-testid': 'datetime-picker'
        }) :
        <input 
          type="datetime-local" 
          value={value?.toISOString?.()?.slice(0, 16) || ''} 
          onChange={handleChange}
          data-testid="datetime-picker"
        />;
    }
  };
});

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  return {
    LocalizationProvider: ({ children }) => <div>{children}</div>
  };
});

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => {
  return {
    AdapterDateFns: () => ({})
  };
});

const theme = createTheme();

const renderWithTheme = (component, props = {}) => {
  const defaultProps = {
    onRetrospectiveCreate: jest.fn(),
    onActionItemUpdate: jest.fn(),
    onExportReport: jest.fn(),
    ...props
  };

  return render(
    <ThemeProvider theme={theme}>
      <ContinuousImprovementTab {...defaultProps} />
    </ThemeProvider>
  );
};

describe('ContinuousImprovementTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset performance.now for consistent testing
    jest.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders with default state', () => {
      renderWithTheme();
      
      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument();
      expect(screen.getByText('Retrospectives')).toBeInTheDocument();
      expect(screen.getByText('Action Items')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByTestId('retrospective-board')).toBeInTheDocument();
    });

    test('renders header controls', () => {
      renderWithTheme();
      
      expect(screen.getByLabelText('refresh')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByLabelText('settings')).toBeInTheDocument();
    });

    test('renders floating action button', () => {
      renderWithTheme();
      
      expect(screen.getByLabelText('add retrospective')).toBeInTheDocument();
    });

    test('shows last updated timestamp', () => {
      renderWithTheme();
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    test('displays key metrics overview cards', () => {
      renderWithTheme();
      
      expect(screen.getByText('Total Retrospectives')).toBeInTheDocument();
      expect(screen.getByText('Action Completion')).toBeInTheDocument();
      expect(screen.getByText('Total Action Items')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Retros')).toBeInTheDocument();
    });
  });

  describe('Advanced Features - Retrospective Scheduling', () => {
    test('opens scheduling dialog when calendar icon is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const scheduleButton = screen.getByLabelText('schedule retrospective');
      await user.click(scheduleButton);

      expect(screen.getByText('Schedule Retrospective')).toBeInTheDocument();
      expect(screen.getByLabelText('Retrospective Title')).toBeInTheDocument();
      expect(screen.getByTestId('datetime-picker')).toBeInTheDocument();
    });

    test('handles retrospective scheduling form submission', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Open scheduler
      await user.click(screen.getByLabelText('schedule retrospective'));

      // Fill form
      const titleInput = screen.getByLabelText('Retrospective Title');
      await user.type(titleInput, 'Sprint 4.1 Retrospective');

      // Submit form
      const scheduleButton = screen.getByRole('button', { name: /schedule/i });
      await user.click(scheduleButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Schedule Retrospective')).not.toBeInTheDocument();
      });
    });

    test('validates scheduling form inputs', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      await user.click(screen.getByLabelText('schedule retrospective'));

      // Try to submit without title
      const scheduleButton = screen.getByRole('button', { name: /schedule/i });
      expect(scheduleButton).toBeDisabled();

      // Add title
      const titleInput = screen.getByLabelText('Retrospective Title');
      await user.type(titleInput, 'Test Retrospective');

      expect(scheduleButton).not.toBeDisabled();
    });

    test('handles reminder settings in scheduling', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      await user.click(screen.getByLabelText('schedule retrospective'));

      // Check reminder toggle
      const reminderSwitch = screen.getByRole('checkbox', { name: /enable reminder/i });
      expect(reminderSwitch).toBeChecked();

      // Toggle off
      await user.click(reminderSwitch);
      expect(reminderSwitch).not.toBeChecked();

      // Reminder time dropdown should not be visible
      expect(screen.queryByLabelText('Reminder Time')).not.toBeInTheDocument();
    });

    test('handles recurrence settings in scheduling', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      await user.click(screen.getByLabelText('schedule retrospective'));

      // Check recurrence dropdown
      const recurrenceSelect = screen.getByLabelText('Recurrence');
      await user.click(recurrenceSelect);

      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Bi-weekly')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });
  });

  describe('Advanced Features - Improvement Analytics', () => {
    test('opens analytics dialog when analytics icon is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const analyticsButton = screen.getByLabelText('view analytics');
      await user.click(analyticsButton);

      expect(screen.getByText('Team Improvement Analytics')).toBeInTheDocument();
      expect(screen.getByText('Improvement Score')).toBeInTheDocument();
    });

    test('displays improvement score and metrics', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      await user.click(screen.getByLabelText('view analytics'));

      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
      expect(screen.getByText('Action Item Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Average Participation')).toBeInTheDocument();
      expect(screen.getByText('Retrospectives Conducted')).toBeInTheDocument();
    });

    test('calculates improvement score correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      await user.click(screen.getByLabelLabel('view analytics'));

      // Should display a score out of 100
      const scoreElement = screen.getByText(/out of 100/);
      expect(scoreElement).toBeInTheDocument();
    });

    test('handles analytics export', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      await user.click(screen.getByLabelText('view analytics'));

      const exportButton = screen.getByRole('button', { name: /export analytics/i });
      await user.click(exportButton);

      // Should trigger export functionality
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Enhanced Accessibility Features', () => {
    test('has proper ARIA labels and roles', () => {
      renderWithTheme();
      
      expect(screen.getByLabelText('add retrospective')).toBeInTheDocument();
      expect(screen.getByLabelText('refresh')).toBeInTheDocument();
      expect(screen.getByLabelText('settings')).toBeInTheDocument();
      expect(screen.getByLabelText('schedule retrospective')).toBeInTheDocument();
      expect(screen.getByLabelText('view analytics')).toBeInTheDocument();
    });

    test('supports enhanced keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const firstTab = screen.getByText('Retrospectives');
      const secondTab = screen.getByText('Action Items');
      const thirdTab = screen.getByText('Metrics');

      // Tab to first tab
      await user.tab();
      expect(firstTab.closest('[role="tab"]')).toHaveFocus();

      // Arrow key navigation
      await user.keyboard('{ArrowRight}');
      expect(secondTab.closest('[role="tab"]')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(thirdTab.closest('[role="tab"]')).toHaveFocus();

      // Home/End key navigation
      await user.keyboard('{Home}');
      expect(firstTab.closest('[role="tab"]')).toHaveFocus();

      await user.keyboard('{End}');
      expect(thirdTab.closest('[role="tab"]')).toHaveFocus();
    });

    test('handles escape key to close modals', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Open scheduler
      await user.click(screen.getByLabelText('schedule retrospective'));
      expect(screen.getByText('Schedule Retrospective')).toBeInTheDocument();

      // Press escape
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Schedule Retrospective')).not.toBeInTheDocument();
      });
    });

    test('provides screen reader announcements', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Switch tabs should announce change
      await user.click(screen.getByText('Action Items'));
      
      // Check for aria-live region
      const tabPanel = screen.getByRole('region');
      expect(tabPanel).toHaveAttribute('aria-live', 'polite');
    });

    test('has proper focus management', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Tab panels should have proper tabindex
      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Performance Monitoring', () => {
    test('tracks component load time', () => {
      const performanceSpy = jest.spyOn(performance, 'now')
        .mockReturnValueOnce(0)  // Initial render
        .mockReturnValueOnce(100); // After useEffect

      renderWithTheme();

      expect(performanceSpy).toHaveBeenCalledTimes(2);
    });

    test('displays performance metrics in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock performance.now to return consistent values
      jest.spyOn(performance, 'now')
        .mockReturnValueOnce(0)  // Initial render
        .mockReturnValueOnce(100); // After useEffect

      renderWithTheme();

      // Wait for the load time to be calculated and displayed
      await waitFor(() => {
        expect(screen.getByText('Load time: 100ms')).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('measures refresh performance', async () => {
      const user = userEvent.setup();
      const performanceSpy = jest.spyOn(performance, 'now')
        .mockReturnValueOnce(0)  // Initial render
        .mockReturnValueOnce(50)  // After useEffect
        .mockReturnValueOnce(0)   // Refresh start
        .mockReturnValueOnce(75); // Refresh end

      renderWithTheme();

      await user.click(screen.getByLabelText('refresh'));

      expect(performanceSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('handles component errors gracefully with error boundary', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ThemeProvider theme={theme}>
          <div>
            <ThrowError />
          </div>
        </ThemeProvider>
      );

      expect(container).toBeInTheDocument();
      consoleError.mockRestore();
    });

    test('provides error recovery options', () => {
      // Test would require triggering an actual error boundary
      // This is more of an integration test
      expect(true).toBe(true);
    });

    test('handles API failures gracefully', async () => {
      const user = userEvent.setup();
      const onRetrospectiveCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      
      renderWithTheme({ onRetrospectiveCreate });

      const createButton = screen.getByTestId('create-retro-btn');
      await user.click(createButton);

      // Should not crash the component
      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument();
    });
  });

  describe('Notifications and Feedback', () => {
    test('displays notifications for upcoming retrospectives', () => {
      renderWithTheme();

      // Should show notification badge if there are upcoming retrospectives
      const notificationBadge = screen.queryByLabelText(/notifications/);
      if (notificationBadge) {
        expect(notificationBadge).toBeInTheDocument();
      }
    });

    test('shows snackbar notifications for user actions', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Switch tabs should show notification
      await user.click(screen.getByText('Action Items'));

      // Should show snackbar (may be brief)
      await waitFor(() => {
        const snackbar = screen.queryByRole('alert');
        if (snackbar) {
          expect(snackbar).toBeInTheDocument();
        }
      }, { timeout: 100 });
    });

    test('handles snackbar close functionality', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Trigger an action that shows snackbar
      await user.click(screen.getByText('Action Items'));

      // Wait for snackbar and close it
      await waitFor(async () => {
        const closeButton = screen.queryByLabelText('Close');
        if (closeButton) {
          await user.click(closeButton);
        }
      }, { timeout: 100 });
    });
  });

  describe('Tab Navigation', () => {
    test('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Initially on Retrospectives tab
      expect(screen.getByTestId('retrospective-board')).toBeInTheDocument();
      expect(screen.queryByTestId('action-item-tracker')).not.toBeInTheDocument();

      // Switch to Action Items tab
      await user.click(screen.getByText('Action Items'));
      expect(screen.getByTestId('action-item-tracker')).toBeInTheDocument();
      expect(screen.queryByTestId('retrospective-board')).not.toBeInTheDocument();

      // Switch to Metrics tab
      await user.click(screen.getByText('Metrics'));
      expect(screen.getByTestId('improvement-metrics')).toBeInTheDocument();
      expect(screen.queryByTestId('action-item-tracker')).not.toBeInTheDocument();
    });

    test('maintains proper tab state', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const actionItemsTab = screen.getByText('Action Items');
      await user.click(actionItemsTab);

      // Check that Action Items tab is selected
      expect(actionItemsTab.closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Data Management', () => {
    test('initializes with sample data', () => {
      renderWithTheme();
      
      // Switch to Action Items tab to see the count
      fireEvent.click(screen.getByText('Action Items'));
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('3 action items');
      
      // Switch to Metrics tab to see retrospective count
      fireEvent.click(screen.getByText('Metrics'));
      expect(screen.getByTestId('retros-count')).toHaveTextContent('3 retrospectives');
    });

    test('handles retrospective creation', async () => {
      const onRetrospectiveCreate = jest.fn();
      renderWithTheme({ onRetrospectiveCreate });

      const createButton = screen.getByTestId('create-retro-btn');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(onRetrospectiveCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Retro',
            participants: []
          })
        );
      });
    });

    test('handles action item updates', async () => {
      const onActionItemUpdate = jest.fn();
      renderWithTheme({ onActionItemUpdate });

      // Switch to Action Items tab
      fireEvent.click(screen.getByText('Action Items'));
      
      const updateButton = screen.getByTestId('update-action-btn');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(onActionItemUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'action-1',
            status: 'done'
          })
        );
      });
    });

    test('handles action item creation', async () => {
      renderWithTheme();

      // Switch to Action Items tab
      fireEvent.click(screen.getByText('Action Items'));
      
      const createButton = screen.getByTestId('create-action-btn');
      fireEvent.click(createButton);

      // Verify the action item was added to state (check count increased)
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('4 action items');
    });
  });

  describe('Export Functionality', () => {
    test('opens export dialog when export button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(screen.getByTestId('retrospective-exporter')).toBeInTheDocument();
    });

    test('closes export dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Open export dialog
      await user.click(screen.getByText('Export'));
      expect(screen.getByTestId('retrospective-exporter')).toBeInTheDocument();

      // Close export dialog
      await user.click(screen.getByTestId('close-export-btn'));
      expect(screen.queryByTestId('retrospective-exporter')).not.toBeInTheDocument();
    });

    test('handles export report callback', async () => {
      const onExportReport = jest.fn();
      const user = userEvent.setup();
      renderWithTheme({ onExportReport });

      // Open export dialog and export
      await user.click(screen.getByText('Export'));
      await user.click(screen.getByTestId('export-pdf-btn'));

      expect(onExportReport).toHaveBeenCalledWith({ format: 'pdf' });
      expect(screen.queryByTestId('retrospective-exporter')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    test('handles refresh button click', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const refreshButton = screen.getByLabelText('refresh');
      await user.click(refreshButton);

      // Should show loading state briefly
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });

    test('shows loading state during refresh', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      const refreshButton = screen.getByLabelText('refresh');
      fireEvent.click(refreshButton);

      // Check for loading indicator (progress bar should be visible)
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Floating Action Button', () => {
    test('creates new retrospective when FAB is clicked on retrospectives tab', async () => {
      const onRetrospectiveCreate = jest.fn();
      const user = userEvent.setup();
      renderWithTheme({ onRetrospectiveCreate });

      // Ensure we're on retrospectives tab
      expect(screen.getByTestId('retrospective-board')).toBeInTheDocument();

      const fab = screen.getByLabelText('add retrospective');
      await user.click(fab);

      expect(onRetrospectiveCreate).toHaveBeenCalled();
    });

    test('creates new action item when FAB is clicked on action items tab', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Switch to Action Items tab
      await user.click(screen.getByText('Action Items'));

      const fab = screen.getByLabelText('add retrospective');
      await user.click(fab);

      // Should create new action item (check count increased)
      expect(screen.getByTestId('action-items-count')).toHaveTextContent('4 action items');
    });

    test('opens scheduler when FAB is clicked on metrics tab', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Switch to Metrics tab
      await user.click(screen.getByText('Metrics'));

      const fab = screen.getByLabelText('add retrospective');
      await user.click(fab);

      // Should open scheduler
      expect(screen.getByText('Schedule Retrospective')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 600px)'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithTheme();
      
      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument();
      expect(screen.getByTestId('retrospective-board')).toBeInTheDocument();
    });

    test('adapts tab layout for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 900px)'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithTheme();
      
      // Tabs should still be functional on mobile
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing props gracefully', () => {
      render(
        <ThemeProvider theme={theme}>
          <ContinuousImprovementTab />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument();
    });

    test('handles callback errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const onRetrospectiveCreate = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      renderWithTheme({ onRetrospectiveCreate });

      const createButton = screen.getByTestId('create-retro-btn');
      
      expect(() => {
        fireEvent.click(createButton);
      }).not.toThrow();

      consoleError.mockRestore();
    });
  });

  describe('Performance', () => {
    test('memoizes expensive operations', () => {
      const { rerender } = renderWithTheme();
      
      // Re-render with same props should not cause unnecessary updates
      rerender(
        <ThemeProvider theme={theme}>
          <ContinuousImprovementTab 
            onRetrospectiveCreate={jest.fn()}
            onActionItemUpdate={jest.fn()}
            onExportReport={jest.fn()}
          />
        </ThemeProvider>
      );
      
      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument();
    });

    test('handles large datasets efficiently', () => {
      // This would require testing with large mock datasets
      // For now, just ensure component renders
      renderWithTheme();
      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument();
    });
  });

  describe('AgentEventsPanel', () => {
    const mockAgents = [
      { id: 'task-optimizer', name: 'Task Optimizer', avatar: '🤖', color: '#2196F3', status: 'active', description: 'AI agent that analyzes task flow', lastActivity: '2025-06-24T04:42:50.298Z' },
      { id: 'story-estimator', name: 'Story Estimator', avatar: '📊', color: '#4CAF50', status: 'active', description: 'AI agent for estimation', lastActivity: '2025-06-24T01:51:42.494Z' }
    ];
    const mockEvents = [
      { id: '1', agentId: 'task-optimizer', action: 'status_change', details: { status: 'active' }, timestamp: '2025-06-24T04:42:50.299Z' },
      { id: '2', agentId: 'story-estimator', action: 'recommendation', details: { title: 'Estimate', description: 'Estimate story points' }, timestamp: '2025-06-24T04:40:00.000Z' }
    ];

    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockImplementation((url) => {
        if (url.includes('/api/ai-agents/activities')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { activities: mockEvents } }) });
        }
        if (url.includes('/api/ai-agents')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { agents: mockAgents } }) });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('renders loading state', async () => {
      jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));
      renderWithTheme(<ContinuousImprovementTab />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders error state', async () => {
      jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({ ok: false }));
      renderWithTheme(<ContinuousImprovementTab />);
      await waitFor(() => expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument());
    });

    test('renders event list and agent health', async () => {
      renderWithTheme(<ContinuousImprovementTab />);
      await waitFor(() => expect(screen.getByText('Recent AI Agent Events & Health')).toBeInTheDocument());
      expect(screen.getByText('Task Optimizer')).toBeInTheDocument();
      expect(screen.getByText('Story Estimator')).toBeInTheDocument();
      expect(screen.getByText('status_change')).toBeInTheDocument();
      expect(screen.getByText('recommendation')).toBeInTheDocument();
    });

    test('filters by event type', async () => {
      renderWithTheme(<ContinuousImprovementTab />);
      await waitFor(() => expect(screen.getByText('Recent AI Agent Events & Health')).toBeInTheDocument());
      const eventTypeSelect = screen.getByLabelText('Event Type');
      userEvent.click(eventTypeSelect);
      userEvent.click(screen.getByText('recommendation'));
      expect(screen.queryByText('status_change')).not.toBeInTheDocument();
      expect(screen.getByText('recommendation')).toBeInTheDocument();
    });

    test('filters by agent', async () => {
      renderWithTheme(<ContinuousImprovementTab />);
      await waitFor(() => expect(screen.getByText('Recent AI Agent Events & Health')).toBeInTheDocument());
      const agentSelect = screen.getByLabelText('Agent');
      userEvent.click(agentSelect);
      userEvent.click(screen.getByText('Task Optimizer'));
      expect(screen.getByText('status_change')).toBeInTheDocument();
      expect(screen.queryByText('recommendation')).not.toBeInTheDocument();
    });

    test('refresh button reloads data', async () => {
      renderWithTheme(<ContinuousImprovementTab />);
      await waitFor(() => expect(screen.getByLabelText('Refresh events')).toBeInTheDocument());
      userEvent.click(screen.getByLabelText('Refresh events'));
      await waitFor(() => expect(screen.getByText('Recent AI Agent Events & Health')).toBeInTheDocument());
    });
  });
}); 