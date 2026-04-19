import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { StorageService } from '@core/services/storage.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  sidebarOpen = false;

  navItems = [
    { label: 'Dashboard',                icon: 'dashboard',              route: '/admin/dashboard' },
    { label: 'Órdenes',                  icon: 'receipt_long',           route: '/orders/waiter'   },
    { label: 'Facturas',                 icon: 'receipt',                route: '/admin/invoices'  },
    { label: 'Inventario',               icon: 'inventory_2',            route: '/admin/inventory/list' },
    { label: 'Proveedores',              icon: 'local_shipping',         route: '/admin/inventory/suppliers' },
    { label: 'Platos',                   icon: 'restaurant',             route: '/admin/inventory/dishes' },
    { label: 'Bebidas',                  icon: 'wine_bar',               route: '/admin/inventory/drinks' },
    { label: 'Adiciones',               icon: 'add_circle',             route: '/admin/inventory/additions' },
    { label: 'Menú del día',             icon: 'event_note',             route: '/admin/inventory/daily-menu' },
    { label: 'Categorías',              icon: 'category',               route: '/admin/inventory/categories' },
    { label: 'Alertas de stock',         icon: 'notification_important', route: '/admin/inventory/alerts' },
    { label: 'Movimientos de inventario',icon: 'swap_horiz',             route: '/admin/inventory/movements' },
  ];

  configItems = [
    { label: 'Gestión de mesas',    icon: 'table_restaurant', route: '/admin/tables' },
    { label: 'Gestión de usuarios', icon: 'group',            route: '/admin/users' },
    { label: 'Auditoría de seguridad', icon: 'shield_person', route: '/admin/audit-logs' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  get currentUser() {
    return this.storageService.getUser();
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { logout: true } }),
      error: () => this.router.navigate(['/auth/login'], { queryParams: { logout: true } })
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
