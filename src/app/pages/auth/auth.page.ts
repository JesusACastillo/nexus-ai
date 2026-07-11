import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppInputComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({ selector: 'app-auth', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppInputComponent, PrimaryButtonComponent], styleUrls: ['../pages.scss'], template: `
<ion-content class="auth-content">
  <!-- Decorative icon top (Figma: asterisk/star in cyan) -->
  <div class="auth-icon"><ion-icon name="sparkles-outline"></ion-icon></div>

  @if (mode === 'register') {
    <h1>Crea tu cuenta</h1>
    <p>Únete a Nexus AI hoy mismo.</p>
    <app-input label="Nombre completo" placeholder="Ej. Jane Doe" icon="person-outline" [(value)]="fullName"></app-input>
  } @else {
    <h1>Bienvenido de nuevo</h1>
    <p>Accede a tu espacio de trabajo inteligente.</p>
  }

  <app-input label="Correo electrónico" placeholder="tu@email.com" icon="mail-outline" type="email" [(value)]="email"></app-input>
  <app-input label="Contraseña" placeholder="••••••••" icon="lock-closed-outline" type="password" [(value)]="password"></app-input>

  @if (mode === 'login') {
    <div class="auth-forgot"><a routerLink="/login">¿Olvidé mi contraseña?</a></div>
  }

  @if (errorMsg) {
    <div class="auth-error">{{ errorMsg }}</div>
  }

  <app-primary-button (click)="onSubmit()">
    @if (loading) { Cargando… } @else { {{ mode === 'register' ? 'Registrarme' : 'Iniciar sesión →' }} }
  </app-primary-button>

  <div class="or">o continúa con</div>

  <button class="google-btn">
    <ion-icon name="logo-google"></ion-icon>
    Continuar con Google
  </button>

  <div class="auth-link">
    {{ mode === 'register' ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?' }}
    <a [routerLink]="mode === 'register' ? '/login' : '/register'">
      {{ mode === 'register' ? 'Inicia sesión' : 'Crear cuenta' }}
    </a>
  </div>
</ion-content>` })
export class AuthPage {
  mode: 'login' | 'register';
  email = '';
  password = '';
  fullName = '';
  loading = false;
  errorMsg = '';

  constructor(
    route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
  ) {
    this.mode = route.snapshot.data['mode'] ?? 'login';
  }

  async onSubmit() {
    this.errorMsg = '';

    if (!this.email || !this.password) {
      this.errorMsg = 'Ingresa tu correo y contraseña.';
      return;
    }
    if (this.mode === 'register' && !this.fullName.trim()) {
      this.errorMsg = 'Ingresa tu nombre completo.';
      return;
    }

    this.loading = true;

    try {
      if (this.mode === 'register') {
        const { user } = await this.supabase.signUp(this.email, this.password, this.fullName.trim());
        // Some Supabase projects require email confirmation.
        // If confirmations are disabled, the user is logged in immediately.
        if (user && !user.confirmed_at && !user.email_confirmed_at) {
          this.errorMsg = 'Revisa tu correo para confirmar tu cuenta.';
          this.loading = false;
          return;
        }
      } else {
        await this.supabase.signIn(this.email, this.password);
      }

      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (err: any) {
      this.errorMsg = this.friendlyError(err?.message ?? 'Error desconocido');
    } finally {
      this.loading = false;
    }
  }

  /** Map Supabase error messages to user-friendly Spanish strings. */
  private friendlyError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (lower.includes('email not confirmed')) return 'Tu correo aún no ha sido confirmado. Revisa tu bandeja.';
    if (lower.includes('user already registered')) return 'Este correo ya tiene una cuenta. Inicia sesión.';
    if (lower.includes('password') && lower.includes('at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (lower.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
    if (lower.includes('network')) return 'Error de conexión. Revisa tu internet.';
    return msg;
  }
}
