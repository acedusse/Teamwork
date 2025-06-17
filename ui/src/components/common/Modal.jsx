import React from 'react';
import PropTypes from 'prop-types';

/**
 * Modal - Simple modal dialog overlay
 * Props: open (bool), onClose (func), title (string), children, hideCloseButton (bool)
 */
const Modal = ({ open, onClose, title, children, hideCloseButton = false }) => {
  if (!open) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {title && <div style={styles.header}>{title}</div>}
        {!hideCloseButton && (
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        )}
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  modal: {
    background: '#fff', borderRadius: 12, minWidth: 350, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', position: 'relative', padding: 0
  },
  header: {
    fontSize: 22, fontWeight: 600, padding: '18px 24px 0 24px', color: '#333'
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888'
  },
  body: {
    padding: '18px 24px 24px 24px'
  }
};

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  hideCloseButton: PropTypes.bool,
};

export default Modal;
