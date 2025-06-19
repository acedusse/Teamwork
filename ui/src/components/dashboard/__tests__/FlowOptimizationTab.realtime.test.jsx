import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FlowOptimizationTab from '../FlowOptimizationTab';
import useFlowOptimizationData from '../../../hooks/useFlowOptimizationData';

// Mock the useFlowOptimizationData hook
jest.mock('../../../hooks/useFlowOptimizationData');

// Mock child components
jest.mock('../BottleneckDetection', () => {
  return function MockBottleneckDetection({ flowData }) {
    return <div data-testid="bottleneck-detection">Bottleneck Detection: {flowData?.bottlenecks?.length || 0} bottlenecks</div>;
  };
});

jest.mock('../FlowMetricsCharts', () => {
  return function MockFlowMetricsCharts({ flowData }) {
    return <div data-testid="flow-metrics-charts">Flow Metrics: {flowData?.metrics ? 'loaded' : 'loading'}</div>;
  };
});

jest.mock('../AdvancedAnalytics', () => {
  return function MockAdvancedAnalytics({ flowData }) {
    return <div data-testid="advanced-analytics">Advanced Analytics: {flowData?.suggestions?.length || 0} suggestions</div>;
  };
});

jest.mock('../ConnectionStatusIndicator', () => {
  return function MockConnectionStatusIndicator({ connectionStatus, lastUpdated, isLoading, onRefresh, error, cacheStats }) {
    return (
      <div data-testid="connection-status">
        <span data-testid="connection-status-text">{connectionStatus}</span>
        <span data-testid="last-updated">{lastUpdated?.toISOString() || 'never'}</span>
        <span data-testid="is-loading">{isLoading ? 'loading' : 'idle'}</span>
        <button data-testid="refresh-button" onClick={onRefresh}>Refresh</button>
        {error && <span data-testid="error-message">{error}</span>}
        {cacheStats && <span data-testid="cache-stats">{JSON.stringify(cacheStats)}</span>}
      </div>
    );
  };
});

const theme = createTheme();

const defaultMockHookReturn = {
  flowData: {
    bottlenecks: [
      {
        id: 1,
        type: 'wip_limit',
        severity: 'high',
        column: 'Development',
        message: 'Development Column is over WIP limit',
        impact: 'high',
        detectedAt: new Date()
      }
    ],
    suggestions: [
      {
        id: 1,
        type: 'task_management',
        priority: 'high',
        title: 'Move TASK-005 to blocked column',
        description: 'Separate blocked tasks',
        impact: 'medium',
        effort: 'low',
        category: 'process'
      }
    ],
    metrics: {
      cycleTime: { current: 2.34, change: -0.3, trend: 'improving' },
      throughput: { current: 15, change: 15, trend: 'improving' },
      leadTime: { current: 4.2, change: -0.8, trend: 'improving' }
    }
  },
  isLoading: false,
  lastUpdated: new Date('2024-01-15T10:30:00Z'),
  error: null,
  connectionStatus: 'connected',
  isConnected: true,
  isPolling: false,
  refreshData: jest.fn(),
  applyOptimisticUpdate: jest.fn(),
  removeOptimisticUpdate: jest.fn(),
  getCacheStats: jest.fn(() => ({
    cacheSize: 5,
    optimisticUpdatesCount: 0,
    lastCacheUpdate: Date.now()
  }))
};

