import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import './FormField.css';

const FormField = ({
  label,
  required = false,
  error = null,
  hint = null,
  children,
  className = ''
}) => {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <div className="form-error">
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <div className="form-hint">{hint}</div>
      )}
    </div>
  );
};

export default FormField;
