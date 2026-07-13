import { Routes } from '@angular/router';

export const marketerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./marketer-home.component').then(m => m.MarketerHomeComponent),
  },
  {
    path: 'teachers',
    loadComponent: () => import('./marketer-teachers.component').then(m => m.MarketerTeachersComponent),
  },
  {
    path: 'onboard',
    loadComponent: () => import('./marketer-onboard.component').then(m => m.MarketerOnboardComponent),
  },
  {
    path: 'teacher/:id',
    loadComponent: () => import('./marketer-teacher-setup.component').then(m => m.MarketerTeacherSetupComponent),
  },
  {
    path: 'fees',
    loadComponent: () => import('./marketer-fees.component').then(m => m.MarketerFeesComponent),
  },
  {
    path: 'leads',
    loadComponent: () => import('./marketer-leads.component').then(m => m.MarketerLeadsComponent),
  },
  {
    path: 'leads/new',
    loadComponent: () => import('./marketer-lead-form.component').then(m => m.MarketerLeadFormComponent),
  },
  {
    path: 'leads/:id/edit',
    loadComponent: () => import('./marketer-lead-form.component').then(m => m.MarketerLeadFormComponent),
  },
  {
    path: 'leads/:id',
    loadComponent: () => import('./marketer-lead-detail.component').then(m => m.MarketerLeadDetailComponent),
  },
];
