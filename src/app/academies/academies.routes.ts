import { Routes } from '@angular/router';
import { authGuard } from '../shared/guards/auth.guard';
import { roleGuard } from '../shared/guards/role.guard';

export const academiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./academies-list.component').then(m => m.AcademiesListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'create',
    loadComponent: () => import('./academy-create.component').then(m => m.AcademyCreateComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN'] },
  },
  {
    path: ':id/profile',
    loadComponent: () => import('./academy-profile.component').then(m => m.AcademyProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: ':id/manage',
    loadComponent: () => import('./academy-manage.component').then(m => m.AcademyManageComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN'] },
  },
];
