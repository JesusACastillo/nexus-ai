import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { DOCUMENTS, SUBJECTS, TASKS } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, TaskCardComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-subject-detail', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, TaskCardComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/workspaces"></app-header><ion-content class="nexus-content"><span class="eyebrow">Universidad / IA-402</span><h1 class="page-title">Inteligencia Artificial</h1><p class="page-subtitle">Aprendizaje automático, redes neuronales y sistemas inteligentes.</p>
<div class="metric-grid"><div class="metric"><ion-icon name="documents-outline"></ion-icon><strong>12</strong><span>Documentos</span></div><div class="metric"><ion-icon name="trending-up-outline"></ion-icon><strong>72%</strong><span>Progreso</span></div></div>
<div class="section-heading"><h2>Herramientas</h2></div><div class="two-col"><a class="action-tile nexus-card" routerLink="/chat/document"><ion-icon name="chatbubbles-outline"></ion-icon><h3>Preguntar a Nexus</h3><p>Consulta todos tus documentos.</p></a><a class="action-tile nexus-card" routerLink="/study-plan"><ion-icon name="calendar-outline"></ion-icon><h3>Plan de estudio</h3><p>Organiza tus próximas sesiones.</p></a></div>
<div class="section-heading"><h2>Documentos recientes</h2><a routerLink="/library">Ver todos</a></div>@for (document of documents.slice(0,2); track document.id) {<app-document-card [document]="document"></app-document-card>}
<div class="section-heading"><h2>Actividad reciente</h2></div>@for (task of tasks.slice(0,2); track task.id) {<app-task-card [task]="task"></app-task-card>}
</ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class SubjectDetailPage { subjects = SUBJECTS; documents = DOCUMENTS; tasks = TASKS; }
