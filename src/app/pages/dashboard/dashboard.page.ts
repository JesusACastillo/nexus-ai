import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { SupabaseService } from '../../core/services/supabase.service';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { Workspace } from '../../core/models/ui.models';

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
        <div class="hero-metric"><strong>{{ pendingTasksCount }}</strong><span>Tareas</span></div>
        <div class="hero-metric"><strong>{{ documentsCount }}</strong><span>Documentos</span></div>
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
    
    @if (loadingSpaces) {
      <div style="padding: 1rem; color: var(--nexus-muted);">Cargando espacios...</div>
    } @else if (recentWorkspaces.length === 0) {
      <div style="padding: 1.5rem 1rem; text-align: center; background: var(--nexus-card-bg); border-radius: 16px; border: 1px solid var(--nexus-border); margin-bottom: 24px;">
        <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Aún no tienes espacios.</p>
        <a routerLink="/workspaces" style="color: var(--ion-color-primary); font-size: 0.9rem; font-weight: 600; text-decoration: none; display: inline-block; margin-top: 8px;">Crea uno aquí →</a>
      </div>
    } @else {
      <div class="spaces-row">
        @for (ws of recentWorkspaces; track ws.id) {
          <a class="space-card" routerLink="/workspaces">
            <div class="space-card-icon" [style.background]="ws.color + '26'" [style.color]="ws.color"><ion-icon [name]="ws.icon"></ion-icon></div>
            <h4>{{ ws.title }}</h4><p>{{ ws.count }} ítems</p>
          </a>
        }
      </div>
    }

    <!-- Actividad reciente (Figma: lista de archivos con ícono y menú de 3 puntos) -->
    <div class="section-heading"><h2>Actividad reciente</h2></div>
    <div style="padding: 1.5rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-bottom: 2rem;">
      <ion-icon name="time-outline" style="font-size: 2rem; color: var(--nexus-muted); margin-bottom: 8px;"></ion-icon>
      <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Aún no hay actividad reciente</p>
    </div>
    
  </div>
</ion-content>
<app-bottom-tabs></app-bottom-tabs>` })
export class DashboardPage implements OnInit {
  firstName = '';
  recentWorkspaces: Workspace[] = [];
  loadingSpaces = true;
  
  pendingTasksCount = 0;
  documentsCount = 0;

  constructor(private supabase: SupabaseService, private workspacesService: WorkspacesService) {}

  ngOnInit() {
    const user = this.supabase.currentUser;
    const fullName = user?.user_metadata?.['full_name'] ?? '';
    this.firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';
    
    this.loadRecentData(user?.id);
  }

  async loadRecentData(userId?: string) {
    if (!userId) return;

    // Load Workspaces
    try {
      this.loadingSpaces = true;
      const allSpaces = await this.workspacesService.getWorkspaces();
      this.recentWorkspaces = allSpaces.slice(0, 3);
    } catch (e) {
      console.error('Error loading workspaces', e);
    } finally {
      this.loadingSpaces = false;
    }

    // Load Tasks count
    try {
      const { count, error } = await this.supabase.client
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'completed');
      
      if (!error) {
        this.pendingTasksCount = count || 0;
      }
    } catch (e) {
      // Ignorar error si la tabla no existe
      this.pendingTasksCount = 0;
    }

    // Load Documents count
    try {
      const { count, error } = await this.supabase.client
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (!error) {
        this.documentsCount = count || 0;
      }
    } catch (e) {
      // Ignorar error si la tabla no existe
      this.documentsCount = 0;
    }
  }
}
