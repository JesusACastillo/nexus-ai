import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { DOCUMENTS, TASKS } from '../../core/data/mock-data';
import { 
  AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, 
  TaskCardComponent 
} from '../../shared/components/ui-kit.components';
import { SubjectDB, SubjectsService } from '../../core/services/subjects.service';
import { Workspace } from '../../core/models/ui.models';
import { WorkspacesService } from '../../core/services/workspaces.service';

@Component({ 
  selector: 'app-subject-detail', 
  standalone: true, 
  imports: [
    IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, 
    DocumentCardComponent, TaskCardComponent, IonSpinner
  ], 
  styleUrls: ['../pages.scss'], 
  template: `
<app-header [showBack]="true" [backLink]="backLink"></app-header>
<ion-content class="nexus-content">
  @if (loading) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (subject) {
    <span class="eyebrow">{{ workspace?.title || 'Espacio' }} / {{ subject.description || subject.name }}</span>
    <h1 class="page-title">{{ subject.name }}</h1>
    <p class="page-subtitle">Explora tus documentos y tareas de esta materia.</p>
    
    <div class="metric-grid">
      <div class="metric"><ion-icon name="documents-outline"></ion-icon><strong>12</strong><span>Documentos</span></div>
      <div class="metric"><ion-icon name="trending-up-outline"></ion-icon><strong>72%</strong><span>Progreso</span></div>
    </div>
    
    <div class="section-heading"><h2>Herramientas</h2></div>
    <div class="two-col">
      <a class="action-tile nexus-card" routerLink="/chat/document">
        <ion-icon name="chatbubbles-outline"></ion-icon>
        <h3>Preguntar a Nexus</h3>
        <p>Consulta todos tus documentos.</p>
      </a>
      <a class="action-tile nexus-card" routerLink="/study-plan">
        <ion-icon name="calendar-outline"></ion-icon>
        <h3>Plan de estudio</h3>
        <p>Organiza tus próximas sesiones.</p>
      </a>
    </div>
    
    <div class="section-heading"><h2>Documentos recientes</h2><a routerLink="/library">Ver todos</a></div>
    @for (document of documents.slice(0,2); track document.id) {
      <app-document-card [document]="document"></app-document-card>
    }
    
    <div class="section-heading"><h2>Actividad reciente</h2></div>
    @for (task of tasks.slice(0,2); track task.id) {
      <app-task-card [task]="task"></app-task-card>
    }
  } @else {
    <div style="padding: 2rem; text-align: center; color: var(--nexus-muted-2);">
      Materia no encontrada
    </div>
  }
</ion-content>
<app-bottom-tabs></app-bottom-tabs>
` 
})
export class SubjectDetailPage implements OnInit { 
  subjectId: string = '';
  subject: SubjectDB | null = null;
  workspace: Workspace | null = null;
  loading = true;
  backLink = '/workspaces';

  documents = DOCUMENTS; 
  tasks = TASKS; 

  constructor(
    private route: ActivatedRoute,
    private subjectsService: SubjectsService,
    private workspacesService: WorkspacesService
  ) {}

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.subjectId) {
      this.loadData();
    }
  }

  async loadData() {
    this.loading = true;
    try {
      this.subject = await this.subjectsService.getSubjectById(this.subjectId);
      
      if (this.subject) {
        this.backLink = '/workspaces/' + this.subject.workspace_id;
        try {
          this.workspace = await this.workspacesService.getWorkspaceById(this.subject.workspace_id);
        } catch (e) {
          console.error('Error loading parent workspace', e);
        }
      }
    } catch (e) {
      console.error('Error loading subject', e);
      this.subject = null;
    } finally {
      this.loading = false;
    }
  }
}
