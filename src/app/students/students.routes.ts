import type { Routes } from '@angular/router';
import { studentDashboardGuard } from '../shared/role-guards';

export const studentsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./students.component').then(c => c.StudentsComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./student-dashboard/student-dashboard.component').then(c => c.StudentDashboardComponent),
    canActivate: [studentDashboardGuard],
  },
  {
    path: 'schedule',
    loadComponent: () => import('./student-schedule/student-schedule.component').then(c => c.StudentScheduleComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./student-detail.component').then(c => c.StudentDetailComponent),
  },
];
