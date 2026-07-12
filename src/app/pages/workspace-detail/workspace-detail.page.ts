import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonIcon, IonModal, IonSpinner, IonItem, 
  IonSelect, IonSelectOption, IonButton, IonHeader, 
  IonToolbar, IonTitle, IonButtons 
} from '@ionic/angular/standalone';
import { 
  AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, 
  TaskCardComponent, SubjectCardComponent, AppInputComponent, 
  PrimaryButtonComponent 
} from '../../shared/components/ui-kit.components';
import { Workspace, Subject, DocumentItem } from '../../core/models/ui.models';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { SubjectsService, SubjectDB } from '../../core/services/subjects.service';
import { DocumentsService } from '../../core/services/documents.service';
import { ToastService } from '../../core/services/toast.service';

@Component({ 
  selector: 'app-workspace-detail', 
  standalone: true, 
  imports: [
    IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, 
    DocumentCardComponent, SubjectCardComponent, IonModal, 
    IonSpinner, FormsModule, AppInputComponent, PrimaryButtonComponent, 
    IonItem, IonSelect, IonSelectOption, IonButton, IonHeader, 
    IonToolbar, IonTitle, IonButtons
  ], 
  styleUrls: ['../pages.scss'], 
  template: `
<app-header [showBack]="true" backLink="/workspaces"></app-header>
<ion-content class="nexus-content">
  @if (loadingWorkspace) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (workspace) {
    <span class="eyebrow">{{ workspace.title }}</span>
    <h1 class="page-title">{{ workspace.title }}</h1>
    <p class="page-subtitle">{{ workspace.description || 'Detalles del espacio' }}</p>
    
    <div class="metric-grid">
      <div class="metric"><ion-icon name="documents-outline"></ion-icon><strong>12</strong><span>Documentos</span></div>
      <div class="metric"><ion-icon name="trending-up-outline"></ion-icon><strong>72%</strong><span>Progreso</span></div>
    </div>
    
    <div class="section-heading">
      <h2>Materias</h2>
      <button class="new-btn" aria-label="Nueva materia" (click)="openModal()" style="background: none; border: none; color: var(--ion-color-primary); display: flex; align-items: center; gap: 4px; font-weight: 600;">
        <ion-icon name="add"></ion-icon> Nueva
      </button>
    </div>

    @if (loadingSubjects) {
      <div style="display: flex; justify-content: center; padding: 2rem;">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    } @else if (subjects.length === 0) {
      <div style="text-align: center; padding: 3rem 1rem; color: var(--nexus-muted-2); background: var(--nexus-card-bg); border-radius: 16px; border: 1px solid var(--nexus-border); margin-bottom: 24px;">
        <ion-icon name="book-outline" style="font-size: 3rem; margin-bottom: 1rem; color: var(--nexus-muted);"></ion-icon>
        <h3>Aún no tienes materias</h3>
        <p style="font-size: 0.9rem;">Crea tu primera materia para este espacio.</p>
        <app-primary-button style="margin-top: 1.5rem; display: inline-block; width: auto; padding: 0 2rem;" (click)="openModal()">
          Crear materia
        </app-primary-button>
      </div>
    } @else {
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        @for (subject of subjects; track subject.id) {
          <app-subject-card [subject]="subject"></app-subject-card>
        }
      </div>
    }

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
    @if (loadingDocs) {
      <div style="display: flex; justify-content: center; padding: 2rem;">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    } @else if (documents.length === 0) {
      <div style="padding: 1.5rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-bottom: 2rem;">
        <ion-icon name="document-text-outline" style="font-size: 2rem; color: var(--nexus-muted); margin-bottom: 8px;"></ion-icon>
        <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Aún no tienes documentos.</p>
      </div>
    } @else {
      @for (document of documents.slice(0,3); track document.id) {
        <app-document-card [document]="document"></app-document-card>
      }
    }
    
    <div class="section-heading"><h2>Actividad reciente</h2></div>
    <div style="padding: 1.5rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-bottom: 2rem;">
      <ion-icon name="time-outline" style="font-size: 2rem; color: var(--nexus-muted); margin-bottom: 8px;"></ion-icon>
      <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Aún no hay actividad reciente.</p>
    </div>
  } @else {
    <div style="padding: 2rem; text-align: center; color: var(--nexus-muted-2);">
      Espacio no encontrado
    </div>
  }

  <!-- Modal para crear materia -->
  <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()">
    <ng-template>
      <ion-header class="ion-no-border">
        <ion-toolbar style="--background: var(--nexus-bg);">
          <ion-title style="color: #f0f4ff;">Nueva materia</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="closeModal()" style="color: var(--nexus-muted-2);">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="nexus-content" style="--background: var(--nexus-bg);">
        <div style="padding: 1rem;">
          <app-input label="Nombre de la materia" placeholder="Ej. Inteligencia Artificial" icon="text-outline" [(value)]="newName"></app-input>
          <app-input label="Código / Descripción" placeholder="Ej. IA-402" icon="document-text-outline" [(value)]="newDesc"></app-input>
          
          <ion-item class="nexus-input" lines="none" style="margin-bottom: 24px; --background: var(--nexus-card-bg); --border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-icon slot="start" name="color-palette-outline" style="color: var(--nexus-muted);"></ion-icon>
            <ion-select label="Color" labelPlacement="floating" [(ngModel)]="newColor" interface="popover" style="color: #f0f4ff; width: 100%;">
              <ion-select-option value="#7a5cff">Púrpura</ion-select-option>
              <ion-select-option value="#25d7ff">Cian</ion-select-option>
              <ion-select-option value="#22e6a8">Verde Esmeralda</ion-select-option>
              <ion-select-option value="#ffbd59">Naranja</ion-select-option>
              <ion-select-option value="#f87171">Rojo</ion-select-option>
            </ion-select>
          </ion-item>

          @if (errorMsg) {
            <div class="auth-error">{{ errorMsg }}</div>
          }

          <app-primary-button (click)="createSubject()">
            @if (creating) { Guardando... } @else { Crear Materia }
          </app-primary-button>
        </div>
      </ion-content>
    </ng-template>
  </ion-modal>

</ion-content>
<app-bottom-tabs></app-bottom-tabs>
` 
})
export class WorkspaceDetailPage implements OnInit { 
  workspaceId: string = '';
  workspace: Workspace | null = null;
  loadingWorkspace = true;

