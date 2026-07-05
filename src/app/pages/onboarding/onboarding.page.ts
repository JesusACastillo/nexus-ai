import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { PrimaryButtonComponent, SecondaryButtonComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-onboarding', standalone: true, imports: [IonContent, IonIcon, PrimaryButtonComponent, SecondaryButtonComponent], styleUrls: ['../pages.scss', './onboarding.page.scss'], template: `
<ion-content><div class="onboarding-wrap">
  <div class="visual"><div class="brain"><ion-icon name="sparkles"></ion-icon></div><span class="orbit o1"><ion-icon name="document-text"></ion-icon></span><span class="orbit o2"><ion-icon name="chatbubbles"></ion-icon></span><span class="orbit o3"><ion-icon name="flash"></ion-icon></span></div>
  <div class="copy"><span class="eyebrow">Todo en un solo lugar</span><h1>Organiza tu mente.<br><span class="gradient-text">Aprende mejor.</span></h1><p>Conecta documentos, tareas y conversaciones. Nexus AI convierte el caos en conocimiento útil.</p><div class="dots"><span class="active"></span><span></span><span></span></div></div>
  <div class="onboarding-actions"><app-primary-button routerLink="/register">Crear mi espacio</app-primary-button><app-secondary-button routerLink="/login">Ya tengo una cuenta</app-secondary-button></div>
</div></ion-content>` })
export class OnboardingPage {}
