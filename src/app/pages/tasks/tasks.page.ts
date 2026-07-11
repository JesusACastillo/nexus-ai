import { Component } from '@angular/core';
import { IonContent, IonFab, IonFabButton, IonIcon, IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-tasks', standalone: true, imports: [IonContent, IonFab, IonFabButton, IonIcon, IonLabel, IonSegment, IonSegmentButton, AppHeaderComponent, BottomTabsComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header><ion-content class="nexus-content"><h1 class="page-title">Tareas</h1><p class="page-subtitle">Tu agenda de aprendizaje, en orden.</p><ion-segment value="today"><ion-segment-button value="today"><ion-label>Hoy</ion-label></ion-segment-button><ion-segment-button value="week"><ion-label>Semana</ion-label></ion-segment-button><ion-segment-button value="all"><ion-label>Todas</ion-label></ion-segment-button></ion-segment>
<div style="padding: 3rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-top: 2rem;">
  <ion-icon name="checkbox-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
  <p style="color: var(--nexus-muted-2); margin: 0;">Aún no hay tareas registradas.</p>
</div>
<ion-fab slot="fixed" vertical="bottom" horizontal="end"><ion-fab-button><ion-icon name="add"></ion-icon></ion-fab-button></ion-fab></ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class TasksPage { tasks: any[] = []; }
