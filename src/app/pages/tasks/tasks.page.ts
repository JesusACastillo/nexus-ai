import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonFab, IonFabButton, IonIcon, IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { TASKS } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, TaskCardComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-tasks', standalone: true, imports: [IonContent, IonFab, IonFabButton, IonIcon, IonLabel, IonSegment, IonSegmentButton, RouterLink, AppHeaderComponent, BottomTabsComponent, TaskCardComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header><ion-content class="nexus-content"><h1 class="page-title">Tareas</h1><p class="page-subtitle">Tu agenda de aprendizaje, en orden.</p><ion-segment value="today"><ion-segment-button value="today"><ion-label>Hoy</ion-label></ion-segment-button><ion-segment-button value="week"><ion-label>Semana</ion-label></ion-segment-button><ion-segment-button value="all"><ion-label>Todas</ion-label></ion-segment-button></ion-segment><div class="section-heading"><h2>Domingo, 5 de julio</h2><a routerLink="/study-plan">Plan de estudio</a></div>@for (task of tasks; track task.id) {<app-task-card [task]="task"></app-task-card>}<ion-fab slot="fixed" vertical="bottom" horizontal="end"><ion-fab-button><ion-icon name="add"></ion-icon></ion-fab-button></ion-fab></ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class TasksPage { tasks = TASKS; }
