import { RoutesService, eLayoutType, ConfigStateService } from '@abp/ng.core';
import { APP_INITIALIZER } from '@angular/core';
import { filter, take } from 'rxjs/operators';

export const APP_ROUTE_PROVIDER = [
  {
    provide: APP_INITIALIZER,
    useFactory: configureRoutes,
    deps: [RoutesService, ConfigStateService],
    multi: true,
  },
];

export const ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  ADMIN: 'ADMIN',
  SECRETARY: 'SECRETARY',
  ADVERTISER: 'ADVERTISER',
} as const;

// ─── Route definitions ────────────────────────────────────────────────────────
// IMPORTANT: `name` is BOTH the sidebar label AND the unique patch identifier.
// Every name must be unique across this list.
// `roles` empty/undefined = visible to all authenticated users.
// `roles` with values = visible only to those roles.

interface MenuItemConfig {
  path: string;
  name: string;      // displayed in sidebar; used as patch() identifier — must be unique
  iconClass: string;
  order: number;
  roles?: string[];
}

const MENU_ITEMS: MenuItemConfig[] = [

  // ── Role home pages ─────────────────────────────────────────────────────────
  { path: '/student',  name: 'لوحتي',          iconClass: 'fas fa-home',               order: 1,  roles: [ROLES.STUDENT] },
  { path: '/parent',   name: 'لوحة ولي الأمر', iconClass: 'fas fa-home',               order: 1,  roles: [ROLES.PARENT] },
  { path: '/teacher',  name: 'لوحة المعلم',    iconClass: 'fas fa-home',               order: 1,  roles: [ROLES.TEACHER] },
  { path: '/secretary',             name: 'لوحة السكرتيرة',  iconClass: 'fas fa-home',               order: 2,  roles: [ROLES.SECRETARY] },
  { path: '/secretary-assignments', name: 'الرئيسية',        iconClass: 'fas fa-home',               order: 2,  roles: [ROLES.ADMIN] },
  // Shared dashboard for all authenticated users
  { path: '/',            name: 'لوحة القيادة',    iconClass: 'fas fa-tachometer-alt',    order: 1 },

  // ── Student ─────────────────────────────────────────────────────────────────
  { path: '/student/courses',    name: 'مقرراتي',         iconClass: 'fas fa-book-open',      order: 2, roles: [ROLES.STUDENT] },
  { path: '/student/requests',   name: 'طلباتي',          iconClass: 'fas fa-clipboard-list', order: 3, roles: [ROLES.STUDENT] },
  { path: '/student/grades',     name: 'درجاتي',          iconClass: 'fas fa-star',           order: 4, roles: [ROLES.STUDENT] },
  { path: '/student/attendance', name: 'حضوري',           iconClass: 'fas fa-calendar-check', order: 5, roles: [ROLES.STUDENT] },
  { path: '/student/qr',        name: 'رمز QR الطالب',   iconClass: 'fas fa-qrcode',         order: 6, roles: [ROLES.STUDENT] },

  // ── Parent ──────────────────────────────────────────────────────────────────
  { path: '/parent-enrollment-approval', name: 'طلبات أبنائي', iconClass: 'fas fa-clipboard-check', order: 2, roles: [ROLES.PARENT] },
  { path: '/parent/link-child',          name: 'ربط طالب',      iconClass: 'fas fa-user-plus',        order: 3, roles: [ROLES.PARENT] },

  // ── Teacher ─────────────────────────────────────────────────────────────────
  { path: '/teacher-groups',   name: 'مجموعاتي',    iconClass: 'fas fa-layer-group', order: 2, roles: [ROLES.TEACHER] },
  { path: '/teacher/qr-codes', name: 'QR المقررات', iconClass: 'fas fa-qrcode',      order: 9, roles: [ROLES.TEACHER] },

  // ── Teacher + Admin + Secretary ──────────────────────────────────────────────
  { path: '/attendance',         name: 'الحضور',         iconClass: 'fas fa-user-check',     order: 3, roles: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/marks-entry',        name: 'تسجيل الدرجات', iconClass: 'fas fa-star-half-alt',  order: 4, roles: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/students',           name: 'قائمة الطلاب',  iconClass: 'fas fa-users',          order: 5, roles: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/students-grades',    name: 'درجات الطلاب',  iconClass: 'fas fa-chart-bar',      order: 6, roles: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/enrollment-requests',name: 'طلبات التسجيل', iconClass: 'fas fa-clipboard-list', order: 7, roles: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/exam-grade',         name: 'درجات الاختبار',iconClass: 'fas fa-clipboard',      order: 8, roles: [ROLES.TEACHER, ROLES.ADMIN, ROLES.SECRETARY] },

  // ── Admin + Secretary only ────────────────────────────────────────────────────
  { path: '/teachers', name: 'المعلمين',       iconClass: 'fas fa-chalkboard-teacher', order: 9,  roles: [ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/parents',  name: 'أولياء الأمور',  iconClass: 'fas fa-users-cog',          order: 10, roles: [ROLES.ADMIN, ROLES.SECRETARY] },
  { path: '/courses',  name: 'المقررات',        iconClass: 'fas fa-book',               order: 11, roles: [ROLES.ADMIN, ROLES.SECRETARY] },

  // ── Shared (all authenticated) ───────────────────────────────────────────────
  { path: '/feeds',          name: 'النشرات',      iconClass: 'fas fa-rss',      order: 90 },
  { path: '/notifications',  name: 'الإشعارات',    iconClass: 'fas fa-bell',     order: 91 },
];

// ─── APP_INITIALIZER ──────────────────────────────────────────────────────────
function configureRoutes(routesService: RoutesService, configStateService: ConfigStateService) {
  return () => {
    // ─ PHASE 1 (sync): Register ALL routes with invisible:true
    // This ensures DynamicLayoutComponent always finds a route with
    // layout:application, so the sidebar chrome renders on every page.
    routesService.add(
      MENU_ITEMS.map(item => ({
        path: item.path,
        name: item.name,
        iconClass: item.iconClass,
        order: item.order,
        layout: eLayoutType.application,
        invisible: true, // hidden until we know the user's role
      }))
    );

    // ─ PHASE 2 (async, does NOT block app startup):
    // Once ABP's own APP_INITIALIZER has finished fetching
    // /api/abp/application-configuration, ConfigStateService emits the real
    // currentUser. We then show only the routes that match the user's role.
    //
    // Because Angular waits for ALL APP_INITIALIZER promises before bootstrapping,
    // and ABP's initializer does `await lastValueFrom(refreshAppState())`,
    // the config is ALWAYS loaded by the time the app renders.
    // The subscription below fires on the very next tick after bootstrap.
    configStateService
      .getOne$('currentUser')
      .pipe(
        filter(u => u !== undefined),
        take(1)
      )
      .subscribe(currentUser => {
        const isAuth: boolean = (currentUser as any)?.isAuthenticated ?? false;
        const userRoles: string[] = (currentUser as any)?.roles ?? [];

        MENU_ITEMS.forEach(item => {
          const visible =
            isAuth &&
            (!item.roles?.length || item.roles.some(r => userRoles.includes(r)));

          routesService.patch(item.name, { invisible: !visible });
        });
      });

    // Return void (synchronous) — app startup is NOT blocked by Phase 2
  };
}

// Navigation is now fully managed by BottomNavComponent
// (mobile bottom bar + desktop sidebar) using role-aware helpers defined there.
