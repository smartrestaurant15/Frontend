import { Injectable } from '@angular/core';
import { Observable, tap, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClientService } from '@core/services/http-client.service';
import { StorageService } from '@core/services/storage.service';
import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { VerifyRequest } from '../models/verify-request.model';
import { ResetPasswordRequest } from '../models/reset-password-request.model';
import { ChangePasswordRequest } from '../models/change-password-request.model';
import { SocialLoginRequest } from '../models/social-login-request.model';
import { User } from '../models/user.model';
import { RegisterEmployeeRequest } from '../models/register-employee-request.model';
import { SocialAuthService } from './social-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private httpClient: HttpClientService,
    private storageService: StorageService,
    private socialAuthService: SocialAuthService
  ) { }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTENTICACIÓN BÁSICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Login con email y contraseña
   * Puede requerir 2FA si está habilitado
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * Verificación 2FA después del login
   */
  verify2fa(request: VerifyRequest): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>('/auth/verify-2fa', request);
  }

  /**
   * Registro público (solo para CUSTOMER)
   */
  register(data: RegisterRequest): Observable<string> {
    return this.httpClient.post<string>('/auth/register', data, { responseType: 'text' as 'json' }).pipe(
      map(res => this.extractMessage(res))
    );
  }

  /**
   * Reenviar código de verificación de email
   */
  resendVerification(email: string): Observable<string> {
    return this.httpClient.post<string>('/auth/resend-verification', { email }, { responseType: 'text' as 'json' });
  }

  /**
   * Reenviar código 2FA para login
   */
  resend2FA(email: string): Observable<string> {
    return this.httpClient.post<string>('/auth/resend-2fa', { email }, { responseType: 'text' as 'json' });
  }

  /**
   * Verificación de email después del registro
   */
  verifyEmail(request: VerifyRequest): Observable<string> {
    return this.httpClient.post<string>('/auth/verify-email', request, { responseType: 'text' as 'json' }).pipe(
      map(res => this.extractMessage(res))
    );
  }

  /**
   * Cierre de sesión
   */
  logout(): Observable<string> {
    const refreshToken = this.storageService.getRefreshToken();

    // Cerrar sesión social si existe
    this.socialAuthService.signOut().subscribe();

    return this.httpClient.post<string>('/auth/logout', { refreshToken }, { responseType: 'text' as 'json' }).pipe(
      tap(() => {
        this.storageService.clearAll();
      }),
      catchError(() => {
        // Limpiar storage incluso si falla la petición
        this.storageService.clearAll();
        return of('Sesión cerrada localmente');
      })
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECUPERACIÓN DE CONTRASEÑA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Solicitar código de recuperación de contraseña
   */
  forgotPassword(email: string): Observable<string> {
    return this.httpClient.post<string>('/auth/forgot-password', { email }, { responseType: 'text' as 'json' });
  }

  /**
   * Restablecer contraseña con código OTP
   */
  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.httpClient.post<string>('/auth/reset-password', request, { responseType: 'text' as 'json' });
  }

  /**
   * Cambiar contraseña cuando el usuario está autenticado (sin OTP)
   */
  changePasswordAuthenticated(request: { currentPassword: string; newPassword: string }): Observable<string> {
    return this.httpClient.post<string>('/auth/change-password-authenticated', request, { responseType: 'text' as 'json' });
  }

  /**
   * Solicitar cambio de contraseña voluntario (envía OTP)
   */
  requestPasswordChange(email: string): Observable<string> {
    return this.httpClient.post<string>('/auth/request-password-change', { email }, { responseType: 'text' as 'json' });
  }

  /**
   * Cambiar contraseña (requiere contraseña actual y OTP)
   */
  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.httpClient.post<string>('/auth/change-password', request, { responseType: 'text' as 'json' });
  }

  /**
   * Cambiar contraseña en primer login (sin OTP ni contraseña actual)
   * Mantiene la sesión activa devolviendo nuevos tokens JWT
   */
  changePasswordFirstLogin(request: { email: string; newPassword: string; confirmPassword: string }): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>('/auth/change-password-first-login', request);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE TOKENS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Refrescar access token usando refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storageService.getRefreshToken();
    return this.httpClient.post<AuthResponse>('/auth/refresh-token', { refreshToken }).pipe(
      tap(response => {
        this.storageService.setToken(response.accessToken);
        if (response.refreshToken) {
          this.storageService.setRefreshToken(response.refreshToken);
        }
      })
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESBLOQUEO DE CUENTA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Desbloquear cuenta con código OTP
   */
  unlockAccount(request: VerifyRequest): Observable<string> {
    return this.httpClient.post<string>('/auth/unlock-account', request, { responseType: 'text' as 'json' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL LOGIN (PENDIENTE DE IMPLEMENTACIÓN EN BACKEND)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Login/Registro con proveedor social (Google, Facebook, GitHub)
   * NOTA: Este endpoint debe ser implementado en el backend
   */
  socialLogin(request: SocialLoginRequest): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>('/auth/social-login', request).pipe(
      tap(response => this.handleSuccessfulAuth(response))
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRO DE EMPLEADOS (SOLO ADMIN)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registro de empleados por administrador
   * Requiere rol ADMIN
   */
  registerEmployee(data: RegisterEmployeeRequest): Observable<string> {
    return this.httpClient.post<string>('/admin/register-employee', data, { responseType: 'text' as 'json' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OBTENER INFORMACIÓN DEL USUARIO ACTUAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Actualiza el perfil del usuario autenticado
   */
  updateProfile(data: { firstName: string; lastName: string }): Observable<any> {
    return this.httpClient.put<any>('/auth/profile', data);
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser(): Observable<any> {
    return this.httpClient.get('/auth/me');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.storageService.getToken();
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getUserRole(): string {
    return this.storageService.getUserRole();
  }

  /**
   * Maneja la autenticación exitosa guardando tokens
   */
  private handleSuccessfulAuth(response: AuthResponse): void {
    this.storageService.setToken(response.accessToken);
    this.storageService.setRefreshToken(response.refreshToken);

    // Guardar flags importantes
    if (response.requiresPasswordChange) {
      this.storageService.setItem('requiresPasswordChange', 'true');
    }
  }

  /**
   * Extrae el campo 'message' si la respuesta es un JSON, o devuelve el string tal cual.
   */
  private extractMessage(raw: string): string {
    if (!raw) return raw;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.message ?? raw;
    } catch {
      return raw;
    }
  }
}

