import type { Routes } from '@angular/router';

export const enrollInCourseRoutes: Routes = [
  {
    path: ':studentId',
    loadComponent: () => import('./enroll-in-course.component').then(c => c.EnrollInCourseComponent),
  },
];
