import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CustomValidators } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  showPrivacyPolicy = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, CustomValidators.noWhitespace(), CustomValidators.onlyLetters()]],
      lastName: ['', [Validators.required, CustomValidators.noWhitespace(), CustomValidators.onlyLetters()]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), CustomValidators.passwordStrength()]],
      confirmPassword: ['', [Validators.required]],
      dataAuthorization: [false, [Validators.requiredTrue]]
    });

    // Validador para confirmar contraseña
    this.registerForm.get('confirmPassword')?.setValidators([
      Validators.required,
      CustomValidators.matchPassword('password')
    ]);
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      const { confirmPassword, ...registerData } = this.registerForm.value;

      this.authService.register(registerData).subscribe({
        next: (message) => {
          this.loading = false;
          this.notificationService.showSuccess(message || 'Registro exitoso. Por favor verifica tu correo.');
          this.registerForm.reset();
          this.router.navigate(['/auth/verify-account'], {
            queryParams: { email: registerData.email }
          });
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      this.notificationService.showWarning('Por favor complete todos los campos correctamente');
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  togglePrivacyPolicy(): void {
    this.showPrivacyPolicy = !this.showPrivacyPolicy;
  }

  getPasswordErrors(): string[] {
    const errors: string[] = [];
    const passwordControl = this.registerForm.get('password');

    if (passwordControl?.hasError('required')) {
      errors.push('La contraseña es requerida');
    }
    if (passwordControl?.hasError('minlength')) {
      errors.push('Mínimo 8 caracteres');
    }
    if (passwordControl?.hasError('passwordStrength')) {
      errors.push('Debe contener mayúsculas, minúsculas, números y caracteres especiales');
    }

    return errors;
  }

  getConfirmPasswordError(): string {
    const confirmControl = this.registerForm.get('confirmPassword');

    if (confirmControl?.hasError('required')) {
      return 'Confirme su contraseña';
    }
    if (confirmControl?.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}
