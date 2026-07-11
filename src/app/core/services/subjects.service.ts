import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SubjectDB {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectsService {
  constructor(private supabase: SupabaseService) {}

  async getSubjectsByWorkspace(workspaceId: string): Promise<SubjectDB[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSubjectById(subjectId: string): Promise<SubjectDB | null> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createSubject(workspaceId: string, name: string, description: string, color: string): Promise<SubjectDB> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const newSubject = {
      user_id: user.id,
      workspace_id: workspaceId,
      name,
      description: description || '',
      icon: 'book-outline', // Default icon
      color: color || '#7a5cff',
      is_archived: false
    };

    const { data, error } = await this.supabase.client
      .from('subjects')
      .insert(newSubject)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSubject(id: string, changes: Partial<SubjectDB>): Promise<SubjectDB> {
    const { data, error } = await this.supabase.client
      .from('subjects')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async archiveSubject(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('subjects')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  }

  async deleteSubject(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
