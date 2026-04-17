import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData } from '../../models/dashboard.model';
import { StorageService } from '@core/services/storage.service';
import { NotificationService } from '@core/services/notification.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  now = new Date();

  constructor(
    private dashboardService: DashboardService,
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Mostrar toast de login solo si viene de un login real
    if (this.storageService.getItem('showLoginSuccess') === 'true') {
      this.storageService.removeItem('showLoginSuccess');
      this.notificationService.showSuccess('Inicio de sesión exitoso');
    }
    this.dashboardService.getDashboard()
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        this.data = data;
        this.loading = false;
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(value);
  }

  get stockStatusClass(): (current: number, min: number) => string {
    return (current, min) => current <= 0 ? 'border-red-500 text-red-400' : 'border-primary text-primary';
  }

  get stockLabel(): (current: number, min: number) => string {
    return (current, min) => current <= 0 ? 'SIN STOCK' : 'BAJO STOCK';
  }

  get topDishMaxSold(): number {
    return this.data?.topDishes?.[0]?.totalSold ?? 1;
  }
}