  subjects: Subject[] = [];
  loadingSubjects = true;

  documents: DocumentItem[] = []; 
  loadingDocs = true;

  isModalOpen = false;
  creating = false;
  newName = '';
  newDesc = '';
  newColor = '#25d7ff';
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private workspacesService: WorkspacesService,
    private subjectsService: SubjectsService,
    private documentsService: DocumentsService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.workspaceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.workspaceId) {
      this.loadWorkspace();
      this.loadSubjects();
      this.loadDocuments();
    }
  }

  async loadWorkspace() {
    this.loadingWorkspace = true;
    try {
      this.workspace = await this.workspacesService.getWorkspaceById(this.workspaceId);
    } catch (e) {
      console.error('Error loading workspace', e);
      this.toastService.showError('No se pudo cargar el espacio');
      this.workspace = null;
    } finally {
      this.loadingWorkspace = false;
    }
  }

  async loadSubjects() {
    this.loadingSubjects = true;
    try {
      const dbSubjects = await this.subjectsService.getSubjectsByWorkspace(this.workspaceId);
      this.subjects = dbSubjects.map(s => this.mapSubject(s));
    } catch (e) {
      console.error('Error loading subjects', e);
      this.toastService.showError('No se pudieron cargar las materias');
    } finally {
      this.loadingSubjects = false;
    }
  }

  private mapSubject(dbSubject: SubjectDB): Subject {
    return {
      id: dbSubject.id,
      title: dbSubject.name,
      code: dbSubject.description || 'GEN-00', // mapped from description
      progress: 0,
      next: 'Sin tareas',
      color: dbSubject.color
    };
  }

  async loadDocuments() {
    this.loadingDocs = true;
    try {
      const dbDocs = await this.documentsService.getDocumentsByWorkspace(this.workspaceId);
      this.documents = dbDocs.map(d => this.mapDocument(d));
    } catch (e) {
      console.error('Error loading documents', e);
      this.toastService.showError('No se pudieron cargar los documentos');
    } finally {
      this.loadingDocs = false;
    }
  }

  private mapDocument(dbDoc: any): DocumentItem {
    let docType = 'PDF';
    if (dbDoc.document_type === 'text') docType = 'DOCX';
    if (dbDoc.document_type === 'image') docType = 'PPTX'; 
    
    let metaText = 'Subido';
    if (dbDoc.status === 'processing') metaText = 'Procesando...';
    else if (dbDoc.status === 'ready') metaText = 'Listo';
    else if (dbDoc.status === 'failed') metaText = 'Error';

    return {
      id: dbDoc.id,
      title: dbDoc.title || dbDoc.file_name,
      type: docType as any,
      meta: metaText,
      subject: this.workspace?.title || 'General',
      color: this.workspace?.color || '#25d7ff'
    };
  }

  openModal() {
    this.newName = '';
    this.newDesc = '';
    this.newColor = '#25d7ff';
    this.errorMsg = '';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async createSubject() {
    if (!this.newName.trim()) {
      this.errorMsg = 'El nombre es obligatorio.';
      return;
    }
    
    this.creating = true;
    this.errorMsg = '';

    try {
      const newSubDb = await this.subjectsService.createSubject(
        this.workspaceId,
        this.newName.trim(),
        this.newDesc.trim(),
        this.newColor
      );
      this.subjects.unshift(this.mapSubject(newSubDb));
      this.closeModal();
    } catch (error: any) {
      console.error('Error creating subject', error);
      this.toastService.showError(error.message || 'Error al crear materia');
    } finally {
      this.creating = false;
    }
  }
}
