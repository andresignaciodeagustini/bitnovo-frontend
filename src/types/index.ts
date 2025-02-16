

export interface Currency {
  symbol: string;
  name: string;
  min_amount: string;
  max_amount: string;
  image?: string;
  blockchain: string;
}

export interface PaymentForm {
  amount: number;
  concept: string;
  currency_id: string;
}

export interface CreateOrderRequest {
  expected_output_amount: number;
  input_currency: string;
  notes: string;
  merchant_urlko?: string;
  merchant_urlok?: string;
  merchant_url_standby?: string;
  fiat?: string;
  language?: string;
}

export interface Transaction {
  txid: string;
  amount: number;
  confirmations: number;
  created_at: string;
  currency_id: string;
}

export type PaymentStatus = 
  | 'NR' // Not Ready
  | 'PE' // Pending
  | 'AC' // Active
  | 'IA' // Inactive
  | 'CO' // Completed
  | 'CA' // Cancelled
  | 'EX' // Expired
  | 'OC' // Order Completed
  | 'RF' // Refunded
  | 'FA' // Failed
  | 'DE' // Declined
  | 'CM' // Confirmed

export interface PaymentResponse {
 
  identifier: string;
  reference: string | null;
  
 
  web_url: string;
  payment_uri?: string;
  url_ko: string | null;
  url_ok: string | null;
  url_standby: string | null;
  
  
  currency_id?: string;
  input_currency?: string;
  fiat: string;
  fiat_amount?: number;
  crypto_amount?: number | null;
  expected_input_amount?: number;
  unconfirmed_amount?: number;
  confirmed_amount?: number;
  received_amount?: number;
  

  address: string | null;
  tag_memo: string | null;
  
 
  status?: PaymentStatus;
  expired_time: string | null;
  created_at?: string;
  edited_at?: string;
  
  merchant_device_id?: number;
  merchant_device?: string;

  notes: string;
  language: string;

  rate?: number;
  good_fee?: boolean;
  rbf?: boolean;
  safe?: boolean;
  percentage?: number;

  balance_based?: string;
  internal_data?: string;
  transactions?: Transaction[];
}

export interface WebSocketResponse extends Partial<PaymentResponse> {
  type?: string;
  message?: string;
  status?: PaymentStatus;
  address?: string;
  tag_memo?: string;
  crypto_amount?: number;
  currency_id?: string;
}

export interface ApiError {
  error: string;
  details: string;
  status?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}


export interface PaymentConfig {
  timeout: number;
  retryAttempts: number;
  wsUrl: string;
  apiUrl: string;
}


export interface PaymentEvent {
  type: 'payment' | 'confirmation' | 'expiration' | 'error';
  data: Partial<PaymentResponse>;
  timestamp: string;
}


export interface TransactionMetadata {
  network: string;
  confirmationsRequired: number;
  fee?: number;
  exchangeRate?: number;
  timestamp: string;
}