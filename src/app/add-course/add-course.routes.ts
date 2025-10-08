import { Route } from '@angular/router';

export const addCourseRoutes: Route[] = [
  { path: '', loadComponent: () => import('./add-course.component').then(m => m.AddCourseComponent) },
];
