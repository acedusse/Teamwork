# Modal System Documentation

This directory contains a comprehensive modal system built with React and Material-UI, designed for the Task Master application. The system provides a consistent, accessible, and flexible foundation for all modal interactions.

## Architecture Overview

The modal system follows a hierarchical architecture:

```
BaseModal (Foundation)
├── ConfirmationModal (User Actions)
├── ErrorModal (Error Handling)
├── LoadingModal (Progress States)
├── TaskFormModal (Task Management)
└── SubtaskFormModal (Subtask Management)
```

## Core Components

### BaseModal
**File:** `BaseModal.jsx`

The foundation component that provides:
- Consistent styling and behavior
- Accessibility features (ARIA labels, focus management, keyboard navigation)
- Responsive design
- Customizable actions and content areas
- Animation and transitions

**Key Features:**
- Auto-focus management
- Escape key handling
- Backdrop click handling
- Screen reader support
- Mobile-responsive design

**Usage:**
```jsx
<BaseModal
  open={open}
  onClose={onClose}
  title="Custom Modal"
  actions={<Button onClick={onClose}>Close</Button>}
>
  <Typography>Your content here</Typography>
</BaseModal>
```

### ConfirmationModal
**File:** `ConfirmationModal.jsx`

Specialized modal for user confirmations with:
- Multiple variants (default, danger, warning, info)
- Customizable icons and messages
- Flexible action buttons
- Context-aware styling

**Variants:**
- `default`: Standard confirmation
- `danger`: Destructive actions (red styling)
- `warning`: Caution required (orange styling)
- `info`: Informational confirmations (blue styling)

**Usage:**
```jsx
<ConfirmationModal
  open={open}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Delete Task"
  message="This action cannot be undone."
  variant="danger"
  confirmText="Delete"
  icon="delete"
/>
```

### ErrorModal
**File:** `ErrorModal.jsx`

Comprehensive error display modal featuring:
- Error type classification (error, warning, network, validation)
- Detailed error information with stack traces
- Retry functionality for recoverable errors
- Copy error details to clipboard
- Bug reporting integration
- User-friendly error messages with troubleshooting tips

**Error Types:**
- `error`: General application errors
- `warning`: Non-critical warnings
- `network`: Network connectivity issues
- `validation`: Form validation errors

**Usage:**
```jsx
<ErrorModal
  open={open}
  onClose={onClose}
  onRetry={handleRetry}
  error={errorObject}
  type="network"
  showRetry={true}
  showReport={true}
  onReport={handleReport}
/>
```

### LoadingModal
**File:** `LoadingModal.jsx`

Loading state modal with:
- Circular and linear progress indicators
- Determinate and indeterminate progress
- Cancellable operations
- Progress percentage display
- Estimated time remaining
- Custom loading messages

**Progress Types:**
- `circular`: Spinning progress indicator
- `linear`: Horizontal progress bar

**Variants:**
- `indeterminate`: Unknown progress duration
- `determinate`: Known progress with percentage

**Usage:**
```jsx
<LoadingModal
  open={open}
  onCancel={onCancel}
  title="Processing..."
  message="Please wait while we save your changes"
  progress={progress}
  variant="determinate"
  progressType="linear"
  estimatedTime={30}
  showCancel={true}
/>
```

### TaskFormModal
**File:** `TaskFormModal.jsx`

Comprehensive task creation and editing modal with:
- Complete task form with all fields
- Dependency management with visual indicators
- Form validation and error handling
- Auto-save functionality
- Rich text editing for descriptions
- Priority and status selection
- Test strategy planning

**Key Features:**
- Multi-select dependencies with search
- Real-time form validation
- Responsive form layout
- Accessibility compliance
- Integration with task management system

**Usage:**
```jsx
<TaskFormModal
  open={open}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Create New Task"
  initialData={taskData} // For editing
  availableTasks={tasks}
  onDelete={handleDelete} // For editing mode
/>
```

### SubtaskFormModal
**File:** `SubtaskFormModal.jsx`

Simplified subtask creation modal featuring:
- Streamlined form for quick subtask creation
- Parent task context display
- Dependency management within subtask scope
- Status and priority selection
- Integration with parent task

**Usage:**
```jsx
<SubtaskFormModal
  open={open}
  onClose={onClose}
  onSubmit={handleSubmit}
  parentTaskId="1"
  parentTaskTitle="Parent Task Name"
  availableSubtasks={subtasks}
/>
```

## Design Principles

### 1. Consistency
- All modals share common styling and behavior patterns
- Consistent button placement and actions
- Unified color scheme and typography
- Standardized spacing and layout

### 2. Accessibility
- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and descriptions
- Focus management and restoration
- High contrast support

