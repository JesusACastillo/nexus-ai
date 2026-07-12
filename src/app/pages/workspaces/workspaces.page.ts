import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonModal, IonSpinner, IonItem, IonSelect, IonSelectOption, IonButton, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent, SearchBarComponent, WorkspaceCardComponent, AppInputComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { Workspace } from '../../core/models/ui.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [IonContent, IonIcon, AppHeaderComponent, BottomTabsComponent, SearchBarComponent, WorkspaceCardComponent, IonModal, IonSpinner, FormsModule, AppInputComponent, PrimaryButtonComponent, IonItem, IonSelect, IonSelectOption, IonButton, IonHeader, IonToolbar, IonTitle, IonButtons],
  styleUrls: ['../pages.scss', './workspaces.page.scss'],
  template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <div class="ws-title-row">
    <h1 class="page-title" style="margin-bottom:0">Mis espacios</h1>
    <button class="new-btn" aria-label="Nuevo espacio" (click)="openModal()"><ion-icon name="add"></ion-icon> Nuevo</button>
  </div>
  <p class="page-subtitle">Organiza tus universos de conocimiento.</p>
  <app-search-bar placeholder="Buscar espacios"></app-search-bar>
  
  @if (loading) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (workspaces.length === 0) {
    <div style="text-align: center; padding: 3rem 1rem; color: var(--nexus-muted-2);">
      <ion-icon name="folder-outline" style="font-size: 3rem; margin-bottom: 1rem; color: var(--nexus-muted);"></ion-icon>
      <h3>Aún no tienes espacios</h3>
      <p style="font-size: 0.9rem;">Crea tu primer espacio para organizar tus apuntes y materias.</p>
      <app-primary-button style="margin-top: 1.5rem; display: inline-block; width: auto; padding: 0 2rem;" (click)="openModal()">
        Crear espacio
      </app-primary-button>
    </div>
  } @else {
    <div class="section-heading"><h2>Todos los espacios</h2><span class="muted">{{ workspaces.length }}</span></div>
    @for (workspace of workspaces; track workspace.id) {
      <app-workspace-card [workspace]="workspace"></app-workspace-card>
    }
  }

  <!-- Modal para crear espacio -->
  <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()">
    <ng-template>
      <ion-header class="ion-no-border">
        <ion-toolbar style="--background: var(--nexus-bg);">
          <ion-title style="color: #f0f4ff;">Nuevo espacio</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="closeModal()" style="color: var(--nexus-muted-2);">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="nexus-content" style="--background: var(--nexus-bg);">
        <div style="padding: 1rem;">
          <app-input label="Nombre del espacio" placeholder="Ej. Universidad" icon="text-outline" [(value)]="newName"></app-input>
          <app-input label="Descripción (Opcional)" placeholder="Ej. Apuntes de 3er año" icon="document-text-outline" [(value)]="newDesc"></app-input>
          
          <ion-item class="nexus-input" lines="none" style="margin-bottom: 16px; --background: var(--nexus-card-bg); --border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-icon slot="start" name="grid-outline" style="color: var(--nexus-muted);"></ion-icon>
            <ion-select label="Tipo" labelPlacement="floating" [(ngModel)]="newType" interface="popover" style="color: #f0f4ff; width: 100%;">
              <ion-select-option value="study">Estudio</ion-select-option>
              <ion-select-option value="project">Proyecto</ion-select-option>
              <ion-select-option value="personal">Personal</ion-select-option>
              <ion-select-option value="career">Carrera</ion-select-option>
              <ion-select-option value="other">Otro</ion-select-option>
            </ion-select>
          </ion-item>

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

          <app-primary-button (click)="create()">
            @if (creating) { Guardando... } @else { Crear Espacio }
          </app-primary-button>
        </div>
      </ion-content>
    </ng-template>
  </ion-modal>
</ion-content>
<app-bottom-tabs></app-bottom-tabs>`
})
export class WorkspacesPage implements OnInit {
  workspaces: Workspace[] = [];
  loading = true;
  
  isModalOpen = false;
  creating = false;
  newName = '';
  newDesc = '';
  newType = 'study';
  newColor = '#7a5cff';
  errorMsg = '';

  constructor(private workspacesService: WorkspacesService, private toastService: ToastService) {}

  ngOnInit() {
    this.loadWorkspaces();
  }

  async loadWorkspaces() {
    this.loading = true;
    try {
      this.workspaces = await this.workspacesService.getWorkspaces();
    } catch (error) {
      console.error('Error loading workspaces', error);
      this.toastService.showError('No se pudieron cargar los espacios');
    } finally {
      this.loading = false;
    }
  }

  openModal() {
    this.newName = '';
    this.newDesc = '';
    this.newType = 'study';
    this.newColor = '#7a5cff';
    this.errorMsg = '';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async create() {
    if (!this.newName.trim()) {
      this.errorMsg = 'El nombre es obligatorio.';
      return;
    }

    this.creating = true;
    this.errorMsg = '';

    try {
      const newWs = await this.workspacesService.createWorkspace(
        this.newName.trim(),
        this.newDesc.trim(),
        this.newType,
        this.newColor
      );
      this.workspaces.unshift(newWs);
      this.closeModal();
    } catch (error: any) {
      console.error('Error al crear espacio', error);
      this.toastService.showError(error.message || 'Error al crear el espacio');
    } finally {
      this.creating = false;
    }
  }
}
