import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, IonInput, IonSpinner, AppHeaderComponent, BottomTabsComponent, FormsModule],
  styleUrls: ['../pages.scss'],
  template: `
<app-header [showBack]="mode === 'document'" [backLink]="mode === 'document' ? '/documents/' + documentId : '/dashboard'"></app-header>
<ion-content class="nexus-content chat-content" #content>
  <div style="padding-bottom: 80px;">
    <div style="text-align: center; margin-bottom: 2rem;">
      <span class="eyebrow">{{ mode === 'document' ? 'Chat contextual' : 'Asistente personal' }}</span>
      <h1 class="page-title" style="margin-top: 0.5rem;">{{ mode === 'document' ? 'Chat con documento' : 'Nexus Chat' }}</h1>
      <p class="page-subtitle" style="margin-top: 0.5rem;">{{ mode === 'document' ? 'Las respuestas utilizan únicamente el contenido seleccionado.' : 'Piensa, estudia y construye con tu segundo cerebro.' }}</p>
    </div>

    @if (mode === 'document') {
      <div class="document-context" style="margin: 0 1rem 2rem 1rem;">
        <ion-icon name="document-text-outline"></ion-icon>
        <div>
          <strong>Documento conectado</strong><br>
          Listo para responder preguntas
        </div>
      </div>
    }

    @if (loadingMessages) {
      <div style="padding: 3rem; display: flex; justify-content: center;">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    } @else if (messages.length === 0) {
      <div style="padding: 2rem 1rem; text-align: center;">
        <ion-icon name="chatbubbles-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
        <p style="color: var(--nexus-muted-2);">Aún no hay mensajes en este chat.</p>
      </div>
    } @else {
      <div style="padding: 0 1rem; display: flex; flex-direction: column; gap: 1rem;">
        @for (msg of messages; track $index) {
          <div [class]="msg.role === 'user' ? 'message user-message' : 'message assistant-message'" 
               style="max-width: 85%; padding: 1rem; border-radius: 16px; line-height: 1.5; font-size: 0.95rem; word-break: break-word;"
               [style.align-self]="msg.role === 'user' ? 'flex-end' : 'flex-start'"
               [style.background]="msg.role === 'user' ? 'var(--nexus-primary)' : 'var(--nexus-card-bg)'"
               [style.color]="msg.role === 'user' ? '#fff' : 'var(--nexus-text)'"
               [style.border]="msg.role === 'assistant' ? '1px solid var(--nexus-border)' : 'none'"
               [style.border-bottom-right-radius]="msg.role === 'user' ? '4px' : '16px'"
               [style.border-bottom-left-radius]="msg.role === 'assistant' ? '4px' : '16px'">
            <span style="white-space: pre-wrap;">{{ msg.content }}</span>
          </div>
        }
        @if (sendingMessage) {
          <div class="message assistant-message" style="align-self: flex-start; background: var(--nexus-card-bg); border: 1px solid var(--nexus-border); padding: 1rem; border-radius: 16px; border-bottom-left-radius: 4px; display: flex; align-items: center; gap: 0.5rem;">
            <ion-spinner name="dots" color="primary"></ion-spinner>
          </div>
        }
      </div>
    }
  </div>
</ion-content>

<div class="fixed-composer with-tabs glass" style="display: flex; gap: 0.5rem; padding: 1rem; align-items: center;">
  <ion-input 
    [(ngModel)]="newMessage" 
    (keyup.enter)="sendMessage()"
    [disabled]="sendingMessage || loadingMessages || (mode === 'document' && !documentId)"
    placeholder="Escribe tu pregunta..." 
    style="flex: 1; --background: var(--nexus-card-bg); --padding-start: 1rem; border-radius: 20px; border: 1px solid var(--nexus-border);">
  </ion-input>
  <ion-button 
    (click)="sendMessage()" 
    [disabled]="!newMessage.trim() || sendingMessage || loadingMessages" 
    shape="round" 
    style="--border-radius: 50%; width: 44px; height: 44px; margin: 0;">
    <ion-icon name="arrow-up" slot="icon-only"></ion-icon>
  </ion-button>
</div>
<app-bottom-tabs></app-bottom-tabs>
  `
})
export class ChatPage implements OnInit {
  @ViewChild('content') content!: IonContent;
  
  mode: 'general' | 'document';
  documentId: string | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  loadingMessages = false;
  sendingMessage = false;
  errorMsg = '';
  conversationId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private toastService: ToastService
  ) {
    this.mode = this.route.snapshot.data['mode'] ?? 'general';
    if (this.mode === 'document') {
      this.documentId = this.route.snapshot.paramMap.get('id');
    }
  }

  ngOnInit() {
    if (this.mode === 'document' && this.documentId) {
      this.loadConversation();
    } else if (this.mode === 'general') {
      this.loadConversation();
    }
  }

  async loadConversation() {
    this.loadingMessages = true;
    this.errorMsg = '';
    
    try {
      let conversation;
      if (this.mode === 'document') {
        conversation = await this.chatService.getLatestDocumentConversation(this.documentId!);
      } else {
        conversation = await this.chatService.getLatestGeneralConversation();
      }
      
      if (conversation) {
        this.conversationId = conversation.id;
        const msgs = await this.chatService.getConversationMessages(conversation.id);
        this.messages = msgs as ChatMessage[];
        this.scrollToBottom();
      } else {
        this.conversationId = null;
        this.messages = [];
      }
    } catch (e: any) {
      console.error('Error loading conversation', e);
      this.toastService.showError('Error al cargar el historial del chat');
    } finally {
      this.loadingMessages = false;
    }
  }

  async sendMessage() {
    const text = this.newMessage.trim();
    if (!text || this.sendingMessage) return;

    if (this.mode === 'document' && !this.documentId) {
      this.toastService.showError('No hay un documento seleccionado.');
      return;
    }

    this.errorMsg = '';
    this.sendingMessage = true;
    this.newMessage = '';

    // Add user message optimistically
    this.messages.push({ role: 'user', content: text });
    this.scrollToBottom();

    if (this.mode === 'document') {
      try {
        const response = await this.chatService.sendMessageToDocument(
          this.documentId!,
          text,
          this.conversationId
        );
        
        this.conversationId = response.conversation_id;
        
        this.messages.push({ role: 'assistant', content: response.answer });
      } catch (e: any) {
        console.error('Error sending message', e);
        this.toastService.showError('No se pudo enviar el mensaje: ' + (e.message || ''));
      } finally {
        this.sendingMessage = false;
        this.scrollToBottom();
      }
    } else if (this.mode === 'general') {
      try {
        const response = await this.chatService.sendMessageToGeneral(
          text,
          this.conversationId
        );
        
        this.conversationId = response.conversation_id;
        
        this.messages.push({ role: 'assistant', content: response.answer });
      } catch (e: any) {
        console.error('Error sending message', e);
        this.toastService.showError('No se pudo enviar el mensaje: ' + (e.message || ''));
      } finally {
        this.sendingMessage = false;
        this.scrollToBottom();
      }
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToBottom(300);
      }
    }, 100);
  }
}
