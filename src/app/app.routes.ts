import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./home/home.routes').then(m => m.homeRoutes),
  },
  {
    path: 'student',
    loadComponent: () => import('./home/student-home.component').then(m => m.StudentHomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'parent',
    loadComponent: () => import('./home/parent-home.component').then(m => m.ParentHomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teacher',
    loadComponent: () => import('./home/teacher-home.component').then(m => m.TeacherHomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('@abp/ng.account').then(m => m.createRoutes()),
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.routes').then(m => m.loginRoutes),
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.routes').then(m => m.registerRoutes),
  },
  {
    path: 'identity',
    loadChildren: () => import('@abp/ng.identity').then(m => m.createRoutes()),
    canActivate: [authGuard]
  },
  {
    path: 'tenant-management',
    loadChildren: () =>
      import('@abp/ng.tenant-management').then(m => m.createRoutes()),
    canActivate: [authGuard]
  },
  {
    path: 'setting-management',
    loadChildren: () =>
      import('@abp/ng.setting-management').then(m => m.createRoutes()),
    canActivate: [authGuard]
  },
  {
    path: 'students-grades',
    loadChildren: () => import('./students-grades/students-grades.routes').then(m => m.studentsGradesRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'students',
    loadChildren: () => import('./students/students.routes').then(m => m.studentsRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'enroll',
    loadChildren: () => import('./enroll-in-course/enroll-in-course.routes').then(m => m.enrollInCourseRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'add-student',
    loadChildren: () => import('./add-student/add-student.routes').then(m => m.addStudentRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SECRETARY'] }
  },
  {
    path: 'add-teacher',
    loadChildren: () => import('./add-teacher/add-teacher.routes').then(m => m.addTeacherRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'teachers',
    loadChildren: () => import('./teachers/teachers.routes').then(m => m.teachersRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'teacher-groups',
    loadChildren: () => import('./teacher-groups/teacher-groups.routes'),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'add-course',
    loadChildren: () => import('./add-course/add-course.routes').then(m => m.addCourseRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'courses',
    loadChildren: () => import('./courses/courses.routes').then(m => m.coursesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'feeds',
    loadChildren: () => import('./feeds/feeds.routes').then(m => m.feedsRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'exam-grade',
    loadChildren: () => import('./exam-grade/exam-grade.routes').then(m => m.examGradeRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'attendance',
    loadChildren: () => import('./attendance/attendance.routes').then(m => m.attendanceRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'parents',
    loadChildren: () => import('./parents/parents.routes').then(m => m.parentsRoutes),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
