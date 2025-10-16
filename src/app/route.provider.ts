import { RoutesService, eLayoutType, AuthService } from '@abp/ng.core';
import { APP_INITIALIZER } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  { provide: APP_INITIALIZER, useFactory: configureRoutes, deps: [RoutesService, AuthService], multi: true },
];

function configureRoutes(routesService: RoutesService, authService: AuthService) {
  return () => {
    // Helper to check authentication status dynamically
    const isAuthenticated = () => {
      return authService.isAuthenticated;
    };

    const menuItems: any[] = [
      {
        path: '/',
        name: 'الرئيسية',
        iconClass: 'fas fa-home',
        order: 1,
        layout: eLayoutType.application,
      },
      // All other menu items only visible when authenticated
      {
        path: '/students',
        name: 'قائمة الطلاب',
        iconClass: 'fas fa-users',
        order: 2,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/students-grades',
        name: 'درجات الطلاب',
        iconClass: 'fas fa-user-graduate',
        order: 3,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/teachers',
        name: 'المعلمين',
        iconClass: 'fas fa-chalkboard-teacher',
        order: 4,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/parents',
        name: 'أولياء الأمور',
        iconClass: 'fas fa-users-cog',
        order: 5,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/courses',
        name: 'المقررات',
        iconClass: 'fas fa-book',
        order: 6,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/attendance',
        name: 'الحضور',
        iconClass: 'fas fa-user-check',
        order: 7,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/exam-grade',
        name: 'درجات الاختبار',
        iconClass: 'fas fa-clipboard-list',
        order: 8,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/feeds',
        name: 'النشرات',
        iconClass: 'fas fa-rss',
        order: 9,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
    ];

    // Conditionally add authentication-related menu items
    if (!isAuthenticated()) {
      // Show login and register for unauthenticated users
      menuItems.push({
        path: '/login',
        name: 'تسجيل الدخول',
        iconClass: 'fas fa-sign-in-alt',
        order: 10,
        layout: eLayoutType.account,
      });
      menuItems.push({
        path: '/register',
        name: 'إنشاء حساب',
        iconClass: 'fas fa-user-plus',
        order: 11,
        layout: eLayoutType.account,
      });
    } else {
      // Show profile management for authenticated users
      menuItems.push({
        path: '/account/manage',
        name: 'ملفي الشخصي',
        iconClass: 'fas fa-user-cog',
        order: 10,
        layout: eLayoutType.application,
      });
    }

    routesService.add(menuItems);
  };
}
