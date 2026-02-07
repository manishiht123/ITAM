import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = null,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const classes = [
    'input',
    `input-${size}`,
    error && 'input-error',
    disabled && 'input-disabled',
    icon && `input-has-icon-${iconPosition}`,
    fullWidth && 'input-full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-wrapper">
      {icon && iconPosition === 'left' && (
        <span className="input-icon input-icon-left">{icon}</span>
      )}
      <input
        ref={ref}
        type={type}
        className={classes}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {icon && iconPosition === 'right' && (
        <span className="input-icon input-icon-right">{icon}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
