import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonProgressBar, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';
import { QuizzesService, QuizDB, QuizQuestionDB } from '../../core/services/quizzes.service';

@Component({ selector: 'app-quiz', standalone: true, imports: [IonContent, IonIcon, IonProgressBar, IonSpinner, AppHeaderComponent, PrimaryButtonComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/library"></app-header><ion-content class="nexus-content">
  @if (loading) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (quiz && questions.length > 0) {
    <ion-progress-bar class="quiz-progress" [value]="progress"></ion-progress-bar>
    <div class="quiz-meta">
      <span>Pregunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}</span>
    </div>
    
    <span class="eyebrow">{{ quiz.title }}</span>
    <h1 class="page-title">{{ currentQuestion.question_text }}</h1>
    
    @if (!validated) {
      <p class="page-subtitle">Selecciona una respuesta.</p>
      @for (option of currentQuestion.options; track option; let i = $index) {
        <button 
          class="option-card" 
          [class.selected]="selectedOption === option"
          (click)="selectOption(option)">
          <span class="letter">{{ getLetter(i) }}</span>
          {{ option }}
        </button>
      }
      <div style="height:16px"></div>
      <app-primary-button [disabled]="!selectedOption" (click)="validateAnswer()">
        Validar <ion-icon name="checkmark-outline" slot="end"></ion-icon>
      </app-primary-button>
    } @else {
      <div style="padding: 1rem; border-radius: 8px; margin-bottom: 1rem;" [style.background]="isCorrect ? 'var(--ion-color-success-tint)' : 'var(--ion-color-danger-tint)'">
        <h3 style="margin-top: 0; color: #fff;">
          <ion-icon [name]="isCorrect ? 'checkmark-circle' : 'close-circle'"></ion-icon> 
          {{ isCorrect ? '¡Correcto!' : 'Incorrecto' }}
        </h3>
        <p style="color: #fff; opacity: 0.9;"><strong>La respuesta correcta es:</strong> {{ currentQuestion.correct_answer }}</p>
        <p style="color: #fff; opacity: 0.9;">{{ currentQuestion.explanation }}</p>
      </div>

      @for (option of currentQuestion.options; track option; let i = $index) {
        <button 
          class="option-card" 
          [class.selected]="selectedOption === option"
          [style.opacity]="option !== currentQuestion.correct_answer && option !== selectedOption ? '0.5' : '1'"
          [style.border-color]="option === currentQuestion.correct_answer ? 'var(--ion-color-success)' : (option === selectedOption && !isCorrect ? 'var(--ion-color-danger)' : '')">
          <span class="letter">{{ getLetter(i) }}</span>
          {{ option }}
        </button>
      }
      
      <div style="height:16px"></div>
      <app-primary-button (click)="nextQuestion()">
        {{ isLastQuestion ? 'Terminar Quiz' : 'Siguiente pregunta' }} <ion-icon name="arrow-forward" slot="end"></ion-icon>
      </app-primary-button>
    }
  } @else {
    <div style="padding: 2rem; text-align: center; color: var(--nexus-muted-2);">
      Error cargando el quiz o no tiene preguntas.
    </div>
  }
</ion-content>` })
export class QuizPage implements OnInit {
  quiz: QuizDB | null = null;
  questions: QuizQuestionDB[] = [];
  loading = true;
  
  currentQuestionIndex = 0;
  selectedOption: string | null = null;
  validated = false;
  isCorrect = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizzesService: QuizzesService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadQuiz(id);
    } else {
      this.loading = false;
    }
  }

  async loadQuiz(id: string) {
    try {
      this.quiz = await this.quizzesService.getQuizById(id);
      this.questions = await this.quizzesService.getQuestionsByQuiz(id);
    } catch (e) {
      console.error('Error loading quiz', e);
    } finally {
      this.loading = false;
    }
  }

  get currentQuestion(): QuizQuestionDB {
    return this.questions[this.currentQuestionIndex];
  }

  get progress(): number {
    if (this.questions.length === 0) return 0;
    return (this.currentQuestionIndex + 1) / this.questions.length;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  getLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C...
  }

  selectOption(option: string) {
    if (this.validated) return;
    this.selectedOption = option;
  }

  validateAnswer() {
    if (!this.selectedOption) return;
    this.isCorrect = this.selectedOption === this.currentQuestion.correct_answer;
    this.validated = true;
  }

  nextQuestion() {
    if (this.isLastQuestion) {
      this.router.navigate(['/library']);
    } else {
      this.currentQuestionIndex++;
      this.selectedOption = null;
      this.validated = false;
      this.isCorrect = false;
    }
  }
}
