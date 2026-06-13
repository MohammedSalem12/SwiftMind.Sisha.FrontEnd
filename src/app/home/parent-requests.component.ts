import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { ParentService } from '@proxy/parents';
import type { ParentStudentDto } from '@proxy/parents/models';
import { ParentStudentLinkStatus } from '@proxy/enums/parent-student-link-status.enum';

interface RequestItem {
  id: string;
  type: 'enrollment';
  title: string;
  subtitle: string;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: string;
  date: Date;
  details: {
    studentName?: string;
    studentCode?: string;
    courseName?: string;
    courseCode?: string;
    teacherName?: string;
    groupName?: string;
  };
  originalRequest?: EnrollmentRequestDto;
  needsMyApproval: boolean;
}

@Component({
  selector: 'app-parent-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="requests-page">
      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1>طلباتي</h1>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab" [class.active]="activeTab() === 'pending'"
                (click)="setTab('pending')">
          <i class="fas fa-clock"></i>
          <span>موافقتي</span>
          <span class="badge" *ngIf="pendingRequests().length > 0">
            {{ pendingRequests().length }}
          </span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'links'"
                (click)="setTab('links')">
          <i class="fas fa-user-plus"></i>
          <span>الربط</span>
          <span class="badge badge--amber" *ngIf="linkRequests().length > 0">
            {{ linkRequests().length }}
          </span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'ended'"
                (click)="setTab('ended')">
          <i class="fas fa-check-circle"></i>
          <span>منتهية</span>
          <span class="badge" *ngIf="endedRequests().length > 0">
            {{ endedRequests().length }}
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-container">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading()" class="content">
        
        <!-- Pending Tab -->
        <div *ngIf="activeTab() === 'pending'">
          <div *ngIf="pendingRequests().length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-inbox"></i>
            </div>
            <h3>لا توجد طلبات معلقة</h3>
            <p>ليس لديك طلبات تنتظر موافقتك حالياً</p>
          </div>

          <div class="requests-list">
            <div class="request-card" *ngFor="let req of pendingRequests()">
              <div class="request-icon pending">
                <i class="fas fa-book-open"></i>
              </div>
              <div class="request-content">
                <h3>{{ req.title }}</h3>
                <p class="subtitle">{{ req.subtitle }}</p>
                <div class="request-details">
                  <span *ngIf="req.details.studentName">
                    <i class="fas fa-user-graduate"></i> {{ req.details.studentName }}
                  </span>
                  <span *ngIf="req.details.teacherName">
                    <i class="fas fa-chalkboard-teacher"></i> {{ req.details.teacherName }}
                  </span>
                </div>
                <div class="request-date">
                  <i class="fas fa-clock"></i>
                  {{ req.date | date:'short' }}
                </div>
              </div>
              <div class="request-actions" *ngIf="req.needsMyApproval">
                <button class="action-btn approve" (click)="approveRequest(req)">
                  <i class="fas fa-check"></i>
                </button>
                <button class="action-btn reject" (click)="rejectRequest(req)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Links Tab -->
        <div *ngIf="activeTab() === 'links'">
          <div *ngIf="linkRequests().length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-user-check"></i>
            </div>
            <h3>لا توجد طلبات ربط معلقة</h3>
            <p>جميع طلبات الربط اكتملت</p>
          </div>

          <div class="requests-list">
            <div class="request-card" *ngFor="let link of linkRequests()">
              <div class="request-icon" [ngClass]="link.linkStatus === 0 ? 'pending' : 'rejected'">
                <i class="fas fa-child"></i>
              </div>
              <div class="request-content">
                <h3>{{ link.studentName }}</h3>
                <p class="subtitle">{{ link.studentCode }}</p>
                <div class="request-details">
                  <span *ngIf="link.gradeName">
                    <i class="fas fa-graduation-cap"></i> {{ link.gradeName }}
                  </span>
                  <span *ngIf="link.relationshipType">
                    <i class="fas fa-link"></i> {{ link.relationshipType }}
                  </span>
                </div>
              </div>
              <div class="request-status">
                <span class="status-badge" [ngClass]="link.linkStatus === 0 ? 'pending-badge' : 'rejected'">
                  {{ link.linkStatus === 0 ? 'بانتظار موافقة الطالب' : 'مرفوض' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ended Tab -->
        <div *ngIf="activeTab() === 'ended'">
          <div *ngIf="endedRequests().length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-history"></i>
            </div>
            <h3>لا توجد طلبات سابقة</h3>
            <p>ستظهر هنا الطلبات المعتمدة والمرفوضة</p>
          </div>

          <div class="requests-list">
            <div class="request-card" *ngFor="let req of endedRequests()">
              <div class="request-icon" [ngClass]="req.status">
                <i class="fas fa-book-open"></i>
              </div>
              <div class="request-content">
                <h3>{{ req.title }}</h3>
                <p class="subtitle">{{ req.subtitle }}</p>
                <div class="request-details">
                  <span *ngIf="req.details.studentName">
                    <i class="fas fa-user-graduate"></i> {{ req.details.studentName }}
                  </span>
                  <span *ngIf="req.details.teacherName">
                    <i class="fas fa-chalkboard-teacher"></i> {{ req.details.teacherName }}
                  </span>
                </div>
                <div class="request-date">
                  <i class="fas fa-clock"></i>
                  {{ req.date | date:'short' }}
                </div>
              </div>
              <div class="request-status">
                <span class="status-badge" [ngClass]="req.status">
                  {{ req.statusLabel }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Toast -->
      <div class="toast" *ngIf="toastMessage()" [class.success]="toastType() === 'success'" [class.error]="toastType() === 'error'">
        <i [class]="toastType() === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        <span>{{ toastMessage() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .requests-page {
      min-height: 100vh;
      background: #f5f7fa;
      padding-bottom: 100px;
    }

    /* ─── Header ─── */
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .page-header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    /* ─── Tabs ─── */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      background: #f5f7fa;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
      font-weight: 600;
      color: #6b7280;
    }

    .tab i {
      font-size: 1rem;
    }

    .tab.active {
      background: #f0f4ff;
      border-color: #667eea;
      color: #667eea;
    }

    .tab .badge {
      background: #667eea;
      color: white;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      font-weight: 700;
    }

    .tab.active .badge {
      background: #667eea;
    }

    .badge--amber {
      background: #f59e0b;
    }

    .status-badge.pending-badge {
      background: #fef3c7;
      color: #d97706;
    }

    /* ─── Loading ─── */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #764ba2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ─── Content ─── */
    .content {
      padding: 1rem;
    }

    /* ─── Empty State ─── */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f0f4ff 0%, #e8e0ff 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .empty-icon i {
      font-size: 2rem;
      color: #667eea;
    }

    .empty-state h3 {
      font-size: 1.1rem;
      color: #1a202c;
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0;
    }

    /* ─── Requests List ─── */
    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .request-card {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      background: white;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .request-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .request-icon.pending {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    }

    .request-icon.approved {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .request-icon.rejected {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .request-icon i {
      font-size: 1rem;
      color: white;
    }

    .request-content {
      flex: 1;
      min-width: 0;
    }

    .request-content h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.25rem;
    }

    .request-content .subtitle {
      font-size: 0.8rem;
      color: #6b7280;
      margin: 0 0 0.5rem;
    }

    .request-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.35rem;
    }

    .request-details span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .request-details i {
      color: #9ca3af;
      font-size: 0.7rem;
    }

    .request-date {
      font-size: 0.7rem;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .request-date i {
      font-size: 0.65rem;
    }

    /* ─── Actions ─── */
    .request-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .action-btn.approve {
      background: #d1fae5;
      color: #059669;
    }

    .action-btn.approve:hover {
      background: #10b981;
      color: white;
    }

    .action-btn.reject {
      background: #fee2e2;
      color: #dc2626;
    }

    .action-btn.reject:hover {
      background: #ef4444;
      color: white;
    }

    /* ─── Status ─── */
    .request-status {
      display: flex;
      align-items: center;
    }

    .status-badge {
      font-size: 0.7rem;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-weight: 600;
    }

    .status-badge.approved {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.rejected {
      background: #fee2e2;
      color: #dc2626;
    }

    /* ─── Toast ─── */
    .toast {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .toast.success {
      background: #10b981;
      color: white;
    }

    .toast.error {
      background: #ef4444;
      color: white;
    }

  `]
})
export class ParentRequestsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly configStateService = inject(ConfigStateService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly parentService = inject(ParentService);

  activeTab = signal<'pending' | 'links' | 'ended'>('pending');
  loading = signal(false);
  
  allRequests = signal<RequestItem[]>([]);
  pendingRequests = signal<RequestItem[]>([]);
  endedRequests = signal<RequestItem[]>([]);
  linkRequests = signal<ParentStudentDto[]>([]);
  
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  async ngOnInit(): Promise<void> {
    await this.loadRequests();
  }

  setTab(tab: 'pending' | 'links' | 'ended'): void {
    this.activeTab.set(tab);
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    try {
      const currentUserId = this.configStateService.getOne('currentUser')?.id;
      if (!currentUserId) {
        this.loading.set(false);
        return;
      }

      // Get parent info
      const parent = await lastValueFrom(this.parentService.getByUserId(currentUserId));
      if (!parent) {
        this.loading.set(false);
        return;
      }

      // Get all enrollment requests for parent's children
      const pendingEnrollments = await lastValueFrom(
        this.enrollmentRequestService.getPendingRequestsForCurrentParent()
      ).catch(() => []);

      // Get all requests (including ended ones)
      const allEnrollments = await lastValueFrom(
        this.enrollmentRequestService.getList()
      ).catch(() => []);

      // Get all linked students (all statuses)
      const linkedStudents = await lastValueFrom(
        this.parentService.getLinkedStudentsByParentId(parent.id!)
      ).catch(() => []);

      // Link requests = pending or rejected (not yet confirmed)
      const links = (linkedStudents || []).filter(
        s => s.linkStatus === ParentStudentLinkStatus.Pending ||
             s.linkStatus === ParentStudentLinkStatus.Rejected
      );
      this.linkRequests.set(links);

      const childrenIds = new Set(
        (linkedStudents || [])
          .filter(s => s.linkStatus === ParentStudentLinkStatus.Confirmed)
          .map(s => s.studentId)
      );

      // Map pending enrollments (waiting for parent approval)
      const pending: RequestItem[] = (pendingEnrollments || []).map(req => ({
        id: req.id!,
        type: 'enrollment' as const,
        title: `تسجيل في ${req.courseName || 'مقرر'}`,
        subtitle: req.courseCode || '',
        status: 'pending' as const,
        statusLabel: 'في انتظار موافقتك',
        date: new Date(req.creationTime || Date.now()),
        details: {
          studentName: req.studentName,
          studentCode: req.studentCode,
          courseName: req.courseName,
          courseCode: req.courseCode,
          teacherName: req.teacherName,
          groupName: req.groupName
        },
        originalRequest: req,
        needsMyApproval: req.isParentApproved !== true
      }));

      // Map ended enrollments (approved or rejected for parent's children)
      const ended: RequestItem[] = (allEnrollments || [])
        .filter(req => 
          childrenIds.has(req.studentId!) && 
          (req.status === EnrollmentRequestStatus.Approved || 
           req.status === EnrollmentRequestStatus.Rejected ||
           req.isParentApproved === true)
        )
        .map(req => ({
          id: req.id!,
          type: 'enrollment' as const,
          title: `تسجيل في ${req.courseName || 'مقرر'}`,
          subtitle: req.courseCode || '',
          status: req.status === EnrollmentRequestStatus.Approved ? 'approved' as const : 
                  req.status === EnrollmentRequestStatus.Rejected ? 'rejected' as const : 
                  'approved' as const,
          statusLabel: req.status === EnrollmentRequestStatus.Approved ? 'تمت الموافقة' : 
                       req.status === EnrollmentRequestStatus.Rejected ? 'مرفوض' : 
                       'تمت موافقتك',
          date: new Date(req.creationTime || Date.now()),
          details: {
            studentName: req.studentName,
            studentCode: req.studentCode,
            courseName: req.courseName,
            courseCode: req.courseCode,
            teacherName: req.teacherName,
            groupName: req.groupName
          },
          originalRequest: req,
          needsMyApproval: false
        }));

      this.pendingRequests.set(pending);
      this.endedRequests.set(ended);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async approveRequest(req: RequestItem): Promise<void> {
    if (!req.originalRequest) return;

    try {
      await lastValueFrom(
        this.enrollmentRequestService.approve({
          requestId: req.id,
          isParent: true
        })
      );
      this.showToast('تمت الموافقة على الطلب بنجاح', 'success');
      await this.loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      this.showToast('حدث خطأ أثناء الموافقة', 'error');
    }
  }

  async rejectRequest(req: RequestItem): Promise<void> {
    if (!req.originalRequest) return;

    try {
      await lastValueFrom(
        this.enrollmentRequestService.reject(req.id)
      );
      this.showToast('تم رفض الطلب', 'success');
      await this.loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      this.showToast('حدث خطأ أثناء الرفض', 'error');
    }
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3000);
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }
}
