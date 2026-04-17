import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WompiService } from '../../services/wompi.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.scss']
})
export class PaymentResultComponent implements OnInit {

  status: 'loading' | 'success' | 'error' | 'pending' = 'loading';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wompiService: WompiService,
    private notification: NotificationService,
    private storageService: StorageService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Wompi redirige con ?id=TRANSACTION_ID en la URL
    const transactionId = this.route.snapshot.queryParamMap.get('id');
    const orderId       = this.route.snapshot.queryParamMap.get('orderId');

    if (!transactionId || !orderId) {
      this.status  = 'error';
      this.message = 'No se recibió información del pago.';
      return;
    }

    const user = this.storageService.getUser();

    // Confirmar el pago en el backend
    this.wompiService.confirmPayment({
      orderId,
      customerId:    user?.id,
      wompiToken:    transactionId,
      amount:        0,   // el backend lo obtiene de la orden
      description:   `Pedido #${orderId.slice(-6).toUpperCase()}`,
      customerEmail: user?.email ?? '',
    }).subscribe({
      next: (res) => {
        // Limpiar carrito y sessionStorage al confirmar exitosamente
        this.cartService.clear();
        sessionStorage.removeItem('pendingOrderId');

        if (res.data?.status === 'APPROVED' || res.data?.status === 'PENDING') {
          this.status  = 'success';
          this.message = 'Pago confirmado. Tu pedido está siendo preparado.';
        } else {
          this.status  = 'pending';
          this.message = 'Pago en proceso. Te notificaremos cuando se confirme.';
        }
      },
      error: () => {
        this.status  = 'error';
        this.message = 'El pago fue procesado pero hubo un error al confirmarlo. Contacta soporte.';
      }
    });
  }

  goToOrders(): void { this.router.navigate(['/customer/my-orders']); }
  goToMenu():   void { this.router.navigate(['/customer/menu']); }
}
