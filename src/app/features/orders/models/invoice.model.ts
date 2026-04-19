export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethodType = 'CASH' | 'CARD' | 'TRANSFER' | 'WOMPI';

export interface Invoice {
  id: string;
  orderId: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PayPresentialDTO {
  invoiceId: string;
  paymentMethod: PaymentMethodType;
  reference?: string;
}
