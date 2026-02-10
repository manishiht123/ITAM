import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconOnly = false,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  title,
  ...props
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    fullWidth && 'btn-full-width',
    iconOnly && 'btn-icon-only',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {iconOnly ? (
        !loading && <span className="btn-icon">{icon}</span>
      ) : (
        <>
          {!loading && icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
          <span className="btn-text">{children}</span>
          {!loading && icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
