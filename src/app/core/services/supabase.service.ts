import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private _session$ = new BehaviorSubject<Session | null>(null);

  session$ = this._session$.asObservable();
  user$ = this.session$.pipe(map(session => session?.user ?? null));

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'nexus-ai-auth'
        }
      }
    );

    this.loadSession();

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session$.next(session);
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get currentUser(): User | null {
    return this._session$.value?.user ?? null;
  }

  get currentSession(): Session | null {
    return this._session$.value;
  }

  private async loadSession(): Promise<void> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      console.error('Error cargando sesión:', error.message);
      this._session$.next(null);
      return;
    }

    this._session$.next(data.session);
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      console.error('Error obteniendo sesión:', error.message);
      this._session$.next(null);
      return null;
    }

    this._session$.next(data.session);
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      console.error('Error obteniendo usuario:', error.message);
      return null;
    }

    return data.user;
  }

  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName ?? ''
        }
      }
    });

    if (error) throw error;

    this._session$.next(data.session);
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this._session$.next(data.session);
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) throw error;

    this._session$.next(null);
  }
}