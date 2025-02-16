import { useState } from 'react';
import { useRouter } from 'next/router';
import { createOrder, getCurrencies } from '../../services/api';
import type { Currency } from '../../types'; 
import CryptoSelector from '../CurrencySelector';
import styles from './styles.module.css';

interface IPaymentForm {
  amount: number;
  concept: string;
  currency_id: string;
  currency_name: string;
}

const PaymentForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<IPaymentForm>({
    amount: 0,
    concept: '',
    currency_id: '',
    currency_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const currencies = await getCurrencies();
      const selectedCurrency = currencies.find(
        (c: Currency) => c.symbol === formData.currency_id
      );

      if (selectedCurrency) {
        const minAmount = parseFloat(selectedCurrency.min_amount);
        const maxAmount = parseFloat(selectedCurrency.max_amount);
        
        if (formData.amount < minAmount || formData.amount > maxAmount) {
          setError(`El monto debe estar entre ${minAmount} y ${maxAmount} EUR`);
          setLoading(false);
          return;
        }
      } else {
        setError('Moneda no válida');
        setLoading(false);
        return;
      }

      const orderData = {
        amount: formData.amount,
        currency_id: formData.currency_id,
        currency_name: formData.currency_name,
        concept: formData.concept,
        merchant_urlok: `${window.location.origin}/payment/success`,
        merchant_urlko: `${window.location.origin}/payment/error`,
        merchant_url_standby: `${window.location.origin}/payment/${formData.currency_id}`
      };

      console.log('Creating order with data:', orderData);
      const response = await createOrder(orderData);
      console.log('Order creation response:', response);

      if (response && response.identifier) {
        console.log('Redirecting to:', `/payment/${response.identifier}`);
        
        try {
          await router.push({
            pathname: '/payment/[identifier]',
            query: { identifier: response.identifier },
          });
        } catch (routerError) {
          console.error('Router push failed:', routerError);
          window.location.href = `/payment/${response.identifier}`;
        }
      } else {
        throw new Error('No se recibió un identificador válido');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setFormData({
      ...formData,
      amount,
      currency_id: amount > 0 ? formData.currency_id : '',
      currency_name: amount > 0 ? formData.currency_name : ''
    });
  };

  const handleCurrencyChange = (symbol: string, name: string) => {
    setFormData({
      ...formData,
      currency_id: symbol,
      currency_name: name
    });
  };

  const isFormValid = () => {
    return (
      formData.amount > 0 && 
      formData.concept.trim().length >= 3 && 
      formData.currency_id !== ''
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Crear Pago</h1>
        
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="amount">
              Importe a pagar (EUR)
            </label>
            <input
              type="number"
              id="amount"
              placeholder="Añade importe a pagar"
              value={formData.amount || ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              min="0"
              step="0.01"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelContainer}>
              <label className={styles.label} htmlFor="currency">
                Seleccionar moneda
              </label>
              <div className={styles.infoTool}>
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 14 14" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="7" cy="7" r="6.5" stroke="#647184"/>
                  <path 
                    d="M7 4.5V7M7 9.5H7.01" 
                    stroke="#647184" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <CryptoSelector
              value={formData.currency_id}
              onChange={handleCurrencyChange}
              disabled={!formData.amount}
              amount={formData.amount}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="concept">
              Concepto
            </label>
            <textarea
              id="concept"
              placeholder="Añade descripción del pago"
              value={formData.concept}
              onChange={(e) => setFormData({
                ...formData,
                concept: e.target.value
              })}
              required
              maxLength={512}
              className={styles.textarea}
            />
            <small className={styles.hint}>
              {formData.concept.length}/512 caracteres
            </small>
          </div>

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`${styles.submitButton} ${
              loading || !isFormValid() ? styles.disabled : ''
            }`}
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <div className={styles.buttonContent}>
                <span className={styles.spinner}></span>
                <span className={styles.buttonText}>Procesando...</span>
              </div>
            ) : (
              <span className={styles.buttonText}>Continuar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;