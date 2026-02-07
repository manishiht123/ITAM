import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Drawer.css';

const Drawer = ({
  open,
  onClose,
  position = 'right',
  size = 'md',
  title = null,
  children
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className={`drawer drawer-${position} drawer-${size}`}>
        <div className="drawer-header">
          {title && <h3 className="drawer-title">{title}</h3>}
          <button className="drawer-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        {children}
      </div>
    </>
  );
};

Drawer.Body = ({ children, className = '' }) => (
  <div className={`drawer-body ${className}`}>{children}</div>
);

Drawer.Footer = ({ children, className = '' }) => (
  <div className={`drawer-footer ${className}`}>{children}</div>
);

export default Drawer;
