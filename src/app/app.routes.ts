import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./home/home.routes').then(m => m.homeRoutes),
    // Open for guests — home.component handles auth/guest views internally
  },
  {
    path: 'student',
    pathMatch: 'full',
    loadComponent: () => import('./home/student-home.component').then(m => m.StudentHomeComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'partners',
    loadComponent: () => import('./partners/partners-directory.component').then(m => m.PartnersDirectoryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'partner/dashboard',
    loadComponent: () => import('./partner/partner-dashboard.component').then(m => m.PartnerDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARTNER'] }
  },
  {
    path: 'parent',
    pathMatch: 'full',
    loadComponent: () => import('./parents/parent-landing.component').then(m => m.ParentLandingComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent/home',
    loadComponent: () => import('./home/parent-home.component').then(m => m.ParentHomeComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'teacher',
    pathMatch: 'full',
    loadComponent: () => import('./home/teacher-home.component').then(m => m.TeacherHomeComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] }
  },
  {
    path: 'parent-dashboard',
    loadComponent: () => import('./parents/parent-dashboard.component').then(m => m.ParentDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent/today-sessions',
    loadComponent: () => import('./parents/parent-today-sessions.component').then(m => m.ParentTodaySessionsComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent/child-overview/:studentId',
    loadComponent: () => import('./parents/parent-child-overview.component').then(m => m.ParentChildOverviewComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
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
    path: 'parent/requests',
    loadComponent: () => import('./home/parent-requests.component').then(m => m.ParentRequestsComponent),
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
    path: 'student/change-teacher/:courseId',
    loadComponent: () => import('./home/student-change-teacher.component').then(m => m.StudentChangeTeacherComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT', 'PARENT'] }
  },
  {
    path: 'student/today-sessions',
    loadComponent: () => import('./home/today-sessions.component').then(m => m.TodaySessionsComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] }
  },
  {
    path: 'teacher/today-sessions',
    loadComponent: () => import('./home/today-sessions.component').then(m => m.TodaySessionsComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'SECRETARY'] }
  },
  {
    path: 'teacher/course/:courseId',
    loadComponent: () => import('./home/teacher-course-action.component').then(m => m.TeacherCourseActionComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'SECRETARY'] }
  },
  {
    path: 'teacher/enroll',
    loadComponent: () => import('./home/teacher-self-enroll.component').then(m => m.TeacherSelfEnrollComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'SECRETARY'] }
  },
  {
    path: 'teacher/attendance-report',
    loadComponent: () => import('./home/teacher-attendance-report.component').then(m => m.TeacherAttendanceReportComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
  },
  {
    path: 'reports/absence',
    loadComponent: () => import('./home/absence-report.component').then(m => m.AbsenceReportComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'SECRETARY'] }
  },
  // Social login profile completion (no role guard — user has token but no role yet)
  {
    path: 'complete-profile',
    loadChildren: () => import('./complete-profile/complete-profile.routes').then(m => m.completeProfileRoutes),
    canActivate: [authGuard],
    data: { layout: 'empty' },
  },
  {
    path: 'pending-approval',
    loadComponent: () => import('./pending-approval/pending-approval.component').then(m => m.PendingApprovalComponent),
    canActivate: [authGuard],
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
    data: { layout: 'empty' },
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.routes').then(m => m.registerRoutes),
    data: { layout: 'empty' },
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { layout: 'empty' },
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
    data: { roles: ['TEACHER', 'SECRETARY'] }
  },
  {
    path: 'enroll',
    loadChildren: () => import('./enroll-in-course/enroll-in-course.routes').then(m => m.enrollInCourseRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN'] }
  },
  {
    path: 'add-student',
    loadChildren: () => import('./add-student/add-student.routes').then(m => m.addStudentRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'add-teacher',
    loadChildren: () => import('./add-teacher/add-teacher.routes').then(m => m.addTeacherRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/password-resets',
    loadComponent: () => import('./admin/password-reset-requests.component').then(m => m.PasswordResetRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/promotions',
    loadComponent: () => import('./admin/promotion-requests.component').then(m => m.PromotionRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'registration-requests',
    loadComponent: () => import('./registration-requests/registration-requests.component').then(m => m.RegistrationRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'teachers',
    loadChildren: () => import('./teachers/teachers.routes').then(m => m.teachersRoutes),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
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
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'ADMIN', 'SECRETARY'] }
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
    data: { roles: ['TEACHER', 'SECRETARY'] }
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
    data: { roles: ['TEACHER', 'SECRETARY'] }
  },
  {
    path: 'secretary',
    pathMatch: 'full',
    loadComponent: () => import('./home/secretary-home.component').then(m => m.SecretaryHomeComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
  },
  {
    path: 'secretary/profile',
    loadComponent: () => import('./secretary/secretary-profile.component').then(m => m.SecretaryProfileComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] },
  },
  {
    path: 'student/profile',
    loadComponent: () => import('./students/student-profile.component').then(m => m.StudentProfileComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] },
  },
  {
    path: 'teacher/profile',
    loadComponent: () => import('./home/teacher-profile.component').then(m => m.TeacherProfileComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] },
  },
  {
    path: 'student/points',
    loadComponent: () => import('./home/student-points.component').then(m => m.StudentPointsComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] },
  },
  {
    path: 'student/invite-friends',
    loadComponent: () => import('./home/invite-friends.component').then(m => m.InviteFriendsComponent),
    canActivate: [roleGuard],
    data: { roles: ['STUDENT'] },
  },
  {
    path: 'teacher/promotion',
    loadComponent: () => import('./home/teacher-promotion.component').then(m => m.TeacherPromotionComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] },
  },
  {
    path: 'parent/profile',
    loadComponent: () => import('./home/parent-profile.component').then(m => m.ParentProfileComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] },
  },
  {
    path: 'secretary/link-teacher',
    loadComponent: () => import('./secretary/secretary-link-teacher.component').then(m => m.SecretaryLinkTeacherComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
  },
  {
    path: 'secretary/requests',
    loadComponent: () => import('./secretary/secretary-requests.component').then(m => m.SecretaryRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
  },
  {
    path: 'secretary/announce',
    loadComponent: () => import('./secretary/secretary-announce.component').then(m => m.SecretaryAnnounceComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
  },
  {
    path: 'secretary/schedule-overview',
    loadComponent: () => import('./secretary/secretary-schedule-overview.component').then(m => m.SecretaryScheduleOverviewComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
  },
  {
    path: 'secretary/bulk-attendance',
    loadComponent: () => import('./secretary/secretary-bulk-attendance.component').then(m => m.SecretaryBulkAttendanceComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
  },
  {
    path: 'teacher/secretary-requests',
    loadComponent: () => import('./secretary/teacher-secretary-requests.component').then(m => m.TeacherSecretaryRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] }
  },
  {
    path: 'secretary/teacher/:teacherId',
    loadComponent: () => import('./secretary/secretary-teacher-courses.component').then(m => m.SecretaryTeacherCoursesComponent),
    canActivate: [roleGuard],
    data: { roles: ['SECRETARY'] }
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
    path: 'parent/message-teacher',
    loadComponent: () => import('./parents/parent-message-teacher.component').then(m => m.ParentMessageTeacherComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent/absence-excuse',
    loadComponent: () => import('./parents/parent-absence-excuse.component').then(m => m.ParentAbsenceExcuseComponent),
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] }
  },
  {
    path: 'parent/child-schedule/:studentId',
    loadComponent: () => import('./parents/parent-child-schedule.component').then(m => m.ParentChildScheduleComponent),
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
    data: { roles: ['TEACHER', 'SECRETARY'] }
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
    path: 'academies',
    loadChildren: () => import('./academies/academies.routes').then(m => m.academiesRoutes),
    // Open for browsing — components handle auth prompts internally
  },
  {
    path: 'teacher/academy',
    loadComponent: () => import('./home/teacher-academy-hub.component').then(m => m.TeacherAcademyHubComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER', 'SECRETARY'] },
  },
  {
    path: 'teacher/enrollment-requests',
    loadComponent: () => import('./home/teacher-enrollment-requests.component').then(m => m.TeacherEnrollmentRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] },
  },
  {
    path: 'teacher/my-requests',
    loadComponent: () => import('./home/teacher-my-requests.component').then(m => m.TeacherMyRequestsComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] },
  },
  {
    path: 'teacher/academies',
    loadComponent: () => import('./home/teacher-academies.component').then(m => m.TeacherAcademiesComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] },
  },
  {
    path: 'teacher/academies/:academyId/courses',
    loadComponent: () => import('./home/teacher-academy-courses.component').then(m => m.TeacherAcademyCoursesComponent),
    canActivate: [roleGuard],
    data: { roles: ['TEACHER'] },
  },
  {
    path: 'ads',
    loadChildren: () => import('./ads/ads.routes').then(m => m.adsRoutes),
    // Open for browsing — auth-required actions prompt registration internally
  },
  {
    path: 'academic-terms',
    loadChildren: () => import('./academic-terms/academic-terms.routes').then(m => m.academicTermRoutes),
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'settings',
    loadComponent: () => import('./shared/app-settings.component').then(m => m.AppSettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'support',
    loadComponent: () => import('./support/support.component').then(m => m.SupportComponent),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
  },
  {
    path: 'data-deletion',
    loadComponent: () => import('./data-deletion/data-deletion.component').then(m => m.DataDeletionComponent),
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
