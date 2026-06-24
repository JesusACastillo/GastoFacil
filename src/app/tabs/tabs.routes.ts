import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'gastos',
        loadComponent: () =>
          import('../gastos/gastos.page').then((m) => m.GastosPage),
      },
      {
        path: 'scanner',
        loadComponent: () =>
          import('../scanner/scanner.page').then((m) => m.ScannerPage),
      },
      {
        path: 'resumen',
        loadComponent: () =>
          import('../resumen/resumen.page').then((m) => m.ResumenPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];

