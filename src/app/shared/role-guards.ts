import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleBasedUIService } from '../shared/role-based-ui.service';

/**
 * Guard to ensure only students can access student dashboard
 */
export const studentDashboardGuard: CanActivateFn = () => {
  const roleService = inject(RoleBasedUIService);
  const router = inject(Router);

  if (roleService.isStudent()) {
    return true;
  }

  // Redirect to appropriate dashboard or home based on role
  if (roleService.isParent()) {
    router.navigate(['/parents/dashboard']);
  } else if (roleService.isTeacher()) {
    router.navigate(['/teacher-groups']); // Teachers don't have a dedicated dashboard, redirect to their groups
  } else if (roleService.isSecretary()) {
    router.navigate(['/secretaries/dashboard']);
  } else {
    router.navigate(['/']);
  }

  return false;
};

/**
 * Guard to ensure only parents can access parent dashboard
 */
export const parentDashboardGuard: CanActivateFn = () => {
  const roleService = inject(RoleBasedUIService);
  const router = inject(Router);

  if (roleService.isParent()) {
    return true;
  }

  // Redirect to appropriate dashboard based on role
  if (roleService.isStudent()) {
    router.navigate(['/students/dashboard']);
  } else if (roleService.isTeacher()) {
    router.navigate(['/teacher-groups']);
  } else if (roleService.isSecretary()) {
    router.navigate(['/secretaries/dashboard']);
  } else {
    router.navigate(['/']);
  }

  return false;
};

/**
 * Guard to ensure only teachers can access teacher-specific pages
 */
export const teacherGuard: CanActivateFn = () => {
  const roleService = inject(RoleBasedUIService);
  const router = inject(Router);

  if (roleService.isTeacher()) {
    return true;
  }

  // Redirect to appropriate dashboard based on role
  if (roleService.isStudent()) {
    router.navigate(['/students/dashboard']);
  } else if (roleService.isParent()) {
    router.navigate(['/parents/dashboard']);
  } else if (roleService.isSecretary()) {
    router.navigate(['/secretaries/dashboard']);
  } else {
    router.navigate(['/']);
  }

  return false;
};

/**
 * Guard to ensure only secretaries can access secretary dashboard
 */
export const secretaryDashboardGuard: CanActivateFn = () => {
  const roleService = inject(RoleBasedUIService);
  const router = inject(Router);

  if (roleService.isSecretary()) {
    return true;
  }

  // Redirect to appropriate dashboard based on role
  if (roleService.isStudent()) {
    router.navigate(['/students/dashboard']);
  } else if (roleService.isParent()) {
    router.navigate(['/parents/dashboard']);
  } else if (roleService.isTeacher()) {
    router.navigate(['/teacher-groups']);
  } else {
    router.navigate(['/']);
  }

  return false;
};

/**
 * Generic role-based guard that redirects to appropriate dashboard
 */
export const roleBasedRedirectGuard: CanActivateFn = () => {
  const roleService = inject(RoleBasedUIService);
  const router = inject(Router);

  // Redirect to role-appropriate page
  if (roleService.isStudent()) {
    router.navigate(['/students/dashboard']);
    return false;
  } else if (roleService.isParent()) {
    router.navigate(['/parents/dashboard']);
    return false;
  } else if (roleService.isTeacher()) {
    router.navigate(['/teacher-groups']);
    return false;
  } else if (roleService.isSecretary()) {
    router.navigate(['/secretaries/dashboard']);
    return false;
  }

  // If no specific role, allow access to home
  return true;
};