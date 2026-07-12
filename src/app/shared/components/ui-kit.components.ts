import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonHeader, IonIcon,
  IonInput, IonItem, IonLabel, IonProgressBar, IonSearchbar, IonSkeletonText, IonToolbar
} from '@ionic/angular/standalone';
import { DocumentItem, QuizItem, Subject, TaskItem, Workspace } from '../../core/models/ui.models';

@Component({
  selector: 'app-logo', standalone: true, imports: [IonIcon], styleUrls: ['./ui-kit.components.scss'],
  template: `<div class="brand" [class.compact]="compact"><span class="brand-orb"><ion-icon name="sparkles"></ion-icon></span>@if (!compact) {<span>Nexus <b>AI</b></span>}</div>`
})
export class LogoComponent { @Input() compact = false; }

@Component({
  selector: 'app-header', standalone: true, imports: [IonHeader, IonToolbar, IonIcon, IonButton, LogoComponent, RouterLink], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-header class="ion-no-border"><ion-toolbar>
    @if (showBack) {
      <ion-button class="back-btn header-icon-button" fill="clear" slot="start" [routerLink]="backLink" aria-label="Volver"><ion-icon name="chevron-back"></ion-icon></ion-button>
    } @else {
      <app-logo slot="start"></app-logo>
    }
    <div slot="end" class="header-actions">
      <ion-button class="header-icon-button" fill="clear" aria-label="Notificaciones"><ion-icon name="notifications-outline"></ion-icon></ion-button>
      <div class="header-avatar" [routerLink]="'/profile'">J</div>
    </div>
  </ion-toolbar></ion-header>`
})
export class AppHeaderComponent { @Input() showBack = false; @Input() backLink = '/dashboard'; }

@Component({
  selector: 'app-bottom-tabs', standalone: true, imports: [IonIcon, RouterLink, RouterLinkActive], styleUrls: ['./ui-kit.components.scss'],
  template: `<nav class="bottom-tabs" aria-label="Navegación principal">
    <a routerLink="/dashboard" routerLinkActive="active"><ion-icon name="home-outline"></ion-icon><span>Inicio</span></a>
    <a routerLink="/library" routerLinkActive="active"><ion-icon name="library-outline"></ion-icon><span>Biblioteca</span></a>
    <a routerLink="/chat" routerLinkActive="active"><ion-icon name="chatbubble-ellipses-outline"></ion-icon><span>Chat</span></a>
    <a routerLink="/tasks" routerLinkActive="active"><ion-icon name="checkbox-outline"></ion-icon><span>Tareas</span></a>
    <a routerLink="/profile" routerLinkActive="active"><ion-icon name="person-outline"></ion-icon><span>Perfil</span></a>
  </nav>`
})
export class BottomTabsComponent {}

@Component({
  selector: 'app-primary-button', standalone: true, imports: [IonButton, IonIcon, RouterLink], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-button expand="block" class="primary-button" [routerLink]="routerLink" [type]="type" [disabled]="disabled">@if (icon) {<ion-icon slot="start" [name]="icon"></ion-icon>}<ng-content></ng-content></ion-button>`
})
export class PrimaryButtonComponent { @Input() routerLink?: string; @Input() icon?: string; @Input() type: 'button' | 'submit' = 'button'; @Input() disabled = false; }

@Component({
  selector: 'app-secondary-button', standalone: true, imports: [IonButton, IonIcon, RouterLink], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-button expand="block" fill="outline" class="secondary-button" [routerLink]="routerLink">@if (icon) {<ion-icon slot="start" [name]="icon"></ion-icon>}<ng-content></ng-content></ion-button>`
})
export class SecondaryButtonComponent { @Input() routerLink?: string; @Input() icon?: string; }

@Component({
  selector: 'app-input', standalone: true, imports: [IonInput, IonItem, IonIcon], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-item class="nexus-input" lines="none">@if (icon) {<ion-icon slot="start" [name]="icon"></ion-icon>}<ion-input [type]="type" [label]="label" labelPlacement="floating" [placeholder]="placeholder" [value]="value" (ionInput)="onInput($event)"></ion-input></ion-item>`
})
export class AppInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() icon?: string;
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  onInput(ev: Event) { const val = (ev as CustomEvent).detail.value ?? ''; this.value = val; this.valueChange.emit(val); }
}


@Component({
  selector: 'app-search-bar', standalone: true, imports: [IonSearchbar], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-searchbar class="nexus-search" [placeholder]="placeholder" showClearButton="focus"></ion-searchbar>`
})
export class SearchBarComponent { @Input() placeholder = 'Buscar en Nexus AI'; }

@Component({
  selector: 'app-status-badge', standalone: true, imports: [IonBadge], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-badge [class]="tone">{{ label }}</ion-badge>`
})
export class StatusBadgeComponent { @Input() label = ''; @Input() tone = 'cyan'; }

