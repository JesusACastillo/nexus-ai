import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { WORKSPACES } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent, SearchBarComponent, WorkspaceCardComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-workspaces', standalone: true, imports: [IonContent, IonIcon, AppHeaderComponent, BottomTabsComponent, SearchBarComponent, WorkspaceCardComponent], styleUrls: ['../pages.scss', './workspaces.page.scss'], template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <!-- Figma: title + "+ Nuevo" pill badge inline -->
  <div class="ws-title-row">
    <h1 class="page-title" style="margin-bottom:0">Mis espacios</h1>
    <button class="new-btn" aria-label="Nuevo espacio"><ion-icon name="add"></ion-icon> Nuevo</button>
  </div>
  <p class="page-subtitle">Organiza tus universos de conocimiento.</p>
  <app-search-bar placeholder="Buscar espacios"></app-search-bar>
  <div class="section-heading"><h2>Todos los espacios</h2><span class="muted">{{ workspaces.length }}</span></div>
  @for (workspace of workspaces; track workspace.id) {
    <app-workspace-card [workspace]="workspace"></app-workspace-card>
  }
</ion-content>
<app-bottom-tabs></app-bottom-tabs>` })
export class WorkspacesPage { workspaces = WORKSPACES; }
