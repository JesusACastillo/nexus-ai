import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppHeaderComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-upload', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, PrimaryButtonComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/library"></app-header><ion-content class="nexus-content"><h1 class="page-title">Subir documento</h1><p class="page-subtitle">Nexus analizará el contenido para ayudarte a estudiarlo.</p>
<div style="padding: 2rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin: 2rem 0;">
  <ion-icon name="information-circle-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
  <p style="color: var(--nexus-muted-2);">Para subir un documento, por favor dirígete a un Espacio, selecciona una Materia y haz clic en "Nuevo Documento".</p>
</div>
<div style="text-align: center;">
  <app-primary-button routerLink="/workspaces">Ir a Mis Espacios</app-primary-button>
</div>
</ion-content>` })
export class UploadPage {}
