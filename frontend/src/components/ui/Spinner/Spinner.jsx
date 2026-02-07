import React from 'react';
import './Spinner.css';

export const Spinner = ({ size = 'md', variant = 'primary' }) => {
  return <div className={`spinner spinner-${size} spinner-${variant}`} />;
};

export const LoadingOverlay = ({ visible, message = 'Loading...' }) => {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner size="lg" />
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default Spinner;
