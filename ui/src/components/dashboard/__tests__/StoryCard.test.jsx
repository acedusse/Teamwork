import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StoryCard from '../StoryCard';

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

// Mock story data for testing
const mockStoryComplete = {
  id: 1,
  title: 'Implement User Authentication',
  description: 'Create a comprehensive user authentication system with login, registration, and password reset functionality.',
  effort: 8,
  priority: 'high',
  status: 'in-progress',
  assignee: 'John Doe',
  tags: ['auth', 'security', 'backend', 'frontend'],
  createdAt: '2023-12-01T10:00:00Z',
  updatedAt: '2023-12-05T15:30:00Z'
};

const mockStoryMinimal = {
  id: 2,
  title: 'Simple Task'
};

const mockStoryMediumPriority = {
  id: 3,
  title: 'Medium Priority Task',
  description: 'A task with medium priority',
  effort: 5,
  priority: 'medium',
  status: 'pending',
  assignee: 'Jane Smith',
  tags: ['feature']
};

const mockStoryLowPriority = {
  id: 4,
  title: 'Low Priority Task',
  description: 'A task with low priority',
  effort: 3,
  priority: 'low',
  status: 'done',
  assignee: 'Bob Wilson',
  tags: ['refactor', 'cleanup']
};

const mockStoryManyTags = {
  id: 5,
  title: 'Task with Many Tags',
  description: 'A task that has many tags to test overflow behavior',
  effort: 10,
  priority: 'high',
  status: 'review',
  assignee: 'Alice Johnson',
  tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7']
};

