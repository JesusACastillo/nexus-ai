import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({ selector: 'app-splash', standalone: true, imports: [IonContent], styleUrls: ['./splash.page.scss'], template: `
<ion-content>
  <div class="splash-wrap">
    <!-- Figma: circular gradient orb with brain/N icon -->
    <div class="splash-orb">
      <span class="splash-n">N</span>
    </div>
    <h1 class="splash-title">Nexus AI</h1>
    <p class="splash-sub">Tu segundo cerebro inteligente</p>
    <!-- Progress dots (Figma: 3 dots) -->
    <div class="splash-dots"><span class="active"></span><span></span><span></span></div>
  </div>
</ion-content>` })
export class SplashPage implements OnInit {
  constructor(private router: Router) {}
  ngOnInit() { setTimeout(() => this.router.navigateByUrl('/onboarding', { replaceUrl: true }), 2600); }
}
