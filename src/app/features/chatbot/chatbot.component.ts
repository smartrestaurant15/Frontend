import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';

interface N8nResponse {
  text: string;
  intent?: string;
  dishes?: any[];
  ingredients?: string[];
  suggestions?: string[];
}

interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  loading?: boolean;
  dishes?: any[];
  ingredients?: string[];
  suggestions?: string[];
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements AfterViewChecked {

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen   = false;
  inputText = '';
  loading  = false;
  currentIntent: string = '';

  messages: ChatMessage[] = [
    {
      from: 'bot',
      text: '¡Hola! 👋 Soy el asistente de Smart Restaurant. ¿En qué te puedo ayudar?',
      suggestions: ['🔍 Buscar un plato', '📂 Ver por categoría', '🥗 Ingredientes de un plato']
    }
  ];

  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  private sessionId = crypto.randomUUID();
  private n8nUrl = 'https://chatbot-smartrestaurant.onrender.com/webhook/chat';
  private http: HttpClient;
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  selectSuggestion(suggestion: string): void {
    this.messages.push({ from: 'user', text: suggestion });
    this.callN8n(suggestion);
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) return;

    this.messages.push({ from: 'user', text });
    this.inputText = '';
    this.callN8n(text);
  }

  askIngredients(dish: any): void {
    const userText = `Ver ingredientes de "${dish.name}"`;
    this.messages.push({ from: 'user', text: userText });
    this.callN8n(userText);
  }

  private callN8n(userMessage: string): void {
    this.loading = true;
    const loadingMsg: ChatMessage = { from: 'bot', text: '', loading: true };
    this.messages.push(loadingMsg);

    this.conversationHistory.push({ role: 'user', content: userMessage });

    const body = {
      message: userMessage,
      history: this.conversationHistory,
      sessionId: this.sessionId
    };

    this.http.post<N8nResponse>(
      this.n8nUrl,
      body,
      { headers: this.headers }
    ).subscribe({
      next: (res) => {
        this.conversationHistory.push({ role: 'assistant', content: res.text });
        if (res.intent !== undefined) this.currentIntent = res.intent;
        const idx = this.messages.lastIndexOf(loadingMsg);
        if (idx !== -1) this.messages.splice(idx, 1);
        this.messages.push({
          from: 'bot',
          text: res.text,
          dishes: res.dishes,
          ingredients: res.ingredients,
          suggestions: res.suggestions
        });
        this.loading = false;
      },
      error: () => {
        const idx = this.messages.lastIndexOf(loadingMsg);
        if (idx !== -1) this.messages.splice(idx, 1);
        this.messages.push({
          from: 'bot',
          text: 'Ocurrió un error al conectar con el asistente. Intenta de nuevo.',
          suggestions: ['🔍 Buscar un plato', '📂 Ver por categoría', '🥗 Ingredientes de un plato']
        });
        this.loading = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
