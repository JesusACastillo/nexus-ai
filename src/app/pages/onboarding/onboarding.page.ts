import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { PrimaryButtonComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-onboarding', standalone: true, imports: [IonContent, IonIcon, RouterLink, PrimaryButtonComponent], styleUrls: ['../pages.scss', './onboarding.page.scss'], template: `
<ion-content>
  <div class="onboarding-wrap">
    <a class="skip-btn" routerLink="/login">Omitir</a>

    <!-- Step indicator -->
    <div class="step-indicator">
      <span [class.active]="step === 1"></span>
      <span [class.active]="step === 2"></span>
      <span [class.active]="step === 3"></span>
    </div>

    <!-- Step visual -->
    <div class="onboarding-visual">
      @if (step === 1) {
        <div class="brain-img"></div>
      } @else if (step === 2) {
        <div class="chat-mock">
          <div class="mock-msg user">¿Cuáles son los puntos clave del informe trimestral?</div>
          <div class="mock-msg ai">el documento dice… los puntos clave son: un aumento de la retención de usuarios y un éxito en la región</div>
        </div>
      } @else {
        <div class="study-mock">
          <div class="mock-card"><ion-icon name="document-text-outline"></ion-icon></div>
          <div class="mock-card accent"><ion-icon name="help-circle-outline"></ion-icon></div>
          <div class="mock-card"><ion-icon name="albums-outline"></ion-icon></div>
        </div>
      }
    </div>

    <!-- Step copy -->
    <div class="onboarding-copy">
      @if (step === 1) {
        <h1>Organiza todo tu conocimiento</h1>
        <p>Guarda materias, proyectos, PDFs, apuntes y recursos en un solo lugar.</p>
      } @else if (step === 2) {
        <h1>Pregunta sobre tus propios archivos</h1>
        <p>Conversa con tus PDFs, apuntes y proyectos como si tuvieras un tutor personal siempre disponible.</p>
      } @else {
        <h1>Estudia con inteligencia artificial</h1>
        <p>Genera resúmenes, quizzes y flashcards automáticamente.</p>
      }
    </div>

    <!-- CTA -->
    <div class="onboarding-actions">
      @if (step < 3) {
        <button class="next-btn" (click)="next()">Siguiente →</button>
      } @else {
        <app-primary-button routerLink="/register">Comenzar →</app-primary-button>
      }
    </div>
  </div>
</ion-content>` })
export class OnboardingPage {
  step = 1;
  next() { if (this.step < 3) this.step++; }
}
