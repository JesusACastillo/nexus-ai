import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonFab, IonFabButton, IonIcon, IonSpinner, 
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
  IonAccordionGroup, IonAccordion, IonCheckbox, IonBadge
} from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { StudyPlanService, StudyPlan, StudyPlanItem } from '../../core/services/study-plan.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonFab, IonFabButton, IonIcon, 
    IonSpinner, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
    IonAccordionGroup, IonAccordion, IonCheckbox, IonBadge,
    AppHeaderComponent, BottomTabsComponent
  ],
  styleUrls: ['../pages.scss'],
  template: `
<app-header [showBack]="true" backLink="/dashboard"></app-header>
<ion-content class="nexus-content">
  <div class="content-pad">
    <span class="eyebrow">Organización IA</span>
    <h1 class="page-title">Mis Planes de Estudio</h1>
    <p class="page-subtitle">Rutas generadas inteligentemente para ti.</p>

    @if (loading) {
      <div style="padding: 2rem; text-align: center;"><ion-spinner name="crescent" color="primary"></ion-spinner></div>
    } @else if (plans.length === 0) {
      <div style="padding: 3rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin: 2rem 0;">
        <ion-icon name="calendar-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
        <h3 style="margin:0 0 0.5rem 0; color: var(--nexus-text);">Ningún plan aún</h3>
        <p style="color: var(--nexus-muted-2); margin: 0; font-size: 0.9rem;">Genera un plan de estudio y deja que la IA te organice los temas por día.</p>
      </div>
    } @else {
      <ion-accordion-group style="margin-top: 1.5rem;" [multiple]="true">
        @for (plan of plans; track plan.id) {
          <ion-accordion [value]="plan.id" class="nexus-accordion" (click)="loadPlanItems(plan)">
            <ion-item slot="header" color="transparent" lines="none" class="accordion-header">
              <ion-icon name="map-outline" slot="start" style="color: var(--ion-color-primary);"></ion-icon>
              <ion-label>
                <h2 style="font-weight: 600; font-size: 1.1rem; color: var(--nexus-text);">{{ plan.title }}</h2>
                <p style="color: var(--nexus-muted-2);">{{ plan.days }} días • Dificultad: {{ plan.difficulty }}</p>
              </ion-label>
            </ion-item>
            <div class="ion-padding accordion-content" slot="content" style="background: var(--nexus-bg); padding-top: 0;">
              <p style="font-size: 0.9rem; color: var(--nexus-muted-2); margin-top: 0;">{{ plan.description }}</p>
              
              @if (plan.loadingItems) {
                <div style="text-align: center; padding: 1rem;"><ion-spinner name="dots"></ion-spinner></div>
              } @else if (plan.items) {
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  @for (item of plan.items; track item.id) {
                    <div class="nexus-card" style="padding: 1rem; border-radius: 12px; display: flex; align-items: flex-start; gap: 12px;" [style.opacity]="item.is_completed ? '0.6' : '1'">
                      <ion-checkbox [checked]="item.is_completed" (ionChange)="toggleItem(item)" style="margin-top: 4px;"></ion-checkbox>
                      <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                          <ion-badge color="primary">Día {{ item.day_number }}</ion-badge>
                          <span style="font-size: 0.75rem; color: var(--nexus-muted-2); text-transform: uppercase;">
                            <ion-icon [name]="getIconForType(item.activity_type)"></ion-icon> {{ item.estimated_minutes }} min
                          </span>
                        </div>
                        <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: var(--nexus-text);" [style.textDecoration]="item.is_completed ? 'line-through' : 'none'">{{ item.title }}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--nexus-muted-2);">{{ item.description }}</p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </ion-accordion>
        }
      </ion-accordion-group>
    }
  </div>

  <ion-fab slot="fixed" vertical="bottom" horizontal="end" style="margin-bottom: 60px;">
    <ion-fab-button (click)="openModal()">
      <ion-icon name="add"></ion-icon>
    </ion-fab-button>
  </ion-fab>

  <ion-modal [isOpen]="isModalOpen" (didDismiss)="isModalOpen = false" initialBreakpoint="1" [breakpoints]="[0, 1]" class="nexus-modal">
    <ng-template>
      <ion-header class="ion-no-border">
        <ion-toolbar style="--background: var(--nexus-bg);">
          <ion-title style="color: var(--nexus-text); font-weight: 600;">Nuevo Plan</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="isModalOpen = false" [disabled]="generating" style="color: var(--nexus-muted);">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content style="--background: var(--nexus-bg);">
        <div class="content-pad" style="padding-top: 1rem; padding-bottom: 2rem;">
          <p style="color: var(--nexus-muted-2); font-size: 0.9rem; margin-top: 0;">Selecciona una materia o documento para generar tu ruta de aprendizaje.</p>

          <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-label position="stacked" style="color: var(--nexus-muted);">Tipo de fuente</ion-label>
            <ion-select [(ngModel)]="form.sourceType" interface="popover" style="color: var(--nexus-text);">
              <ion-select-option value="document">Un Documento específico</ion-select-option>
              <ion-select-option value="subject">Toda una Materia</ion-select-option>
            </ion-select>
          </ion-item>

          @if (form.sourceType === 'document') {
            <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
              <ion-label position="stacked" style="color: var(--nexus-muted);">Documento</ion-label>
              <ion-select [(ngModel)]="form.documentId" interface="popover" placeholder="Selecciona un documento" style="color: var(--nexus-text);">
                @for (doc of documents; track doc.id) {
                  <ion-select-option [value]="doc.id">{{ doc.title }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
          } @else {
            <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
              <ion-label position="stacked" style="color: var(--nexus-muted);">Materia</ion-label>
              <ion-select [(ngModel)]="form.subjectId" interface="popover" placeholder="Selecciona una materia" style="color: var(--nexus-text);">
                @for (sub of subjects; track sub.id) {
                  <ion-select-option [value]="sub.id">{{ sub.name }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
          }

          <div style="display: flex; gap: 12px; margin-bottom: 1rem;">
            <ion-item class="nexus-input-item" lines="none" style="flex: 1; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
              <ion-label position="stacked" style="color: var(--nexus-muted);">Días</ion-label>
              <ion-select [(ngModel)]="form.days" interface="popover" style="color: var(--nexus-text);">
                <ion-select-option [value]="3">3 días</ion-select-option>
                <ion-select-option [value]="5">5 días</ion-select-option>
                <ion-select-option [value]="7">7 días</ion-select-option>
                <ion-select-option [value]="14">14 días</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item class="nexus-input-item" lines="none" style="flex: 1; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
              <ion-label position="stacked" style="color: var(--nexus-muted);">Dificultad</ion-label>
              <ion-select [(ngModel)]="form.difficulty" interface="popover" style="color: var(--nexus-text);">
                <ion-select-option value="easy">Fácil</ion-select-option>
                <ion-select-option value="medium">Media</ion-select-option>
                <ion-select-option value="hard">Difícil</ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1.5rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-label position="stacked" style="color: var(--nexus-muted);">Objetivo (opcional)</ion-label>
            <ion-input [(ngModel)]="form.goal" placeholder="Ej: Prepararme para examen final" style="color: var(--nexus-text);"></ion-input>
          </ion-item>

          <ion-button expand="block" shape="round" class="nexus-btn-primary" (click)="generatePlan()" [disabled]="generating || (!form.documentId && !form.subjectId)">
            @if (generating) {
              <ion-spinner name="crescent" style="margin-right: 8px;"></ion-spinner> Generando con IA...
            } @else {
              Generar Plan Mágico <ion-icon name="sparkles" slot="end"></ion-icon>
            }
          </ion-button>
        </div>
      </ion-content>
    </ng-template>
  </ion-modal>

</ion-content>
<app-bottom-tabs></app-bottom-tabs>
  `
})
export class StudyPlanPage implements OnInit {
  plans: (StudyPlan & { items?: StudyPlanItem[], loadingItems?: boolean })[] = [];
  loading = true;
  isModalOpen = false;
  generating = false;

