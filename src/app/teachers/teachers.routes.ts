import type { Route } from '@angular/router';

export const teachersRoutes: Route[] = [
  { path: '', loadComponent: () => import('./teachers.component').then(m => m.TeachersComponent) },
  { path: ':id', loadComponent: () => import('./teacher-detail.component').then(m => m.TeacherDetailComponent) },
  { path: ':id/enroll', loadComponent: () => import('./enroll-teacher.component').then(m => m.EnrollTeacherComponent) },
  { path: ':id/courses', loadComponent: () => import('./teacher-courses.component').then(m => m.TeacherCoursesComponent) },
];
