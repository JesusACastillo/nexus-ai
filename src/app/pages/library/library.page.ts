import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { DOCUMENTS } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, SearchBarComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-library', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, SearchBarComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <h1 class="page-title">Biblioteca</h1>
  <p class="page-subtitle">Gestiona y analiza tus documentos.</p>
  <app-search-bar placeholder="Buscar documentos..."></app-search-bar>
  <!-- Figma filter chips: Todos / PDFs / Imágenes / Notas -->
  <div class="chip-row">
    <button class="chip" [class.active]="filter==='todos'" (click)="filter='todos'">Todos</button>
    <button class="chip" [class.active]="filter==='pdf'"   (click)="filter='pdf'">PDFs</button>
    <button class="chip" [class.active]="filter==='img'"   (click)="filter='img'">Imágenes</button>
    <button class="chip" [class.active]="filter==='notas'" (click)="filter='notas'">Notas</button>
  </div>
  @for (document of documents; track document.id) {
    <app-document-card [document]="document"></app-document-card>
  }
</ion-content>
<button class="floating-add-btn" aria-label="Subir documento" routerLink="/upload">
  <ion-icon name="add"></ion-icon>
</button>
<app-bottom-tabs></app-bottom-tabs>` })
export class LibraryPage {
  documents = DOCUMENTS;
  filter = 'todos';
}
