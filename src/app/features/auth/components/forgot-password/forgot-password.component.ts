import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      const { email } = this.forgotPasswordForm.value;
      
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.notificationService.showSuccess('Código de recuperación enviado a tu correo');
          this.router.navigate(['/auth/reset-password'], {
            queryParams: { email }
          });
        },
        error: () => {
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}
