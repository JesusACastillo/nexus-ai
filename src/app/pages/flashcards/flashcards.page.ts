import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-flashcards', standalone: true, imports: [IonContent, IonIcon, AppHeaderComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/library"></app-header><ion-content class="nexus-content"><span class="eyebrow">Documento seleccionado</span><h1 class="page-title">Flashcards</h1>
<div style="padding: 2rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin: 2rem 0;">
  <ion-icon name="albums-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
  <p style="color: var(--nexus-muted-2);">Las flashcards estarán disponibles próximamente.</p>
</div>
</ion-content>` })
export class FlashcardsPage {}
