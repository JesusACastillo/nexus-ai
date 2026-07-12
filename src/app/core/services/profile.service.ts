import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ProfileStats {
  totalDocuments: number;
  readyDocuments: number;
  totalSummaries: number;
  totalQuizzes: number;
  totalQuizAttempts: number;
  averageScore: number;
  totalFlashcards: number;
  totalConversations: number;
  activeStudyPlans: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private supabase: SupabaseService) {}

  async getProfileStats(): Promise<ProfileStats> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    
    const userId = user.id;

    const stats: ProfileStats = {
      totalDocuments: 0,
      readyDocuments: 0,
      totalSummaries: 0,
      totalQuizzes: 0,
      totalQuizAttempts: 0,
      averageScore: 0,
      totalFlashcards: 0,
      totalConversations: 0,
      activeStudyPlans: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0
    };

    try {
      const [
        docsCount,
        readyDocsCount,
        summariesCount,
        quizzesCount,
        attemptsRes,
        flashcardsCount,
        conversationsCount,
        activePlansCount,
        totalTasksCount,
        completedTasksCount
      ] = await Promise.all([
        this.supabase.client.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ready'),
        this.supabase.client.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('quiz_attempts').select('score').eq('user_id', userId),
        this.supabase.client.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('ai_conversations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('study_plans').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
        this.supabase.client.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_completed', true)
      ]);

      stats.totalDocuments = docsCount.count || 0;
      stats.readyDocuments = readyDocsCount.count || 0;
      stats.totalSummaries = summariesCount.count || 0;
      stats.totalQuizzes = quizzesCount.count || 0;
      stats.totalFlashcards = flashcardsCount.count || 0;
      stats.totalConversations = conversationsCount.count || 0;
      stats.activeStudyPlans = activePlansCount.count || 0;
      stats.totalTasks = totalTasksCount.count || 0;
      stats.completedTasks = completedTasksCount.count || 0;
      stats.pendingTasks = stats.totalTasks - stats.completedTasks;

      if (attemptsRes.data && attemptsRes.data.length > 0) {
        stats.totalQuizAttempts = attemptsRes.data.length;
        const sum = attemptsRes.data.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
        stats.averageScore = Math.round(sum / stats.totalQuizAttempts);
      }
    } catch (e) {
      console.error('Error fetching profile stats', e);
    }
    return stats;
  }
}
