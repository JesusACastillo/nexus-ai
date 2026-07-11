import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SUBJECTS, TASKS } from '../../core/data/mock-data';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({ selector: 'app-dashboard', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent], styleUrls: ['../pages.scss'], template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <div class="content-pad">
    <h1 class="page-title">Hola, {{ firstName }}</h1>
    <p class="page-subtitle">¿Qué quieres aprender hoy?</p>

    <!-- Hero banner: TU RESUMEN INTELIGENTE (Figma exact) -->
    <div class="hero-panel">
      <div class="eyebrow"><ion-icon name="sparkles-outline"></ion-icon> Tu resumen inteligente</div>
      <p>Tienes tareas pendientes y documentos por revisar para estar al día.</p>
      <div class="hero-metrics">
        <div class="hero-metric"><strong>3</strong><span>Tareas</span></div>
        <div class="hero-metric"><strong>2</strong><span>Documentos</span></div>
      </div>
    </div>

    <!-- Quick actions 4-grid (Figma: Subir doc / Crear quiz / Nuevo chat / Crear tarea) -->
    <div class="section-heading"><h2>Acciones rápidas</h2></div>
    <div class="quick-grid">
      <a class="quick-action" routerLink="/upload"><ion-icon name="cloud-upload-outline"></ion-icon>Subir documento</a>
      <a class="quick-action" routerLink="/quiz-generator"><ion-icon name="help-circle-outline"></ion-icon>Crear quiz</a>
      <a class="quick-action" routerLink="/chat"><ion-icon name="chatbubble-outline"></ion-icon>Nuevo chat</a>
      <a class="quick-action" routerLink="/tasks"><ion-icon name="checkbox-outline"></ion-icon>Crear tarea</a>
    </div>

    <!-- Espacios recientes (Figma: horizontal scroll cards) -->
    <div class="section-heading"><h2>Espacios recientes</h2><a routerLink="/workspaces">Ver todos</a></div>
    <div class="spaces-row">
      <a class="space-card" routerLink="/workspaces">
        <div class="space-card-icon" style="background:rgba(108,99,255,.15);color:#a78bfa"><ion-icon name="school-outline"></ion-icon></div>
        <h4>Universidad</h4><p>12 ítems</p>
      </a>
      <a class="space-card" routerLink="/workspaces">
        <div class="space-card-icon" style="background:rgba(0,212,255,.12);color:#00d4ff"><ion-icon name="code-slash-outline"></ion-icon></div>
        <h4>Portal</h4><p>5 ítems</p>
      </a>
      <a class="space-card" routerLink="/workspaces">
        <div class="space-card-icon" style="background:rgba(16,185,129,.12);color:#34d399"><ion-icon name="airplane-outline"></ion-icon></div>
        <h4>Japón 2024</h4><p>8 ítems</p>
      </a>
    </div>

    <!-- Actividad reciente (Figma: lista de archivos con ícono y menú de 3 puntos) -->
    <div class="section-heading"><h2>Actividad reciente</h2></div>
    <div class="activity-item" routerLink="/documents/subnetting">
      <div class="activity-icon" style="background:rgba(239,68,68,.12);color:#f87171"><ion-icon name="document-text-outline"></ion-icon></div>
      <div class="activity-info"><h4>Apuntes_Redes_Tema4.pdf</h4><p>Procesado hace 2 horas</p></div>
      <ion-icon class="activity-more" name="ellipsis-vertical"></ion-icon>
    </div>
    <div class="activity-item" routerLink="/documents/subnetting">
      <div class="activity-icon" style="background:rgba(59,130,246,.12);color:#60a5fa"><ion-icon name="document-outline"></ion-icon></div>
      <div class="activity-info"><h4>Borrador_Ensayo_Final.docx</h4><p>Procesado ayer</p></div>
      <ion-icon class="activity-more" name="ellipsis-vertical"></ion-icon>
    </div>
    <div class="activity-item" routerLink="/quiz">
      <div class="activity-icon" style="background:rgba(168,85,247,.12);color:#c084fc"><ion-icon name="help-circle-outline"></ion-icon></div>
      <div class="activity-info"><h4>Quiz: Fundamentos CCNA</h4><p>Completado · Hace 2 días</p></div>
      <ion-icon class="activity-more" name="ellipsis-vertical"></ion-icon>
    </div>
  </div>
</ion-content>
<app-bottom-tabs></app-bottom-tabs>` })
export class DashboardPage implements OnInit {
  subjects = SUBJECTS;
  tasks = TASKS;
  firstName = '';

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    const user = this.supabase.currentUser;
    const fullName = user?.user_metadata?.['full_name'] ?? '';
    this.firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';
  }
}
