import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AppInputComponent, LogoComponent, PrimaryButtonComponent, SecondaryButtonComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-auth', standalone: true, imports: [IonContent, RouterLink, AppInputComponent, LogoComponent, PrimaryButtonComponent, SecondaryButtonComponent], styleUrls: ['../pages.scss'], template: `
<ion-content class="auth-content"><a class="auth-back" routerLink="/onboarding">← Volver</a><div class="auth-logo"><app-logo></app-logo></div>
  @if (mode === 'register') {<h1>Crea tu cuenta</h1><p>Empieza a construir tu segundo cerebro.</p><app-input label="Nombre" placeholder="Tu nombre" icon="person-outline"></app-input>}
  @else {<h1>Bienvenido de nuevo</h1><p>Continúa donde dejaste tus ideas.</p>}
  <app-input label="Correo electrónico" placeholder="tu@correo.com" icon="mail-outline" type="email"></app-input><app-input label="Contraseña" placeholder="••••••••" icon="lock-closed-outline" type="password"></app-input>
  <app-primary-button routerLink="/dashboard">{{ mode === 'register' ? 'Registrarme' : 'Iniciar sesión' }}</app-primary-button><div class="or">o continúa con</div><app-secondary-button icon="logo-google" routerLink="/dashboard">Google</app-secondary-button>
  <div class="auth-link">{{ mode === 'register' ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?' }} <a [routerLink]="mode === 'register' ? '/login' : '/register'">{{ mode === 'register' ? 'Inicia sesión' : 'Regístrate' }}</a></div>
</ion-content>` })
export class AuthPage { mode: 'login' | 'register'; constructor(route: ActivatedRoute) { this.mode = route.snapshot.data['mode'] ?? 'login'; } }
