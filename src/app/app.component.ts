import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, albumsOutline, arrowForward, arrowUp, calendarOutline, chatbubbleOutline,
  chatbubbles, chatbubblesOutline, checkboxOutline, checkmark, checkmarkCircle,
  checkmarkCircleOutline, chevronBack, chevronForward, close, cloudUploadOutline,
  codeSlashOutline, documentsOutline, documentText, documentTextOutline,
  ellipseOutline, ellipsisVertical, flameOutline, flash, gridOutline,
  helpCircleOutline, languageOutline, layersOutline, libraryOutline,
  lockClosedOutline, logoGoogle, logOutOutline, mailOutline, moonOutline,
  notificationsOutline, person, personOutline, readerOutline, refreshOutline,
  schoolOutline, shieldCheckmarkOutline, sparkles, sparklesOutline,
  statsChartOutline, syncOutline, timeOutline, trendingUpOutline, trophy,
  trophyOutline, volumeHighOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({
      add, albumsOutline, arrowForward, arrowUp, calendarOutline, chatbubbleOutline,
      chatbubbles, chatbubblesOutline, checkboxOutline, checkmark, checkmarkCircle,
      checkmarkCircleOutline, chevronBack, chevronForward, close, cloudUploadOutline,
      codeSlashOutline, documentsOutline, documentText, documentTextOutline,
      ellipseOutline, ellipsisVertical, flameOutline, flash, gridOutline,
      helpCircleOutline, languageOutline, layersOutline, libraryOutline,
      lockClosedOutline, logoGoogle, logOutOutline, mailOutline, moonOutline,
      notificationsOutline, person, personOutline, readerOutline, refreshOutline,
      schoolOutline, shieldCheckmarkOutline, sparkles, sparklesOutline,
      statsChartOutline, syncOutline, timeOutline, trendingUpOutline, trophy,
      trophyOutline, volumeHighOutline
    });
  }
}
