import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonIcon, IonSpinner, IonModal, IonHeader, 
  IonToolbar, IonTitle, IonButtons, IonButton, IonItem, 
  IonSelect, IonSelectOption 
} from '@ionic/angular/standalone';
import { TASKS } from '../../core/data/mock-data';
import { 
  AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, 
  TaskCardComponent, AppInputComponent, PrimaryButtonComponent 
} from '../../shared/components/ui-kit.components';
import { SubjectDB, SubjectsService } from '../../core/services/subjects.service';
import { Workspace, DocumentItem } from '../../core/models/ui.models';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { DocumentDB, DocumentsService } from '../../core/services/documents.service';

@Component({ 
  selector: 'app-subject-detail', 
  standalone: true, 
  imports: [
    IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, 
    DocumentCardComponent, TaskCardComponent, IonSpinner, IonModal, IonHeader,
    IonToolbar, IonTitle, IonButtons, IonButton, FormsModule, AppInputComponent,
    IonItem, IonSelect, IonSelectOption, PrimaryButtonComponent
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
      <div class="metric"><ion-icon name="documents-outline"></ion-icon><strong>{{ documents.length }}</strong><span>Documentos</span></div>
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
    
    <div class="section-heading">
      <h2>Documentos recientes</h2>
      <button class="new-btn" aria-label="Subir documento" (click)="openModal()" style="background: none; border: none; color: var(--ion-color-primary); display: flex; align-items: center; gap: 4px; font-weight: 600;">
        <ion-icon name="add"></ion-icon> Subir
      </button>
    </div>

    @if (loadingDocs) {
      <div style="display: flex; justify-content: center; padding: 2rem;">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    } @else if (documents.length === 0) {
      <div style="text-align: center; padding: 3rem 1rem; color: var(--nexus-muted-2); background: var(--nexus-card-bg); border-radius: 16px; border: 1px solid var(--nexus-border); margin-bottom: 24px;">
        <ion-icon name="document-text-outline" style="font-size: 3rem; margin-bottom: 1rem; color: var(--nexus-muted);"></ion-icon>
        <h3>No hay documentos</h3>
        <p style="font-size: 0.9rem;">Sube apuntes, PDFs o enlaces para esta materia.</p>
        <app-primary-button style="margin-top: 1.5rem; display: inline-block; width: auto; padding: 0 2rem;" (click)="openModal()">
          Subir documento
        </app-primary-button>
      </div>
    } @else {
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        @for (document of documents; track document.id) {
          <app-document-card [document]="document"></app-document-card>
        }
      </div>
      <div style="text-align: right; margin-bottom: 2rem;">
        <a routerLink="/library" style="color: var(--nexus-muted-2); font-size: 0.9rem; font-weight: 600; text-decoration: none;">Ver todos los documentos →</a>
      </div>
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

  <!-- Modal para crear documento -->
  <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()">
    <ng-template>
      <ion-header class="ion-no-border">
        <ion-toolbar style="--background: var(--nexus-bg);">
          <ion-title style="color: #f0f4ff;">Nuevo Documento</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="closeModal()" style="color: var(--nexus-muted-2);">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="nexus-content" style="--background: var(--nexus-bg);">
        <div style="padding: 1rem;">
          <app-input label="Título del documento" placeholder="Ej. Resumen Tema 1" icon="text-outline" [(value)]="newTitle"></app-input>
          <app-input label="Descripción (Opcional)" placeholder="Ej. Notas de la clase de hoy" icon="document-text-outline" [(value)]="newDesc"></app-input>
          
          <ion-item class="nexus-input" lines="none" style="margin-bottom: 24px; --background: var(--nexus-card-bg); --border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-icon slot="start" name="document-attach-outline" style="color: var(--nexus-muted);"></ion-icon>
            <ion-select label="Tipo de Documento" labelPlacement="floating" [(ngModel)]="newType" interface="popover" style="color: #f0f4ff; width: 100%;">
              <ion-select-option value="pdf">PDF</ion-select-option>
              <ion-select-option value="text">Texto / Notas</ion-select-option>
              <ion-select-option value="link">Enlace web</ion-select-option>
              <ion-select-option value="image">Imagen</ion-select-option>
              <ion-select-option value="other">Otro</ion-select-option>
            </ion-select>
          </ion-item>

          @if (errorMsg) {
            <div class="auth-error">{{ errorMsg }}</div>
          }

          <app-primary-button (click)="createDocument()">
            @if (creating) { Guardando... } @else { Guardar Documento }
          </app-primary-button>
        </div>
      </ion-content>
    </ng-template>
  </ion-modal>
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

  documents: DocumentItem[] = [];
  loadingDocs = true;

  tasks = TASKS; 

  isModalOpen = false;
  creating = false;
  newTitle = '';
  newDesc = '';
  newType = 'pdf';
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private subjectsService: SubjectsService,
    private workspacesService: WorkspacesService,
    private documentsService: DocumentsService
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
        await this.loadDocuments();
      }
    } catch (e) {
      console.error('Error loading subject', e);
      this.subject = null;
    } finally {
      this.loading = false;
    }
  }

  async loadDocuments() {
    this.loadingDocs = true;
    try {
      const dbDocs = await this.documentsService.getDocumentsBySubject(this.subjectId);
      this.documents = dbDocs.map(d => this.mapDocument(d));
    } catch (e) {
      console.error('Error loading documents', e);
    } finally {
      this.loadingDocs = false;
    }
  }

  private mapDocument(dbDoc: DocumentDB): DocumentItem {
    let docType = 'PDF';
    if (dbDoc.document_type === 'text') docType = 'DOCX';
    if (dbDoc.document_type === 'image') docType = 'PPTX'; // Using available UI types as fallback
    
    return {
      id: dbDoc.id,
      title: dbDoc.title,
      type: docType as any,
      meta: dbDoc.status === 'uploaded' ? 'Subido' : 'Procesado',
      subject: this.subject?.name || 'General',
      color: this.subject?.color || '#25d7ff'
    };
  }

  openModal() {
    this.newTitle = '';
    this.newDesc = '';
    this.newType = 'pdf';
    this.errorMsg = '';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async createDocument() {
    if (!this.newTitle.trim()) {
      this.errorMsg = 'El título es obligatorio.';
      return;
    }
    
    if (!this.subject) return;

    this.creating = true;
    this.errorMsg = '';

    try {
      const newDocDb = await this.documentsService.createDocument(
        this.subject.workspace_id,
        this.subject.id,
        this.newTitle.trim(),
        this.newDesc.trim(),
        this.newType
      );
      this.documents.unshift(this.mapDocument(newDocDb));
      this.closeModal();
    } catch (error: any) {
      console.error('Error creating document', error);
      this.errorMsg = error.message || 'Error al crear documento';
    } finally {
      this.creating = false;
    }
  }
}
