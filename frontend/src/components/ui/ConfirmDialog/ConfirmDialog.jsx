import React from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal open={open} onClose={onCancel} size="sm" title={title}>
      <Modal.Body>
        <p className="confirm-dialog-message">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDialog;
