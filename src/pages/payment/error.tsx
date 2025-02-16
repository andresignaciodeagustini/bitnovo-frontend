
import { useRouter } from 'next/router';
import SuccessModal from '../../components/SuccessModal';

const PaymentErrorPage: React.FC = () => {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  const handleTryAgain = () => {
    router.push('http://localhost:3000/'); 
  };

  return (
    <SuccessModal
      title="¡Pago cancelado!"
      message="Lo sentimos, ha ocurrido un error al procesar tu pago. Por favor, intenta nuevamente."
      onClose={handleClose}
      onContinue={handleTryAgain}
      buttonText="Crear nuevo pago"
      type="error"
      icon="error"
    />
  );
};

export default PaymentErrorPage;