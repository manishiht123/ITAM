import { useEffect } from "react";

/**
 * Closes a modal/drawer when the user presses the Escape key.
 * @param {boolean} isOpen  - Whether the modal is currently open
 * @param {Function} onClose - Callback to close the modal
 */
export function useEscClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
}
