import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ChatRequest } from './chatbot.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private sessionId: string;
  private chatbotUrl = environment.chatbotUrl;

  constructor(private http: HttpClient) {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  sendMessage(mensaje: string): Observable<any> {
    const body: ChatRequest = { mensaje, sessionId: this.sessionId };
    return this.http.post(this.chatbotUrl, body);
  }
}
