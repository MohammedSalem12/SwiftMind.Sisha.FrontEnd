import type { Routes } from '@angular/router';

export const studentsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./students.component').then(c => c.StudentsComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./student-detail.component').then(c => c.StudentDetailComponent),
  },
];
