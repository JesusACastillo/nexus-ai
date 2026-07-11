import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface QuizDB {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  difficulty: string;
  total_questions: number;
  created_at: string;
}

export interface QuizQuestionDB {
  id: string;
  user_id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  question_order: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizzesService {
  constructor(private supabase: SupabaseService) {}

  async generateQuiz(documentId: string, difficulty: string = 'medium', totalQuestions: number = 5): Promise<{ quiz: QuizDB, questions: QuizQuestionDB[] }> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client.functions.invoke('generate-quiz', {
      body: { 
        document_id: documentId,
        difficulty,
        total_questions: totalQuestions
      }
    });

    if (error) {
      throw new Error(error.message || 'Error al invocar la función de generación de quiz');
    }

    if (data && data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async getQuizById(quizId: string): Promise<QuizDB> {
    const { data, error } = await this.supabase.client
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error) throw error;
    return data;
  }

  async getQuestionsByQuiz(quizId: string): Promise<QuizQuestionDB[]> {
    const { data, error } = await this.supabase.client
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
