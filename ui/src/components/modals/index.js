// Base modal component
export { default as BaseModal } from './BaseModal';

// Specialized modal components
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as ErrorModal } from './ErrorModal';
export { default as LoadingModal } from './LoadingModal';

// Form modal components
export { default as TaskFormModal } from './TaskFormModal';
export { default as TaskModal } from './TaskModal';
export { default as SubtaskFormModal } from './SubtaskFormModal';
export { default as AgentModal } from './AgentModal';
export { default as SessionModal } from './SessionModal';
export { default as DependencyModal } from './DependencyModal';

// Re-export for convenience
export * from './BaseModal';
export * from './ConfirmationModal';
export * from './ErrorModal';
export * from './LoadingModal';
export * from './TaskFormModal';
export * from './TaskModal';
export * from './SubtaskFormModal';
export * from './AgentModal';
export * from './SessionModal';
export * from './DependencyModal';
export { default as ModalManager, ModalManagerProvider, useModalManager, MODAL_TYPES } from './ModalManager';

// Modal Components Export
export { default as FormModal } from './FormModal';
export { default as InfoModal } from './InfoModal';
export { default as SuccessModal } from './SuccessModal';
export { default as ProgressModal } from './ProgressModal';
export { default as MultiStepModal } from './MultiStepModal';

// Modal Hooks
export { default as useModal } from './useModal';
export { default as useModalStack } from './useModalStack';

// Modal Context
export { ModalProvider, useModalContext } from './ModalContext';

// Modal Utilities
export * from './modalUtils'; 