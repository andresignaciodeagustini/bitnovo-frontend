
import axios, { AxiosError } from 'axios';
import type { Currency, PaymentForm, PaymentResponse } from '../types';


const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api`,  
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    throw error;
  }
);


export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    console.log('Fetching currencies...');
    const response = await api.get<Currency[]>('/currencies');
    console.log('Currencies fetched successfully:', response.data.length, 'currencies');
    return response.data;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch currencies');
  }
};

export const createOrder = async (paymentData: PaymentForm): Promise<PaymentResponse> => {
  try {
    const formData = new FormData();
    
  
    formData.append('expected_output_amount', paymentData.amount.toString());
    formData.append('input_currency', paymentData.currency_id);
    formData.append('notes', paymentData.concept);

  
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = `${origin}/payment/success`;
    const errorUrl = `${origin}/payment/error`;
    const standbyUrl = `${origin}/payment/${paymentData.currency_id}`;

    formData.append('merchant_urlok', successUrl);
    formData.append('merchant_urlko', errorUrl);
    formData.append('merchant_url_standby', standbyUrl);

    
    formData.append('fiat', 'EUR');
    formData.append('language', 'ES');

    console.log('Creating order with data:', {
      amount: paymentData.amount,
      currency: paymentData.currency_id,
      notes: paymentData.concept,
      successUrl,
      errorUrl,
      standbyUrl
    });
    
    const response = await api.post<PaymentResponse>('/orders/', formData);
    console.log('Order created successfully:', {
      identifier: response.data.identifier,
      currency: response.data.input_currency,
      amount: response.data.expected_input_amount
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating order:', {
      error,
      paymentData: {
        amount: paymentData.amount,
        currency: paymentData.currency_id
      }
    });
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.details || 'Failed to create order');
    }
    throw new Error('Failed to create order');
  }
};


export const getOrderInfo = async (identifier: string): Promise<PaymentResponse> => {
  try {
    if (!identifier) {
      console.error('getOrderInfo called without identifier');
      throw new Error('Order identifier is required');
    }

    console.log('Fetching order info for identifier:', identifier);
    const response = await api.get<PaymentResponse>(`/orders/info/${identifier}`);
    
    console.log('Order info retrieved successfully:', {
      identifier: response.data.identifier,
      status: response.data.status,
      currency: response.data.input_currency,
      amount: response.data.expected_input_amount
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching order info:', {
      error,
      identifier
    });
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.details || 'Failed to fetch order info';
      console.error('API Error details:', errorMessage);
      throw new Error(errorMessage);
    }
    throw new Error('Failed to fetch order info');
  }
};


export const validateAmount = (amount: number, currency: Currency): boolean => {
  const minAmount = parseFloat(currency.min_amount);
  const maxAmount = parseFloat(currency.max_amount);
  const isValid = amount >= minAmount && amount <= maxAmount;
  
  console.log('Amount validation:', {
    amount,
    currency: currency.symbol,
    minAmount,
    maxAmount,
    isValid
  });
  
  return isValid;
};

export const getWebSocketUrl = (identifier: string): string => {
  if (!identifier) {
    console.warn('getWebSocketUrl called without identifier');
    return '';
  }
  
  const wsUrl = `wss://payments.pre-bnvo.com/ws/${identifier}`;
  console.log('WebSocket URL generated:', wsUrl);
  return wsUrl;
};


export const isOrderExpired = (status?: string): boolean => {
  return status === 'EX' || status === 'OC';
};

export const isOrderCompleted = (status?: string): boolean => {
  return status === 'CO' || status === 'AC';
};