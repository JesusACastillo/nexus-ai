import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface TaskDB {
  id: string;
  user_id: string;
  workspace_id?: string;
  subject_id?: string;
  document_id?: string;
  study_plan_id?: string;
  study_plan_item_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  constructor(private supabase: SupabaseService) { }

  async getTasks(): Promise<TaskDB[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('No user logged in');

    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createTask(task: Partial<TaskDB>): Promise<TaskDB> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('No user logged in');

    const newTask = {
      ...task,
      user_id: user.id,
      status: 'pending',
      is_completed: false
    };

    const { data, error } = await this.supabase.client
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, updates: Partial<TaskDB>): Promise<TaskDB> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleTaskCompleted(task: TaskDB): Promise<TaskDB> {
    const isCompleted = !task.is_completed;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    // 1. Update the task
    const updatedTask = await this.updateTask(task.id, {
      is_completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      completed_at: completedAt
    });

    // 2. Sync with study_plan_item if it exists
    if (task.study_plan_item_id) {
      const { error } = await this.supabase.client
        .from('study_plan_items')
        .update({ is_completed: isCompleted })
        .eq('id', task.study_plan_item_id);

      if (error) {
        console.error('Error syncing task completion with study plan item:', error);
        // We do not throw error here to not break the UI if sync fails, but it's logged.
      }
    }

    return updatedTask;
  }
}
