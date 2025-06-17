import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * SuccessModal - Simple modal for displaying a success message and optional action button
 */
const SuccessModal = ({ open, onClose, message = 'Operation successful!', buttonText = 'OK', onAction }) => {
  return (
    <Modal open={open} onClose={onClose} title="✅ Success">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, color: '#28a745', marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 18, marginBottom: 24 }}>{message}</div>
        <Button onClick={onAction || onClose}>{buttonText}</Button>
      </div>
    </Modal>
  );
};

SuccessModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  buttonText: PropTypes.string,
  onAction: PropTypes.func,
};

export default SuccessModal;
