import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  dot = false,
  className = ''
}) => {
  const classes = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export default Badge;
