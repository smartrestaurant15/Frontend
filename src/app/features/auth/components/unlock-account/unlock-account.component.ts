import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-unlock-account',
  templateUrl: './unlock-account.component.html',
  styleUrls: ['./unlock-account.component.scss']
})
export class UnlockAccountComponent implements OnInit, OnDestroy {
  unlockForm!: FormGroup;
  loading = false;
  cooldown = 0;
  resending = false;
  private cooldownTimer?: ReturnType<typeof setInterval>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const emailFromRoute = this.route.snapshot.queryParamMap.get('email') || '';
    this.unlockForm = this.fb.group({
      email: [emailFromRoute, [Validators.required, Validators.email]],
      code:  ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  onSubmit(): void {
    if (this.unlockForm.invalid || this.loading) return;
    this.loading = true;
    const { email, code } = this.unlockForm.value;
    this.authService.unlockAccount({ email, code }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Cuenta desbloqueada. Ya puedes iniciar sesión.');
        this.router.navigate(['/auth/login']);
      },
      error: () => { this.loading = false; }
    });
  }

  resendCode(): void {
    const email = this.unlockForm.get('email')?.value;
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
    this.cooldownTimer = setInterval(() => {
      this.cooldown--;
      if (this.cooldown <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldown = 0;
      }
    }, 1000);
  }
}
