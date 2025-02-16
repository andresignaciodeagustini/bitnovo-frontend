import { useRouter } from 'next/router';
import SuccessModal from '../../components/SuccessModal/index';

const PaymentSuccessPage: React.FC = () => {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  const handleContinue = () => {
    router.push('/');  
  };

  return (
    <SuccessModal
      title="¡Pago completado!"
      message="Tu transacción se ha procesado exitosamente. Recibirás un correo de confirmación en breve."
      onClose={handleClose}
      onContinue={handleContinue}
      buttonText="Crear nuevo pago" 
      type="success" 
      icon="success" 
    />
  );
};

export default PaymentSuccessPage;