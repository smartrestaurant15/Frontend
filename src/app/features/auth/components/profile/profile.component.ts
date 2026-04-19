import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/user-role.enum';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { RoleRedirectService } from '../../services/role-redirect.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm!: FormGroup;
  loading = false;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private roleRedirectService: RoleRedirectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      firstName: [{ value: '', disabled: true }, Validators.required],
      lastName: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }]
    });
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        if (this.user) {
          this.profileForm.patchValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            email: this.user.email
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar perfil:', err);
        this.loading = false;
        this.notificationService.showError('Error al cargar el perfil');
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      this.profileForm.get('firstName')?.enable();
      this.profileForm.get('lastName')?.enable();
    } else {
      this.profileForm.get('firstName')?.disable();
      this.profileForm.get('lastName')?.disable();
      // Restaurar valores originales
      if (this.user) {
        this.profileForm.patchValue({
          firstName: this.user.firstName,
          lastName: this.user.lastName
        });
      }
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName } = this.profileForm.value;
    this.loading = true;

    this.authService.updateProfile({ firstName, lastName }).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        // Actualizar datos en storage
        if (this.user) {
          this.user = { ...this.user, firstName, lastName };
          this.storageService.setUser(this.user);
        }
        this.notificationService.showSuccess('Perfil actualizado exitosamente');
        this.toggleEdit();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/auth/change-password']);
  }

  navigateToDashboard(): void {
    const user = this.storageService.getUser();
    const role = (user?.role as UserRole) || UserRole.CUSTOMER;
    this.router.navigate([this.roleRedirectService.getDashboardRoute(role)]);
  }
}
