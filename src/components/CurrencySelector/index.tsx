import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import styles from './styles.module.css';
import { getCurrencies } from '@/services/api';
import type { Currency } from '@/types';

interface CryptoSelectorProps {
  value: string;
  onChange: (symbol: string, name: string) => void;
  disabled?: boolean;
  amount?: number;
  className?: string;
}

const DEFAULT_CRYPTO_IMAGE = '/images/default-crypto-icon.png';

const CurrencySelector = ({ 
  value, 
  onChange, 
  disabled, 
  amount,
  className 
}: CryptoSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptoOptions, setCryptoOptions] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageError, setImageError] = useState<{[key: string]: boolean}>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currencies = await getCurrencies();
      
      const filteredCurrencies = amount 
        ? currencies.filter((currency: Currency) => {
            const minAmount = parseFloat(currency.min_amount);
            const maxAmount = parseFloat(currency.max_amount);
            return amount >= minAmount && amount <= maxAmount;
          })
        : currencies;

      setCryptoOptions(filteredCurrencies);
    } catch (err) {
      setError('Error al cargar las criptomonedas');
      console.error('Error loading currencies:', err);
    } finally {
      setLoading(false);
    }
  }, [amount]);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredOptions = cryptoOptions.filter(crypto => 
    crypto.name.toLowerCase().includes(searchTerm) || 
    crypto.symbol.toLowerCase().includes(searchTerm)
  );

  const selectedCrypto = cryptoOptions.find(crypto => crypto.symbol === value);

  const handleSelect = (crypto: Currency) => {
    onChange(crypto.symbol, crypto.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleImageError = (symbol: string) => {
    setImageError(prev => ({
      ...prev,
      [symbol]: true
    }));
  };

  if (loading) {
    return (
      <div className={`${styles.loading} ${className}`}>
        <div className={styles.spinner}></div>
        <span>Cargando criptomonedas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.error} ${className}`}>
        <span className={styles.errorIcon}>⚠️</span>
        {error}
        <button 
          onClick={loadCurrencies} 
          className={styles.retryButton}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.cryptoSelector} ${className}`} ref={dropdownRef}>
      <div 
        className={`${styles.selectedOption} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        {selectedCrypto ? (
          <div className={styles.cryptoOption}>
            <Image 
              src={imageError[selectedCrypto.symbol] || !selectedCrypto.image ? DEFAULT_CRYPTO_IMAGE : selectedCrypto.image}
              alt={selectedCrypto.name}
              width={24}
              height={24}
              className={styles.cryptoLogo}
              onError={() => handleImageError(selectedCrypto.symbol)}
              unoptimized
            />
            <div className={styles.cryptoInfo}>
              <span className={styles.cryptoName}>{selectedCrypto.name}</span>
              <span className={styles.cryptoSymbol}>{selectedCrypto.symbol}</span>
            </div>
          </div>
        ) : (
          <span className={styles.placeholder}>Seleccionar moneda</span>
        )}
        <span className={`${styles.arrow} ${isOpen ? styles.up : ''}`}>▼</span>
      </div>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar criptomoneda..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((crypto: Currency) => (
                <div
                  key={crypto.symbol}
                  className={`${styles.cryptoOption} ${value === crypto.symbol ? styles.selected : ''}`}
                  onClick={() => handleSelect(crypto)}
                  role="option"
                  aria-selected={value === crypto.symbol}
                >
                  <Image 
                    src={imageError[crypto.symbol] || !crypto.image ? DEFAULT_CRYPTO_IMAGE : crypto.image}
                    alt={crypto.name}
                    width={24}
                    height={24}
                    className={styles.cryptoLogo}
                    onError={() => handleImageError(crypto.symbol)}
                    unoptimized
                  />
                  <div className={styles.cryptoInfo}>
                    <span className={styles.cryptoName}>{crypto.name}</span>
                    <span className={styles.cryptoSymbol}>{crypto.symbol}</span>
                    <span className={styles.limits}>
                      Min: {crypto.min_amount} € - Max: {crypto.max_amount} €
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;