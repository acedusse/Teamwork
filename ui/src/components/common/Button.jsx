import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button - Simple styled button with variant support
 * Props: variant (primary/secondary), children, ...rest
 */
const Button = ({ variant = 'primary', children, ...rest }) => {
  return (
    <button
      style={{
        ...styles.base,
        ...(variant === 'secondary' ? styles.secondary : styles.primary),
        ...rest.style
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

const styles = {
  base: {
    fontSize: 16,
    padding: '10px 22px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background 0.2s',
    margin: 0,
  },
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },
  secondary: {
    background: '#f3f4f6',
    color: '#333',
    border: '1px solid #e9ecef',
  },
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  children: PropTypes.node,
};

export default Button;
