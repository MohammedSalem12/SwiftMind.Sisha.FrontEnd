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
    path: 'parent/child/:studentId',
    loadComponent: () => import('./home/parent-child-detail.component').then(m => m.ParentChildDetailComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent/link-child',
    loadComponent: () => import('./home/parent-link-child.component').then(m => m.ParentLinkChildComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'student/attendance',
    loadComponent: () => import('./home/student-my-attendance.component').then(m => m.StudentMyAttendanceComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'student/grades',
    loadComponent: () => import('./home/student-my-grades.component').then(m => m.StudentMyGradesComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'student/requests',
    loadComponent: () => import('./home/student-my-requests.component').then(m => m.StudentMyRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'student/courses',
    loadComponent: () => import('./home/student-courses.component').then(m => m.StudentCoursesComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'student/course/:courseId',
    loadComponent: () => import('./home/student-course-profile.component').then(m => m.StudentCourseProfileComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'teacher/enroll',
    loadComponent: () => import('./home/teacher-self-enroll.component').then(m => m.TeacherSelfEnrollComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] }
  },
  {
    path: 'teacher/attendance-report',
    loadComponent: () => import('./home/teacher-attendance-report.component').then(m => m.TeacherAttendanceReportComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  // Redirect ABP's default account/login to our custom login page
  { path: 'account/login', redirectTo: '/login', pathMatch: 'full' },
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
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SECRETARY'] }
  },
  {
    path: 'teacher/qr-codes',
    loadComponent: () => import('./home/teacher-qr-codes.component').then(m => m.TeacherQrCodesComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] }
  },
  {
    path: 'student/qr',
    loadComponent: () => import('./home/student-qr.component').then(m => m.StudentQrComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'student/enroll/:id',
    loadComponent: () => import('./courses/course-enrollment.component').then(m => m.CourseEnrollmentComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'enrollment-requests',
    loadComponent: () => import('./enrollment-requests/enrollment-requests.component').then(m => m.EnrollmentRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'secretary-assignments',
    loadComponent: () => import('./secretary-assignments/secretary-assignments.component').then(m => m.SecretaryAssignmentsComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SECRETARY'] }
  },
  {
    path: 'parent/enroll-child/:studentId',
    loadComponent: () => import('./parent-enroll-child/parent-enroll-child.component')
      .then(m => m.ParentEnrollChildComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent-enrollment-approval',
    loadComponent: () => import('./parent-enrollment-approval/parent-enrollment-approval.component').then(m => m.ParentEnrollmentApprovalComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
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
    path: 'marks-entry',
    loadChildren: () => import('./marks-entry/marks-entry.routes').then(m => m.marksEntryRoutes),
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
