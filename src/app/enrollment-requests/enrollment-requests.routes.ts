import { Routes } from '@angular/router';
import { CreateEnrollmentRequestComponent } from './create-enrollment-request.component';
import { EnrollmentRequestsListComponent } from './enrollment-requests-list.component';
import { EnrollmentApprovalComponent } from './enrollment-approval.component';

export const enrollmentRequestRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    component: EnrollmentRequestsListComponent
  },
  {
    path: 'create',
    component: CreateEnrollmentRequestComponent
  },
  {
    path: 'approve',
    component: EnrollmentApprovalComponent
  }
];
