import React from 'react';
import Image from 'next/image';
import styles from './styles.module.css';

const Footer: React.FC = () => {
  return (
    <div className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <div className={styles.poweredBySection}>
          <span className={styles.poweredByText}>Powered by</span>
          <Image
            src="/img/bitnovo.png"
            alt="Bitnovo Logo"
            width={100}
            height={100}
            className={styles.logo}
          />
        </div>
        <div className={styles.divider} />
        <span className={styles.copyright}>
          © 2022 Bitnovo. All rights reserved.
        </span>
      </div>
    </div>
  );
};

export default Footer;