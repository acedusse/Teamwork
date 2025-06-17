import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';

// Simple spinner for progress indication
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
    <div style={{
      width: 40,
      height: 40,
      border: '4px solid #e9ecef',
      borderTop: '4px solid #667eea',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * ProgressModal - Modal for showing progress/spinner and a message
 */
const ProgressModal = ({ open, onClose, message = 'Processing, please wait...' }) => {
  return (
    <Modal open={open} onClose={onClose} title="⏳ In Progress" hideCloseButton>
      <Spinner />
      <div style={{ textAlign: 'center', fontSize: 16, color: '#666', marginBottom: 8 }}>{message}</div>
    </Modal>
  );
};

ProgressModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  message: PropTypes.string,
};

export default ProgressModal;