describe('StoryCard Component', () => {
  
  describe('Basic Rendering', () => {
    test('renders with complete story data', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      expect(screen.getByText('Implement User Authentication')).toBeInTheDocument();
      expect(screen.getByText(/Create a comprehensive user authentication/)).toBeInTheDocument();
      expect(screen.getByText('8 pts')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
    });

    test('renders with minimal story data', () => {
      renderWithTheme(<StoryCard story={mockStoryMinimal} />);
      
      expect(screen.getByText('Simple Task')).toBeInTheDocument();
      expect(screen.getByText('0 pts')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument(); // Default priority
      expect(screen.getByText('Pending')).toBeInTheDocument(); // Default status
    });

    test('handles undefined story gracefully', () => {
      renderWithTheme(<StoryCard story={undefined} />);
      
      expect(screen.getByText('Untitled Story')).toBeInTheDocument();
      expect(screen.getByText('0 pts')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });
  });

  describe('Priority System', () => {
    test('displays high priority correctly', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const priorityChip = screen.getByText('HIGH');
      expect(priorityChip).toBeInTheDocument();
      
      // Check for flag icon
      const flagIcons = screen.getAllByTestId('FlagIcon');
      expect(flagIcons.length).toBeGreaterThan(0);
    });

    test('displays medium priority correctly', () => {
      renderWithTheme(<StoryCard story={mockStoryMediumPriority} />);
      
      const priorityChip = screen.getByText('MEDIUM');
      expect(priorityChip).toBeInTheDocument();
    });

    test('displays low priority correctly', () => {
      renderWithTheme(<StoryCard story={mockStoryLowPriority} />);
      
      const priorityChip = screen.getByText('LOW');
      expect(priorityChip).toBeInTheDocument();
    });

    test('shows priority tooltips on hover', async () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const priorityChip = screen.getByText('HIGH');
      fireEvent.mouseOver(priorityChip);
      
      await waitFor(() => {
        expect(screen.getByText('High Priority')).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    test('displays in-progress status', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    test('displays pending status', () => {
      renderWithTheme(<StoryCard story={mockStoryMediumPriority} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    test('displays done status', () => {
      renderWithTheme(<StoryCard story={mockStoryLowPriority} />);
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    test('displays review status', () => {
      renderWithTheme(<StoryCard story={mockStoryManyTags} />);
      expect(screen.getByText('In Review')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    test('displays effort points correctly', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      expect(screen.getByText('8 pts')).toBeInTheDocument();
    });

    test('displays assignee initials', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    test('handles single name assignee', () => {
      const singleNameStory = { ...mockStoryComplete, assignee: 'Madonna' };
      renderWithTheme(<StoryCard story={singleNameStory} />);
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    test('handles missing assignee', () => {
      const noAssigneeStory = { ...mockStoryComplete, assignee: '' };
      renderWithTheme(<StoryCard story={noAssigneeStory} />);
      
      // Should not render assignee avatar
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });

    test('shows assignee tooltip', async () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const avatar = screen.getByText('JD');
      fireEvent.mouseOver(avatar);
      
      await waitFor(() => {
        expect(screen.getByText('Assigned to: John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Tags Display', () => {
    test('displays tags in normal mode', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      expect(screen.getByText('auth')).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
    });

    test('handles tag overflow', () => {
      renderWithTheme(<StoryCard story={mockStoryManyTags} />);
      
      // Should show first 4 tags plus overflow indicator
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('tag4')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument(); // Overflow indicator
    });

    test('handles compact mode tags', () => {
      renderWithTheme(<StoryCard story={mockStoryManyTags} compact />);
      
      // Should show only first 2 tags in compact mode
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('+5')).toBeInTheDocument(); // Overflow indicator
    });

    test('handles stories with no tags', () => {
      const noTagsStory = { ...mockStoryComplete, tags: [] };
      renderWithTheme(<StoryCard story={noTagsStory} />);
      
      // Should not crash and not show tag section
      expect(screen.queryByText('auth')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop Preparation', () => {
    test('includes drag handle by default', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const dragIcon = screen.getByTestId('DragIndicatorIcon');
      expect(dragIcon).toBeInTheDocument();
    });

    test('hides drag handle when showDragHandle is false', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} showDragHandle={false} />);
      
      const dragIcon = screen.queryByTestId('DragIndicatorIcon');
      expect(dragIcon).not.toBeInTheDocument();
    });

    test('includes data attributes for drag and drop', () => {
      const { container } = renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const card = container.querySelector('[data-story-id="1"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-story-priority', 'high');
      expect(card).toHaveAttribute('data-story-effort', '8');
    });

    test('shows drag handle tooltip', async () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const dragIcon = screen.getByTestId('DragIndicatorIcon');
      fireEvent.mouseOver(dragIcon.closest('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Drag to move story')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Behavior', () => {
    test('calls onClick when card is clicked', () => {
      const mockOnClick = jest.fn();
      renderWithTheme(<StoryCard story={mockStoryComplete} onClick={mockOnClick} />);
      
      const card = screen.getByText('Implement User Authentication').closest('.MuiCard-root');
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith(mockStoryComplete, expect.any(Object));
    });

    test('does not call onClick when no handler provided', () => {
      // Should not crash
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const card = screen.getByText('Implement User Authentication').closest('.MuiCard-root');
      fireEvent.click(card);
      
      // No error should occur
    });

    test('applies selected styling', () => {
      const { container } = renderWithTheme(
        <StoryCard story={mockStoryComplete} isSelected />
      );
      
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle('background-color: rgba(0, 0, 0, 0.08)'); // MUI action.selected
    });

    test('applies dragging styling', () => {
      const { container } = renderWithTheme(
        <StoryCard story={mockStoryComplete} isDragging />
      );
      
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle('opacity: 0.5');
      expect(card).toHaveStyle('transform: rotate(5deg)');
    });
  });

  describe('Compact Mode', () => {
    test('applies compact styling', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} compact />);
      
      // Title should be smaller variant
      const title = screen.getByText('Implement User Authentication');
      expect(title).toHaveClass('MuiTypography-body1');
    });

    test('hides description in compact mode', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} compact />);
      
      // Description should not be visible
      expect(screen.queryByText(/Create a comprehensive user authentication/)).not.toBeInTheDocument();
    });

    test('limits tags in compact mode', () => {
      renderWithTheme(<StoryCard story={mockStoryManyTags} compact />);
      
      // Should show only first 2 tags
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.queryByText('tag3')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('applies custom className', () => {
      const { container } = renderWithTheme(
        <StoryCard story={mockStoryComplete} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('forwards additional props', () => {
      const { container } = renderWithTheme(
        <StoryCard story={mockStoryComplete} data-testid="story-card" />
      );
      
      expect(container.querySelector('[data-testid="story-card"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('uses proper heading hierarchy', () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Implement User Authentication');
    });

    test('provides tooltips for interactive elements', async () => {
      renderWithTheme(<StoryCard story={mockStoryComplete} />);
      
      // Test effort tooltip
      const effortChip = screen.getByText('8 pts');
      fireEvent.mouseOver(effortChip);
      
      await waitFor(() => {
        expect(screen.getByText('Story Points')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles invalid priority gracefully', () => {
      const invalidPriorityStory = { ...mockStoryComplete, priority: 'invalid' };
      renderWithTheme(<StoryCard story={invalidPriorityStory} />);
      
      // Should default to medium priority styling but show the invalid text
      expect(screen.getByText('INVALID')).toBeInTheDocument();
    });

    test('handles null/undefined values in story object', () => {
      const nullValuesStory = {
        id: 1,
        title: null,
        description: undefined,
        effort: null,
        priority: undefined,
        status: null,
        assignee: undefined,
        tags: null
      };
      
      expect(() => {
        renderWithTheme(<StoryCard story={nullValuesStory} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large tag arrays', () => {
      const largeTags = Array.from({ length: 50 }, (_, i) => `tag${i}`);
      const largeTagsStory = { ...mockStoryComplete, tags: largeTags };
      
      const startTime = performance.now();
      renderWithTheme(<StoryCard story={largeTagsStory} />);
      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('uses forwardRef correctly', () => {
      const ref = React.createRef();
      renderWithTheme(<StoryCard ref={ref} story={mockStoryComplete} />);
      
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });
}); 