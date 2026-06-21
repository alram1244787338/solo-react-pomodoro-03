import { useTheme } from '../context/ThemeContext';
import styles from '../styles/ConfirmModal.module.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = '确认', cancelText = '取消' }) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={`${styles.modal} ${theme === 'dark' ? styles.dark : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`${styles.confirmBtn}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
