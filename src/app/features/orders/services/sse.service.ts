import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { StorageService } from '@core/services/storage.service';

export interface SseNotification {
  type: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class SseService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private storage: StorageService) {}

  subscribeKitchen(): Observable<SseNotification> {
    return this.connect('/sse/kitchen');
  }

  subscribeWaiter(): Observable<SseNotification> {
    return this.connect('/sse/waiter');
  }

  subscribeCustomer(): Observable<SseNotification> {
    return this.connect('/sse/customer');
  }

  private connect(path: string): Observable<SseNotification> {
    return new Observable(observer => {
      const token = this.storage.getToken();
      const url = `${this.baseUrl}${path}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      const source = new EventSource(url);

      source.onmessage = (event) => {
        try {
          observer.next(JSON.parse(event.data));
        } catch {
          observer.next({ type: event.data });
        }
      };

      source.onerror = () => {
        source.close();
        observer.error(new Error('SSE connection error'));
      };

      return () => source.close();
    });
  }
}
