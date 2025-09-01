import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  id?: string;
}

export interface ChatbotResponse {
  response: string;
  timestamp: string;
  conversationId?: string;
}

export interface ChatbotStatus {
  status: string;
  message: string;
  timestamp: string;
  version?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly apiUrl = `${environment.apiUrl}api/chatbot`;
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos
  
  // Subject para manejar el estado del chat
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Envía un mensaje al chatbot
   */
  sendMessage(message: string, conversationHistory?: string[]): Observable<ChatbotResponse> {
    this.isLoadingSubject.next(true);
    
    const payload = {
      message: message.trim(),
      conversationHistory: conversationHistory || []
    };

    return this.http.post<ChatbotResponse>(`${this.apiUrl}/message`, payload)
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError),
        // Finalizar loading state
        catchError(error => {
          this.isLoadingSubject.next(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Verifica el estado del servicio de chatbot
   */
  getStatus(): Observable<ChatbotStatus> {
    return this.http.get<ChatbotStatus>(`${this.apiUrl}/status`)
      .pipe(
        timeout(5000),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene información sobre el chatbot
   */
  getInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/info`)
      .pipe(
        timeout(5000),
        catchError(this.handleError)
      );
  }

  /**
   * Finaliza el estado de loading
   */
  finishLoading(): void {
    this.isLoadingSubject.next(false);
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Lo siento, estoy teniendo problemas técnicos. Por favor, intenta nuevamente.';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      console.error('Client error:', error.error.message);
      errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
    } else {
      // Error del lado del servidor
      console.error(`Server error: ${error.status}, body:`, error.error);
      
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Por favor, intenta más tarde.';
          break;
        case 400:
          errorMessage = error.error?.error || 'Solicitud inválida. Por favor, revisa tu mensaje.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intenta nuevamente.';
          break;
        case 504:
          errorMessage = 'El servidor está tardando en responder. Por favor, intenta nuevamente.';
          break;
        default:
          errorMessage = error.error?.response || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  };

  /**
   * Valida un mensaje antes de enviarlo
   */
  validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Por favor, escribe un mensaje.' };
    }

    if (message.length > 500) {
      return { isValid: false, error: 'El mensaje es muy largo. Por favor, sé más conciso.' };
    }

    return { isValid: true };
  }

  /**
   * Prepara el historial de conversación para enviar al backend
   */
  prepareConversationHistory(messages: ChatMessage[]): string[] {
    return messages
      .slice(-6) // Últimas 6 interacciones
      .map(msg => `${msg.isUser ? 'Usuario' : 'Asistente'}: ${msg.text}`);
  }
}
