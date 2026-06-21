import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/ConfirmModal.module.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = '确认', cancelText = '取消' }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setClosing(false);
      setMounted(true);
    } else if (mounted) {
      setClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        setClosing(false);
        closeTimerRef.current = null;
      }, 250);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  const handleCancel = () => {
    if (closing) return;
    if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    if (closing) return;
    if (onConfirm) onConfirm();
  };

  return (
    <div
      className={`${styles.modalOverlay} ${closing ? styles.closing : ''}`}
      onClick={handleCancel}
    >
      <div
        className={`${styles.modal} ${theme === 'dark' ? styles.dark : ''} ${closing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={handleCancel} disabled={closing}>
            {cancelText}
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={closing}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
