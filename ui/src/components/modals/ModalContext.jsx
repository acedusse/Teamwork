import React, { createContext, useContext } from 'react';
import useModalStack from './useModalStack';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const modalStack = useModalStack();

  return (
    <ModalContext.Provider value={modalStack}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return ctx;
}
