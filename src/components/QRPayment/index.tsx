import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image'; 
import { QRCodeSVG } from 'qrcode.react';
import { BrowserProvider, parseEther } from 'ethers';
import { getOrderInfo, getCurrencies } from '@/services/api';
import { PaymentResponse, Currency } from '@/types';
import { ClockIcon, CopyIcon, InfoHexagonIcon } from '@/components/utils/icons';
import styles from './styles.module.css';

const DEFAULT_CRYPTO_IMAGE = '/images/default-crypto-icon.png';


interface QRPaymentProps {
  identifier: string;
}

interface PaymentInfo extends Omit<PaymentResponse, 'created_at' | 'address' | 'tag_memo' | 'expired_time'> {
  fiat_amount: number;
  fiat: string;
  currency_id: string;
  currency_name?: string;
  merchant_device: string;
  created_at?: string;
  notes: string;
  crypto_amount: number;
  address?: string;
  tag_memo?: string;
  expired_time?: string;
  input_currency: string;
  expected_input_amount: number;
}

interface Web3State {
  account: string | null;
  chainId: string | null;
  error: string | null;
}

const formatAmount = (amount: number | undefined | null): string => {
  return amount?.toString() || '0';
};

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

const formatCryptoName = (name: string) => {
  return name.replace('_TEST', '').replace('_', ' ');
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};



