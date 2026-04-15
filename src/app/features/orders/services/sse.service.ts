import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { StorageService } from '@core/services/storage.service';

export interface SseNotification {
  type: string;
  message: string;
  data: any;
}

/**
 * Servicio de notificaciones en tiempo real via Server-Sent Events.
 *
 * Usa fetch() en lugar de EventSource porque EventSource no permite
 * enviar cabeceras personalizadas (Authorization: Bearer ...).
 * Con fetch + ReadableStream podemos mantener la conexión abierta
 * y leer el stream de texto SSE con el token JWT incluido.
 */
@Injectable({
  providedIn: 'root'
})
export class SseService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private storageService: StorageService) {}

  private connect(endpoint: string): Observable<SseNotification> {
    return new Observable(observer => {
      const token = this.storageService.getToken();
      const controller = new AbortController();

      fetch(`${this.apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })
      .then(response => {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = (): void => {
          reader.read().then(({ done, value }) => {
            if (done) {
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const json = line.slice(5).trim();
                if (json) {
                  try {
                    observer.next(JSON.parse(json));
                  } catch { /* ignorar líneas no JSON */ }
                }
              }
            }

            read();
          }).catch(err => {
            if (err.name !== 'AbortError') observer.error(err);
          });
        };

        read();
      })
      .catch(err => {
        if (err.name !== 'AbortError') observer.error(err);
      });

      // Al desuscribirse del Observable se cierra la conexión SSE
      return () => controller.abort();
    });
  }

  /** Suscripción para la cocina — recibe NEW_ORDER */
  subscribeKitchen(): Observable<SseNotification> {
    return this.connect('/sse/kitchen');
  }

  /** Suscripción para meseros — recibe ORDER_READY */
  subscribeWaiter(): Observable<SseNotification> {
    return this.connect('/sse/waiter');
  }

  /** Suscripción para el cliente autenticado — recibe YOUR_ORDER_READY */
  subscribeCustomer(): Observable<SseNotification> {
    return this.connect('/sse/me');
  }
}
