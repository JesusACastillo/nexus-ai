import { Component } from '@angular/core';
import { IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { WORKSPACES } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, SearchBarComponent, WorkspaceCardComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-workspaces', standalone: true, imports: [IonContent, IonFab, IonFabButton, IonIcon, AppHeaderComponent, BottomTabsComponent, SearchBarComponent, WorkspaceCardComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header><ion-content class="nexus-content"><h1 class="page-title">Mis espacios</h1><p class="page-subtitle">Organiza tus universos de conocimiento.</p><app-search-bar placeholder="Buscar espacios"></app-search-bar><div class="section-heading"><h2>Todos los espacios</h2><span class="muted">{{ workspaces.length }}</span></div>@for (workspace of workspaces; track workspace.id) {<app-workspace-card [workspace]="workspace"></app-workspace-card>}<ion-fab slot="fixed" vertical="bottom" horizontal="end"><ion-fab-button><ion-icon name="add"></ion-icon></ion-fab-button></ion-fab></ion-content><app-bottom-tabs></app-bottom-tabs>` })
export class WorkspacesPage { workspaces = WORKSPACES; }
