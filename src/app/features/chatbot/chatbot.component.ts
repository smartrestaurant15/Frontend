import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';

type Intent = 'none' | 'awaiting_search' | 'awaiting_category' | 'awaiting_ingredients';

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
  currentIntent: Intent = 'none';

  messages: ChatMessage[] = [
    {
      from: 'bot',
      text: '¡Hola! 👋 Soy el asistente de Smart Restaurant. ¿En qué te puedo ayudar?',
      suggestions: ['🔍 Buscar un plato', '📂 Ver por categoría', '🥗 Ingredientes de un plato']
    }
  ];

  private apiUrl = environment.apiUrl;
  private http: HttpClient;

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
    const text = suggestion.replace(/^[^\s]+\s/, ''); // quita el emoji
    this.messages.push({ from: 'user', text: suggestion });

    if (suggestion.includes('Buscar')) {
      this.currentIntent = 'awaiting_search';
      this.addBotMessage('¿Qué plato estás buscando? Escribe el nombre o una palabra clave (ej: "pollo", "vegetariano", "pasta").');
    } else if (suggestion.includes('categor')) {
      this.currentIntent = 'awaiting_category';
      this.addBotMessage('¿De qué categoría quieres ver platos? Escribe el nombre (ej: "Ensaladas", "Carnes", "Postres").');
    } else if (suggestion.includes('Ingredientes') || suggestion.includes('ingrediente')) {
      this.currentIntent = 'awaiting_ingredients';
      this.addBotMessage('¿De qué plato quieres ver los ingredientes? Escribe su nombre.');
    }
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) return;

    this.messages.push({ from: 'user', text });
    this.inputText = '';
    this.loading = true;

    const loadingMsg: ChatMessage = { from: 'bot', text: '', loading: true };
    this.messages.push(loadingMsg);

    this.handleIntent(text).then(reply => {
      const idx = this.messages.lastIndexOf(loadingMsg);
      if (idx !== -1) this.messages.splice(idx, 1);
      this.messages.push(reply);
      this.loading = false;
    });
  }

  askIngredients(dish: any): void {
    this.messages.push({ from: 'user', text: `Ver ingredientes de "${dish.name}"` });
    const loadingMsg: ChatMessage = { from: 'bot', text: '', loading: true };
    this.messages.push(loadingMsg);
    this.loading = true;

    this.http.get<any>(`${this.apiUrl}/chatbot/dishes/${dish.id}/ingredients`).subscribe({
      next: (res) => {
        const idx = this.messages.lastIndexOf(loadingMsg);
        if (idx !== -1) this.messages.splice(idx, 1);
        const ings: string[] = (res.ingredients ?? []).map((i: any) => i.product_name ?? i.name ?? i);
        this.messages.push({
          from: 'bot',
          text: ings.length > 0 ? `Ingredientes de ${dish.name}:` : `${dish.name} no tiene ingredientes registrados.`,
          ingredients: ings,
          suggestions: ['🔍 Buscar otro plato', '📂 Ver por categoría']
        });
        this.loading = false;
      },
      error: () => {
        const idx = this.messages.lastIndexOf(loadingMsg);
        if (idx !== -1) this.messages.splice(idx, 1);
        this.messages.push({ from: 'bot', text: 'No pude obtener los ingredientes. Intenta de nuevo.', suggestions: ['🔍 Buscar un plato'] });
        this.loading = false;
      }
    });
  }

  private async handleIntent(text: string): Promise<ChatMessage> {
    switch (this.currentIntent) {

      case 'awaiting_search':
        this.currentIntent = 'none';
        return this.searchDishes(text);

      case 'awaiting_category':
        this.currentIntent = 'none';
        return this.searchByCategory(text);

      case 'awaiting_ingredients':
        this.currentIntent = 'none';
        return this.searchDishForIngredients(text);

      default:
        // Sin contexto previo: búsqueda general
        return this.searchDishes(text);
    }
  }

  private async searchDishes(query: string): Promise<ChatMessage> {
    try {
      const params = new HttpParams().set('q', query);
      const dishes = await this.http.get<any[]>(`${this.apiUrl}/chatbot/dishes/search`, { params }).toPromise();
      if (dishes && dishes.length > 0) {
        return {
          from: 'bot',
          text: `Encontré ${dishes.length} plato(s) para "${query}":`,
          dishes,
          suggestions: ['📂 Ver por categoría', '🥗 Ingredientes de un plato']
        };
      }
      return {
        from: 'bot',
        text: `No encontré platos con "${query}". Intenta con otro término.`,
        suggestions: ['🔍 Buscar otro plato', '📂 Ver por categoría']
      };
    } catch {
      return { from: 'bot', text: 'Error al buscar. Intenta de nuevo.', suggestions: ['🔍 Buscar un plato'] };
    }
  }

  private async searchByCategory(category: string): Promise<ChatMessage> {
    try {
      const dishes = await this.http.get<any[]>(
        `${this.apiUrl}/chatbot/categories/${encodeURIComponent(category)}/dishes`
      ).toPromise();
      if (dishes && dishes.length > 0) {
        return {
          from: 'bot',
          text: `${dishes.length} plato(s) en la categoría "${category}":`,
          dishes,
          suggestions: ['📂 Ver otra categoría', '🥗 Ingredientes de un plato']
        };
      }
      return {
        from: 'bot',
        text: `No encontré platos en la categoría "${category}". Verifica el nombre.`,
        suggestions: ['📂 Ver por categoría', '🔍 Buscar un plato']
      };
    } catch {
      return { from: 'bot', text: 'Error al buscar por categoría. Intenta de nuevo.', suggestions: ['📂 Ver por categoría'] };
    }
  }

  private async searchDishForIngredients(dishName: string): Promise<ChatMessage> {
    try {
      const params = new HttpParams().set('q', dishName);
      const dishes = await this.http.get<any[]>(`${this.apiUrl}/chatbot/dishes/search`, { params }).toPromise();
      if (!dishes || dishes.length === 0) {
        return {
          from: 'bot',
          text: `No encontré el plato "${dishName}". Intenta con otro nombre.`,
          suggestions: ['🥗 Buscar otro plato', '🔍 Buscar un plato']
        };
      }
      const dish = dishes[0];
      const detail = await this.http.get<any>(`${this.apiUrl}/chatbot/dishes/${dish.id}/ingredients`).toPromise();
      const ings: string[] = (detail?.ingredients ?? []).map((i: any) => i.product_name ?? i.name ?? i);
      return {
        from: 'bot',
        text: ings.length > 0 ? `Ingredientes de ${dish.name}:` : `${dish.name} no tiene ingredientes registrados.`,
        ingredients: ings,
        suggestions: ['🔍 Buscar otro plato', '📂 Ver por categoría']
      };
    } catch {
      return { from: 'bot', text: 'Error al obtener ingredientes. Intenta de nuevo.', suggestions: ['🥗 Ingredientes de un plato'] };
    }
  }

  private addBotMessage(text: string): void {
    this.messages.push({ from: 'bot', text });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
