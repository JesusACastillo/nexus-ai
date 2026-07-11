import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonToggle } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../../shared/components/ui-kit.components';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({ selector: 'app-settings', standalone: true, imports: [IonContent, IonIcon, IonItem, IonLabel, IonList, IonToggle, AppHeaderComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/profile"></app-header><ion-content class="nexus-content"><h1 class="page-title">Configuración</h1><p class="page-subtitle">Haz que Nexus trabaje a tu manera.</p><div class="section-heading"><h2>Cuenta</h2></div><ion-list class="settings-list"><ion-item button><ion-icon name="person-outline"></ion-icon><ion-label>Editar perfil</ion-label><ion-icon slot="end" name="chevron-forward"></ion-icon></ion-item><ion-item button><ion-icon name="mail-outline"></ion-icon><ion-label>Correo y contraseña</ion-label><ion-icon slot="end" name="chevron-forward"></ion-icon></ion-item></ion-list><div class="section-heading"><h2>Preferencias</h2></div><ion-list class="settings-list"><ion-item><ion-icon name="moon-outline"></ion-icon><ion-label>Modo oscuro</ion-label><ion-toggle slot="end" checked="true"></ion-toggle></ion-item><ion-item><ion-icon name="notifications-outline"></ion-icon><ion-label>Recordatorios</ion-label><ion-toggle slot="end" checked="true"></ion-toggle></ion-item><ion-item button><ion-icon name="language-outline"></ion-icon><ion-label>Idioma</ion-label><span slot="end" class="muted">Español</span></ion-item></ion-list><div class="section-heading"><h2>Nexus AI</h2></div><ion-list class="settings-list"><ion-item button><ion-icon name="sparkles-outline"></ion-icon><ion-label>Personalización de IA</ion-label><ion-icon slot="end" name="chevron-forward"></ion-icon></ion-item><ion-item button><ion-icon name="shield-checkmark-outline"></ion-icon><ion-label>Privacidad y datos</ion-label><ion-icon slot="end" name="chevron-forward"></ion-icon></ion-item></ion-list><div class="section-heading"><h2>Sesión</h2></div><ion-list class="settings-list danger-zone"><ion-item button (click)="logout()"><ion-icon name="log-out-outline"></ion-icon><ion-label>Cerrar sesión</ion-label></ion-item></ion-list></ion-content>` })
export class SettingsPage {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async logout() {
    await this.supabase.signOut();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
