import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FlashcardDB {
  id: string;
  user_id: string;
  document_id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlashcardsService {
  constructor(private supabase: SupabaseService) {}

  async generateFlashcards(documentId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', totalCards: number = 10): Promise<any> {
    const { data, error } = await this.supabase.client.functions.invoke('generate-flashcards', {
      body: {
        document_id: documentId,
        difficulty,
        total_cards: totalCards
      }
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async getFlashcardsByDocument(documentId: string): Promise<FlashcardDB[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
