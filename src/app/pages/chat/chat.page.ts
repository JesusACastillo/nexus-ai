import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-chat', standalone: true, imports: [IonButton, IonContent, IonIcon, IonInput, AppHeaderComponent, BottomTabsComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="mode === 'document'" [backLink]="mode === 'document' ? '/library' : '/dashboard'"></app-header><ion-content class="nexus-content chat-content"><span class="eyebrow">{{ mode === 'document' ? 'Chat contextual' : 'Asistente personal' }}</span><h1 class="page-title">{{ mode === 'document' ? 'Chat con documento' : 'Nexus Chat' }}</h1><p class="page-subtitle">{{ mode === 'document' ? 'Las respuestas utilizan únicamente el contenido seleccionado.' : 'Piensa, estudia y construye con tu segundo cerebro.' }}</p>@if (mode === 'document') {<div class="document-context"><ion-icon name="document-text-outline"></ion-icon><div><strong>Documento seleccionado</strong><br>Conectado</div></div>}
<div style="padding: 2rem 1rem; text-align: center;">
  <ion-icon name="chatbubbles-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
  <p style="color: var(--nexus-muted-2);">Aún no hay mensajes en este chat.</p>
</div>
</ion-content><div class="fixed-composer with-tabs glass"><ion-input placeholder="Escribe tu pregunta..."></ion-input><ion-button aria-label="Enviar"><ion-icon name="arrow-up"></ion-icon></ion-button></div><app-bottom-tabs></app-bottom-tabs>` })
export class ChatPage { mode: 'general' | 'document'; messages: any[] = []; constructor(route: ActivatedRoute) { this.mode = route.snapshot.data['mode'] ?? 'general'; } }
