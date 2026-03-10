import { Routes } from '@angular/router';

export const completeProfileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./complete-profile.component').then(m => m.CompleteProfileComponent),
  },
];
