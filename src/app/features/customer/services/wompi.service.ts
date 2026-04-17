import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ResponseDTO } from '@features/orders/models/response-dto.model';

export interface WompiCheckoutParams {
  publicKey: string;
  signature: string;
  reference: string;
  currency: string;
}

export interface WompiPaymentRequest {
  orderId: string;
  customerId: number;
  wompiToken: string;
  amount: number;
  description: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

export interface WompiPaymentResponse {
  paymentId: string;
  orderId: string;
  wompiTransactionId: string;
  status: string;
  amount: number;
  currency: string;
  processedAt: string;
  message: string;
  paymentMethodType: string;
  customerEmail: string;
}

@Injectable({ providedIn: 'root' })
export class WompiService {

  constructor(private http: HttpClientService) {}

  /**
   * Obtiene la llave pública y la firma de integridad del backend
   * GET /api/payments/wompi/checkout-params
   */
  getCheckoutParams(reference: string, amountInCents: number): Observable<ResponseDTO<WompiCheckoutParams>> {
    return this.http.get<ResponseDTO<WompiCheckoutParams>>(
      `/payments/wompi/checkout-params?reference=${reference}&amountInCents=${amountInCents}`
    );
  }

  /**
   * Confirma el pago en el backend después de que Wompi redirige de vuelta
   * POST /api/payments/wompi/confirm
   */
  confirmPayment(dto: WompiPaymentRequest): Observable<ResponseDTO<WompiPaymentResponse>> {
    return this.http.post<ResponseDTO<WompiPaymentResponse>>('/payments/wompi/confirm', dto);
  }

  /**
   * Renderiza el formulario de Wompi y hace submit automático.
   * El widget de Wompi Colombia funciona con un <form> + <script data-render>
   * que redirige al checkout de Wompi.
   */
  redirectToCheckout(params: {
    publicKey: string;
    amountInCents: number;
    reference: string;
    signature: string;
    redirectUrl: string;
    currency?: string;
    description?: string;
    customerEmail?: string;
  }): void {
    // Wompi checkout usa GET params en la URL.
    // Nota: URLSearchParams codifica ":" como "%3A" en el nombre del parámetro,
    // pero Wompi espera "signature:integrity" con los dos puntos literales.
    // Por eso construimos la query string manualmente para ese campo.
    const enc = encodeURIComponent;

    const parts: string[] = [
      `public-key=${enc(params.publicKey)}`,
      `currency=${enc(params.currency ?? 'COP')}`,
      `amount-in-cents=${enc(String(params.amountInCents))}`,
      `reference=${enc(params.reference)}`,
      `signature:integrity=${enc(params.signature)}`,
      `redirect-url=${enc(params.redirectUrl)}`,
    ];

    if (params.description)   parts.push(`description=${enc(params.description)}`);
    if (params.customerEmail) parts.push(`customer-email=${enc(params.customerEmail)}`);

    window.location.href = `https://checkout.wompi.co/p/?${parts.join('&')}`;
  }
}