const QRPayment = ({ identifier }: QRPaymentProps) => {
  const router = useRouter();
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [cryptoList, setCryptoList] = useState<Currency[]>([]);
  const [timeLeft, setTimeLeft] = useState(330);
  const [copied, setCopied] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOption, setActiveOption] = useState<'qr' | 'web3'>('qr');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [web3State, setWeb3State] = useState<Web3State>({
    account: null,
    chainId: null,
    error: null
  });
  const [destinationTag] = useState(Math.floor(1000000000 + Math.random() * 9000000000));

  const getCryptoImage = useCallback((currencyId: string) => {
    const crypto = cryptoList.find((c: Currency) => c.symbol === currencyId);
    return crypto?.image || DEFAULT_CRYPTO_IMAGE;
  }, [cryptoList]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[];
        
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        }) as string;

        setWeb3State({
          account: accounts[0],
          chainId,
          error: null
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al conectar con MetaMask';
        console.error('MetaMask connection error:', errorMessage);
        setWeb3State(prev => ({
          ...prev,
          error: errorMessage
        }));
      }
    } else {
      setWeb3State(prev => ({
        ...prev,
        error: 'Por favor, instala MetaMask'
      }));
    }
  };
  const sendTransaction = async () => {
    if (!web3State.account || !paymentInfo) return;
  
    try {
      
      const provider = new BrowserProvider(window.ethereum!);
      const balance = await provider.getBalance(web3State.account);
      const requiredAmount = parseEther(paymentInfo.crypto_amount.toString());
  
    
      if (balance < requiredAmount) {
        setWeb3State(prev => ({
          ...prev,
          error: 'No tienes suficientes fondos para realizar esta transacción'
        }));
        return; 
      }
  
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: paymentInfo.address,
        value: parseEther(paymentInfo.crypto_amount.toString())
      });
  
      await tx.wait();
      router.push('/payment/ok');
    } catch (err) {
      let errorMessage = 'Error al enviar la transacción';
      
      if (err instanceof Error) {
        switch (err.message) {
          case 'user rejected transaction':
            errorMessage = 'Transacción cancelada por el usuario';
            break;
          default:
            if (err.message.includes('insufficient funds')) {
              errorMessage = 'No tienes suficientes fondos para realizar esta transacción';
            }
        }
      }
  
      console.error('Transaction error:', err);
      setWeb3State(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  };
      useEffect(() => {
        const loadCryptoList = async () => {
          try {
            const currencies = await getCurrencies();
            setCryptoList(currencies);
          } catch (error) {
            console.error('Error loading currencies:', error);
          }
        };
      
        loadCryptoList();
      }, []);
      
      useEffect(() => {
        const fetchPaymentInfo = async () => {
          try {
            setIsLoading(true);
            const data = await getOrderInfo(identifier);
            const processedData = Array.isArray(data) ? data[0] : data;
           
            if (processedData?.address) {
              let formattedAddress = processedData.address;
              if (formattedAddress.includes(':')) {
                formattedAddress = formattedAddress.split(':')[1];
              }
              if (!formattedAddress.startsWith('0x')) {
                formattedAddress = `0x${formattedAddress}`;
              }
              processedData.address = formattedAddress;
            }
            
            setPaymentInfo(processedData);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar la información del pago');
          } finally {
            setIsLoading(false);
          }
        };
      
        if (identifier) {
          fetchPaymentInfo();
        }
      }, [identifier]);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: unknown[]) => {
        setWeb3State(prev => ({
          ...prev,
          account: (accounts as string[])[0] || null
        }));
      };
  
      const handleChainChanged = (chainId: unknown) => {
        setWeb3State(prev => ({
          ...prev,
          chainId: chainId as string
        }));
      };
  
      window.ethereum?.on('accountsChanged', handleAccountsChanged);
      window.ethereum?.on('chainChanged', handleChainChanged);
  
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      if (!identifier) return;

      try {
        ws = new WebSocket(`wss://payments.pre-bnvo.com/ws/${identifier}`);
        setWsStatus('connecting');

        ws.onopen = () => {
          setWsStatus('connected');
          retryCount = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as PaymentInfo;
            setPaymentInfo(prev => prev ? { ...prev, ...data } : null);
          } catch {
            console.error('Error parsing WebSocket message');
          }
        };

        ws.onerror = () => {
          setWsStatus('error');
          if (retryCount < maxRetries) {
            retryCount++;
            retryTimeout = setTimeout(connectWebSocket, 2000 * retryCount);
          }
        };

        ws.onclose = () => {
          if (retryCount < maxRetries) {
            retryCount++;
            retryTimeout = setTimeout(connectWebSocket, 2000 * retryCount);
          }
        };
      } catch {
        setWsStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [identifier]);
  useEffect(() => {
    if (!paymentInfo?.expired_time) return;

    const expirationDate = new Date(paymentInfo.expired_time);
    if (isNaN(expirationDate.getTime())) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiration = expirationDate.getTime();
      const remaining = Math.max(0, Math.floor((expiration - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        router.push('/payment/error');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentInfo?.expired_time, router]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      console.error('Error copying to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando información del pago...</p>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className={styles.errorContainer}>
        <p>{error || 'No se encontró la información del pago'}</p>
        <button onClick={() => router.push('/')}>Volver al inicio</button>
      </div>
    );
  }
  return (
    <div className={styles.paymentContainer}>
      <div className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>Resumen del pedido</h2>
        <div className={styles.summaryInfo}>
          <div className={styles.summaryItem}>
            <span>Importe:</span>
            <span>
              {formatAmount(paymentInfo.fiat_amount)} {paymentInfo.fiat}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span>Moneda seleccionada:</span>
            <div className={styles.currencyWrapper}>
              <div className={styles.cryptoOption}>
                <Image 
                  src={getCryptoImage(paymentInfo.currency_id)}
                  alt={formatCryptoName(paymentInfo.currency_id)}
                  width={24}
                  height={24}
                  className={styles.cryptoLogo}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_CRYPTO_IMAGE;
                  }}
                  unoptimized
                />
                <div className={styles.cryptoInfo}>
                  <span className={styles.currencyName}>
                    {formatCryptoName(paymentInfo.currency_id)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span>Comercio:</span>
            <div className={styles.commerceWrapper}>
              <Image
                src="/img/verify.png"
                alt="Verified"
                width={24}
                height={24}
                className={styles.verifyIcon}
              />
              <span>{paymentInfo.merchant_device || 'N/A'}</span>
            </div>
          </div>
          <div className={styles.summaryItem}>
            <span>Fecha:</span>
            <span>{formatDate(paymentInfo.created_at)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Concepto:</span>
            <span>{paymentInfo.notes || 'N/A'}</span>
          </div>
        </div>
      </div>
      <div className={styles.paymentSection}>
        <h2 className={styles.sectionTitle}>Realiza el pago</h2>
        
        <div className={styles.timer}>
          <ClockIcon />
          <span>{formatTime(timeLeft)}</span>
        </div>
  
        {wsStatus === 'error' && (
          <div className={styles.wsError}>
            <p>Error en la conexión en tiempo real. Los datos podrían no estar actualizados.</p>
          </div>
        )}
  
        <div className={styles.paymentOptions}>
          <button 
            className={`${styles.optionButton} ${activeOption === 'qr' ? styles.active : ''}`}
            onClick={() => setActiveOption('qr')}
          >
            Smart QR
          </button>
          <button 
            className={`${styles.optionButton} ${activeOption === 'web3' ? styles.active : ''}`}
            onClick={() => setActiveOption('web3')}
          >
            Web3
          </button>
        </div>
  
        {activeOption === 'qr' && paymentInfo.address && (
          <div className={styles.qrCode}>
            <QRCodeSVG
              value={paymentInfo.payment_uri || 
                `${paymentInfo.input_currency?.toLowerCase()}:${paymentInfo.address}?amount=${paymentInfo.expected_input_amount}`}
              size={200}
              level="L"
              includeMargin={true}
              className={styles.qrImage}
            />
          </div>
        )}
  
        {activeOption === 'web3' && (
          <div className={styles.web3Container}>
            <Image 
              src="/img/metamask.png"  
              alt="MetaMask"
              width={137}
              height={43}
              className={styles.metamaskImage}
            />
            {!web3State.account ? (
              <button 
                onClick={connectWallet}
                className={styles.connectWalletButton}
              >
                Conectar MetaMask
              </button>
            ) : (
              <div className={styles.web3Connected}>
                <p className={styles.accountInfo}>
                  Cuenta conectada: {web3State.account.slice(0, 6)}...{web3State.account.slice(-4)}
                </p>
                <button 
                  onClick={sendTransaction}
                  className={styles.sendTransactionButton}
                >
                  Enviar pago
                </button>
              </div>
            )}
            {web3State.error && (
              <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>⚠️</div>
                <p className={styles.errorMessage}>{web3State.error}</p>
              </div>
            )}
          </div>
        )}
        <div className={styles.paymentDetails}>
          <div className={styles.detailItem}>
            <span className={styles.sendLabel}>Enviar</span>
            <div className={styles.copyWrapper}>
              <div className={styles.amountInfo}>
                <span>
                  {formatAmount(paymentInfo.crypto_amount)} {formatCryptoName(paymentInfo.currency_id)}
                </span>
              </div>
              <button 
                onClick={() => copyToClipboard(formatAmount(paymentInfo.crypto_amount), 'amount')}
                className={`${styles.copyButton} ${copied === 'amount' ? styles.copied : ''}`}
              >
                <CopyIcon />
              </button>
            </div>
          </div>
  
          {paymentInfo.address && (
            <div className={styles.detailItem}>
              <div className={styles.copyWrapper}>
                <span className={styles.addressText}>
                  {paymentInfo.address.replace('bchtest:', '')}
                </span>
                <button 
                  onClick={() => copyToClipboard(paymentInfo.address || '', 'address')}
                  className={`${styles.copyButton} ${copied === 'address' ? styles.copied : ''}`}
                >
                  <CopyIcon />
                </button>
              </div>
            </div>
          )}
  
          <div className={styles.destinationTagContainer}>
            <div className={styles.warningIcon}>
              <InfoHexagonIcon />
            </div>
            <div className={styles.destinationTagWrapper}>
              <span>Etiqueta de destino: {destinationTag}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(destinationTag.toString(), 'tag')}
              className={styles.copyButton}
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRPayment;