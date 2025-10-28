import type { Routes } from '@angular/router';
import { AuthGuard } from '@abp/ng.core';
import { teacherGuard } from '../shared/role-guards';

export default [
  {
    path: '',
    loadComponent: () => import('./teacher-groups.component').then(m => m.TeacherGroupsComponent),
    canActivate: [AuthGuard, teacherGuard],
  },
] as Routes;