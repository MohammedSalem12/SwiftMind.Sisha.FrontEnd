import { Routes } from '@angular/router';

export const studentsGradesRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./students-grades.component').then(m => m.StudentsGradesComponent),
  },
];
