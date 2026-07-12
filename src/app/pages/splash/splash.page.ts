import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { SupabaseService } from '../../core/services/supabase.service';

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
    <div class="splash-dots loading-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
  </div>
</ion-content>` })
export class SplashPage implements OnInit {
  constructor(private router: Router, private supabase: SupabaseService) {}

  ngOnInit() {
    this.redirect();
  }

  private async redirect() {
    // Wait at least 2.6s for the splash animation, and also for the session to resolve.
    const [session] = await Promise.all([
      this.supabase.getSession(),
      new Promise(r => setTimeout(r, 2600)),
    ]);

    const target = session ? '/dashboard' : '/onboarding';
    this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
