import { RoutesService, eLayoutType, AuthService, ConfigStateService } from '@abp/ng.core';
import { APP_INITIALIZER } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  { provide: APP_INITIALIZER, useFactory: configureRoutes, deps: [RoutesService, AuthService, ConfigStateService], multi: true },
];

function configureRoutes(routesService: RoutesService, authService: AuthService, configStateService: ConfigStateService) {
  return () => {
    // Helper to check authentication status dynamically
    const isAuthenticated = () => {
      debugger;
      return authService.isAuthenticated;
    };

    // Helper to check if current user is a teacher
    const isTeacher = () => {
      debugger;
      alert('Checking if user is teacher...');
      if (!authService.isAuthenticated) {
        return false;
      }
      
      try {
        const currentUser = configStateService.getOne('currentUser') as any;
        
        // Debug: log current user to console for debugging purposes
        console.log('Current user data for role checking:', currentUser);
        
        // Check multiple possible properties where roles might be stored
        const roles = currentUser?.roles || 
                     currentUser?.roleNames || 
                     currentUser?.userRoles || 
                     [];
        alert('User roles: ' + JSON.stringify(roles));
        // Check if user has teacher role (case-insensitive)
        const isTeacherRole = Array.isArray(roles) 
          ? roles.some((role: any) => typeof role === 'string' && role.toLowerCase() === 'teacher')
          : false;
          
        // Also check if there's a userType property for custom user types
        const userType = currentUser?.userType || currentUser?.type;
        const isTeacherType = userType === 'Teacher' || userType === 'teacher' || userType === 3; // UserRegistrationType.Teacher = 3
        
        const result = isTeacherRole || isTeacherType;
        console.log('Is teacher check result:', result, { roles, userType, isTeacherRole, isTeacherType });
        
        return result;
      } catch (error) {
        console.warn('Error checking teacher role:', error);
        return false;
      }
    };

    // Helper to check if current user is a secretary
    const isSecretary = () => {
      if (!authService.isAuthenticated) {
        return false;
      }
      
      try {
        const currentUser = configStateService.getOne('currentUser') as any;
        
        // Check multiple possible properties where roles might be stored
        const roles = currentUser?.roles || 
                     currentUser?.roleNames || 
                     currentUser?.userRoles || 
                     [];
        
        // Check if user has secretary role (case-insensitive)
        const isSecretaryRole = Array.isArray(roles) 
          ? roles.some((role: any) => typeof role === 'string' && role.toLowerCase() === 'secretary')
          : false;
          
        // Also check if there's a userType property for custom user types
        const userType = currentUser?.userType || currentUser?.type;
        const isSecretaryType = userType === 'Secretary' || userType === 'secretary' || userType === 4; // Assuming Secretary = 4
        
        const result = isSecretaryRole || isSecretaryType;
        console.log('Is secretary check result:', result, { roles, userType, isSecretaryRole, isSecretaryType });
        
        return result;
      } catch (error) {
        console.warn('Error checking secretary role:', error);
        return false;
      }
    };

    // Helper to check if current user is either teacher or secretary
    const isTeacherOrSecretary = () => {
      return isTeacher() || isSecretary();
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
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/teacher-groups',
        name: 'مجموعاتي',
        iconClass: 'fas fa-layer-group',
        order: 3,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacherOrSecretary(),
      },
      {
        path: '/students-grades',
        name: 'درجات الطلاب',
        iconClass: 'fas fa-user-graduate',
        order: 4,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/teachers',
        name: 'المعلمين',
        iconClass: 'fas fa-chalkboard-teacher',
        order: 5,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/parents',
        name: 'أولياء الأمور',
        iconClass: 'fas fa-users-cog',
        order: 6,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/courses',
        name: 'المقررات',
        iconClass: 'fas fa-book',
        order: 7,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/attendance',
        name: 'الحضور',
        iconClass: 'fas fa-user-check',
        order: 8,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/exam-grade',
        name: 'درجات الاختبار',
        iconClass: 'fas fa-clipboard-list',
        order: 9,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/feeds',
        name: 'النشرات',
        iconClass: 'fas fa-rss',
        order: 10,
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
