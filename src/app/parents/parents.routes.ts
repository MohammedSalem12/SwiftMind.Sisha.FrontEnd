import type { Routes } from '@angular/router';
import { parentDashboardGuard } from '../shared/role-guards';

export const parentsRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./parents.component').then(c => c.ParentsComponent) 
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./parent-dashboard/parent-dashboard.component').then(c => c.ParentDashboardComponent),
    canActivate: [parentDashboardGuard],
  },
  { 
    path: ':id', 
    loadComponent: () => import('./parent-detail.component').then(c => c.ParentDetailComponent) 
  }
];