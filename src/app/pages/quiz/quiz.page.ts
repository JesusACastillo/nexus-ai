import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonProgressBar, IonSpinner } from '@ionic/angular/standalone';
import { AppHeaderComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';
import { QuizzesService, QuizDB, QuizQuestionDB, SubmitQuizResponse } from '../../core/services/quizzes.service';
import { ToastService } from '../../core/services/toast.service';

@Component({ selector: 'app-quiz', standalone: true, imports: [IonContent, IonIcon, IonProgressBar, IonSpinner, AppHeaderComponent, PrimaryButtonComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/library"></app-header><ion-content class="nexus-content">
  @if (loading) {
    <div style="display: flex; justify-content: center; padding: 2rem;">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  } @else if (result) {
    <div style="padding: 1rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 0.5rem; color: var(--ion-color-primary);">{{ result.result.score }}%</h1>
        <p style="color: var(--nexus-muted-2);">Respondiste correctamente {{ result.result.correct_answers }} de {{ result.result.total_questions }} preguntas</p>
      </div>

      @for (ans of result.graded_answers; track ans.question_id; let i = $index) {
        <div class="nexus-card" style="margin-bottom: 1rem;" [style.border-left]="ans.is_correct ? '4px solid var(--ion-color-success)' : '4px solid var(--ion-color-danger)'">
          <h3 style="margin-top: 0;">Pregunta {{ i + 1 }}</h3>
          <p><strong>Tu respuesta:</strong> {{ ans.selected_answer || 'Ninguna' }}</p>
          
          @if (!ans.is_correct) {
            <p><strong>Respuesta correcta:</strong> {{ ans.correct_answer }}</p>
          }
          
          <div style="background: var(--nexus-bg-2); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
            <p style="margin: 0;"><em>{{ ans.explanation }}</em></p>
          </div>
        </div>
      }

      <div style="height: 16px;"></div>
      <app-primary-button routerLink="/library">Regresar a la biblioteca <ion-icon name="arrow-forward" slot="end"></ion-icon></app-primary-button>
      <div style="height: 32px;"></div>
    </div>
  } @else if (quiz && questions.length > 0) {
    <ion-progress-bar class="quiz-progress" [value]="progress"></ion-progress-bar>
    <div class="quiz-meta">
      <span>Pregunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}</span>
    </div>
    
    <span class="eyebrow">{{ quiz.title }}</span>
    <h1 class="page-title">{{ currentQuestion.question_text }}</h1>
    
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
    
    @if (submitting) {
      <div style="display: flex; justify-content: center; padding: 1rem;">
        <ion-spinner name="dots"></ion-spinner>
      </div>
    } @else {
      @if (isLastQuestion) {
        <app-primary-button [disabled]="!selectedOption" (click)="submitQuiz()">
          Finalizar Quiz <ion-icon name="checkmark-done-outline" slot="end"></ion-icon>
        </app-primary-button>
      } @else {
        <app-primary-button [disabled]="!selectedOption" (click)="nextQuestion()">
          Siguiente pregunta <ion-icon name="arrow-forward" slot="end"></ion-icon>
        </app-primary-button>
      }
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
  
  // Store user answers
  userAnswers: { question_id: string, selected_answer: string }[] = [];

  submitting = false;
  result: SubmitQuizResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizzesService: QuizzesService,
    private toastService: ToastService
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
      this.toastService.showError('Error al cargar el quiz');
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
    this.selectedOption = option;
  }

  nextQuestion() {
    if (!this.selectedOption) return;
    
    // Save current answer
    this.userAnswers.push({
      question_id: this.currentQuestion.id,
      selected_answer: this.selectedOption
    });

    if (!this.isLastQuestion) {
      this.currentQuestionIndex++;
      this.selectedOption = null; // reset for next question
    }
  }

  async submitQuiz() {
    if (!this.selectedOption || !this.quiz) return;
    
    // Save the last answer
    this.userAnswers.push({
      question_id: this.currentQuestion.id,
      selected_answer: this.selectedOption
    });

    this.submitting = true;
    try {
      this.result = await this.quizzesService.submitQuiz(this.quiz.id, this.userAnswers);
    } catch (error) {
      console.error('Error submitting quiz', error);
      this.toastService.showError('Error enviando el quiz. Por favor intenta de nuevo.');
      this.userAnswers.pop(); // Revert the last answer so user can try again
    } finally {
      this.submitting = false;
    }
  }
}
