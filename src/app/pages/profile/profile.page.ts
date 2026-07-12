import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { SupabaseService } from '../../core/services/supabase.service';
import { ProfileService, ProfileStats } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, RouterLink, AppHeaderComponent, BottomTabsComponent],
  styleUrls: ['../pages.scss'],
  template: `
<app-header></app-header>
<ion-content class="nexus-content">
  @if (loading) {
    <div style="padding: 4rem 2rem; text-align: center;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <p style="color: var(--nexus-muted); margin-top: 1rem;">Cargando tu progreso...</p>
    </div>
  } @else {
    <div class="profile-hero">
      <div class="profile-avatar">{{ initial }}</div>
      <h1>{{ displayName }}</h1>
      <p style="color: var(--nexus-muted); margin: 4px 0 0; font-size: 0.85rem;">{{ email }}</p>
    </div>
    
    <div class="metric-grid">
      <div class="metric">
        <ion-icon name="checkbox-outline"></ion-icon>
        <strong>{{ stats.completedTasks }}/{{ stats.totalTasks }}</strong>
        <span>Tareas listas</span>
      </div>
      <div class="metric">
        <ion-icon name="school-outline"></ion-icon>
        <strong>{{ stats.activeStudyPlans }}</strong>
        <span>Planes activos</span>
      </div>
      <div class="metric">
        <ion-icon name="document-text-outline"></ion-icon>
        <strong>{{ stats.readyDocuments }}</strong>
        <span>Docs procesados</span>
      </div>
      <div class="metric">
        <ion-icon name="trophy-outline"></ion-icon>
        <strong>{{ stats.averageScore }}%</strong>
        <span>Promedio quiz</span>
      </div>
    </div>
    
    <div class="section-heading">
      <h2>Progreso Detallado</h2>
      <a routerLink="/settings">Configuración</a>
    </div>
    
    @if (hasActivity) {
      <div class="summary-block nexus-card">
        <h3>Estadísticas de Inteligencia Artificial</h3>
        <p style="margin-bottom: 12px; font-size: 0.85rem;">Aquí tienes un resumen de tus interacciones con Nexus AI:</p>
        <ul style="padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 8px;">
          <li>Has generado <strong>{{ stats.totalSummaries }} resúmenes</strong> de lectura.</li>
          <li>Has mantenido <strong>{{ stats.totalConversations }} chats</strong> con tus documentos.</li>
          <li>Has creado <strong>{{ stats.totalFlashcards }} flashcards</strong> para repasar.</li>
          <li>Has realizado <strong>{{ stats.totalQuizAttempts }} intentos</strong> de evaluación.</li>
        </ul>
      </div>
    } @else {
      <div style="padding: 2rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-bottom: 16px;">
        <ion-icon name="planet-outline" style="font-size: 2.5rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
        <h3 style="margin:0 0 0.5rem 0; color: var(--nexus-text);">¡Empieza a explorar!</h3>
        <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.85rem;">Aún no tienes actividad registrada. Sube un documento y genera resúmenes para ver tus estadísticas aquí.</p>
      </div>
    }

    <div class="two-col" style="margin-bottom: 30px;">
      <a class="action-tile nexus-card" routerLink="/study-plan">
        <ion-icon name="calendar-outline"></ion-icon>
        <h3>Mi plan</h3>
        <p>Tus rutinas de estudio</p>
      </a>
      <a class="action-tile nexus-card" routerLink="/quiz-history">
        <ion-icon name="stats-chart-outline"></ion-icon>
        <h3>Evaluaciones</h3>
        <p>Revisa tus notas</p>
      </a>
    </div>
  }
</ion-content>
<app-bottom-tabs></app-bottom-tabs>
  `
})
export class ProfilePage implements OnInit {
  displayName = '';
  initial = '';
  email = '';
  loading = true;
  stats!: ProfileStats;
  hasActivity = false;

  constructor(
    private supabase: SupabaseService,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    this.loading = true;
    try {
      const user = this.supabase.currentUser;
      if (user) {
        this.displayName = user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Usuario';
        this.initial = this.displayName.charAt(0).toUpperCase();
        this.email = user.email || '';
      }

      this.stats = await this.profileService.getProfileStats();
      
      this.hasActivity = this.stats.totalDocuments > 0 || 
                         this.stats.totalSummaries > 0 || 
                         this.stats.totalConversations > 0 || 
                         this.stats.totalQuizzes > 0 || 
                         this.stats.totalFlashcards > 0 || 
                         this.stats.totalTasks > 0;
                         
    } catch (e) {
      console.error('Error loading profile', e);
    } finally {
      this.loading = false;
    }
  }
}
