import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, SearchBarComponent } from '../../shared/components/ui-kit.components';
import { DocumentsService, DocumentDB } from '../../core/services/documents.service';
import { DocumentItem } from '../../core/models/ui.models';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({ selector: 'app-library', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, SearchBarComponent, IonSpinner], styleUrls: ['../pages.scss'], template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <h1 class="page-title">Biblioteca</h1>
  <p class="page-subtitle">Gestiona y analiza tus documentos.</p>
  <app-search-bar placeholder="Buscar documentos..."></app-search-bar>
  <!-- Figma filter chips: Todos / PDFs / Imágenes / Notas -->
  <div class="chip-row">
    <button class="chip" [class.active]="filter==='todos'" (click)="setFilter('todos')">Todos</button>
    <button class="chip" [class.active]="filter==='pdf'"   (click)="setFilter('pdf')">PDFs</button>
    <button class="chip" [class.active]="filter==='img'"   (click)="setFilter('img')">Imágenes</button>
    <button class="chip" [class.active]="filter==='notas'" (click)="setFilter('notas')">Notas</button>
  </div>
  
  @if (loading) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (filteredDocuments.length === 0) {
    <div style="padding: 1.5rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-bottom: 2rem;">
      <ion-icon name="document-text-outline" style="font-size: 2rem; color: var(--nexus-muted); margin-bottom: 8px;"></ion-icon>
      <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Aún no tienes documentos.</p>
    </div>
  } @else {
    @for (document of filteredDocuments; track document.id) {
      <app-document-card [document]="document"></app-document-card>
    }
  }
</ion-content>
<button class="floating-add-btn" aria-label="Subir documento" routerLink="/upload">
  <ion-icon name="add"></ion-icon>
</button>
<app-bottom-tabs></app-bottom-tabs>` })
export class LibraryPage implements OnInit {
  documents: DocumentItem[] = [];
  filteredDocuments: DocumentItem[] = [];
  filter = 'todos';
  loading = true;

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    this.loadDocuments();
  }

  async loadDocuments() {
    this.loading = true;
    const user = this.supabase.currentUser;
    if (!user) return;

    try {
      const { data, error } = await this.supabase.client
        .from('documents')
        .select(`
          id, title, document_type, status, file_name, file_mime, file_size_bytes, 
          subject_id, workspace_id, created_at,
          subjects(name, color)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      this.documents = (data || []).map((dbDoc: any) => this.mapDocument(dbDoc));
      this.filteredDocuments = [...this.documents];
    } catch (error) {
      console.error('Error loading documents', error);
    } finally {
      this.loading = false;
    }
  }

  setFilter(newFilter: string) {
    this.filter = newFilter;
    if (newFilter === 'todos') {
      this.filteredDocuments = [...this.documents];
    } else if (newFilter === 'pdf') {
      this.filteredDocuments = this.documents.filter(d => d.type === 'PDF');
    } else if (newFilter === 'img') {
      this.filteredDocuments = this.documents.filter(d => d.type === 'PPTX'); // Using PPTX as UI image fallback
    } else if (newFilter === 'notas') {
      this.filteredDocuments = this.documents.filter(d => d.type === 'DOCX'); // Using DOCX as UI text fallback
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

    const subjectName = dbDoc.subjects?.name || 'General';
    const color = dbDoc.subjects?.color || '#25d7ff';

    return {
      id: dbDoc.id,
      title: dbDoc.title || dbDoc.file_name,
      type: docType as any,
      meta: metaText,
      subject: subjectName,
      color: color
    };
  }
}
