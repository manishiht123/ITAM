import React from 'react';
import './PageLayout.css';

const PageLayout = ({ children, className = '' }) => {
  return (
    <div className={`page-layout ${className}`}>
      {children}
    </div>
  );
};

PageLayout.Header = ({ title, subtitle, badge, actions, className = '' }) => (
  <div className={`page-header ${className}`}>
    <div className="page-header-content">
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {badge && <div className="page-badge">{badge}</div>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
);

PageLayout.Content = ({ children, className = '' }) => (
  <div className={`page-content ${className}`}>{children}</div>
);

export default PageLayout;
