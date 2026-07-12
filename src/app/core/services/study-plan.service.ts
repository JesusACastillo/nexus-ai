import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface StudyPlan {
  id: string;
  user_id: string;
  document_id?: string;
  subject_id?: string;
  title: string;
  description: string;
  goal: string;
  difficulty: string;
  days: number;
  created_at: string;
}

export interface StudyPlanItem {
  id: string;
  study_plan_id: string;
  day_number: number;
  title: string;
  description: string;
  estimated_minutes: number;
  activity_type: string;
  is_completed: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudyPlanService {

  constructor(private supabase: SupabaseService) { }

  async generatePlan(params: { document_id?: string, subject_id?: string, days: number, goal: string, difficulty: string }) {
    const { data, error } = await this.supabase.client.functions.invoke('generate-study-plan', {
      body: params
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async getPlans(): Promise<StudyPlan[]> {
    const user = this.supabase.currentUser;
    if (!user) throw new Error('No user logged in');

    const { data, error } = await this.supabase.client
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPlanItems(planId: string): Promise<StudyPlanItem[]> {
    const { data, error } = await this.supabase.client
      .from('study_plan_items')
      .select('*')
      .eq('study_plan_id', planId)
      .order('day_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateItemCompletion(itemId: string, isCompleted: boolean) {
    const { error } = await this.supabase.client
      .from('study_plan_items')
      .update({ is_completed: isCompleted })
      .eq('id', itemId);

    if (error) throw error;
  }
}
