import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '@core/services/storage.service';
import { AuthService } from '@features/auth/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.checkUserStatus();
  }

  checkUserStatus(): void {
    const token = this.storageService.getToken();
    this.isLoggedIn = !!token;

    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      if (user) {
        this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Usuario';
        this.userRole = user.role || '';
      } else {
        this.userName = 'Usuario';
      }
    }
  }

  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'ADMIN':    'Administrador',
      'KITCHEN':  'Cocina',
      'WAITER':   'Mesero',
      'CASHIER':  'Cajero',
      'CUSTOMER': 'Cliente'
    };
    return roleNames[role] || role;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.showSuccess('Sesión cerrada correctamente');
        this.router.navigate(['/auth/login'], { queryParams: { logout: 'true' } });
      },
      error: () => {
        // Even if API fails, clear local storage
        this.storageService.clearAll();
        this.router.navigate(['/auth/login'], { queryParams: { logout: 'true' } });
      }
    });
  }
}
