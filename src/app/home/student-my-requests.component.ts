import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { StudentService } from '@proxy/students';
import type { ParentStudentDto } from '@proxy/parents/models';

type Tab = 'pending' | 'finished';

@Component({
  selector: 'app-student-my-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="requests-page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-text">
          <span class="header-title">طلباتي · My Requests</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab-btn" [class.tab-btn--active]="activeTab() === 'pending'" (click)="activeTab.set('pending')">
          <i class="fas fa-clock"></i>
          قيد الانتظار
          @if (pendingCount() > 0) {
            <span class="tab-badge">{{ pendingCount() }}</span>
          }
        </button>
        <button class="tab-btn" [class.tab-btn--active]="activeTab() === 'finished'" (click)="activeTab.set('finished')">
          <i class="fas fa-check-double"></i>
          المكتملة
          @if (finishedCount() > 0) {
            <span class="tab-badge tab-badge--gray">{{ finishedCount() }}</span>
          }
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="sk"></div>
          <div class="sk"></div>
          <div class="sk"></div>
        </div>
      }

      <!-- Content -->
      @if (!loading()) {

        <!-- PENDING TAB -->
        @if (activeTab() === 'pending') {

          <!-- Enrollment requests sent by student -->
          @if (pendingEnrollments().length > 0) {
            <div class="section-lbl">
              <i class="fas fa-paper-plane"></i>
              <span>طلبات التسجيل المُرسلة</span>
            </div>
            <div class="cards-list">
              @for (req of pendingEnrollments(); track req.id) {
                <div class="req-card">
                  <div class="req-card-top">
                    <div class="req-icon req-icon--sent">
                      <i class="fas fa-book"></i>
                    </div>
                    <div class="req-info">
                      <div class="req-title">{{ req.courseName }}</div>
                      <div class="req-sub">{{ req.courseCode }} · {{ req.teacherName }}</div>
                      @if (req.groupName) {
                        <div class="req-sub"><i class="fas fa-users"></i> {{ req.groupName }}</div>
                      }
                    </div>
                    <span class="status-chip status-chip--pending">قيد الانتظار</span>
                  </div>
                  <div class="approval-row">
                    <div class="approval-item" [class.approval-item--done]="req.isTeacherApproved">
                      <i class="fas" [class.fa-check-circle]="req.isTeacherApproved" [class.fa-clock]="!req.isTeacherApproved"></i>
                      موافقة المعلم
                    </div>
                    <div class="approval-item" [class.approval-item--done]="req.isParentApproved">
                      <i class="fas" [class.fa-check-circle]="req.isParentApproved" [class.fa-clock]="!req.isParentApproved"></i>
                      موافقة ولي الأمر
                    </div>
                  </div>
                  <button class="cancel-btn" [disabled]="cancellingId() === req.id" (click)="cancelRequest(req.id)">
                    @if (cancellingId() === req.id) {
                      <i class="fas fa-spinner fa-spin"></i> جاري الإلغاء...
                    } @else {
                      <i class="fas fa-times"></i> إلغاء الطلب
                    }
                  </button>
                </div>
              }
            </div>
          }

          <!-- Parent link requests received by student -->
          @if (pendingParentLinks().length > 0) {
            <div class="section-lbl">
              <i class="fas fa-link"></i>
              <span>طلبات ربط ولي الأمر الواردة</span>
            </div>
            <div class="cards-list">
              @for (link of pendingParentLinks(); track link.parentId) {
                <div class="req-card">
                  <div class="req-card-top">
                    <div class="req-icon req-icon--parent">
                      <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="req-info">
                      <div class="req-title">{{ link.parent?.firstName }} {{ link.parent?.lastName }}</div>
                      @if (link.relationshipType) {
                        <div class="req-sub">{{ link.relationshipType }}</div>
                      }
                    </div>
                    <span class="status-chip status-chip--pending">طلب وارد</span>
                  </div>
                  <div class="link-actions">
                    <button class="action-btn action-btn--accept" (click)="confirmParentLink(link)">
                      <i class="fas fa-check"></i> قبول
                    </button>
                    <button class="action-btn action-btn--reject" (click)="rejectParentLink(link)">
                      <i class="fas fa-times"></i> رفض
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Empty pending -->
          @if (pendingCount() === 0) {
            <div class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>لا توجد طلبات معلقة</p>
              <small>No pending requests</small>
            </div>
          }
        }

        <!-- FINISHED TAB -->
        @if (activeTab() === 'finished') {

          <!-- Finished enrollment requests -->
          @if (finishedEnrollments().length > 0) {
            <div class="section-lbl">
              <i class="fas fa-paper-plane"></i>
              <span>طلبات التسجيل المكتملة</span>
            </div>
            <div class="cards-list">
              @for (req of finishedEnrollments(); track req.id) {
                <div class="req-card">
                  <div class="req-card-top">
                    <div class="req-icon" [class.req-icon--approved]="req.status === EnrollmentRequestStatus.Approved" [class.req-icon--rejected]="req.status === EnrollmentRequestStatus.Rejected">
                      <i class="fas" [class.fa-check]="req.status === EnrollmentRequestStatus.Approved" [class.fa-times]="req.status === EnrollmentRequestStatus.Rejected"></i>
                    </div>
                    <div class="req-info">
                      <div class="req-title">{{ req.courseName }}</div>
                      <div class="req-sub">{{ req.courseCode }} · {{ req.teacherName }}</div>
                      @if (req.groupName) {
                        <div class="req-sub"><i class="fas fa-users"></i> {{ req.groupName }}</div>
                      }
                    </div>
                    @if (req.status === EnrollmentRequestStatus.Approved) {
                      <span class="status-chip status-chip--approved">مقبول</span>
                    } @else {
                      <span class="status-chip status-chip--rejected">مرفوض</span>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Confirmed parent links -->
          @if (confirmedParents().length > 0) {
            <div class="section-lbl">
              <i class="fas fa-user-shield"></i>
              <span>أولياء الأمور المرتبطون</span>
            </div>
            <div class="cards-list">
              @for (link of confirmedParents(); track link.parentId) {
                <div class="req-card">
                  <div class="req-card-top">
                    <div class="req-icon req-icon--approved">
                      <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="req-info">
                      <div class="req-title">{{ link.parent?.firstName }} {{ link.parent?.lastName }}</div>
                      @if (link.relationshipType) {
                        <div class="req-sub">{{ link.relationshipType }}</div>
                      }
                    </div>
                    <span class="status-chip status-chip--approved">مرتبط</span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Empty finished -->
          @if (finishedCount() === 0) {
            <div class="empty-state">
              <i class="fas fa-history"></i>
              <p>لا توجد طلبات مكتملة</p>
              <small>No finished requests yet</small>
            </div>
          }
        }
      }

    </div>
  `,
  styles: [`
    $pg: linear-gradient(135deg, #667eea, #764ba2);
    $ps: #667eea; $pe: #764ba2;

    .requests-page {
      min-height: 100vh;
      background: #f4f3ff;
      direction: rtl;
      padding-bottom: calc(1rem + env(safe-area-inset-bottom));
    }

    /* Header */
    .page-header {
      background: $pg;
      padding: 1rem;
      display: flex; align-items: center; gap: 0.85rem;
    }
    .back-btn {
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.2); border: none; border-radius: 50%;
      color: #fff; font-size: 1rem; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .header-text { display: flex; flex-direction: column; }
    .header-title { color: #fff; font-size: 1.1rem; font-weight: 700; }

    /* Tabs */
    .tabs-bar {
      display: flex;
      background: #fff;
      border-bottom: 2px solid #e9e6ff;
      position: sticky; top: 0; z-index: 10;
    }
    .tab-btn {
      flex: 1; padding: 0.85rem 0.5rem;
      background: none; border: none; border-bottom: 3px solid transparent;
      font-size: 0.88rem; font-weight: 600; color: #9ca3af;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      transition: all 0.2s ease; margin-bottom: -2px;
      i { font-size: 0.8rem; }
    }
    .tab-btn--active { color: $pe; border-bottom-color: $pe; }
    .tab-badge {
      background: $pg; color: #fff;
      border-radius: 20px; padding: 0.1rem 0.45rem;
      font-size: 0.68rem; font-weight: 700;
    }
    .tab-badge--gray { background: #e5e7eb; color: #6b7280; }

    /* Loading */
    .loading-area { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .sk {
      height: 90px; border-radius: 14px;
      background: linear-gradient(90deg, #e9e6ff 25%, #f4f3ff 50%, #e9e6ff 75%);
      background-size: 600px 100%; animation: shimmer 1.5s infinite;
    }

    /* Section label */
    .section-lbl {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0 1rem; margin: 1rem 0 0.5rem;
      font-size: 0.82rem; font-weight: 600; color: #374151;
      i { color: $ps; }
    }

    /* Cards */
    .cards-list { padding: 0 1rem; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.25rem; }
    .req-card {
      background: #fff; border-radius: 14px;
      padding: 0.9rem 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1.5px solid #e9e6ff;
    }
    .req-card-top { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; }
    .req-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; color: #fff;
    }
    .req-icon--sent { background: $pg; }
    .req-icon--parent { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
    .req-icon--approved { background: linear-gradient(135deg, #4ade80, #16a34a); }
    .req-icon--rejected { background: linear-gradient(135deg, #f87171, #dc2626); }

    .req-info { flex: 1; min-width: 0; }
    .req-title { font-size: 0.9rem; font-weight: 700; color: #1a202c; margin-bottom: 0.2rem; }
    .req-sub { font-size: 0.75rem; color: #9ca3af; display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.68rem; }
    }

    /* Status chips */
    .status-chip {
      flex-shrink: 0; border-radius: 20px;
      padding: 0.2rem 0.65rem; font-size: 0.7rem; font-weight: 700;
    }
    .status-chip--pending { background: #fef3c7; color: #d97706; }
    .status-chip--approved { background: #dcfce7; color: #16a34a; }
    .status-chip--rejected { background: #fef2f2; color: #dc2626; }

    /* Approval indicators */
    .approval-row {
      display: flex; gap: 1rem;
      background: #f4f3ff; border-radius: 8px; padding: 0.55rem 0.75rem;
      margin-bottom: 0.65rem;
    }
    .approval-item {
      display: flex; align-items: center; gap: 0.3rem;
      font-size: 0.75rem; color: #9ca3af;
      i { font-size: 0.8rem; color: #9ca3af; }
    }
    .approval-item--done { color: #16a34a; i { color: #16a34a; } }

    /* Cancel btn */
    .cancel-btn {
      width: 100%; background: #fef2f2; color: #dc2626;
      border: 1px solid #fecaca; border-radius: 8px;
      padding: 0.5rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      min-height: 40px;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    /* Parent link actions */
    .link-actions { display: flex; gap: 0.5rem; }
    .action-btn {
      flex: 1; border: none; border-radius: 8px;
      padding: 0.5rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.3rem;
      min-height: 40px;
    }
    .action-btn--accept { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
    .action-btn--reject { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

    /* Empty */
    .empty-state {
      text-align: center; padding: 3rem 1.5rem; color: #9ca3af;
      i { font-size: 3rem; color: #c4b5fd; display: block; margin-bottom: 0.75rem; }
      p { font-size: 0.95rem; font-weight: 600; color: #374151; margin: 0 0 0.25rem; }
      small { font-size: 0.78rem; }
    }
  `],
})
export class StudentMyRequestsComponent implements OnInit {
  private readonly router                 = inject(Router);
  private readonly enrollmentRequestSvc   = inject(EnrollmentRequestService);
  private readonly studentService         = inject(StudentService);

  readonly EnrollmentRequestStatus = EnrollmentRequestStatus;

  activeTab          = signal<Tab>('pending');
  allRequests        = signal<EnrollmentRequestDto[]>([]);
  pendingParentLinks = signal<ParentStudentDto[]>([]);
  confirmedParents   = signal<ParentStudentDto[]>([]);
  loading            = signal(true);
  cancellingId       = signal<string | null>(null);

  pendingEnrollments  = computed(() => this.allRequests().filter(r => r.status === EnrollmentRequestStatus.Pending));
  finishedEnrollments = computed(() => this.allRequests().filter(r => r.status !== EnrollmentRequestStatus.Pending));
  pendingCount        = computed(() => this.pendingEnrollments().length + this.pendingParentLinks().length);
  finishedCount       = computed(() => this.finishedEnrollments().length + this.confirmedParents().length);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [reqs, pending, confirmed] = await Promise.all([
        lastValueFrom(this.enrollmentRequestSvc.getRequestsForCurrentStudent()),
        lastValueFrom(this.studentService.getPendingLinksForCurrentStudent()).catch(() => []),
        lastValueFrom(this.studentService.getConfirmedParentsForCurrentStudent()).catch(() => []),
      ]);
      this.allRequests.set(reqs || []);
      this.pendingParentLinks.set(pending || []);
      this.confirmedParents.set(confirmed || []);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async cancelRequest(requestId?: string): Promise<void> {
    if (!requestId || this.cancellingId()) return;
    this.cancellingId.set(requestId);
    try {
      await lastValueFrom(this.enrollmentRequestSvc.reject(requestId));
      const reqs = await lastValueFrom(this.enrollmentRequestSvc.getRequestsForCurrentStudent());
      this.allRequests.set(reqs || []);
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      this.cancellingId.set(null);
    }
  }

  async confirmParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.studentService.confirmParentStudentLink(link.parentId!, link.studentId!));
      const [pending, confirmed] = await Promise.all([
        lastValueFrom(this.studentService.getPendingLinksForCurrentStudent()),
        lastValueFrom(this.studentService.getConfirmedParentsForCurrentStudent()),
      ]);
      this.pendingParentLinks.set(pending || []);
      this.confirmedParents.set(confirmed || []);
    } catch (err) { console.error(err); }
  }

  async rejectParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.studentService.rejectParentStudentLink(link.parentId!, link.studentId!));
      const pending = await lastValueFrom(this.studentService.getPendingLinksForCurrentStudent());
      this.pendingParentLinks.set(pending || []);
    } catch (err) { console.error(err); }
  }

  goBack(): void { this.router.navigate(['/student']); }
}
