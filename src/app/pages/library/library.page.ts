import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { DOCUMENTS } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, SearchBarComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-library', standalone: true, imports: [IonContent, IonFab, IonFabButton, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, DocumentCardComponent, SearchBarComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header><ion-content class="nexus-content"><h1 class="page-title">Biblioteca</h1><p class="page-subtitle">Todo tu conocimiento, listo para conversar.</p><app-search-bar placeholder="Buscar documentos"></app-search-bar><div class="chip-row"><button class="chip active">Todos</button><button class="chip">PDF</button><button class="chip">Apuntes</button><button class="chip">Presentaciones</button></div>@for (document of documents; track document.id) {<app-document-card [document]="document"></app-document-card>}<ion-fab slot="fixed" vertical="bottom" horizontal="end"><ion-fab-button routerLink="/upload"><ion-icon name="add"></ion-icon></ion-fab-button></ion-fab></ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class LibraryPage { documents = DOCUMENTS; }
