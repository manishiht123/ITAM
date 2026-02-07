import React, { forwardRef } from 'react';
import './Select.css';

const Select = forwardRef(({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  error = null,
  disabled = false,
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const classes = [
    'select',
    `select-${size}`,
    error && 'select-error',
    disabled && 'select-disabled',
    fullWidth && 'select-full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="select-wrapper">
      <select
        ref={ref}
        className={classes}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
