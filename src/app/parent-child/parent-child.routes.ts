import { Routes } from '@angular/router';

export const parentChildRoutes: Routes = [
  {
    path: '',
    redirectTo: 'grades',
    pathMatch: 'full'
  },
  {
    path: 'grades',
    loadComponent: () => import('./child-grades.component').then(c => c.ChildGradesComponent)
  },
  {
    path: 'attendance',
    loadComponent: () => import('./child-attendance.component').then(c => c.ChildAttendanceComponent)
  },
  {
    path: 'courses',
    loadComponent: () => import('./child-courses.component').then(c => c.ChildCoursesComponent)
  }
];
