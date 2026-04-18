export type PaymentMethodType = 'CASH' | 'CARD' | 'TRANSFER';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Invoice {
  id: string;
  orderId: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethodType;
  reference?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PayPresentialDTO {
  invoiceId: string;
  paymentMethod: PaymentMethodType;
  reference?: string;
}
