import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Workspace } from '../models/ui.models';

export interface WorkspaceDb {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspacesService {
  private supabase = inject(SupabaseService);

  private mapToUIModel(dbItem: WorkspaceDb): Workspace {
    let icon = 'folder-outline';
    if (dbItem.type === 'study') icon = 'school-outline';
    else if (dbItem.type === 'project') icon = 'briefcase-outline';
    else if (dbItem.type === 'personal') icon = 'person-outline';
    else if (dbItem.type === 'career') icon = 'trending-up-outline';
    else if (dbItem.type === 'other') icon = 'grid-outline';

    return {
      id: dbItem.id,
      title: dbItem.name,
      description: dbItem.description || '',
      icon: icon,
      color: dbItem.color || '#a78bfa',
      count: 0 // Mocked for now, needs related tables query later
    };
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workspaces:', error.message);
      throw error;
    }

    return (data as WorkspaceDb[]).map(this.mapToUIModel);
  }

  async createWorkspace(name: string, description: string, type: string, color: string): Promise<Workspace> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('workspaces')
      .insert({
        user_id: user.id,
        name,
        description,
        type,
        color,
        is_archived: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workspace:', error.message);
      throw error;
    }

    return this.mapToUIModel(data as WorkspaceDb);
  }

  async updateWorkspace(id: string, updates: Partial<WorkspaceDb>): Promise<Workspace> {
    const { data, error } = await this.supabase.client
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workspace:', error.message);
      throw error;
    }

    return this.mapToUIModel(data as WorkspaceDb);
  }

  async archiveWorkspace(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('workspaces')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving workspace:', error.message);
      throw error;
    }
  }
}
