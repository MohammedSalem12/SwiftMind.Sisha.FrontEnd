import { Route } from '@angular/router';

export const addTeacherRoutes: Route[] = [
  { path: '', loadComponent: () => import('./add-teacher.component').then(m => m.AddTeacherComponent) },
];
