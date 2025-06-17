import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TeamPerformance from '../TeamPerformance';

// Mock axios
jest.mock('axios');

// Create theme for testing
const theme = createTheme();

describe('TeamPerformance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading state initially', async () => {
    // Mock API delay
    axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => {
      resolve({ data: [{ name: 'Test User', role: 'Developer' }] });
    }, 100)));
    
    // Render
    render(
      <ThemeProvider theme={theme}>
        <TeamPerformance />
      </ThemeProvider>
    );
    
    // Check if loading indicator appears
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('should render team data when API responds', async () => {
    // Setup with minimal test data - not mocking specific values
    const testData = [{
      id: 'test123',
      name: 'Test User',
      role: 'Developer',
      department: 'Engineering',
      email: 'test@example.com',
      bio: 'Test bio',
      joined: '2023-01-01',
      skills: ['Testing'],
      tasksCompleted: 5,
      tasksInProgress: 3,
      productivity: 62
    }];
    
    axios.get.mockResolvedValueOnce({ data: testData });
    
    // Render
    render(
      <ThemeProvider theme={theme}>
        <TeamPerformance />
      </ThemeProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/team/performance?timeRange=week');
    });
    
    // Check if the user data appears
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // tasks completed
    expect(screen.getByText('3')).toBeInTheDocument(); // tasks in progress
    expect(screen.getByText('62%')).toBeInTheDocument(); // productivity
    
    // No Avatar elements should be present (we removed avatars)
    const svgElements = document.querySelectorAll('svg');
    const avatarSVGs = Array.from(svgElements).filter(svg => 
      svg.getAttribute('data-testid')?.includes('Avatar') ||
      svg.getAttribute('data-testid')?.includes('Person') ||
      svg.getAttribute('data-testid')?.includes('Account')
    );
    expect(avatarSVGs.length).toBe(0);
  });
  
  test('should fetch data with the correct timeRange parameter', async () => {
    // Setup
    axios.get.mockResolvedValueOnce({ data: [] });
    
    // Render
    render(
      <ThemeProvider theme={theme}>
        <TeamPerformance />
      </ThemeProvider>
    );
    
    // Wait for initial data load (default: week)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/team/performance?timeRange=week');
    });
  });
  
  test('should call API with different timeRange when filter changes', async () => {
    // Setup - we don't care about the specific responses, just that the API calls are made
    axios.get.mockResolvedValue({ data: [] });
    
    // Render
    render(
      <ThemeProvider theme={theme}>
        <TeamPerformance />
      </ThemeProvider>
    );
    
    // Wait for initial data load (default: week)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/team/performance?timeRange=week');
    });
    
    // Reset mock to track new calls
    axios.get.mockClear();
    
    // Find and click the time filter dropdown
    const timeFilterSelect = screen.getByLabelText('Time Period');
    fireEvent.mouseDown(timeFilterSelect);
    
    // Select 'Today' option
    const dayOption = await screen.findByText('Today');
    fireEvent.click(dayOption);
    
    // Verify API was called with the day timeRange
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/team/performance?timeRange=day');
    });
    
    // Reset mock again
    axios.get.mockClear();
    
    // Select 'This Month' option
    fireEvent.mouseDown(timeFilterSelect);
    const monthOption = await screen.findByText('This Month');
    fireEvent.click(monthOption);
    
    // Verify API was called with the month timeRange
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/team/performance?timeRange=month');
    });
  });
  
  test('should display error message when API call fails', async () => {
    // Simulate API error
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    // Render
    render(
      <ThemeProvider theme={theme}>
        <TeamPerformance />
      </ThemeProvider>
    );
    
    // Check if error message appears
    expect(await screen.findByText(/Failed to load team performance data/i)).toBeInTheDocument();
  });
  
  test('should display empty state message when no data is returned', async () => {
    // Return empty data array
    axios.get.mockResolvedValueOnce({ data: [] });
    
    // Render
    render(
      <ThemeProvider theme={theme}>
        <TeamPerformance />
      </ThemeProvider>
    );
    
    // Check if empty state message appears
    expect(await screen.findByText(/No team performance data available/i)).toBeInTheDocument();
  });
}); 

