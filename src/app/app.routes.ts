import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./home/home.routes').then(m => m.homeRoutes),
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
    path: 'identity',
    loadChildren: () => import('@abp/ng.identity').then(m => m.createRoutes()),
  },
  {
    path: 'tenant-management',
    loadChildren: () =>
      import('@abp/ng.tenant-management').then(m => m.createRoutes()),
  },
  {
    path: 'setting-management',
    loadChildren: () =>
      import('@abp/ng.setting-management').then(m => m.createRoutes()),
  },
  {
    path: 'students-grades',
    loadChildren: () => import('./students-grades/students-grades.routes').then(m => m.studentsGradesRoutes),
  },
  {
    path: 'students',
    loadChildren: () => import('./students/students.routes').then(m => m.studentsRoutes),
  },
  {
    path: 'enroll',
    loadChildren: () => import('./enroll-in-course/enroll-in-course.routes').then(m => m.enrollInCourseRoutes),
  },
  {
    path: 'add-student',
    loadChildren: () => import('./add-student/add-student.routes').then(m => m.addStudentRoutes),
  },
  {
    path: 'add-teacher',
    loadChildren: () => import('./add-teacher/add-teacher.routes').then(m => m.addTeacherRoutes),
  },
  {
    path: 'teachers',
    loadChildren: () => import('./teachers/teachers.routes').then(m => m.teachersRoutes),
  },
  {
    path: 'add-course',
    loadChildren: () => import('./add-course/add-course.routes').then(m => m.addCourseRoutes),
  },
  {
    path: 'courses',
    loadChildren: () => import('./courses/courses.routes').then(m => m.coursesRoutes),
  },
  {
    path: 'feeds',
    loadChildren: () => import('./feeds/feeds.routes').then(m => m.feedsRoutes),
  },
  {
    path: 'attendance',
    loadChildren: () => import('./attendance/attendance.routes').then(m => m.attendanceRoutes),
  },
];
