import { Routes } from '@angular/router';

export const adsRoutes: Routes = [
  { path: '', loadComponent: () => import('./ads-browse.component').then(m => m.AdsBrowseComponent) },
  { path: 'detail/:id', loadComponent: () => import('./ad-detail.component').then(m => m.AdDetailComponent) },
  { path: 'my', loadComponent: () => import('./ads-my.component').then(m => m.AdsMyComponent) },
  { path: 'create', loadComponent: () => import('./ads-create.component').then(m => m.AdsCreateComponent) },
  { path: 'admin', loadComponent: () => import('./ads-admin.component').then(m => m.AdsAdminComponent) },
];
