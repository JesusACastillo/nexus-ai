import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SummaryDB {
  id: string;
  document_id: string;
  content: string;
  summary_type: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SummariesService {
  constructor(private supabase: SupabaseService) {}

  async getSummariesByDocument(documentId: string): Promise<SummaryDB[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('summaries')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async generateSummary(documentId: string, summaryType: string = 'general'): Promise<any> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client.functions.invoke('generate-summary', {
      body: { 
        document_id: documentId,
        summary_type: summaryType
      }
    });

    if (error) throw error;
    return data;
  }
}