### 3. Responsiveness
- Mobile-first design approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions
- Optimized for various devices

### 4. Performance
- Lazy loading of modal content
- Efficient re-rendering strategies
- Minimal bundle impact
- Optimized animations

### 5. User Experience
- Clear visual hierarchy
- Intuitive interactions
- Helpful error messages
- Progress feedback
- Contextual help and guidance

## Usage Patterns

### Basic Modal Pattern
```jsx
import { useState } from 'react';
import { BaseModal } from '../components/modals';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title="My Modal"
        actions={
          <Button onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <Typography>Modal content</Typography>
      </BaseModal>
    </>
  );
}
```

### Confirmation Pattern
```jsx
import { ConfirmationModal } from '../components/modals';

function DeleteButton({ onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    await onDelete();
    setConfirmOpen(false);
  };

  return (
    <>
      <Button 
        color="error" 
        onClick={() => setConfirmOpen(true)}
      >
        Delete
      </Button>
      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Deletion"
        message="This action cannot be undone."
        variant="danger"
      />
    </>
  );
}
```

### Error Handling Pattern
```jsx
import { ErrorModal } from '../components/modals';

function DataComponent() {
  const [error, setError] = useState(null);

  const handleRetry = () => {
    setError(null);
    // Retry the failed operation
  };

  return (
    <ErrorModal
      open={!!error}
      onClose={() => setError(null)}
      onRetry={handleRetry}
      error={error}
      type="network"
      showRetry={true}
    />
  );
}
```

### Loading Pattern
```jsx
import { LoadingModal } from '../components/modals';

function AsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleOperation = async () => {
    setLoading(true);
    // Simulate progress updates
    // ... operation logic
    setLoading(false);
  };

  return (
    <LoadingModal
      open={loading}
      title="Processing"
      message="Please wait..."
      progress={progress}
      variant="determinate"
      progressType="linear"
    />
  );
}
```

## Customization

### Theming
All modals respect the Material-UI theme and can be customized through:
- Theme palette colors
- Typography settings
- Spacing and breakpoints
- Component overrides

### Styling
Individual modals can be styled using:
- `sx` prop for custom styles
- `className` prop for CSS classes
- Theme overrides for global changes
- CSS-in-JS for dynamic styling

### Behavior
Modal behavior can be customized through:
- Props for different configurations
- Event handlers for custom logic
- Render props for content customization
- Higher-order components for shared behavior

## Testing

### Unit Tests
Each modal component includes comprehensive unit tests covering:
- Rendering with different props
- User interactions (clicks, keyboard)
- Accessibility features
- Error states and edge cases

### Integration Tests
Integration tests verify:
- Modal interactions with parent components
- Form submissions and data flow
- Error handling and recovery
- Performance under load

### Accessibility Tests
Automated accessibility tests ensure:
- ARIA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast requirements

## Demo and Examples

Visit `/demo/modals` in the application to see interactive examples of all modal components with:
- Live demonstrations
- Code snippets
- Different configurations
- Real-world use cases

## Best Practices

### 1. Modal Usage
- Use modals sparingly to avoid disrupting user flow
- Prefer inline editing when possible
- Provide clear exit paths
- Keep content focused and concise

### 2. Accessibility
- Always provide meaningful titles and descriptions
- Ensure keyboard navigation works properly
- Test with screen readers
- Maintain focus management

### 3. Performance
- Lazy load modal content when possible
- Avoid heavy computations in modal renders
- Use React.memo for expensive components
- Optimize re-renders with proper dependencies

### 4. Error Handling
- Provide clear, actionable error messages
- Offer retry mechanisms for recoverable errors
- Log errors for debugging
- Gracefully handle edge cases

### 5. User Experience
- Show loading states for async operations
- Provide progress feedback when possible
- Use appropriate modal types for different contexts
- Test on various devices and screen sizes

## Contributing

When adding new modal components:

1. Extend `BaseModal` for consistency
2. Follow the established naming conventions
3. Include comprehensive PropTypes
4. Add accessibility features
5. Write unit tests
6. Update this documentation
7. Add examples to the demo page

## Migration Guide

### From Legacy Modals
If migrating from existing modal implementations:

1. Replace custom modal components with appropriate system modals
2. Update prop names to match new API
3. Test accessibility and keyboard navigation
4. Verify responsive behavior
5. Update tests to match new component structure

### Breaking Changes
- Modal prop names may have changed
- Event handler signatures might be different
- Styling props have been standardized
- Some legacy features may not be supported

## Support

For questions or issues with the modal system:
- Check the demo page for examples
- Review component PropTypes for API details
- Consult accessibility guidelines
- File issues for bugs or feature requests 