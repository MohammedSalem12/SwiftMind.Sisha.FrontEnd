import type { Routes } from '@angular/router';
import { AuthGuard } from '@abp/ng.core';

export default [
  {
    path: '',
    loadComponent: () => import('./teacher-groups.component').then(m => m.TeacherGroupsComponent),
    canActivate: [AuthGuard],
  },
] as Routes;