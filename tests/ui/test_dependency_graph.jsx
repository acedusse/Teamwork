import React from 'react';
import { render, screen } from '@testing-library/react';
import DependencyGraph from '../../ui/src/components/DependencyGraph';

describe('DependencyGraph', () => {
  it('renders demo graph title and node labels', () => {
    render(<DependencyGraph />);
    expect(screen.getByText(/Dependency Graph/i)).toBeInTheDocument();
    expect(screen.getByText(/Task 1/)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/)).toBeInTheDocument();
    expect(screen.getByText(/Task 3/)).toBeInTheDocument();
    expect(screen.getByText(/Task 4/)).toBeInTheDocument();
  });

  it('renders custom nodes and edges', () => {
    const nodes = [
      { data: { id: 'a', label: 'Alpha' } },
      { data: { id: 'b', label: 'Beta' } }
    ];
    const edges = [
      { data: { source: 'a', target: 'b' } }
    ];
    render(<DependencyGraph nodes={nodes} edges={edges} />);
    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/Beta/)).toBeInTheDocument();
  });
});
