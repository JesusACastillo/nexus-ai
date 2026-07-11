import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-quiz-generator', standalone: true, imports: [IonContent, IonIcon, AppHeaderComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/library"></app-header><ion-content class="nexus-content"><span class="eyebrow">Generador inteligente</span><h1 class="page-title">Crear quiz</h1><p class="page-subtitle">Personaliza una evaluación a partir de tu contenido.</p>
<div style="padding: 2rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin: 2rem 0;">
  <ion-icon name="help-circle-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
  <p style="color: var(--nexus-muted-2);">El generador de quizzes estará disponible próximamente.</p>
</div>
</ion-content>` })
export class QuizGeneratorPage {}
