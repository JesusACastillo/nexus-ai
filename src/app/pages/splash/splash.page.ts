import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { LogoComponent, PrimaryButtonComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-splash', standalone: true, imports: [IonContent, IonIcon, RouterLink, LogoComponent, PrimaryButtonComponent], styleUrls: ['../pages.scss', './splash.page.scss'], template: `
<ion-content><div class="splash-wrap">
  <div class="ambient one"></div><div class="ambient two"></div>
  <div class="splash-brand"><app-logo [compact]="true"></app-logo><h1>Nexus <span>AI</span></h1><p>Tu conocimiento, conectado.</p></div>
  <div class="splash-footer"><app-primary-button routerLink="/onboarding">Comenzar <ion-icon name="arrow-forward" slot="end"></ion-icon></app-primary-button><small>Tu segundo cerebro con inteligencia artificial</small></div>
</div></ion-content>` })
export class SplashPage {}
