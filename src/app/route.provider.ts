import { RoutesService, eLayoutType, AuthService, ConfigStateService } from '@abp/ng.core';
import { APP_INITIALIZER } 
      {
        path: '/enrollment-requests',
        name: 'طلبات التسجيل',
        iconClass: 'fas fa-file-import',
        order: 14,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },from '@angular/core';

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

    // Helper to check if current user is a parent
    const isParent = () => {
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
        
        // Check if user has parent role (case-insensitive)
        const isParentRole = Array.isArray(roles) 
          ? roles.some((role: any) => typeof role === 'string' && role.toLowerCase() === 'parent')
          : false;
          
        // Also check if there's a userType property for custom user types
        const userType = currentUser?.userType || currentUser?.type;
        const isParentType = userType === 'Parent' || userType === 'parent' || userType === 5; // Assuming Parent = 5
        
        const result = isParentRole || isParentType;
        console.log('Is parent check result:', result, { roles, userType, isParentRole, isParentType });
        
        return result;
      } catch (error) {
        console.warn('Error checking parent role:', error);
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
        name: 'Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©',
        iconClass: 'fas fa-home',
        order: 1,
        layout: eLayoutType.application,
      },
      // All other menu items only visible when authenticated
      {
        path: '/students',
        name: 'Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø·Ù„Ø§Ø¨',
        iconClass: 'fas fa-users',
        order: 2,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/students/dashboard',
        name: 'Ù„ÙˆØ­Ø© Ø§Ù„Ø·Ø§Ù„Ø¨',
        iconClass: 'fas fa-tachometer-alt',
        order: 3,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(), // All authenticated users can access their own dashboard
      },
      {
        path: '/parents/dashboard',
        name: 'Ù„ÙˆØ­Ø© ÙˆÙ„ÙŠ Ø§Ù„Ø£Ù…Ø±',
        iconClass: 'fas fa-user-friends',
        order: 4,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isParent(),
      },
      {
        path: '/teacher-groups',
        name: 'Ù…Ø¬Ù…ÙˆØ¹Ø§ØªÙŠ',
        iconClass: 'fas fa-layer-group',
        order: 5,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacherOrSecretary(),
      },
      {
        path: '/students-grades',
        name: 'Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø·Ù„Ø§Ø¨',
        iconClass: 'fas fa-user-graduate',
        order: 6,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/teachers',
        name: 'Ø§Ù„Ù…Ø¹Ù„Ù…ÙŠÙ†',
        iconClass: 'fas fa-chalkboard-teacher',
        order: 7,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/parents',
        name: 'Ø£ÙˆÙ„ÙŠØ§Ø¡ Ø§Ù„Ø£Ù…ÙˆØ±',
        iconClass: 'fas fa-users-cog',
        order: 8,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/courses',
        name: 'Ø§Ù„Ù…Ù‚Ø±Ø±Ø§Øª',
        iconClass: 'fas fa-book',
        order: 9,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/attendance',
        name: 'Ø§Ù„Ø­Ø¶ÙˆØ±',
        iconClass: 'fas fa-user-check',
        order: 10,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/exam-grade',
        name: 'Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±',
        iconClass: 'fas fa-clipboard-list',
        order: 11,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && isTeacher(),
      },
      {
        path: '/feeds',
        name: 'Ø§Ù„Ù†Ø´Ø±Ø§Øª',
        iconClass: 'fas fa-rss',
        order: 12,
        layout: eLayoutType.application,
        visible: () => isAuthenticated(),
      },
      {
        path: '/secretaries',
        name: 'Ø§Ù„Ø³ÙƒØ±ØªØ§Ø±ÙŠØ©',
        iconClass: 'fas fa-user-tie',
        order: 13,
        layout: eLayoutType.application,
        visible: () => isAuthenticated() && (isSecretary() || isTeacher()), // Secretaries and teachers can access
      },
    ];

    // Conditionally add authentication-related menu items
    if (!isAuthenticated()) {
      // Show login and register for unauthenticated users
      menuItems.push({
        path: '/login',
        name: 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„',
        iconClass: 'fas fa-sign-in-alt',
        order: 13,
        layout: eLayoutType.account,
      });
      menuItems.push({
        path: '/register',
        name: 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨',
        iconClass: 'fas fa-user-plus',
        order: 14,
        layout: eLayoutType.account,
      });
    } else {
      // Show profile management for authenticated users
      menuItems.push({
        path: '/account/manage',
        name: 'Ù…Ù„ÙÙŠ Ø§Ù„Ø´Ø®ØµÙŠ',
        iconClass: 'fas fa-user-cog',
        order: 13,
        layout: eLayoutType.application,
      });
    }

    routesService.add(menuItems);
  };
}

