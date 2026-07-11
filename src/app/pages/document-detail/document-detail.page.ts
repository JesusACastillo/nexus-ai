import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, PrimaryButtonComponent, StatusBadgeComponent } from '../../shared/components/ui-kit.components';
import { DocumentsService, DocumentDB } from '../../core/services/documents.service';
import { SummariesService, SummaryDB } from '../../core/services/summaries.service';
import { QuizzesService } from '../../core/services/quizzes.service';

@Component({ selector: 'app-document-detail', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, PrimaryButtonComponent, StatusBadgeComponent, IonSpinner, DatePipe], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/library"></app-header><ion-content class="nexus-content">
  @if (loading) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (document) {
    <div class="document-hero nexus-card">
      <div class="document-big-icon"><ion-icon name="document-text-outline"></ion-icon></div>
      <div>
        <app-status-badge [label]="getStatusLabel(document.status)"></app-status-badge>
        <h1>{{ document.title || document.file_name }}</h1>
        <p>{{ getFileSize(document.file_size_bytes) }} · Subido el {{ document.created_at | date:'shortDate' }}</p>
      </div>
    </div>
    
    @if (errorMsg) {
      <div style="color: var(--ion-color-danger); padding: 1rem; text-align: center; border: 1px dashed var(--ion-color-danger); border-radius: 8px; margin-bottom: 1rem;">
        {{ errorMsg }}
      </div>
    }

    <div class="section-heading"><h2>Acciones IA</h2></div>
    <div class="two-col">
      <a class="action-tile nexus-card" (click)="generateSummary()">
        @if (generatingSummary) {
          <ion-spinner name="dots"></ion-spinner>
        } @else {
          <ion-icon name="reader-outline"></ion-icon>
        }
        <h3>Resumen IA</h3>
        <p>Generar resumen</p>
      </a>
      <a class="action-tile nexus-card" routerLink="/chat/document">
        <ion-icon name="chatbubbles-outline"></ion-icon>
        <h3>Chat con documento</h3>
        <p>Próximamente...</p>
      </a>
      <a class="action-tile nexus-card" (click)="generateQuiz()">
        @if (generatingQuiz) {
          <ion-spinner name="dots"></ion-spinner>
        } @else {
          <ion-icon name="help-circle-outline"></ion-icon>
        }
        <h3>Crear quiz</h3>
        <p>Generar quiz interactivo</p>
      </a>
      <a class="action-tile nexus-card" routerLink="/flashcards">
        <ion-icon name="albums-outline"></ion-icon>
        <h3>Flashcards</h3>
        <p>Próximamente...</p>
      </a>
    </div>
    
    <div class="section-heading"><h2>Resumen rápido</h2></div>
    <div class="summary-block nexus-card">
      @if (summary) {
        <p style="white-space: pre-wrap;">{{ summary.content }}</p>
      } @else {
        <p style="color: var(--nexus-muted-2); text-align: center;">Aún no hay resumen generado.</p>
      }
    </div>
    <app-primary-button icon="chatbubble-outline" routerLink="/chat/document">Preguntar a Nexus</app-primary-button>
  } @else {
    <div style="padding: 2rem; text-align: center; color: var(--nexus-muted-2);">
      Documento no encontrado
    </div>
  }
</ion-content>` })
export class DocumentDetailPage implements OnInit {
  document: DocumentDB | null = null;
  loading = true;
  summary: SummaryDB | null = null;
  generatingSummary = false;
  generatingQuiz = false;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentsService: DocumentsService,
    private summariesService: SummariesService,
    private quizzesService: QuizzesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocument(id);
    } else {
      this.loading = false;
    }
  }

  async loadDocument(id: string) {
    this.loading = true;
    try {
      this.document = await this.documentsService.getDocumentById(id);
      await this.loadSummary(id);
    } catch (e) {
      console.error('Error loading document', e);
      this.document = null;
    } finally {
      this.loading = false;
    }
  }

  async loadSummary(documentId: string) {
    try {
      const summaries = await this.summariesService.getSummariesByDocument(documentId);
      this.summary = summaries[0] || null;
    } catch (e) {
      console.error('Error loading summary', e);
    }
  }

  async generateSummary() {
    if (!this.document) return;
    if (this.document.status !== 'ready') {
      this.errorMsg = 'El documento aún no está listo para generar resumen.';
      return;
    }

    this.generatingSummary = true;
    this.errorMsg = '';
    
    try {
      await this.summariesService.generateSummary(this.document.id, 'general');
      await this.loadSummary(this.document.id);
    } catch (e) {
      console.error('Error generating summary', e);
      this.errorMsg = 'Error al generar resumen.';
    } finally {
      this.generatingSummary = false;
    }
  }

  async generateQuiz() {
    if (!this.document) return;
    if (this.document.status !== 'ready') {
      this.errorMsg = 'El documento aún no está listo para crear quiz.';
      return;
    }

    this.generatingQuiz = true;
    this.errorMsg = '';

    try {
      const response = await this.quizzesService.generateQuiz(this.document.id);
      if (response && response.quiz) {
        this.router.navigate(['/quiz', response.quiz.id]);
      }
    } catch (e: any) {
      console.error('Error generating quiz', e);
      this.errorMsg = 'Error al generar quiz: ' + (e.message || '');
    } finally {
      this.generatingQuiz = false;
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'uploaded': return 'Subido';
      case 'processing': return 'Procesando...';
      case 'ready': return 'Listo';
      case 'failed': return 'Error';
      default: return 'Desconocido';
    }
  }

  getFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
