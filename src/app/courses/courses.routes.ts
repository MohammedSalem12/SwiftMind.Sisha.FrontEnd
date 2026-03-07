import { Route } from '@angular/router';

export const coursesRoutes: Route[] = [
  { path: '', loadComponent: () => import('./courses.component').then(m => m.CoursesComponent) },
  { path: ':id/edit', loadComponent: () => import('./edit-course.component').then(m => m.EditCourseComponent) },
  { path: ':id/groups', loadComponent: () => import('./course-groups.component').then(m => m.CourseGroupsComponent) },
  { path: ':id/groups/create', loadComponent: () => import('./create-group.component').then(m => m.CreateGroupComponent) },
];
