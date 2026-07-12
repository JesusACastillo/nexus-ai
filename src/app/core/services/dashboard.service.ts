import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DashboardStats {
  totalDocuments: number;
  readyDocuments: number;
  totalSummaries: number;
  totalQuizzes: number;
  totalQuizAttempts: number;
  averageScore: number;
  totalFlashcards: number;
  totalConversations: number;
  activeSubjects: number;
}

export interface ActivityItem {
  id: string;
  type: 'document' | 'quiz_attempt' | 'conversation';
  title: string;
  subtitle: string;
  date: Date;
  icon: string;
  link: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private supabase: SupabaseService) {}

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const stats: DashboardStats = {
      totalDocuments: 0,
      readyDocuments: 0,
      totalSummaries: 0,
      totalQuizzes: 0,
      totalQuizAttempts: 0,
      averageScore: 0,
      totalFlashcards: 0,
      totalConversations: 0,
      activeSubjects: 0
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
        subjectsCount
      ] = await Promise.all([
        this.supabase.client.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ready'),
        this.supabase.client.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('quiz_attempts').select('score').eq('user_id', userId),
        this.supabase.client.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('ai_conversations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        this.supabase.client.from('subjects').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_archived', false)
      ]);

      stats.totalDocuments = docsCount.count || 0;
      stats.readyDocuments = readyDocsCount.count || 0;
      stats.totalSummaries = summariesCount.count || 0;
      stats.totalQuizzes = quizzesCount.count || 0;
      stats.totalFlashcards = flashcardsCount.count || 0;
      stats.totalConversations = conversationsCount.count || 0;
      stats.activeSubjects = subjectsCount.count || 0;

      if (attemptsRes.data && attemptsRes.data.length > 0) {
        stats.totalQuizAttempts = attemptsRes.data.length;
        const sum = attemptsRes.data.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
        stats.averageScore = Math.round(sum / stats.totalQuizAttempts);
      }
    } catch (e) {
      console.error('Error fetching dashboard stats', e);
    }
    return stats;
  }

  async getRecentActivity(userId: string): Promise<ActivityItem[]> {
    const activity: ActivityItem[] = [];

    try {
      const [docs, attempts, chats] = await Promise.all([
        this.supabase.client.from('documents').select('id, title, file_name, created_at, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        this.supabase.client.from('quiz_attempts').select('id, quiz_id, score, completed_at').eq('user_id', userId).order('completed_at', { ascending: false }).limit(5),
        this.supabase.client.from('ai_conversations').select('id, title, updated_at, document_id').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5)
      ]);

      if (docs.data) {
        docs.data.forEach(d => {
          activity.push({
            id: d.id,
            type: 'document',
            title: d.title || d.file_name,
            subtitle: d.status === 'ready' ? 'Documento listo' : 'Documento subido',
            date: new Date(d.created_at),
            icon: 'document-text-outline',
            link: '/documents/' + d.id
          });
        });
      }

      if (attempts.data) {
        attempts.data.forEach((a: any) => {
          activity.push({
            id: a.id,
            type: 'quiz_attempt',
            title: 'Quiz completado (' + (a.score || 0) + ' pts)',
            subtitle: 'Evaluación',
            date: new Date(a.completed_at),
            icon: 'help-circle-outline',
            link: '/quiz/' + a.quiz_id
          });
        });
      }

      if (chats.data) {
        chats.data.forEach(c => {
          activity.push({
            id: c.id,
            type: 'conversation',
            title: c.title || 'Conversación IA',
            subtitle: 'Chat contextual',
            date: new Date(c.updated_at),
            icon: 'chatbubbles-outline',
            link: '/chat/document/' + c.document_id
          });
        });
      }
      
      // Sort all descending
      activity.sort((a, b) => b.date.getTime() - a.date.getTime());
      
    } catch (e) {
      console.error('Error fetching recent activity', e);
    }

    return activity.slice(0, 8); // Top 8 most recent
  }

  async getSummariesHistory(userId: string) {
    const { data, error } = await this.supabase.client
      .from('summaries')
      .select('id, document_id, created_at, documents(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getFlashcardsHistory(userId: string) {
    const { data, error } = await this.supabase.client
      .from('flashcards')
      .select('id, document_id, created_at, documents(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    if (!data) return [];
    
    // Group by document_id
    const grouped = new Map<string, any>();
    data.forEach((item: any) => {
      if (!grouped.has(item.document_id)) {
        grouped.set(item.document_id, {
          document_id: item.document_id,
          title: item.documents?.title || 'Documento sin título',
          created_at: item.created_at,
          count: 0
        });
      }
      grouped.get(item.document_id)!.count++;
    });
    
    return Array.from(grouped.values());
  }

  async getQuizAttemptsHistory(userId: string) {
    const { data, error } = await this.supabase.client
      .from('quiz_attempts')
      .select('id, quiz_id, score, correct_answers, total_questions, completed_at, quizzes(document_id, documents(title))')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getChatConversationsHistory(userId: string) {
    const { data, error } = await this.supabase.client
      .from('ai_conversations')
      .select('id, document_id, title, updated_at, documents(title)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
