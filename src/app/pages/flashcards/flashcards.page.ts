import { Component } from '@angular/core';
import { IonContent, IonIcon, IonProgressBar } from '@ionic/angular/standalone';
import { AppHeaderComponent, FlashcardComponent } from '../../shared/components/ui-kit.components';

@Component({ selector: 'app-flashcards', standalone: true, imports: [IonContent, IonIcon, IonProgressBar, AppHeaderComponent, FlashcardComponent], styleUrls: ['../pages.scss'], template: `
<app-header [showBack]="true" backLink="/documents/subnetting"></app-header><ion-content class="nexus-content"><span class="eyebrow">Guía de subnetting</span><h1 class="page-title">Flashcards</h1><div class="quiz-meta"><span>Tarjeta 3 de 12</span><span>25%</span></div><ion-progress-bar class="quiz-progress" value="0.25"></ion-progress-bar><div style="height:24px"></div><app-flashcard front="¿Qué representa la longitud del prefijo en notación CIDR?" back="Indica cuántos bits de la dirección IP pertenecen a la parte de red."></app-flashcard><div class="flash-controls"><button><ion-icon name="close"></ion-icon></button><button class="main"><ion-icon name="arrow-forward"></ion-icon></button><button><ion-icon name="checkmark"></ion-icon></button></div><p class="muted" style="text-align:center;font-size:.7rem">Toca la tarjeta para revelar la respuesta</p></ion-content>` })
export class FlashcardsPage {}