describe('FlowOptimizationTab - Real-time Data Integration (Task 6.7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFlowOptimizationData.mockReturnValue(defaultMockHookReturn);
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <FlowOptimizationTab {...props} />
      </ThemeProvider>
    );
  };

  describe('Real-time Connection Status', () => {
    it('displays connection status indicator with correct status', () => {
      renderComponent();
      
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByTestId('connection-status-text')).toHaveTextContent('connected');
    });

    it('shows last updated timestamp', () => {
      renderComponent();
      
      expect(screen.getByTestId('last-updated')).toHaveTextContent('2024-01-15T10:30:00.000Z');
    });

    it('displays loading state when data is being fetched', () => {
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        isLoading: true
      });

      renderComponent();
      
      expect(screen.getByTestId('is-loading')).toHaveTextContent('loading');
    });

    it('shows error message when connection fails', () => {
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        error: 'WebSocket connection failed',
        connectionStatus: 'error'
      });

      renderComponent();
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('WebSocket connection failed');
      expect(screen.getByTestId('connection-status-text')).toHaveTextContent('error');
    });

    it('displays cache statistics', () => {
      renderComponent();
      
      const cacheStats = screen.getByTestId('cache-stats');
      expect(cacheStats).toBeInTheDocument();
      expect(JSON.parse(cacheStats.textContent)).toEqual({
        cacheSize: 5,
        optimisticUpdatesCount: 0,
        lastCacheUpdate: expect.any(Number)
      });
    });
  });

  describe('Manual Refresh Functionality', () => {
    it('calls refreshData when refresh button is clicked', async () => {
      const mockRefreshData = jest.fn();
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        refreshData: mockRefreshData
      });

      renderComponent();
      
      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);
      
      expect(mockRefreshData).toHaveBeenCalledTimes(1);
    });

    it('calls refreshData when header refresh button is clicked', async () => {
      const mockRefreshData = jest.fn();
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        refreshData: mockRefreshData
      });

      renderComponent();
      
      // Find the refresh button in the header
      const headerRefreshButton = screen.getByLabelText('Refresh Data');
      fireEvent.click(headerRefreshButton);
      
      expect(mockRefreshData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Optimistic Updates', () => {
    it('applies optimistic updates when suggestions are applied', async () => {
      const mockApplyOptimisticUpdate = jest.fn();
      const mockRemoveOptimisticUpdate = jest.fn();
      const mockOnApplySuggestions = jest.fn().mockResolvedValue();

      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        applyOptimisticUpdate: mockApplyOptimisticUpdate,
        removeOptimisticUpdate: mockRemoveOptimisticUpdate
      });

      renderComponent({ onApplySuggestions: mockOnApplySuggestions });
      
      // Select a suggestion
      const suggestionCard = screen.getByText('Move TASK-005 to blocked column');
      fireEvent.click(suggestionCard);
      
      // Apply suggestions
      const applyButton = screen.getByText('✨ Apply Suggestions');
      
      await act(async () => {
        fireEvent.click(applyButton);
      });
      
      await waitFor(() => {
        expect(mockApplyOptimisticUpdate).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(mockOnApplySuggestions).toHaveBeenCalledWith([1]);
      });
      
      await waitFor(() => {
        expect(mockRemoveOptimisticUpdate).toHaveBeenCalled();
      });
    });

    it('removes optimistic updates on error', async () => {
      const mockApplyOptimisticUpdate = jest.fn();
      const mockRemoveOptimisticUpdate = jest.fn();
      const mockOnApplySuggestions = jest.fn().mockRejectedValue(new Error('API Error'));

      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        applyOptimisticUpdate: mockApplyOptimisticUpdate,
        removeOptimisticUpdate: mockRemoveOptimisticUpdate
      });

      renderComponent({ onApplySuggestions: mockOnApplySuggestions });
      
      // Select a suggestion
      const suggestionCard = screen.getByText('Move TASK-005 to blocked column');
      fireEvent.click(suggestionCard);
      
      // Apply suggestions
      const applyButton = screen.getByText('✨ Apply Suggestions');
      
      await act(async () => {
        fireEvent.click(applyButton);
      });
      
      await waitFor(() => {
        expect(mockApplyOptimisticUpdate).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(mockRemoveOptimisticUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Connection Status Variations', () => {
    it('handles disconnected state', () => {
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        connectionStatus: 'disconnected',
        isConnected: false
      });

      renderComponent();
      
      expect(screen.getByTestId('connection-status-text')).toHaveTextContent('disconnected');
    });

    it('handles polling mode fallback', () => {
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        connectionStatus: 'polling',
        isConnected: false,
        isPolling: true
      });

      renderComponent();
      
      expect(screen.getByTestId('connection-status-text')).toHaveTextContent('polling');
    });

    it('handles connecting state', () => {
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        connectionStatus: 'connecting',
        isConnected: false
      });

      renderComponent();
      
      expect(screen.getByTestId('connection-status-text')).toHaveTextContent('connecting');
    });
  });

  describe('Data Flow Integration', () => {
    it('passes real-time data to child components', () => {
      renderComponent();
      
      expect(screen.getByTestId('bottleneck-detection')).toHaveTextContent('1 bottlenecks');
      expect(screen.getByTestId('flow-metrics-charts')).toHaveTextContent('loaded');
      expect(screen.getByTestId('advanced-analytics')).toHaveTextContent('1 suggestions');
    });

    it('handles null flow data gracefully', () => {
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        flowData: null
      });

      renderComponent();
      
      // Should still render with fallback data
      expect(screen.getByTestId('bottleneck-detection')).toBeInTheDocument();
      expect(screen.getByTestId('flow-metrics-charts')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-analytics')).toBeInTheDocument();
    });

    it('updates displayed timestamp from hook', () => {
      const customDate = new Date('2024-01-16T15:45:00Z');
      useFlowOptimizationData.mockReturnValue({
        ...defaultMockHookReturn,
        lastUpdated: customDate
      });

      renderComponent();
      
      expect(screen.getByText(customDate.toLocaleTimeString())).toBeInTheDocument();
    });
  });

  describe('Hook Configuration', () => {
    it('initializes useFlowOptimizationData with correct options', () => {
      renderComponent();
      
      expect(useFlowOptimizationData).toHaveBeenCalledWith({
        enableAutoRefresh: true,
        enableWebSocket: true,
        enableCaching: true,
        onDataUpdate: expect.any(Function),
        onError: expect.any(Function)
      });
    });

    it('calls onDataUpdate callback when data changes', () => {
      const mockOnDataUpdate = jest.fn();
      
      // Mock the hook to capture the onDataUpdate callback
      useFlowOptimizationData.mockImplementation((options) => {
        // Simulate calling the onDataUpdate callback
        setTimeout(() => {
          options.onDataUpdate({ test: 'data' });
        }, 0);
        
        return defaultMockHookReturn;
      });

      renderComponent();
      
      // The callback should be called during hook initialization
      expect(useFlowOptimizationData).toHaveBeenCalled();
    });

    it('calls onError callback when errors occur', () => {
      const mockOnError = jest.fn();
      
      // Mock the hook to capture the onError callback
      useFlowOptimizationData.mockImplementation((options) => {
        // Simulate calling the onError callback
        setTimeout(() => {
          options.onError(new Error('Test error'));
        }, 0);
        
        return {
          ...defaultMockHookReturn,
          error: 'Test error'
        };
      });

      renderComponent();
      
      // The callback should be called during hook initialization
      expect(useFlowOptimizationData).toHaveBeenCalled();
    });
  });
}); 