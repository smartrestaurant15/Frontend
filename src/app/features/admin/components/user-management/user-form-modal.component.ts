import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { NotificationService } from '@core/services/notification.service';
import { UserRole } from '@features/auth/models/user-role.enum';
import { User } from '@features/auth/models/user.model';
import { RegisterEmployeeRequest } from '../../models/register-employee-request.model';
import { UpdateUserRequest } from '../../models/update-user-request.model';
import { ChangeRoleRequest } from '../../models/change-role-request.model';

@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.scss']
})
export class UserFormModalComponent implements OnInit {
  @Input() userId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  userForm!: FormGroup;
  loading = false;
  isEditMode = false;
  currentUser: User | null = null;

  roles = [
    { value: UserRole.ADMIN,    label: 'Administrador' },
    { value: UserRole.KITCHEN,  label: 'Cocina'        },
    { value: UserRole.WAITER,   label: 'Mesero'        },
    { value: UserRole.CASHIER,  label: 'Cajero'        },
    { value: UserRole.CUSTOMER, label: 'Cliente'       }
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.userId !== null;
    this.initForm();

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  initForm(): void {
    if (this.isEditMode) {
      this.userForm = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        newRole: ['']
      });
    } else {
      this.userForm = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        role: ['', Validators.required]
      });
    }
  }

  loadUser(id: number): void {
    this.loading = true;
    this.adminService.getUserById(id).subscribe({
      next: (user: User) => {
        console.log('✅ Usuario cargado:', user);
        this.currentUser = user;
        this.userForm.patchValue({
          firstName: this.currentUser.firstName,
          lastName: this.currentUser.lastName,
          newRole: this.currentUser.role
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar usuario:', err);
        this.loading = false;
        // El error ya es manejado por el interceptor
        this.onClose();
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.userId) {
      this.updateUser();
    } else {
      this.createEmployee();
    }
  }

  createEmployee(): void {
    const request: RegisterEmployeeRequest = {
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      email: this.userForm.value.email,
      role: this.userForm.value.role as UserRole
    };

    console.log('📤 Enviando petición de registro:', request);

    this.adminService.registerEmployee(request).subscribe({
      next: (response: string) => {
        console.log('✅ Respuesta del servidor:', response);
        this.notificationService.showSuccess(response);
        this.saved.emit();
        this.onClose();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al registrar usuario:', err);
        this.loading = false;
        // El error ya es manejado por el interceptor
      }
    });
  }

  updateUser(): void {
    if (!this.userId || !this.currentUser) return;

    const updateRequest: UpdateUserRequest = {
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName
    };

    this.adminService.updateUser(this.userId, updateRequest).subscribe({
      next: (user: User) => {
        console.log('✅ Usuario actualizado:', user);
        
        // Si el rol cambió, actualizar el rol
        const newRole = this.userForm.value.newRole;
        if (newRole && newRole !== this.currentUser!.role) {
          this.changeUserRole(this.userId!, newRole);
        } else {
          this.notificationService.showSuccess('Usuario actualizado exitosamente');
          this.saved.emit();
          this.onClose();
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('❌ Error al actualizar usuario:', err);
        this.loading = false;
        // El error ya es manejado por el interceptor
      }
    });
  }

  changeUserRole(userId: number, newRole: UserRole): void {
    const roleRequest: ChangeRoleRequest = { role: newRole };

    this.adminService.changeRole(userId, roleRequest).subscribe({
      next: (user: User) => {
        console.log('✅ Rol actualizado:', user);
        this.notificationService.showSuccess('Usuario y rol actualizados exitosamente');
        this.saved.emit();
        this.onClose();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cambiar rol:', err);
        this.loading = false;
        // El error ya es manejado por el interceptor
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  onClose(): void {
    this.close.emit();
  }
}
