import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { ChatMessage } from './chatbot.model';
import { ChatbotService } from './chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  isMinimized = false;
  isLoading = false;
  inputText = '';
  messages: ChatMessage[] = [];

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.addBotMessage('¡Hola! Soy el asistente virtual del restaurante. ¿En qué puedo ayudarte hoy?');
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    if (this.isMinimized) {
      this.isMinimized = false;
    } else {
      this.isOpen = !this.isOpen;
    }
  }

  minimizeChat(): void {
    this.isMinimized = true;
  }

  closeChat(): void {
    this.isOpen = false;
    this.isMinimized = false;
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    this.addUserMessage(text);
    this.inputText = '';
    this.isLoading = true;

    this.chatbotService.sendMessage(text).subscribe({
      next: (response: any) => {
        const botText = response?.output || response?.message || response?.respuesta
          || response?.text || JSON.stringify(response);
        this.addBotMessage(botText);
        this.isLoading = false;
      },
      error: () => {
        this.addBotMessage('Lo siento, ocurrió un error al procesar tu mensaje. Intenta de nuevo.');
        this.isLoading = false;
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private addUserMessage(text: string): void {
    this.messages.push({ id: this.newId(), text, sender: 'user', timestamp: new Date() });
  }

  private addBotMessage(text: string): void {
    this.messages.push({ id: this.newId(), text, sender: 'bot', timestamp: new Date() });
  }

  private newId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
