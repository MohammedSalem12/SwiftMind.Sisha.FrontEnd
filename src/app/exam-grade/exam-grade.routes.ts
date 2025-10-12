import type { Routes } from '@angular/router';

export const examGradeRoutes: Routes = [
  { path: '', loadComponent: () => import('./exam-grade.component').then(c => c.ExamGradeComponent) }
];
