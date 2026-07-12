import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, PrimaryButtonComponent, StatusBadgeComponent } from '../../shared/components/ui-kit.components';
import { FlashcardsService, FlashcardDB } from '../../core/services/flashcards.service';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, AppHeaderComponent, PrimaryButtonComponent, StatusBadgeComponent],
  styleUrls: ['../pages.scss'],
  styles: [`
    .flashcard-container {
      background: transparent;
      perspective: 1000px;
      width: 100%;
      height: 400px;
      margin: 0 auto;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .slide-out-left {
      transform: translateX(-100%) rotate(-10deg);
      opacity: 0;
    }
    .slide-out-right {
      transform: translateX(100%) rotate(10deg);
      opacity: 0;
    }
    .slide-in-right {
      animation: slideInRight 0.3s forwards;
    }
    .slide-in-left {
      animation: slideInLeft 0.3s forwards;
    }
    @keyframes slideInRight {
      from { transform: translateX(100%) rotate(10deg); opacity: 0; }
      to { transform: translateX(0) rotate(0); opacity: 1; }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%) rotate(-10deg); opacity: 0; }
      to { transform: translateX(0) rotate(0); opacity: 1; }
    }
    .flashcard-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
      transform-style: preserve-3d;
      cursor: pointer;
    }
    .flashcard-container.flipped .flashcard-inner {
      transform: rotateY(180deg);
    }
    .flashcard-front, .flashcard-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 3rem 2rem;
      border-radius: 16px;
      overflow: hidden;
    }
    .flashcard-back {
      transform: rotateY(180deg);
    }
    .card-content {
      max-height: 100%;
      overflow-y: auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    /* Hide scrollbar for cleaner look but keep functionality */
    .card-content::-webkit-scrollbar {
      width: 6px;
    }
    .card-content::-webkit-scrollbar-thumb {
      background: var(--nexus-border);
      border-radius: 4px;
    }
  `],
  template: `
  <app-header [showBack]="true" backLink="/library"></app-header>
  <ion-content class="nexus-content">
    <div style="max-width: 600px; margin: 0 auto; padding-top: 1rem;">
      <span class="eyebrow">Flashcards</span>
      <h1 class="page-title">Estudio interactivo</h1>

      @if (loading) {
        <div style="display: flex; justify-content: center; padding: 3rem;">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>
      } @else if (errorMsg) {
        <div style="color: var(--ion-color-danger); text-align: center; padding: 2rem;">
          {{ errorMsg }}
        </div>
      } @else if (flashcards.length === 0) {
        <div style="padding: 2rem; text-align: center; color: var(--nexus-muted-2);">
          No hay flashcards para este documento.
        </div>
      } @else {
        <div style="text-align: center; margin-bottom: 1rem; color: var(--nexus-muted-2);">
          Tarjeta {{ currentIndex + 1 }} de {{ flashcards.length }}
        </div>

        <div class="flashcard-container {{ animationClass }}" [class.flipped]="isFlipped" (click)="toggleFlip()">
          <div class="flashcard-inner">
            <!-- FRONT -->
            <div class="flashcard-front nexus-card">
              <div style="position: absolute; top: 1.25rem; right: 1.25rem; z-index: 2;">
                <app-status-badge [label]="flashcards[currentIndex].difficulty" [tone]="getDifficultyType(flashcards[currentIndex].difficulty)"></app-status-badge>
              </div>
              <div style="position: absolute; top: 1.25rem; left: 1.25rem; font-size: 0.8rem; color: var(--nexus-muted-2); text-transform: uppercase; z-index: 2;">
                {{ flashcards[currentIndex].category }}
              </div>
              <div class="card-content">
                <h2 style="margin: 0; font-size: 1.6rem; color: var(--nexus-text); font-weight: 600;">{{ flashcards[currentIndex].question }}</h2>
                <p style="margin-top: 1.5rem; color: var(--nexus-muted-2); font-size: 0.95rem;">
                  <ion-icon name="hand-right-outline" style="vertical-align: middle;"></ion-icon> Toca para voltear
                </p>
              </div>
            </div>

            <!-- BACK -->
            <div class="flashcard-back nexus-card">
              <div style="position: absolute; top: 1.25rem; right: 1.25rem; z-index: 2;">
                <app-status-badge [label]="flashcards[currentIndex].difficulty" [tone]="getDifficultyType(flashcards[currentIndex].difficulty)"></app-status-badge>
              </div>
              <div style="position: absolute; top: 1.25rem; left: 1.25rem; font-size: 0.8rem; color: var(--nexus-muted-2); text-transform: uppercase; z-index: 2;">
                {{ flashcards[currentIndex].category }}
              </div>
              <div class="card-content">
                <p style="margin: 0; font-size: 1.25rem; color: var(--nexus-text); line-height: 1.7;">{{ flashcards[currentIndex].answer }}</p>
                <div style="margin-top: 1.5rem; color: var(--nexus-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                  <ion-icon name="sync-outline"></ion-icon> Voltear de nuevo
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem;">
          <app-primary-button [disabled]="currentIndex === 0" (click)="prevCard()" icon="chevron-back-outline">Anterior</app-primary-button>
          <app-primary-button [disabled]="currentIndex === flashcards.length - 1" (click)="nextCard()" icon="chevron-forward-outline">Siguiente</app-primary-button>
        </div>
      }
    </div>
  </ion-content>
  `
})
export class FlashcardsPage implements OnInit {
  documentId: string | null = null;
  flashcards: FlashcardDB[] = [];
  loading = true;
  errorMsg = '';
  
  currentIndex = 0;
  isFlipped = false;
  
  animating = false;
  animationClass = '';

  constructor(
    private route: ActivatedRoute,
    private flashcardsService: FlashcardsService
  ) {}

  ngOnInit() {
    this.documentId = this.route.snapshot.paramMap.get('id');
    if (this.documentId) {
      this.loadFlashcards(this.documentId);
    } else {
      this.errorMsg = 'ID de documento no proporcionado.';
      this.loading = false;
    }
  }

  async loadFlashcards(documentId: string) {
    this.loading = true;
    this.errorMsg = '';
    try {
      this.flashcards = await this.flashcardsService.getFlashcardsByDocument(documentId);
    } catch (e: any) {
      console.error('Error loading flashcards', e);
      this.errorMsg = 'Error al cargar las flashcards: ' + (e.message || '');
    } finally {
      this.loading = false;
    }
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
  }

  nextCard() {
    if (this.currentIndex < this.flashcards.length - 1 && !this.animating) {
      this.animating = true;
      this.animationClass = 'slide-out-left';
      
      setTimeout(() => {
        this.currentIndex++;
        this.isFlipped = false;
        this.animationClass = 'slide-in-right';
        
        setTimeout(() => {
          this.animationClass = '';
          this.animating = false;
        }, 300);
      }, 300);
    }
  }

  prevCard() {
    if (this.currentIndex > 0 && !this.animating) {
      this.animating = true;
      this.animationClass = 'slide-out-right';
      
      setTimeout(() => {
        this.currentIndex--;
        this.isFlipped = false;
        this.animationClass = 'slide-in-left';
        
        setTimeout(() => {
          this.animationClass = '';
          this.animating = false;
        }, 300);
      }, 300);
    }
  }

  getDifficultyType(difficulty: string): string {
    switch(difficulty) {
      case 'easy': return 'cyan';
      case 'medium': return 'purple';
      case 'hard': return 'danger';
      default: return 'cyan';
    }
  }
}