  documents: any[] = [];
  subjects: any[] = [];

  form = {
    sourceType: 'document',
    documentId: '',
    subjectId: '',
    days: 7,
    difficulty: 'medium',
    goal: ''
  };

  constructor(
    private studyPlanService: StudyPlanService,
    private supabase: SupabaseService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadPlans();
    this.loadSources();
  }

  async loadPlans() {
    this.loading = true;
    try {
      this.plans = await this.studyPlanService.getPlans();
    } catch (e) {
      console.error(e);
      this.toastService.showError('Error al cargar planes de estudio');
    } finally {
      this.loading = false;
    }
  }

  async loadSources() {
    try {
      const user = this.supabase.currentUser;
      if (!user) return;
      const [docsRes, subsRes] = await Promise.all([
        this.supabase.client.from('documents').select('id, title').eq('user_id', user.id).eq('status', 'ready'),
        this.supabase.client.from('subjects').select('id, name').eq('user_id', user.id).eq('is_archived', false)
      ]);
      this.documents = docsRes.data || [];
      this.subjects = subsRes.data || [];
    } catch (e) {
      console.error(e);
      this.toastService.showError('Error al cargar documentos/materias');
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  async generatePlan() {
    if (!this.form.documentId && !this.form.subjectId) return;
    this.generating = true;
    try {
      const params: any = {
        days: this.form.days,
        difficulty: this.form.difficulty,
        goal: this.form.goal || 'Aprender y repasar los conceptos'
      };
      
      if (this.form.sourceType === 'document') {
        params.document_id = this.form.documentId;
      } else {
        params.subject_id = this.form.subjectId;
      }

      await this.studyPlanService.generatePlan(params);
      await this.loadPlans();
      this.isModalOpen = false;
      
      // Reset form
      this.form.documentId = '';
      this.form.subjectId = '';
    } catch (e) {
      console.error('Error generando plan', e);
      this.toastService.showError('Hubo un error al generar el plan. Intenta de nuevo.');
    } finally {
      this.generating = false;
    }
  }

  async loadPlanItems(plan: any) {
    if (plan.items) return; // Ya cargados
    plan.loadingItems = true;
    try {
      plan.items = await this.studyPlanService.getPlanItems(plan.id);
    } catch (e) {
      console.error(e);
      this.toastService.showError('Error al cargar detalles del plan');
    } finally {
      plan.loadingItems = false;
    }
  }

  async toggleItem(item: StudyPlanItem) {
    item.is_completed = !item.is_completed;
    try {
      await this.studyPlanService.updateItemCompletion(item.id, item.is_completed);
    } catch (e) {
      console.error('Error updating item', e);
      this.toastService.showError('No se pudo actualizar la tarea');
      // Revert if error
      item.is_completed = !item.is_completed;
    }
  }

  getIconForType(type: string) {
    const map: Record<string, string> = {
      'read': 'book-outline',
      'review': 'eye-outline',
      'quiz': 'help-circle-outline',
      'flashcards': 'albums-outline',
      'chat': 'chatbubbles-outline',
      'practice': 'create-outline'
    };
    return map[type] || 'ellipse-outline';
  }
}
