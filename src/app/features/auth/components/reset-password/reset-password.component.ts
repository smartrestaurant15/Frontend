import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CustomValidators } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm!: FormGroup;
  loading = false;
  emailFromRoute = '';
<<<<<<< HEAD
=======
  showPassword = false;
  showConfirmPassword = false;
  resending = false;
  cooldown = 0;
  private cooldownInterval: any;
>>>>>>> johanc

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
<<<<<<< HEAD

    // Leer email pasado desde forgot-password
=======
>>>>>>> johanc
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.emailFromRoute = params['email'];
        this.resetPasswordForm.patchValue({ email: params['email'] });
      }
    });
<<<<<<< HEAD
=======
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
>>>>>>> johanc
  }

  initForm(): void {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, CustomValidators.passwordStrength()]],
      confirmPassword: ['', [Validators.required]]
    });
    this.resetPasswordForm.get('confirmPassword')?.setValidators([
      Validators.required,
      CustomValidators.matchPassword('newPassword')
    ]);
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.loading = true;
      const { email, code, newPassword } = this.resetPasswordForm.value;
<<<<<<< HEAD

      const request = {
        email,
        otp: code,
        newPassword
      };

      this.authService.resetPassword(request).subscribe({
=======
      this.authService.resetPassword({ email, otp: code, newPassword }).subscribe({
>>>>>>> johanc
        next: () => {
          this.notificationService.showSuccess('Contraseña restablecida exitosamente');
          this.router.navigate(['/auth/login']);
        },
        error: () => { this.loading = false; }
      });
    }
  }

  resendCode(): void {
    const email = this.resetPasswordForm.value.email;
    if (!email || this.resending || this.cooldown > 0) return;
    this.resending = true;
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.notificationService.showSuccess('Código reenviado a tu correo');
        this.resending = false;
        this.startCooldown();
      },
      error: () => { this.resending = false; }
    });
  }

  private startCooldown(): void {
    this.cooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.cooldown--;
      if (this.cooldown <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }
}
