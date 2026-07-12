import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonFab, IonFabButton, IonIcon, IonLabel, IonSegment, IonSegmentButton,
  IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonCheckbox,
  IonBadge, IonSpinner, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonInput, IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton
} from '@ionic/angular/standalone';
import { AppHeaderComponent, BottomTabsComponent } from '../../shared/components/ui-kit.components';
import { TasksService, TaskDB } from '../../core/services/tasks.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonFab, IonFabButton, IonIcon, IonLabel, 
    IonSegment, IonSegmentButton, IonList, IonItemSliding, IonItem, IonItemOptions, 
    IonItemOption, IonCheckbox, IonBadge, IonSpinner, IonModal, IonHeader, IonToolbar, 
    IonTitle, IonButtons, IonButton, IonInput, IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton,
    AppHeaderComponent, BottomTabsComponent
  ],
  styleUrls: ['../pages.scss'],
  template: `
<app-header></app-header>
<ion-content class="nexus-content">
  <div class="content-pad">
    <h1 class="page-title">Tareas</h1>
    <p class="page-subtitle">Tu agenda de aprendizaje, en orden.</p>
    
    <ion-segment [(ngModel)]="filter" (ionChange)="applyFilter()" style="margin-bottom: 1.5rem;">
      <ion-segment-button value="today"><ion-label>Hoy</ion-label></ion-segment-button>
      <ion-segment-button value="week"><ion-label>Semana</ion-label></ion-segment-button>
      <ion-segment-button value="all"><ion-label>Todas</ion-label></ion-segment-button>
    </ion-segment>

    @if (loading) {
      <div style="padding: 2rem; text-align: center;"><ion-spinner name="crescent" color="primary"></ion-spinner></div>
    } @else if (filteredTasks.length === 0) {
      <div style="padding: 3rem 1rem; text-align: center; border: 1px dashed var(--nexus-border); border-radius: 12px; margin-top: 1rem;">
        <ion-icon name="checkbox-outline" style="font-size: 3rem; color: var(--nexus-muted); margin-bottom: 1rem;"></ion-icon>
        <h3 style="margin:0 0 0.5rem 0; color: var(--nexus-text);">Todo al día</h3>
        <p style="color: var(--nexus-muted-2); margin: 0;">No tienes tareas para este filtro.</p>
      </div>
    } @else {
      <ion-list class="nexus-list" style="background: transparent;">
        @for (task of filteredTasks; track task.id) {
          <ion-item-sliding>
            <ion-item lines="none" class="nexus-card" style="margin-bottom: 12px; border-radius: 12px; --padding-start: 12px;">
              <ion-checkbox slot="start" [checked]="task.is_completed" (ionChange)="toggleTask(task)" style="margin-right: 16px;"></ion-checkbox>
              <ion-label [style.opacity]="task.is_completed ? '0.6' : '1'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <h3 style="margin: 0; font-weight: 600; font-size: 1.05rem; color: var(--nexus-text);" [style.textDecoration]="task.is_completed ? 'line-through' : 'none'">
                    {{ task.title }}
                  </h3>
                  <ion-badge [color]="getPriorityColor(task.priority)">{{ getPriorityLabel(task.priority) }}</ion-badge>
                </div>
                <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: var(--nexus-muted-2);" *ngIf="task.description">{{ task.description }}</p>
                
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <ion-badge color="light" *ngIf="task.due_date">
                    <ion-icon name="calendar-outline"></ion-icon> {{ task.due_date | date:'shortDate' }}
                  </ion-badge>
                  <ion-badge color="tertiary" *ngIf="task.study_plan_id">
                    <ion-icon name="school-outline"></ion-icon> Plan de Estudio
                  </ion-badge>
                </div>
              </ion-label>
            </ion-item>
            
            <ion-item-options side="end">
              <ion-item-option color="danger" (click)="deleteTask(task.id)">
                <ion-icon slot="icon-only" name="trash"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        }
      </ion-list>
    }
  </div>

  <ion-fab slot="fixed" vertical="bottom" horizontal="end" style="margin-bottom: 60px;">
    <ion-fab-button (click)="isModalOpen = true">
      <ion-icon name="add"></ion-icon>
    </ion-fab-button>
  </ion-fab>

  <ion-modal [isOpen]="isModalOpen" (didDismiss)="isModalOpen = false" initialBreakpoint="1" [breakpoints]="[0, 1]" class="nexus-modal">
    <ng-template>
      <ion-header class="ion-no-border">
        <ion-toolbar style="--background: var(--nexus-bg);">
          <ion-title style="color: var(--nexus-text); font-weight: 600;">Nueva Tarea</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="isModalOpen = false" [disabled]="saving" style="color: var(--nexus-muted);">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content style="--background: var(--nexus-bg);">
        <div class="content-pad" style="padding-top: 1rem; padding-bottom: 2rem;">
          
          <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-label position="stacked" style="color: var(--nexus-muted);">Título</ion-label>
            <ion-input [(ngModel)]="form.title" placeholder="¿Qué necesitas hacer?" style="color: var(--nexus-text);"></ion-input>
          </ion-item>

          <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-label position="stacked" style="color: var(--nexus-muted);">Descripción (Opcional)</ion-label>
            <ion-input [(ngModel)]="form.description" placeholder="Detalles de la tarea" style="color: var(--nexus-text);"></ion-input>
          </ion-item>

          <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-label position="stacked" style="color: var(--nexus-muted);">Prioridad</ion-label>
            <ion-select [(ngModel)]="form.priority" interface="popover" style="color: var(--nexus-text);">
              <ion-select-option value="high">Alta</ion-select-option>
              <ion-select-option value="medium">Media</ion-select-option>
              <ion-select-option value="low">Baja</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item class="nexus-input-item" lines="none" style="margin-bottom: 1.5rem; --background: var(--nexus-card-bg); border-radius: 12px; border: 1px solid var(--nexus-border);">
            <ion-label position="stacked" style="color: var(--nexus-muted);">Fecha límite</ion-label>
            <ion-datetime-button datetime="datetime" style="margin-top: 8px;"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime id="datetime" presentation="date" [(ngModel)]="form.due_date"></ion-datetime>
              </ng-template>
            </ion-modal>
          </ion-item>

          <ion-button expand="block" shape="round" class="nexus-btn-primary" (click)="saveTask()" [disabled]="saving || !form.title.trim()">
            @if (saving) {
              <ion-spinner name="crescent" style="margin-right: 8px;"></ion-spinner> Guardando...
            } @else {
              Crear Tarea
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
export class TasksPage implements OnInit {
  tasks: TaskDB[] = [];
  filteredTasks: TaskDB[] = [];
  loading = true;
  filter: 'today' | 'week' | 'all' = 'today';
  
  isModalOpen = false;
  saving = false;
  
  form = {
    title: '',
    description: '',
    priority: 'medium',
    due_date: new Date().toISOString()
  };

  constructor(private tasksService: TasksService) {}

  ngOnInit() {
    this.loadTasks();
  }

  ionViewWillEnter() {
    this.loadTasks(); // Reload when navigating back to tab
  }

  async loadTasks() {
    this.loading = true;
    try {
      this.tasks = await this.tasksService.getTasks();
      this.applyFilter();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const week = new Date(today);
    week.setDate(today.getDate() + 7);

    this.filteredTasks = this.tasks.filter(t => {
      if (this.filter === 'all') return true;
      
      if (!t.due_date) return false; // If it has no due date, maybe only show in 'all'
      
      const due = new Date(t.due_date);
      const dueDateZero = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      if (this.filter === 'today') {
        // Due today or overdue and not completed yet
        return dueDateZero.getTime() <= today.getTime() || (!t.is_completed && dueDateZero.getTime() <= today.getTime());
      } else if (this.filter === 'week') {
        return dueDateZero.getTime() >= today.getTime() && dueDateZero.getTime() <= week.getTime();
      }
      return true;
    });
  }

  async toggleTask(task: TaskDB) {
    try {
      const updated = await this.tasksService.toggleTaskCompleted(task);
      // Update locally
      task.is_completed = updated.is_completed;
      task.status = updated.status;
      task.completed_at = updated.completed_at;
    } catch (e) {
      console.error('Error toggling task', e);
      // Revert visually if error (usually handled automatically by bindings, but ionic checkboxes emit ionChange before model update)
    }
  }

  async deleteTask(id: string) {
    try {
      await this.tasksService.deleteTask(id);
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.applyFilter();
    } catch (e) {
      console.error('Error deleting task', e);
    }
  }

  async saveTask() {
    if (!this.form.title.trim()) return;
    
    this.saving = true;
    try {
      const newTask = await this.tasksService.createTask({
        title: this.form.title,
        description: this.form.description,
        priority: this.form.priority,
        due_date: this.form.due_date
      });
      
      this.tasks.unshift(newTask);
      this.applyFilter();
      this.isModalOpen = false;
      
      this.form = {
        title: '',
        description: '',
        priority: 'medium',
        due_date: new Date().toISOString()
      };
    } catch (e) {
      console.error('Error saving task', e);
    } finally {
      this.saving = false;
    }
  }

  getPriorityColor(priority: string) {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'success';
  }

  getPriorityLabel(priority: string) {
    if (priority === 'high') return 'Alta';
    if (priority === 'medium') return 'Media';
    return 'Baja';
  }
}
