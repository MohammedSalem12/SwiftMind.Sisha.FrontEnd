import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ConfigStateService } from '@abp/ng.core';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const configStateService = inject(ConfigStateService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }

  // Get allowed roles from route data
  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  
  if (!allowedRoles || allowedRoles.length === 0) {
    // No role restrictions, allow access
    return true;
  }

  try {
    const currentUser = configStateService.getOne('currentUser') as any;
    
    // Get user roles from various possible properties
    const userRoles = currentUser?.roles || 
                     currentUser?.roleNames || 
                     currentUser?.userRoles || 
                     [];

    // Check if user has any of the allowed roles (case-insensitive)
    const hasAllowedRole = Array.isArray(userRoles) 
      ? userRoles.some((role: any) => 
          allowedRoles.some(allowedRole => 
            typeof role === 'string' && 
            role.toLowerCase() === allowedRole.toLowerCase()
          )
        )
      : false;

    if (hasAllowedRole) {
      return true;
    }

    // User doesn't have required role, redirect to home
    console.warn('Access denied: User does not have required role', { 
      userRoles, 
      requiredRoles: allowedRoles 
    });
    router.navigate(['/']);
    return false;

  } catch (error) {
    console.error('Error checking user roles:', error);
    router.navigate(['/']);
    return false;
  }
};
