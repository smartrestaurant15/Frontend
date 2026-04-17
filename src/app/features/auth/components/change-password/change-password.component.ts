import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RoleRedirectService } from '../../services/role-redirect.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { CustomValidators } from '@shared/validators/custom-validators';
import { UserRole } from '../../models/user-role.enum';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  loading = false;
  otpRequested = false;
  userEmail = '';
  isForcedChange = false; // Indica si es cambio obligatorio en primer login

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private roleRedirectService: RoleRedirectService,
    private notificationService: NotificationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.userEmail = user?.email || '';
    
    // Verificar si es un cambio forzado ANTES de inicializar el formulario
    this.route.queryParams.subscribe(params => {
      this.isForcedChange = params['forced'] === 'true';
      this.initForm(); // Inicializar formulario DESPUÉS de obtener el parámetro
    });
  }

  initForm(): void {
    if (this.isForcedChange) {
      this.changePasswordForm = this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(8), CustomValidators.passwordStrength()]],
        confirmPassword: ['', [Validators.required]]
      });
    } else {
      // Cambio voluntario: solo contraseña actual + nueva (sin OTP)
      this.changePasswordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8), CustomValidators.passwordStrength()]],
        confirmPassword: ['', [Validators.required]]
      });
    }
    this.changePasswordForm.get('confirmPassword')?.setValidators([
      Validators.required,
      CustomValidators.matchPassword('newPassword')
    ]);
  }

  requestOtp(): void {
    if (!this.userEmail) {
      this.notificationService.showError('No se pudo obtener el email del usuario');
      return;
    }

    this.loading = true;
    this.authService.requestPasswordChange(this.userEmail).subscribe({
      next: () => {
        this.notificationService.showSuccess('Código OTP enviado a tu correo');
        this.otpRequested = true;
        // Hacer el campo OTP requerido
        this.changePasswordForm.get('otp')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.changePasswordForm.get('otp')?.updateValueAndValidity();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.loading = true;

      if (this.isForcedChange) {
        // Cambio de contraseña en primer login (simplificado)
        const { newPassword, confirmPassword } = this.changePasswordForm.value;
        
        const request = {
          email: this.userEmail,
          newPassword,
          confirmPassword
        };
        
        this.authService.changePasswordFirstLogin(request).subscribe({
          next: (response) => {
            // Actualizar tokens en el storage
            this.storageService.setToken(response.accessToken);
            this.storageService.setRefreshToken(response.refreshToken);
            
            this.notificationService.showSuccess('Contraseña cambiada exitosamente');
            
            // Redirigir al dashboard según el rol
            const user = this.storageService.getUser();
            const userRole = user?.role || UserRole.CUSTOMER;
            this.roleRedirectService.redirectByRole(userRole, false);
          },
          error: () => {
            this.loading = false;
          }
        });
      } else {
        // Cambio voluntario: contraseña actual + nueva (sin OTP, usuario autenticado)
        const { currentPassword, newPassword } = this.changePasswordForm.value;
        this.authService.changePasswordAuthenticated({ currentPassword, newPassword }).subscribe({
          next: () => {
            this.notificationService.showSuccess('Contraseña cambiada exitosamente');
            this.router.navigate(['/auth/profile']);
          },
          error: () => { this.loading = false; }
        });
      }
    }
  }
}
