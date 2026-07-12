import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../../shared/components/ui-kit.components';
import { DashboardService } from '../../core/services/dashboard.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-ai-flashcards',
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, RouterLink, AppHeaderComponent, DatePipe],
  styleUrls: ['../pages.scss'],
  template: `
<app-header [showBack]="true" backLink="/dashboard"></app-header>
<ion-content class="nexus-content">
  <div class="content-pad">
    <div style="text-align: center; margin-bottom: 2rem;">
      <span class="eyebrow">Estadísticas AI</span>
      <h1 class="page-title" style="margin-top: 0.5rem;">Grupos de Flashcards</h1>
    </div>

    @if (loading) {
      <div style="padding: 2rem; text-align: center;"><ion-spinner name="crescent" color="primary"></ion-spinner></div>
    } @else if (items.length === 0) {
      <div style="padding: 3rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px;">
        <ion-icon name="albums-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
        <p style="color: var(--nexus-muted-2); margin: 0;">Aún no has generado flashcards.</p>
      </div>
    } @else {
      <div style="display: flex; flex-direction: column; gap: 12px;">
        @for (item of items; track item.document_id) {
          <a class="nexus-card" [routerLink]="['/flashcards', item.document_id]" style="display: flex; align-items: center; padding: 1rem; text-decoration: none; border-radius: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(var(--ion-color-primary-rgb), 0.1); display: flex; align-items: center; justify-content: center; margin-right: 12px; color: var(--nexus-primary);">
              <ion-icon name="albums-outline" style="font-size: 1.5rem;"></ion-icon>
            </div>
            <div style="flex: 1; overflow: hidden;">
              <h4 style="margin: 0; font-size: 1rem; color: var(--nexus-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.title }}</h4>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--nexus-muted-2);">{{ item.count }} flashcard(s)</p>
            </div>
            <div style="font-size: 0.8rem; color: var(--nexus-muted-2); margin-left: 8px; white-space: nowrap;">
              {{ item.created_at | date:'shortDate' }}
            </div>
          </a>
        }
      </div>
    }
  </div>
</ion-content>
  `
})
export class AiFlashcardsPage implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(private dashboardService: DashboardService, private supabase: SupabaseService) {}

  async ngOnInit() {
    try {
      const user = this.supabase.currentUser;
      if (user) {
        this.items = await this.dashboardService.getFlashcardsHistory(user.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }
}
