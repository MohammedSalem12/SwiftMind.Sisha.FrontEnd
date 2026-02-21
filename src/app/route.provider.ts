import { RoutesService, eLayoutType } from '@abp/ng.core';
import { APP_INITIALIZER } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  { provide: APP_INITIALIZER, useFactory: configureRoutes, deps: [RoutesService], multi: true },
];

function configureRoutes(routesService: RoutesService) {
  return () => {
    routesService.add([
      {
        path: '/',
        name: 'الرئيسية',
        iconClass: 'fas fa-home',
        order: 1,
        layout: eLayoutType.application,
      },
      {
        path: '/students',
        name: 'قائمة الطلاب',
        iconClass: 'fas fa-users',
        order: 2,
        layout: eLayoutType.application,
      },
      {
        path: '/teacher-groups',
        name: 'مجموعاتي',
        iconClass: 'fas fa-layer-group',
        order: 3,
        layout: eLayoutType.application,
      },
      {
        path: '/students-grades',
        name: 'درجات الطلاب',
        iconClass: 'fas fa-user-graduate',
        order: 4,
        layout: eLayoutType.application,
      },
      {
        path: '/teachers',
        name: 'المعلمين',
        iconClass: 'fas fa-chalkboard-teacher',
        order: 5,
        layout: eLayoutType.application,
      },
      {
        path: '/parents',
        name: 'أولياء الأمور',
        iconClass: 'fas fa-users-cog',
        order: 6,
        layout: eLayoutType.application,
      },
      {
        path: '/courses',
        name: 'المقررات',
        iconClass: 'fas fa-book',
        order: 7,
        layout: eLayoutType.application,
      },
      {
        path: '/attendance',
        name: 'الحضور',
        iconClass: 'fas fa-user-check',
        order: 8,
        layout: eLayoutType.application,
      },
      {
        path: '/exam-grade',
        name: 'درجات الاختبار',
        iconClass: 'fas fa-clipboard-list',
        order: 9,
        layout: eLayoutType.application,
      },
      {
        path: '/feeds',
        name: 'النشرات',
        iconClass: 'fas fa-rss',
        order: 10,
        layout: eLayoutType.application,
      },
      {
        path: '/notifications',
        name: 'الإشعارات',
        iconClass: 'fas fa-bell',
        order: 11,
        layout: eLayoutType.application,
      },
      {
        path: '/account/manage',
        name: 'ملفي الشخصي',
        iconClass: 'fas fa-user-cog',
        order: 12,
        layout: eLayoutType.application,
      },
    ]);
  };
}
