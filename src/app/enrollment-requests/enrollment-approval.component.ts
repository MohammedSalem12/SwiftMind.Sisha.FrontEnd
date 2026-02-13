import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto, EnrollmentRequestRejectDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { GroupService } from '@proxy/groups';
import type { GroupDto } from '@proxy/groups/models';

@Component({
  selector: 'app-enrollment-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment-approval.component.html',
  styleUrls: ['./enrollment-approval.component.scss'],
})
export class EnrollmentApprovalComponent implements OnInit {
  private readonly enrollmentReqSvc = inject(EnrollmentRequestService);
  private readonly groupSvc = inject(GroupService);

  requests = signal<EnrollmentRequestDto[]>([]);
  groups = signal<GroupDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  processingId = signal<string | null>(null);

  selectedGroupId = signal<string | undefined>(undefined);
  rejectionReason = signal<string>('');
  showRejectModal = signal(false);
  rejectingRequestId = signal<string | null>(null);

  EnrollmentRequestStatus = EnrollmentRequestStatus;

  ngOnInit(): void {
    this.loadRequests();
    this.loadGroups();
  }

  async loadRequests() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.enrollmentReqSvc.getPendingRequestsForTeacher());
      this.requests.set(res ?? []);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to load pending requests.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadGroups() {
    try {
      const res = await lastValueFrom(this.groupSvc.getList());
      this.groups.set(res?.items ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  onGroupSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedGroupId.set(target.value || undefined);
  }

  async approve(req: EnrollmentRequestDto) {
    if (!confirm('Are you sure you want to approve this enrollment request?')) {
      return;
    }

    this.processingId.set(req.id ?? null);
    try {
      await lastValueFrom(
        this.enrollmentReqSvc.approve({
          requestId: req.id,
          isParent: false,
          groupId: this.selectedGroupId() || req.groupId,
        })
      );
      await this.loadRequests();
      this.selectedGroupId.set(undefined);
    } catch (e) {
      console.error(e);
      alert('Failed to approve enrollment request.');
    } finally {
      this.processingId.set(null);
    }
  }

  openRejectModal(req: EnrollmentRequestDto) {
    this.rejectingRequestId.set(req.id ?? null);
    this.rejectionReason.set('');
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.rejectingRequestId.set(null);
    this.rejectionReason.set('');
  }

  async confirmReject() {
    const requestId = this.rejectingRequestId();
    if (!requestId) return;

    this.processingId.set(requestId);
    try {
      await lastValueFrom(
        this.enrollmentReqSvc.reject({
          requestId: requestId,
          reason: this.rejectionReason() || undefined,
        })
      );
      this.closeRejectModal();
      await this.loadRequests();
    } catch (e) {
      console.error(e);
      alert('Failed to reject enrollment request.');
    } finally {
      this.processingId.set(null);
    }
  }

  getFilteredGroups(req: EnrollmentRequestDto): GroupDto[] {
    return this.groups().filter(g => g.courseId === req.courseId && g.teacherId === req.teacherId);
  }
}