import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders Taskmaster application title', () => {
    render(<App />);
    // Check for the main heading in TopAppBar (should be the only h1)
    expect(screen.getByRole('heading', { level: 1, name: /taskmaster/i })).toBeInTheDocument();
  });
}); 