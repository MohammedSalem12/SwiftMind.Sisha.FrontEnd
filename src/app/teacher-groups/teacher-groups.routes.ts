import type { Routes } from '@angular/router';
import { AuthGuard } from '@abp/ng.core';

export default [
  {
    path: '',
    loadComponent: () => import('./teacher-groups.component').then(m => m.TeacherGroupsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'create',
    loadComponent: () => import('./create-group.component').then(m => m.CreateGroupComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-group.component').then(m => m.EditGroupComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'add-schedule/:groupId',
    loadComponent: () => import('./add-schedule.component').then(m => m.AddScheduleComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-schedule/:scheduleId',
    loadComponent: () => import('./edit-schedule.component').then(m => m.EditScheduleComponent),
    canActivate: [AuthGuard],
  },
] as Routes;
