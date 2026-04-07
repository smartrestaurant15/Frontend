import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { ErrorResponse } from '../models/error-response.model';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Verificar si es una respuesta de 2FA (el backend devuelve is2faRequired en el error)
        if (error.error && error.error.is2faRequired) {
          // No mostrar error, el componente manejará el 2FA
          return throwError(() => error);
        }

        const errorMessage = this.extractErrorMessage(error);
        this.handleErrorByStatus(error.status, errorMessage);

        return throwError(() => error);
      })
    );
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    // Error de red o del cliente
    if (error.error instanceof ErrorEvent) {
      return 'Error de conexión. Verifique su conexión a internet.';
    }

    // Sin respuesta del servidor
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
    }

    // Intentar parsear el body si viene como string (responseType: 'text')
    let errorResponse: ErrorResponse | null = null;
    if (typeof error.error === 'string') {
      try {
        errorResponse = JSON.parse(error.error);
      } catch {
        // no es JSON, usar el string directamente si es legible
        if (!this.isTechnicalMessage(error.error)) {
          return error.error;
        }
        return this.getDefaultErrorMessage(error.status);
      }
    } else {
      errorResponse = error.error as ErrorResponse;
    }

    // Prioridad 1: mensaje amigable por errorCode del backend
    if (errorResponse?.errorCode) {
      const friendly = this.getFriendlyMessageByCode(errorResponse.errorCode, errorResponse.message);
      if (friendly) return friendly;
    }

    // Prioridad 2: mensaje del backend (solo si no es técnico)
    if (errorResponse?.message && !this.isTechnicalMessage(errorResponse.message)) {
      return errorResponse.message;
    }

    // Prioridad 3: mensaje genérico por código HTTP
    return this.getDefaultErrorMessage(error.status);
  }

  private getFriendlyMessageByCode(errorCode: string, backendMessage?: string): string | null {
    // Para EMAIL_ALREADY_EXISTS, si el backend envió un mensaje personalizado (caso social login),
    // usarlo directamente porque contiene información útil para el usuario.
    if (errorCode === 'EMAIL_ALREADY_EXISTS') {
      return backendMessage || 'Este correo electrónico ya está registrado.';
    }

    const messages: Record<string, string> = {
      'INVALID_CREDENTIALS':       'Correo o contraseña incorrectos.',
      'ACCOUNT_INACTIVE':          'Tu cuenta está inactiva. Contacta al administrador.',
      'ACCOUNT_PENDING':           'Tu cuenta aún no ha sido verificada. Revisa tu correo.',
      'ACCOUNT_LOCKED':            'Tu cuenta ha sido bloqueada por múltiples intentos fallidos.',
      'INVALID_OTP':               'El código ingresado es inválido o ha expirado.',
      'USER_NOT_FOUND':            'No encontramos una cuenta con ese correo electrónico.',
      'PASSWORD_POLICY_VIOLATION': 'La contraseña no cumple con los requisitos de seguridad.',
      'PASSWORD_REUSE':            'No puedes reutilizar una contraseña anterior.',
      'VALIDATION_ERROR':          backendMessage || 'Algunos campos tienen errores. Revisa el formulario.',
      'RUNTIME_ERROR':             backendMessage || 'Ha ocurrido un error al procesar la solicitud.',
      'INTERNAL_ERROR':            'Error interno del servidor. Intenta nuevamente más tarde.',
    };
    return messages[errorCode] ?? null;
  }

  private isTechnicalMessage(message: string): boolean {
    const technicalKeywords = [
      'could not execute statement',
      'duplicate key',
      'SQL',
      'Hibernate',
      'constraint',
      'violates unique',
      'insert into',
      'update ',
      'delete from',
      'NullPointerException',
      'StackTrace',
      'at com.',
      'at org.',
      'at java.',
    ];
    return technicalKeywords.some(k => message.toLowerCase().includes(k.toLowerCase()));
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Solicitud invalida. Por favor, revise que los datos ingresados sean correctos.';
      case 401:
        return 'Sesion expirada o credenciales incorrectas. Intente ingresar sus datos de nuevo.';
      case 403:
        return 'Lo sentimos, no tiene los permisos necesarios para realizar esta tarea.';
      case 404:
        return 'El recurso que busca no esta disponible actualmente.';
      case 409:
        return 'Existe un conflicto con los datos. Es posible que el registro ya exista.';
      case 422:
        return 'Los datos proporcionados no cumplen con el formato requerido.';
      case 429:
        return 'Ha realizado demasiadas solicitudes en poco tiempo. Espere un momento e intente de nuevo.';
      case 500:
        return 'Estamos experimentando problemas tecnicos en nuestro servidor. Trabajamos para solucionarlo.';
      case 502:
        return 'Error de comunicacion. El servidor tardo demasiado en responder.';
      case 503:
        return 'El servicio de SmartRestaurant se encuentra en mantenimiento. Vuelva pronto.';
      case 504:
        return 'Se agoto el tiempo de espera. Revise su conexion.';
      default:
        return 'Algo no salio como esperabamos. Por favor, intente la operacion nuevamente.';
    }
  }


  private handleErrorByStatus(status: number, message: string): void {
    // Mostrar notificación
    this.notificationService.showError(message);

    // Acciones específicas según el código de estado
    switch (status) {
      case 401:
        // Redirigir al login solo si no estamos ya en una ruta de autenticación
        if (!window.location.pathname.includes('/auth/')) {
          this.router.navigate(['/auth/login']);
        }
        break;
      case 403:
        // Opcional: redirigir a página de acceso denegado
        // this.router.navigate(['/access-denied']);
        break;
    }
  }
}
