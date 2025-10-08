import type { Routes } from '@angular/router';

export const attendanceRoutes: Routes = [
  { path: '', loadComponent: () => import('./attendance.component').then(c => c.AttendanceComponent) }
];
