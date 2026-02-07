import React, { useEffect } from 'react';
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal modal-${size}`}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>
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
