import { Routes } from '@angular/router';

export const secretariesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./secretaries.component').then(m => m.SecretariesComponent),
  },
  {
    path: 'add',
    loadComponent: () => import('./add-secretary/add-secretary.component').then(m => m.AddSecretaryComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-secretary/edit-secretary.component').then(m => m.EditSecretaryComponent),
  },
  {
    path: 'dashboard/:id',
    loadComponent: () => import('./secretary-dashboard/secretary-dashboard.component').then(m => m.SecretaryDashboardComponent),
  },
  {
    path: 'delegations',
    loadComponent: () => import('./delegations/delegations.component').then(m => m.DelegationsComponent),
  },
];