@Component({
  selector: 'app-workspace-card', standalone: true, imports: [IonCard, IonCardContent, IonIcon, RouterLink], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-card class="entity-card workspace-card" [routerLink]="['/workspaces', workspace.id]"><ion-card-content><div class="entity-icon" [style.--accent]="workspace.color"><ion-icon [name]="workspace.icon"></ion-icon></div><div class="entity-copy"><h3>{{ workspace.title }}</h3><p>{{ workspace.description }}</p><div class="workspace-metrics"><span><ion-icon name="document-text-outline"></ion-icon>{{ workspace.count }}</span><span><ion-icon name="checkmark-circle-outline"></ion-icon>{{ 0 }}</span></div></div><ion-icon class="chevron" name="chevron-forward"></ion-icon></ion-card-content></ion-card>`
})
export class WorkspaceCardComponent { @Input({ required: true }) workspace!: Workspace; }


@Component({
  selector: 'app-subject-card', standalone: true, imports: [IonCard, IonCardContent, IonProgressBar, RouterLink], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-card class="entity-card subject-card" [routerLink]="['/subjects', subject.id]"><ion-card-content><div class="subject-top"><span class="subject-code" [style.color]="subject.color">{{ subject.code }}</span><span>{{ subject.progress }}%</span></div><h3>{{ subject.title }}</h3><p>{{ subject.next }}</p><ion-progress-bar [value]="subject.progress / 100" [style.--progress-background]="subject.color"></ion-progress-bar></ion-card-content></ion-card>`
})
export class SubjectCardComponent { @Input({ required: true }) subject!: Subject; }

@Component({
  selector: 'app-document-card', standalone: true, imports: [IonCard, IonCardContent, IonIcon, RouterLink, StatusBadgeComponent], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-card class="entity-card document-card" [routerLink]="['/documents', document.id]"><ion-card-content><div class="file-icon" [style.--accent]="document.color"><ion-icon name="document-text-outline"></ion-icon></div><div class="entity-copy"><h3>{{ document.title }}</h3><p>{{ document.meta }}</p><app-status-badge [label]="document.subject"></app-status-badge></div><ion-icon class="more" name="ellipsis-vertical"></ion-icon></ion-card-content></ion-card>`
})
export class DocumentCardComponent { @Input({ required: true }) document!: DocumentItem; }

@Component({
  selector: 'app-task-card', standalone: true, imports: [IonCard, IonCardContent, IonIcon, StatusBadgeComponent], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-card class="entity-card task-card" [class.done]="task.done"><ion-card-content><button class="task-check" [attr.aria-label]="task.done ? 'Completada' : 'Pendiente'"><ion-icon [name]="task.done ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon></button><div class="entity-copy"><h3>{{ task.title }}</h3><p>{{ task.subject }} · {{ task.due }}</p></div><app-status-badge [label]="task.priority" [tone]="task.priority === 'Alta' ? 'danger' : 'purple'"></app-status-badge></ion-card-content></ion-card>`
})
export class TaskCardComponent { @Input({ required: true }) task!: TaskItem; }

@Component({
  selector: 'app-quiz-card', standalone: true, imports: [IonCard, IonCardContent, IonIcon, RouterLink, StatusBadgeComponent], styleUrls: ['./ui-kit.components.scss'],
  template: `<ion-card class="entity-card quiz-card" routerLink="/quiz"><ion-card-content><div class="entity-icon quiz"><ion-icon name="help-circle-outline"></ion-icon></div><div class="entity-copy"><h3>{{ quiz.title }}</h3><p>{{ quiz.questions }} preguntas @if (quiz.score) {<span>· {{ quiz.score }}%</span>}</p></div><app-status-badge [label]="quiz.status" tone="purple"></app-status-badge></ion-card-content></ion-card>`
})
export class QuizCardComponent { @Input({ required: true }) quiz!: QuizItem; }

@Component({
  selector: 'app-flashcard', standalone: true, imports: [IonIcon], styleUrls: ['./ui-kit.components.scss'],
  template: `<button class="flashcard" [class.flipped]="flipped" (click)="flipped = !flipped"><span class="flash-tag">{{ flipped ? 'Respuesta' : 'Concepto' }}</span><ion-icon name="sync-outline"></ion-icon><h2>{{ flipped ? back : front }}</h2><p>Toca para voltear</p></button>`
})
export class FlashcardComponent { @Input() front = ''; @Input() back = ''; flipped = false; }

@Component({
  selector: 'app-chat-bubble', standalone: true, imports: [IonIcon], styleUrls: ['./ui-kit.components.scss'],
  template: `<div class="message" [class.user]="role === 'user'"><div class="message-avatar"><ion-icon [name]="role === 'user' ? 'person' : 'sparkles'"></ion-icon></div><div class="bubble">{{ text }}</div></div>`
})
export class ChatBubbleComponent { @Input() role: 'user' | 'assistant' = 'assistant'; @Input() text = ''; }

@Component({
  selector: 'app-empty-state', standalone: true, imports: [IonIcon], styleUrls: ['./ui-kit.components.scss'],
  template: `<div class="state"><ion-icon [name]="icon"></ion-icon><h3>{{ title }}</h3><p>{{ text }}</p></div>`
})
export class EmptyStateComponent { @Input() icon = 'sparkles-outline'; @Input() title = 'Todavía no hay contenido'; @Input() text = 'Crea tu primer elemento para verlo aquí.'; }

@Component({
  selector: 'app-loading-state', standalone: true, imports: [IonSkeletonText], styleUrls: ['./ui-kit.components.scss'],
  template: `<div class="loading-state"><ion-skeleton-text animated></ion-skeleton-text><ion-skeleton-text animated></ion-skeleton-text><ion-skeleton-text animated></ion-skeleton-text></div>`
})
export class LoadingStateComponent {}
