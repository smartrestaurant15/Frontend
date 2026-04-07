import { Component, OnInit } from '@angular/core';
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
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  emailFromRoute = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Leer email pasado desde forgot-password
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.emailFromRoute = params['email'];
        this.resetPasswordForm.patchValue({ email: params['email'] });
      }
    });
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

      const request = {
        email,
        otp: code,
        newPassword
      };

      this.authService.resetPassword(request).subscribe({
        next: () => {
          this.notificationService.showSuccess('Contraseña restablecida exitosamente');
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }
}
