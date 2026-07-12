import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { SupabaseService } from '../../core/services/supabase.service';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { DashboardService, DashboardStats, ActivityItem } from '../../core/services/dashboard.service';
import { Workspace } from '../../core/models/ui.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, AppHeaderComponent, BottomTabsComponent, IonSpinner, DatePipe],
  styleUrls: ['../pages.scss'],
  template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <div class="content-pad">
    <h1 class="page-title">Hola, {{ firstName }}</h1>
    <p class="page-subtitle">¿Qué quieres aprender hoy?</p>

    <!-- Hero banner: TU RESUMEN INTELIGENTE -->
    <div class="hero-panel">
      <div class="eyebrow"><ion-icon name="sparkles-outline"></ion-icon> Tu resumen inteligente</div>
      <p>Tienes {{ stats?.readyDocuments || 0 }} documentos listos y {{ stats?.activeSubjects || 0 }} materias activas para estudiar.</p>
      <div class="hero-metrics">
        <div class="hero-metric">
          @if (loadingStats) { <ion-spinner name="dots"></ion-spinner> } @else { <strong>{{ stats?.averageScore || 0 }}%</strong> }
          <span>Promedio Quizzes</span>
        </div>
        <div class="hero-metric">
          @if (loadingStats) { <ion-spinner name="dots"></ion-spinner> } @else { <strong>{{ stats?.totalDocuments || 0 }}</strong> }
          <span>Documentos</span>
        </div>
      </div>
    </div>

    <!-- Quick actions 4-grid -->
    <div class="section-heading"><h2>Acciones rápidas</h2></div>
    <div class="quick-grid">
      <a class="quick-action" routerLink="/upload"><ion-icon name="cloud-upload-outline"></ion-icon>Subir documento</a>
      <a class="quick-action" routerLink="/quiz-generator"><ion-icon name="help-circle-outline"></ion-icon>Crear quiz</a>
      <a class="quick-action" routerLink="/chat"><ion-icon name="chatbubble-outline"></ion-icon>Nuevo chat</a>
      <a class="quick-action" routerLink="/tasks"><ion-icon name="checkbox-outline"></ion-icon>Crear tarea</a>
    </div>

    <!-- Estadísticas IA -->
    <div class="section-heading"><h2>Estadísticas AI</h2></div>
    @if (loadingStats) {
      <div style="padding: 1rem; color: var(--nexus-muted); text-align: center;"><ion-spinner name="crescent"></ion-spinner></div>
    } @else {
      <div class="two-col" style="margin-bottom: 2rem;">
        <a class="action-tile nexus-card" routerLink="/ai-summaries" style="padding: 1rem; text-align: center; text-decoration: none; display: block;">
          <ion-icon name="reader-outline"></ion-icon>
          <h3 style="font-size: 1.5rem; margin-top: 0.5rem; color: var(--nexus-text);">{{ stats?.totalSummaries || 0 }}</h3>
          <p style="margin: 0; color: var(--nexus-muted-2);">Resúmenes</p>
        </a>
        <a class="action-tile nexus-card" routerLink="/ai-flashcards" style="padding: 1rem; text-align: center; text-decoration: none; display: block;">
          <ion-icon name="albums-outline"></ion-icon>
          <h3 style="font-size: 1.5rem; margin-top: 0.5rem; color: var(--nexus-text);">{{ stats?.totalFlashcards || 0 }}</h3>
          <p style="margin: 0; color: var(--nexus-muted-2);">Flashcards</p>
        </a>
        <a class="action-tile nexus-card" routerLink="/quiz-history" style="padding: 1rem; text-align: center; text-decoration: none; display: block;">
          <ion-icon name="help-circle-outline"></ion-icon>
          <h3 style="font-size: 1.5rem; margin-top: 0.5rem; color: var(--nexus-text);">{{ stats?.totalQuizAttempts || 0 }}</h3>
          <p style="margin: 0; color: var(--nexus-muted-2);">Intentos Quiz</p>
        </a>
        <a class="action-tile nexus-card" routerLink="/ai-chat-history" style="padding: 1rem; text-align: center; text-decoration: none; display: block;">
          <ion-icon name="chatbubbles-outline"></ion-icon>
          <h3 style="font-size: 1.5rem; margin-top: 0.5rem; color: var(--nexus-text);">{{ stats?.totalConversations || 0 }}</h3>
          <p style="margin: 0; color: var(--nexus-muted-2);">Chats IA</p>
        </a>
      </div>
    }

    <!-- Espacios recientes -->
    <div class="section-heading"><h2>Espacios recientes</h2><a routerLink="/workspaces">Ver todos</a></div>
    
    @if (loadingSpaces) {
      <div style="padding: 1rem; color: var(--nexus-muted); text-align: center;"><ion-spinner name="crescent"></ion-spinner></div>
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

    <!-- Actividad reciente -->
    <div class="section-heading"><h2>Actividad reciente</h2></div>
    @if (loadingStats) {
      <div style="padding: 1rem; color: var(--nexus-muted); text-align: center;"><ion-spinner name="crescent"></ion-spinner></div>
    } @else if (recentActivity.length === 0) {
      <div style="padding: 1.5rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-bottom: 2rem;">
        <ion-icon name="time-outline" style="font-size: 2rem; color: var(--nexus-muted); margin-bottom: 8px;"></ion-icon>
        <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Aún no hay actividad reciente</p>
      </div>
    } @else {
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 2rem;">
        @for (item of recentActivity; track item.id) {
          <a class="nexus-card" [routerLink]="item.link" style="display: flex; align-items: center; padding: 1rem; text-decoration: none; border-radius: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(var(--ion-color-primary-rgb), 0.1); display: flex; align-items: center; justify-content: center; margin-right: 12px; color: var(--nexus-primary);">
              <ion-icon [name]="item.icon" style="font-size: 1.5rem;"></ion-icon>
            </div>
            <div style="flex: 1; overflow: hidden;">
              <h4 style="margin: 0; font-size: 1rem; color: var(--nexus-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.title }}</h4>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--nexus-muted-2);">{{ item.subtitle }}</p>
            </div>
            <div style="font-size: 0.8rem; color: var(--nexus-muted-2); margin-left: 8px; white-space: nowrap;">
              {{ item.date | date:'shortDate' }}
            </div>
          </a>
        }
      </div>
    }
  </div>
</ion-content>
<app-bottom-tabs></app-bottom-tabs>
  `
})
export class DashboardPage implements OnInit {
  firstName = '';
  
  recentWorkspaces: Workspace[] = [];
  loadingSpaces = true;
  
  stats: DashboardStats | null = null;
  recentActivity: ActivityItem[] = [];
  loadingStats = true;

  constructor(
    private supabase: SupabaseService, 
    private workspacesService: WorkspacesService,
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const user = this.supabase.currentUser;
    const fullName = user?.user_metadata?.['full_name'] ?? '';
    this.firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario';
    
    this.loadRecentData(user?.id);
  }

  async loadRecentData(userId?: string) {
    if (!userId) return;

    // Load Workspaces
    this.loadingSpaces = true;
    this.workspacesService.getWorkspaces().then(allSpaces => {
      this.recentWorkspaces = allSpaces.slice(0, 3);
      this.loadingSpaces = false;
    }).catch(e => {
      console.error('Error loading workspaces', e);
      this.toastService.showError('No se pudieron cargar los espacios');
      this.loadingSpaces = false;
    });

    // Load Stats and Activity
    this.loadingStats = true;
    try {
      const [statsData, activityData] = await Promise.all([
        this.dashboardService.getDashboardStats(userId),
        this.dashboardService.getRecentActivity(userId)
      ]);
      this.stats = statsData;
      this.recentActivity = activityData;
    } catch (e) {
      console.error('Error loading dashboard stats', e);
      this.toastService.showError('Error al cargar las estadísticas');
    } finally {
      this.loadingStats = false;
    }
  }
}
