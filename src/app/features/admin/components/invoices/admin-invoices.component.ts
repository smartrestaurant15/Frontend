import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '@features/orders/services/invoice.service';
import { NotificationService } from '@core/services/notification.service';
import { Invoice, PaymentMethodType, PayPresentialDTO } from '@features/orders/models/invoice.model';

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './admin-invoices.component.html',
  styleUrls: ['./admin-invoices.component.scss']
})
export class AdminInvoicesComponent implements OnInit {

  invoices: Invoice[] = [];
  loading = false;

  payingInvoice: Invoice | null = null;
  selectedMethod: PaymentMethodType = 'CASH';
  paymentReference = '';
  submittingPayment = false;

  confirmCancelId: string | null = null;

  readonly statusBadge: Record<string, string> = {
    PENDING:   'bg-amber-400/10 text-amber-400 border-amber-400/20',
    PAID:      'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    CANCELLED: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  readonly statusLabel: Record<string, string> = {
    PENDING:   'Pendiente',
    PAID:      'Pagada',
    CANCELLED: 'Cancelada',
  };

  readonly PAYMENT_METHODS: { value: PaymentMethodType; label: string; icon: string }[] = [
    { value: 'CASH',     label: 'Efectivo',     icon: 'payments'        },
    { value: 'CARD',     label: 'Tarjeta',      icon: 'credit_card'     },
    { value: 'TRANSFER', label: 'Transferencia', icon: 'account_balance' },
  ];

  constructor(
    private invoiceService: InvoiceService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getAllInvoices().subscribe({
      next: (res) => {
        this.invoices = Array.isArray(res.data) ? res.data : [];
        this.loading = false;
      },
      error: () => { this.invoices = []; this.loading = false; }
    });
  }

  openPayment(inv: Invoice): void {
    this.payingInvoice = inv;
    this.selectedMethod = 'CASH';
    this.paymentReference = '';
  }

  closePayment(): void {
    this.payingInvoice = null;
  }

  submitPayment(): void {
    if (!this.payingInvoice || this.submittingPayment) { return; }
    this.submittingPayment = true;
    const dto: PayPresentialDTO = {
      invoiceId: this.payingInvoice.id,
      paymentMethod: this.selectedMethod,
      reference: this.paymentReference || undefined,
    };
    this.invoiceService.payPresential(this.payingInvoice.id, dto).subscribe({
      next: () => {
        this.notification.showSuccess('Pago registrado correctamente');
        this.payingInvoice = null;
        this.submittingPayment = false;
        this.loadInvoices();
      },
      error: () => {
        this.notification.showError('Error al registrar el pago');
        this.submittingPayment = false;
      }
    });
  }

  requestCancel(inv: Invoice): void {
    if (this.confirmCancelId === inv.id) {
      this.confirmCancelId = null;
      this.invoiceService.cancelInvoice(inv.id).subscribe({
        next: () => {
          this.notification.showSuccess('Factura cancelada');
          this.loadInvoices();
        },
        error: () => this.notification.showError('Error al cancelar la factura')
      });
    } else {
      this.confirmCancelId = inv.id;
      setTimeout(() => {
        if (this.confirmCancelId === inv.id) { this.confirmCancelId = null; }
      }, 4000);
    }
  }

  trackById(_: number, inv: Invoice): string { return inv.id; }
}
