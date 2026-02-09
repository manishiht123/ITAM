import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.css';

const Modal = ({
  open,
  onClose,
  size = 'md',
  title = null,
  closeOnOverlayClick = true,
  showCloseButton = true,
  children
}) => {
  const modalRef = useRef(null);

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

  // Trap focus inside modal
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} aria-hidden="true">
      <div
        ref={modalRef}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button className="modal-close" onClick={onClose} aria-label="Close dialog">
                <FaTimes />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

Modal.Body = ({ children, className = '' }) => (
  <div className={`modal-body ${className}`}>{children}</div>
);

Modal.Footer = ({ children, className = '' }) => (
  <div className={`modal-footer ${className}`}>{children}</div>
);

export default Modal;
