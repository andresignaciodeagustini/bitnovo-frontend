
import { useRouter } from 'next/router';
import QRPayment from '@/components/QRPayment';

const PaymentPageWrapper = () => {
  const router = useRouter();
  const { identifier } = router.query;
  
  
  if (!router.isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!identifier) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>
          <p>No se encontró la información del pago</p>
          <button onClick={() => router.push('/')}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  return <QRPayment identifier={identifier as string} />;
};

export default PaymentPageWrapper;