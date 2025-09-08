import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatbotService, ChatMessage } from '../services/chatbot.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // Estado del componente
  messages: ChatMessage[] = [];
  userInput = '';
  isOpen = false;
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  // Control de destrucción del componente
  private destroy$ = new Subject<void>();
  
  // Estado de scroll
  private shouldScrollToBottom = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.initializeChat();
    this.subscribeToLoadingState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Inicializa el chat con mensaje de bienvenida
   */
  private initializeChat(): void {
    this.messages = [
      {
        text: '¡Hola! Soy el asistente virtual de PACA 🌱. Te puedo ayudar con consultas sobre nuestros productos agroecológicos, stock disponible, procesos de la cooperativa y preguntas frecuentes. ¿En qué puedo ayudarte?',
        isUser: false,
        timestamp: new Date(),
        id: this.generateMessageId()
      }
    ];
  }

  /**
   * Se suscribe al estado de loading del servicio
   */
  private subscribeToLoadingState(): void {
    this.chatbotService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  /**
   * Abre/cierra el widget del chat
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.hasError = false;
    
    if (this.isOpen) {
      // Dar tiempo para que se renderice antes de hacer focus
      setTimeout(() => {
        if (this.messageInput?.nativeElement) {
          this.messageInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  /**
   * Envía un mensaje al chatbot
   */
  async sendMessage(): Promise<void> {
    if (this.isLoading) return;

    // Validar mensaje
    const validation = this.chatbotService.validateMessage(this.userInput);
    if (!validation.isValid) {
      this.showError(validation.error || 'Mensaje inválido');
      return;
    }

    const userMessage = this.userInput.trim();
    this.userInput = '';
    this.hasError = false;

    // Agregar mensaje del usuario
    this.addMessage({
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
      id: this.generateMessageId()
    });

    // Preparar historial de conversación
    const conversationHistory = this.chatbotService.prepareConversationHistory(this.messages);

    try {
      // Enviar mensaje al servicio
      this.chatbotService.sendMessage(userMessage, conversationHistory)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.addMessage({
              text: response.response,
              isUser: false,
              timestamp: new Date(response.timestamp),
              id: response.conversationId || this.generateMessageId()
            });
            this.chatbotService.finishLoading();
          },
          error: (error) => {
            this.addMessage({
              text: error.message || 'Lo siento, hubo un error. Por favor intenta nuevamente.',
              isUser: false,
              timestamp: new Date(),
              id: this.generateMessageId()
            });
            this.showError('Error de conexión');
            this.chatbotService.finishLoading();
          }
        });

    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Error inesperado');
      this.chatbotService.finishLoading();
    }
  }

  /**
   * Maneja el evento de presionar Enter
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Limpia el chat
   */
  clearChat(): void {
    this.messages = [];
    this.initializeChat();
    this.hasError = false;
  }

  /**
   * Agrega un mensaje a la conversación
   */
  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.shouldScrollToBottom = true;
  }

  /**
   * Muestra un error temporalmente
   */
  private showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    
    // Ocultar error después de 5 segundos
    setTimeout(() => {
      this.hasError = false;
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * Hace scroll hacia abajo en el contenedor de mensajes
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }

  /**
   * Genera un ID único para mensajes
   */
  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Formatea la hora del mensaje
   */
  formatTime(timestamp: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  }

  /**
   * Sugiere preguntas frecuentes cuando el chat está vacío
   */
  getSuggestedQuestions(): Array<{text: string, icon: string}> {
    return [
      { text: '¿Qué es PACA?', icon: 'info' },
      { text: '¿Qué productos ofrecen?', icon: 'eco' },
      { text: '¿Cómo hago un pedido?', icon: 'shopping_cart' },
      { text: '¿Cuánto stock tienen disponible?', icon: 'inventory' },
      { text: '¿Los productos son orgánicos?', icon: 'verified' },
      { text: '¿Hacen envíos?', icon: 'local_shipping' },
    ];
  }

  /**
   * Envía una pregunta sugerida
   */
  sendSuggestedQuestion(question: string): void {
    this.userInput = question;
    this.sendMessage();
  }

  /**
   * TrackBy function para optimizar el ngFor de mensajes
   */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id || `message-${index}`;
  }

  /**
   * Formatea el contenido del mensaje para mejor visualización de respuestas de stock
   */
  formatMessageContent(content: string): string {
    if (!content) return '';
    
    // Escapar HTML peligroso pero mantener ciertos caracteres
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    // Convertir saltos de línea a <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Formatear emojis y elementos especiales para stock
    formatted = formatted
      // Hacer emojis más visibles
      .replace(/(📦|🔢|✅|⚠️|❌|📋|💡)/g, '<span class="emoji">$1</span>')
      // Resaltar texto en negritas con **texto**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convertir listas numeradas simples
      .replace(/^(\d+\.\s)/gm, '<span class="list-number">$1</span>')
      // Resaltar cantidades de stock
      .replace(/(\d+)\s+(unidades?)/gi, '<span class="stock-quantity">$1 $2</span>');
    
    return formatted;
  }
}
