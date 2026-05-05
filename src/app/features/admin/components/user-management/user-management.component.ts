import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { User } from '@features/auth/models/user.model';
import { UserRole } from '@features/auth/models/user-role.enum';
import { UserStatus } from '@features/auth/models/user-status.enum';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  isModalOpen = false;
  selectedUserId: number | null = null;
  
  // Modal de cambio de rol
  isRoleModalOpen = false;
  selectedUserForRoleChange: User | null = null;
  newRole: UserRole | null = null;
  
  // Filtros
  selectedRole: UserRole | null = null;
  selectedStatus: UserStatus | null = null;
  
  // Enums para el template
  UserRole = UserRole;
  UserStatus = UserStatus;
  
  roles = [
    { value: UserRole.ADMIN,    label: 'Administrador' },
    { value: UserRole.KITCHEN,  label: 'Cocina'        },
    { value: UserRole.WAITER,   label: 'Mesero'        },
    { value: UserRole.CASHIER,  label: 'Cajero'        },
    { value: UserRole.CUSTOMER, label: 'Cliente'       }
  ];
  
  statuses = [
    { value: UserStatus.ACTIVE, label: 'Activo' },
    { value: UserStatus.INACTIVE, label: 'Inactivo' },
    { value: UserStatus.PENDING, label: 'Pendiente' },
    { value: UserStatus.BANNED, label: 'Baneado' }
  ];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers(this.selectedRole || undefined, this.selectedStatus || undefined).subscribe({
      next: (users: User[]) => {
        console.log('✅ Usuarios cargados:', users);
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar usuarios:', err);
        this.loading = false;
        // El error ya es manejado por el interceptor
      }
    });
  }

  openCreateModal(): void {
    this.selectedUserId = null;
    this.isModalOpen = true;
  }

  openEditModal(id: number): void {
    this.selectedUserId = id;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedUserId = null;
  }

  onUserSaved(): void {
    this.loadUsers();
  }

  viewUserDetail(id: number): void {
    this.router.navigate(['/admin/users', id]);
  }

  deactivateUser(id: number): void {
    if (confirm('¿Está seguro de desactivar este usuario?')) {
      this.adminService.deactivateUser(id).subscribe({
        next: (user: User) => {
          console.log('✅ Usuario desactivado:', user);
          this.notificationService.showSuccess('Usuario desactivado exitosamente');
          this.loadUsers();
        },
        error: () => {
          // El error ya es manejado por el interceptor
        }
      });
    }
  }

  activateUser(id: number): void {
    if (confirm('¿Está seguro de activar este usuario?')) {
      this.adminService.activateUser(id).subscribe({
        next: (user: User) => {
          console.log('✅ Usuario activado:', user);
          this.notificationService.showSuccess('Usuario activado exitosamente');
          this.loadUsers();
        },
        error: () => {
          // El error ya es manejado por el interceptor
        }
      });
    }
  }

  openRoleModal(user: User): void {
    this.selectedUserForRoleChange = user;
    this.newRole = user.role; // Inicializar con el rol actual
    this.isRoleModalOpen = true;
  }

  closeRoleModal(): void {
    this.isRoleModalOpen = false;
    this.selectedUserForRoleChange = null;
    this.newRole = null;
  }

  changeUserRole(): void {
    if (!this.selectedUserForRoleChange || !this.newRole) {
      return;
    }

    if (this.newRole === this.selectedUserForRoleChange.role) {
      this.notificationService.showWarning('El usuario ya tiene ese rol');
      return;
    }

    this.adminService.changeRole(this.selectedUserForRoleChange.id, { role: this.newRole }).subscribe({
      next: (user: User) => {
        console.log('✅ Rol cambiado:', user);
        this.notificationService.showSuccess(`Rol cambiado exitosamente a ${this.getRoleLabel(this.newRole!)}`);
        this.closeRoleModal();
        this.loadUsers();
      },
      error: () => {
        // El error ya es manejado por el interceptor
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  onRoleFilterChange(): void {
    this.loadUsers();
  }

  onStatusFilterChange(): void {
    this.loadUsers();
  }

  clearFilters(): void {
    this.selectedRole = null;
    this.selectedStatus = null;
    this.loadUsers();
  }

  getRoleBadgeClass(role: UserRole): string {
    const classes: { [key in UserRole]: string } = {
      [UserRole.ADMIN]:    'badge-admin',
      [UserRole.KITCHEN]:  'badge-kitchen',
      [UserRole.WAITER]:   'badge-waiter',
      [UserRole.CASHIER]:  'badge-cashier',
      [UserRole.CUSTOMER]: 'badge-customer'
    };
    return classes[role] || '';
  }

  getStatusBadgeClass(status: UserStatus): string {
    const classes: { [key in UserStatus]: string } = {
      [UserStatus.ACTIVE]: 'badge-success',
      [UserStatus.INACTIVE]: 'badge-warning',
      [UserStatus.PENDING]: 'badge-info',
      [UserStatus.BANNED]: 'badge-danger'
    };
    return classes[status] || '';
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
