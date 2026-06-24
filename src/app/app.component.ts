import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  layersOutline, carOutline, fastFoodOutline, cartOutline,
  homeOutline, airplaneOutline, medicalOutline, schoolOutline,
  briefcaseOutline, shirtOutline, giftOutline, gameControllerOutline,
  fitnessOutline, cafeOutline, wineOutline, basketOutline, personOutline, wifiOutline,
  personCircleOutline, notificationsOutline, trendingUpOutline, trophyOutline,
  chevronBackOutline, chevronForwardOutline, medkitOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({
      layersOutline, carOutline, fastFoodOutline, cartOutline,
      homeOutline, airplaneOutline, medicalOutline, schoolOutline,
      briefcaseOutline, shirtOutline, giftOutline, gameControllerOutline,
      fitnessOutline, cafeOutline, wineOutline, basketOutline, personOutline, wifiOutline,
      personCircleOutline, notificationsOutline, trendingUpOutline, trophyOutline,
      chevronBackOutline, chevronForwardOutline, medkitOutline
    });
  }
}
