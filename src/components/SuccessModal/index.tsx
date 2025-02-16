
import React from 'react';
import styles from './styles.module.css';
import { CloseIcon, ErrorIcon, SuccessIcon } from '../utils/icons';

interface SuccessModalProps {
  title: string;
  message: string;
  onClose?: () => void;
  onContinue?: () => void;
  buttonText?: string;
  type?: 'success' | 'error';
  icon?: 'success' | 'error';
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  title,
  message,
  onClose,
  onContinue,
  buttonText = 'Continuar',
  type = 'success',
  icon = 'success'
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            <CloseIcon />
          </button>
        )}
        
        <div className={styles.content}>
          <div className={`${styles.iconContainer} ${styles[`icon${type}`]}`}>
            {icon === 'success' ? <SuccessIcon /> : <ErrorIcon />}
          </div>
          
          <div className={styles.textContent}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
          </div>
          
          <button 
            className={`${styles.continueButton} ${styles[`button${type}`]}`}
            onClick={onContinue}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;