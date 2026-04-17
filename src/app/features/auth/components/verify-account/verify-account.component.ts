import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-verify-account',
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.scss']
})
export class VerifyAccountComponent implements OnInit, OnDestroy {
  verifyForm!: FormGroup;
  loading = false;
  resending = false;
  cooldown = 0;
  private cooldownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.verifyForm.patchValue({ email: params['email'] });
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }

  initForm(): void {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.verifyForm.valid) {
      this.loading = true;
      const request = {
        email: this.verifyForm.value.email,
        code: this.verifyForm.value.otp
      };
      this.authService.verifyEmail(request).subscribe({
        next: (message) => {
          this.notificationService.showSuccess(message || 'Cuenta verificada exitosamente');
          this.router.navigate(['/auth/login']);
        },
        error: () => { this.loading = false; }
      });
    }
  }

  resendCode(): void {
    const email = this.verifyForm.value.email;
    if (!email || this.resending || this.cooldown > 0) return;

    this.resending = true;
    this.authService.resendVerification(email).subscribe({
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
