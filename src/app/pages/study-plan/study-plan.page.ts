import { Component } from '@angular/core';
import { IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-study-plan', standalone: true, imports: [IonContent, IonFab, IonFabButton, IonIcon, AppHeaderComponent, BottomTabsComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/tasks"></app-header><ion-content class="nexus-content"><span class="eyebrow">Semana actual</span><h1 class="page-title">Plan de estudio</h1><p class="page-subtitle">Una ruta realista para avanzar sin saturarte.</p>
<div style="padding: 2rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin: 2rem 0;">
  <ion-icon name="calendar-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
  <p style="color: var(--nexus-muted-2);">El plan de estudio estará disponible próximamente.</p>
</div>
<ion-fab slot="fixed" vertical="bottom" horizontal="end"><ion-fab-button><ion-icon name="add"></ion-icon></ion-fab-button></ion-fab></ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class StudyPlanPage {}
