import { useState, useCallback } from 'react';

/**
 * useModalStack - React hook for managing a stack of modals
 * Provides push, pop, and reset operations for modal workflows
 * Each stack entry can be a modal name, component, or config object
 */
export default function useModalStack(initialStack = []) {
  const [stack, setStack] = useState(initialStack);

  const push = useCallback(
    modal => setStack(s => [...s, modal]),
    []
  );

  const pop = useCallback(
    () => setStack(s => (s.length > 0 ? s.slice(0, -1) : s)),
    []
  );

  const reset = useCallback(
    () => setStack([]),
    []
  );

  const top = stack.length > 0 ? stack[stack.length - 1] : null;

  return {
    stack,
    top,
    push,
    pop,
    reset,
    isEmpty: stack.length === 0,
    size: stack.length
  };
}
