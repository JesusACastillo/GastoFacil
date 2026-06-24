import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonMenuToggle, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, wallet, scan, barChart, menu } from 'ionicons/icons';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonSplitPane, IonMenu, IonContent, IonList, IonItem, IonMenuToggle, IonIcon, IonLabel, IonRouterOutlet, RouterLink, RouterLinkActive],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    addIcons({ home, wallet, scan, barChart, menu });
  }
}
