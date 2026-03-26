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
      return `Error de conexion: ${error.error.message}`;
    }

    // Sin respuesta del servidor (timeout, red caida, etc.)
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique su conexion a internet.';
    }

    // Intentar extraer el mensaje del backend
    const errorResponse = error.error as ErrorResponse;
    let message = '';

    // Prioridad 1: mensaje del backend
    if (errorResponse?.message) {
      message = errorResponse.message;
      // Si hay detalles adicionales, agregarlos
      if (errorResponse.details && errorResponse.details.length > 0) {
        message = `${message}: ${errorResponse.details.join(', ')}`;
      }
    }
    // Prioridad 2: error como string directo
    else if (typeof error.error === 'string') {
      message = error.error;
    }
    // Prioridad 3: mensaje generico segun codigo HTTP
    else {
      message = this.getDefaultErrorMessage(error.status);
    }

    return this.sanitizeErrorMessage(message);
  }

  private sanitizeErrorMessage(message: string): string {
    if (!message) return message;

    const technicalKeywords = [
      'could not execute statement',
      'ERROR:',
      'duplicate key',
      'SQL',
      'Hibernate',
      'constraint',
      'violates unique',
      'insert into',
      'update ',
      'delete from'
    ];

    const isTechnical = technicalKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isTechnical) {
      return 'Ha ocurrido un error al procesar la solicitud. Por favor, intente nuevamente.';
    }

    return message;
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
