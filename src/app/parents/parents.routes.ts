import type { Routes } from '@angular/router';

export const parentsRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./parents.component').then(c => c.ParentsComponent) 
  },
  { 
    path: ':id', 
    loadComponent: () => import('./parent-detail.component').then(c => c.ParentDetailComponent) 
  }
];