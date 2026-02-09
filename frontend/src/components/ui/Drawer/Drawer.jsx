import React, { useEffect, useRef } from 'react';
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
  const drawerRef = useRef(null);

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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Trap focus inside drawer
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className={`drawer drawer-${position} drawer-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
      >
        <div className="drawer-header">
          {title && <h3 className="drawer-title">{title}</h3>}
          <button className="drawer-close" onClick={onClose} aria-label="Close drawer">
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
