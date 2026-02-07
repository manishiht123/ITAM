import React from 'react';
import './Grid.css';

const Grid = ({
  children,
  columns = 2,
  gap = 'lg',
  responsive = true,
  className = ''
}) => {
  const style = {
    '--grid-columns': columns,
    '--grid-gap': `var(--space-${gap})`
  };

  const classes = [
    'grid',
    responsive && 'grid-responsive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
};

Grid.Row = ({ children, className = '' }) => (
  <div className={`grid-row ${className}`}>{children}</div>
);

Grid.Col = ({ children, span = 12, className = '' }) => (
  <div className={`grid-col grid-col-${span} ${className}`}>{children}</div>
);

export default Grid;
