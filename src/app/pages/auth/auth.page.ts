import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppInputComponent, LogoComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-auth', standalone: true, imports: [IonContent, IonIcon, RouterLink, AppInputComponent, LogoComponent, PrimaryButtonComponent], styleUrls: ['../pages.scss'], template: `
<ion-content class="auth-content">
  <!-- Decorative icon top (Figma: asterisk/star in cyan) -->
  <div class="auth-icon"><ion-icon name="sparkles-outline"></ion-icon></div>

  @if (mode === 'register') {
    <h1>Crea tu cuenta</h1>
    <p>Únete a Nexus AI hoy mismo.</p>
    <app-input label="Nombre completo" placeholder="Ej. Jane Doe" icon="person-outline"></app-input>
  } @else {
    <h1>Bienvenido de nuevo</h1>
    <p>Accede a tu espacio de trabajo inteligente.</p>
  }

  <app-input label="Correo electrónico" placeholder="tu@email.com" icon="mail-outline" type="email"></app-input>
  <app-input label="Contraseña" placeholder="••••••••" icon="lock-closed-outline" type="password"></app-input>

  @if (mode === 'login') {
    <div class="auth-forgot"><a routerLink="/login">¿Olvidé mi contraseña?</a></div>
  }

  <app-primary-button routerLink="/dashboard">{{ mode === 'register' ? 'Registrarme' : 'Iniciar sesión →' }}</app-primary-button>

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
export class AuthPage { mode: 'login' | 'register'; constructor(route: ActivatedRoute) { this.mode = route.snapshot.data['mode'] ?? 'login'; } }
