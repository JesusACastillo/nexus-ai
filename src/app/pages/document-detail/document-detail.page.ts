import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, PrimaryButtonComponent, StatusBadgeComponent } from '../../shared/components/ui-kit.components';
import { DocumentsService, DocumentDB } from '../../core/services/documents.service';
import { SummariesService, SummaryDB } from '../../core/services/summaries.service';
import { QuizzesService } from '../../core/services/quizzes.service';
import { FlashcardsService } from '../../core/services/flashcards.service';
import { ToastService } from '../../core/services/toast.service';

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
      <a class="action-tile nexus-card" routerLink="/chat/document/{{ document.id }}">
        <ion-icon name="chatbubbles-outline"></ion-icon>
        <h3>Chat con documento</h3>
        <p>Conversar sobre el contenido</p>
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
      <a class="action-tile nexus-card" (click)="generateFlashcards()">
        @if (generatingFlashcards) {
          <ion-spinner name="dots"></ion-spinner>
        } @else {
          <ion-icon name="albums-outline"></ion-icon>
        }
        <h3>Flashcards</h3>
        <p>Generar flashcards</p>
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
    <app-primary-button icon="chatbubble-outline" routerLink="/chat/document/{{ document.id }}">Preguntar a Nexus</app-primary-button>
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
  generatingFlashcards = false;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentsService: DocumentsService,
    private summariesService: SummariesService,
    private quizzesService: QuizzesService,
    private flashcardsService: FlashcardsService,
    private toastService: ToastService
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
      this.toastService.showError('Error al cargar el documento');
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
    if (!this.document || this.generatingSummary) return;
    if (this.document.status !== 'ready') {
      this.toastService.showError('El documento aún no está listo para generar resumen.');
      return;
    }

    this.generatingSummary = true;
    this.errorMsg = '';
    
    try {
      await this.summariesService.generateSummary(this.document.id, 'general');
      await this.loadSummary(this.document.id);
    } catch (e) {
      console.error('Error generating summary', e);
      this.toastService.showError('Error al generar resumen.');
    } finally {
      this.generatingSummary = false;
    }
  }

  async generateQuiz() {
    if (!this.document || this.generatingQuiz) return;
    if (this.document.status !== 'ready') {
      this.toastService.showError('El documento aún no está listo para crear quiz.');
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
      this.toastService.showError('Error al generar quiz: ' + (e.message || ''));
    } finally {
      this.generatingQuiz = false;
    }
  }

  async generateFlashcards() {
    if (!this.document || this.generatingFlashcards) return;
    if (this.document.status !== 'ready') {
      this.toastService.showError('El documento aún no está listo para generar flashcards.');
      return;
    }

    this.generatingFlashcards = true;
    this.errorMsg = '';

    try {
      await this.flashcardsService.generateFlashcards(this.document.id);
      this.router.navigate(['/flashcards', this.document.id]);
    } catch (e: any) {
      console.error('Error generating flashcards', e);
      this.toastService.showError('Error al generar flashcards: ' + (e.message || ''));
    } finally {
      this.generatingFlashcards = false;
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
