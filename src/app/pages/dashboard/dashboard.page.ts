import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SUBJECTS, TASKS } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, SubjectCardComponent, TaskCardComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-dashboard', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, SubjectCardComponent, TaskCardComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header><ion-content class="nexus-content"><div class="content-pad"><p class="eyebrow">Domingo, 5 de julio</p><h1 class="page-title">Hola, Jesús 👋</h1><p class="page-subtitle">¿Qué quieres aprender hoy?</p>
  <section class="hero-panel"><span class="eyebrow">Impulsado por Nexus</span><h2>Tu semana en foco</h2><p>Tienes 3 tareas pendientes y una sesión de estudio recomendada.</p></section>
  <div class="metric-grid"><div class="metric"><ion-icon name="flame-outline"></ion-icon><strong>7 días</strong><span>Racha de estudio</span></div><div class="metric"><ion-icon name="time-outline"></ion-icon><strong>12.5 h</strong><span>Esta semana</span></div></div>
  <div class="section-heading"><h2>Acciones rápidas</h2></div><div class="quick-grid"><a class="quick-action" routerLink="/upload"><ion-icon name="cloud-upload-outline"></ion-icon>Subir</a><a class="quick-action" routerLink="/chat"><ion-icon name="sparkles-outline"></ion-icon>Chat IA</a><a class="quick-action" routerLink="/quiz-generator"><ion-icon name="help-circle-outline"></ion-icon>Quiz</a><a class="quick-action" routerLink="/flashcards"><ion-icon name="albums-outline"></ion-icon>Tarjetas</a></div>
  <div class="section-heading"><h2>Materias activas</h2><a routerLink="/workspaces">Ver todas</a></div>@for (subject of subjects.slice(0, 2); track subject.id) {<app-subject-card [subject]="subject"></app-subject-card>}
  <div class="section-heading"><h2>Próximas tareas</h2><a routerLink="/tasks">Agenda</a></div>@for (task of tasks.slice(0, 2); track task.id) {<app-task-card [task]="task"></app-task-card>}
</div></ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class DashboardPage { subjects = SUBJECTS; tasks = TASKS; }
