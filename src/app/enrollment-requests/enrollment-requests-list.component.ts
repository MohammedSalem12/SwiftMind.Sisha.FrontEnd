import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';

@Component({
  selector: 'app-enrollment-requests-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enrollment-requests-list.component.html',
  styleUrls: ['./enrollment-requests-list.component.scss'],
})
export class EnrollmentRequestsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly enrollmentReqSvc = inject(EnrollmentRequestService);

  requests = signal<EnrollmentRequestDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  EnrollmentRequestStatus = EnrollmentRequestStatus;

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.enrollmentReqSvc.getMyRequests());
      this.requests.set(res ?? []);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to load enrollment requests.');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusBadgeClass(status?: EnrollmentRequestStatus): string {
    switch (status) {
      case EnrollmentRequestStatus.Pending:
        return 'badge bg-warning';
      case EnrollmentRequestStatus.Approved:
        return 'badge bg-success';
      case EnrollmentRequestStatus.Rejected:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(status?: EnrollmentRequestStatus): string {
    switch (status) {
      case EnrollmentRequestStatus.Pending:
        return 'Pending';
      case EnrollmentRequestStatus.Approved:
        return 'Approved';
      case EnrollmentRequestStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  createNew() {
    this.router.navigate(['/enrollment-requests/create']);
  }
}
