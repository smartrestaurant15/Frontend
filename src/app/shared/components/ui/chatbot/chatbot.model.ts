export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatRequest {
  mensaje: string;
  sessionId: string;
}
