import { Routes } from '@angular/router';

export const marksEntryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./marks-entry.component').then(m => m.MarksEntryComponent),
  },
];
