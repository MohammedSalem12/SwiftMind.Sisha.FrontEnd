import { RoutesService, eLayoutType, AuthService } from '@abp/ng.core';
import { APP_INITIALIZER, inject } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  { provide: APP_INITIALIZER, useFactory: configureRoutes, deps: [RoutesService], multi: true },
];

function configureRoutes(routesService: RoutesService) {
  return () => {
    // Helper to detect token presence at runtime. This avoids depending on DI timing
    const hasToken = () => {
      try {
        return !!(localStorage.getItem('access_token') || localStorage.getItem('id_token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('id_token'));
      } catch {
        return false;
      }
    };

    const menuItems: any[] = [
      {
        path: '/',
        name: 'الرئيسية',
        iconClass: 'fas fa-home',
        order: 1,
        layout: eLayoutType.application,
      },
      {
        path: '/students-grades',
        name: 'الطلاب',
        iconClass: 'fas fa-user-graduate',
        order: 2,
        layout: eLayoutType.application,
      },
      {
        path: '/students',
        name: 'قائمة الطلاب',
        iconClass: 'fas fa-users',
        order: 2,
        layout: eLayoutType.application,
        visible: () => hasToken(),
      },
      {
        path: '/teachers',
        name: 'المعلمين',
        iconClass: 'fas fa-chalkboard-teacher',
        order: 3,
        layout: eLayoutType.application,
        visible: () => hasToken(),
      },
      {
        path: '/feeds',
        name: 'النشرات',
        iconClass: 'fas fa-rss',
        order: 3,
        layout: eLayoutType.application,
      },
      {
        path: '/courses',
        name: 'المقررات',
        iconClass: 'fas fa-book',
        order: 4,
        layout: eLayoutType.application,
      },
      {
        path: '/exam-grade',
        name: 'درجات الاختبار',
        iconClass: 'fas fa-clipboard-list',
        order: 4,
        layout: eLayoutType.application,
        visible: () => hasToken(),
      },
      {
        path: '/attendance',
        name: 'الحضور',
        iconClass: 'fas fa-user-check',
        order: 4,
        layout: eLayoutType.application,
        visible: () => hasToken(),
      },
    ];

    // Conditionally add login/profile based on whether a token is present right now.
    if (!hasToken()) {
      menuItems.push({
        path: '/login',
        name: 'تسجيل الدخول',
        iconClass: 'fas fa-sign-in-alt',
        order: 4,
        layout: eLayoutType.account,
      });
    } else {
      menuItems.push({
        path: '/account/manage',
        name: 'ملفي',
        iconClass: 'fas fa-user',
        order: 5,
        layout: eLayoutType.application,
      });
    }

    routesService.add(menuItems);
  };
}
