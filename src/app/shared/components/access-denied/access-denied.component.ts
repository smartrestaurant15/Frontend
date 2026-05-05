import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '@core/services/storage.service';
import { PermissionService } from '@core/services/permission.service';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent implements OnInit {
  userRole: string = '';
  userName: string = '';

  constructor(
    private router: Router,
    private storageService: StorageService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.userRole = this.storageService.getUserRole();
    this.userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Usuario';
  }

  goToDashboard(): void {
    if (this.permissionService.isCustomer()) {
      this.router.navigate(['/customer/home']);
    } else if (this.userRole === 'CASHIER') {
      this.router.navigate(['/orders/cashier']);
    } else {
      this.router.navigate(['/inventory']);
    }
  }

  getRoleDisplayName(): string {
    const roleNames: Record<string, string> = {
      'ADMIN':    'Administrador',
      'KITCHEN':  'Cocina',
      'WAITER':   'Mesero',
      'CASHIER':  'Cajero',
      'CUSTOMER': 'Cliente'
    };
    return roleNames[this.userRole] || this.userRole;
  }
}
