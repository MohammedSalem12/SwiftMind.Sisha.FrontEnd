import { Routes } from '@angular/router';

export const loginRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./login.component').then(m => m.LoginComponent),
    data: { layout: 'account' },
  },
];
