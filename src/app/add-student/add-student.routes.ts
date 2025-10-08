import { Route } from '@angular/router';

export const addStudentRoutes: Route[] = [
  { path: '', loadComponent: () => import('./add-student.component').then(m => m.AddStudentComponent) },
];

