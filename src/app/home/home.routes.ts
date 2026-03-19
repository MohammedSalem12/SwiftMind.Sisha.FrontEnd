import { Routes } from '@angular/router';
import { authGuard } from '../shared/guards/auth.guard';

export const homeRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./home.component').then(m => m.HomeComponent),
  },
  {
    path: 'student',
    pathMatch: 'full',
    loadComponent: () => import('./student-home.component').then(m => m.StudentHomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'parent',
    pathMatch: 'full',
    loadComponent: () => import('./parent-home.component').then(m => m.ParentHomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teacher',
    pathMatch: 'full',
    loadComponent: () => import('./teacher-home.component').then(m => m.TeacherHomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teacher/course/:courseId',
    loadComponent: () => import('./teacher-course-action.component').then(m => m.TeacherCourseActionComponent),
    canActivate: [authGuard]
  },
];
