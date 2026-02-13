import type { Routes } from '@angular/router';

export const parentsRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./parents.component').then(c => c.ParentsComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./parent-dashboard.component').then(c => c.ParentDashboardComponent) 
  },
  { 
    path: ':id', 
    loadComponent: () => import('./parent-detail.component').then(c => c.ParentDetailComponent) 
  }
];