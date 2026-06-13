import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfigStateService } from '@abp/ng.core';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { EnrollmentRequestDto } from '@proxy/student-enrollments/models';

@Component({
  selector: 'app-enrollment-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="enrollment-requests-container">
      <div class="container py-4">
        <!-- Header -->
        <div class="mb-4">
          <h2><i class="bi bi-inbox"></i> طلبات التسجيل</h2>
          <p class="text-muted">راجع وافق على طلبات التسجيل المعلقة</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <!-- Requests List -->
        <div *ngIf="!loading()" class="requests-list">
          <div class="row g-3">
            <div class="col-md-6" *ngFor="let request of requests()">
              <div class="card request-card h-100">
                <div class="card-body">
                  <!-- Request Header -->
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 class="card-title mb-1">{{ request.studentName }}</h5>
                      <p class="text-muted mb-0">
                        <small>كود الطالب: {{ request.studentCode }}</small>
                      </p>
                    </div>
                    <span class="badge" [ngClass]="getStatusBadgeClass(request.status!)">
                      {{ getStatusText(request.status!) }}
                    </span>
                  </div>

                  <!-- Request Details -->
                  <div class="request-details mb-3">
                    <div class="detail-item">
                      <i class="bi bi-book"></i>
                      <span class="fw-bold">المقرر:</span>
                      <span>{{ request.courseName }} ({{ request.courseCode }})</span>
                    </div>
                    <div class="detail-item">
                      <i class="bi bi-people"></i>
                      <span class="fw-bold">المجموعة:</span>
                      <span>{{ request.groupName }}</span>
                    </div>
                    <div class="detail-item" *ngIf="isSecretary()">
                      <i class="bi bi-person"></i>
                      <span class="fw-bold">المعلم:</span>
                      <span>{{ request.teacherName }}</span>
                    </div>
                  </div>

                  <!-- Approval Status -->
                  <div class="approval-status mb-3">
                    <div class="status-item">
                      <i class="bi" [ngClass]="request.isTeacherApproved ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                      <span>موافقة المعلم</span>
                    </div>
                    <div class="status-item">
                      <i class="bi" [ngClass]="request.isParentApproved ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                      <span>موافقة ولي الأمر</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="action-buttons" *ngIf="request.status === EnrollmentRequestStatus.Pending">
                    <button 
                      class="btn btn-success flex-fill me-2"
                      (click)="approveRequest(request)"
                      [disabled]="processingRequest() === request.id">
                      <i class="bi bi-check-lg"></i>
                      <span *ngIf="processingRequest() !== request.id">موافقة</span>
                      <span *ngIf="processingRequest() === request.id">جاري المعالجة...</span>
                    </button>
                    <button 
                      class="btn btn-danger flex-fill"
                      (click)="rejectRequest(request)"
                      [disabled]="processingRequest() === request.id">
                      <i class="bi bi-x-lg"></i>
                      رفض
                    </button>
                  </div>

                  <!-- Already Processed -->
                  <div *ngIf="request.status !== EnrollmentRequestStatus.Pending" class="alert alert-info mb-0">
                    <i class="bi bi-info-circle"></i>
                    تمت معالجة هذا الطلب
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="requests().length === 0" class="text-center py-5">
            <i class="bi bi-inbox fs-1 text-muted"></i>
            <p class="text-muted mt-3">لا توجد طلبات تسجيل معلقة حالياً</p>
          </div>
        </div>

        <!-- Success Message -->
        <div *ngIf="successMessage()" class="alert alert-success alert-dismissible fade show mt-3" role="alert">
          <i class="bi bi-check-circle"></i> {{ successMessage() }}
          <button type="button" class="btn-close" (click)="successMessage.set('')"></button>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage()" class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
          <i class="bi bi-exclamation-triangle"></i> {{ errorMessage() }}
          <button type="button" class="btn-close" (click)="errorMessage.set('')"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .request-card {
      border: 1px solid #dee2e6;
      transition: box-shadow 0.2s;
    }

    .request-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .detail-item {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-item i {
      color: #6c757d;
      margin-right: 8px;
      width: 20px;
    }

    .detail-item .fw-bold {
      margin-right: 8px;
      min-width: 80px;
      display: inline-block;
    }

    .approval-status {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .status-item i {
      font-size: 1.2rem;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .badge {
      font-size: 0.85rem;
      padding: 6px 12px;
    }
  `]
})
export class EnrollmentRequestsComponent implements OnInit {
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly configStateService = inject(ConfigStateService);
  private readonly destroyRef = inject(DestroyRef);

  requests = signal<EnrollmentRequestDto[]>([]);
  loading = signal(false);
  processingRequest = signal<string>('');
  successMessage = signal('');
  errorMessage = signal('');
  EnrollmentRequestStatus = EnrollmentRequestStatus;

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading.set(true);
    this.errorMessage.set('');

    // Check if user is secretary/admin or teacher
    const service = this.isSecretary() 
      ? this.enrollmentRequestService.getPendingRequestsForSecretary()
      : this.enrollmentRequestService.getPendingRequestsForCurrentTeacher();

    service.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.errorMessage.set('حدث خطأ أثناء تحميل الطلبات');
        this.loading.set(false);
      }
    });
  }

  approveRequest(request: EnrollmentRequestDto) {
    this.processingRequest.set(request.id!);
    this.errorMessage.set('');
    this.successMessage.set('');

    const approveDto = {
      requestId: request.id!,
      isParent: false // Teacher/Secretary approval
    };

    this.enrollmentRequestService.approve(approveDto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.successMessage.set(`تمت الموافقة على طلب ${request.studentName} بنجاح`);
        this.processingRequest.set('');
        this.loadRequests(); // Reload the list
      },
      error: (error) => {
        console.error('Error approving request:', error);
        this.errorMessage.set('حدث خطأ أثناء الموافقة على الطلب');
        this.processingRequest.set('');
      }
    });
  }

  rejectRequest(request: EnrollmentRequestDto) {
    if (!confirm(`هل أنت متأكد من رفض طلب ${request.studentName}؟`)) {
      return;
    }

    this.processingRequest.set(request.id!);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentRequestService.reject(request.id!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.successMessage.set(`تم رفض طلب ${request.studentName}`);
        this.processingRequest.set('');
        this.loadRequests(); // Reload the list
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.errorMessage.set('حدث خطأ أثناء رفض الطلب');
        this.processingRequest.set('');
      }
    });
  }

  isSecretary(): boolean {
    const cu = this.configStateService.getOne('currentUser') as any;
    const roles: string[] = (cu?.roles || cu?.roleNames || cu?.userRoles || [])
      .map((r: any) => (typeof r === 'string' ? r.toUpperCase() : ''));
    return roles.includes('SECRETARY') || roles.includes('ADMIN');
  }

  getStatusText(status: EnrollmentRequestStatus): string {
    switch (status) {
      case EnrollmentRequestStatus.Pending:
        return 'قيد الانتظار';
      case EnrollmentRequestStatus.Approved:
        return 'تمت الموافقة';
      case EnrollmentRequestStatus.Rejected:
        return 'مرفوض';
      default:
        return 'غير معروف';
    }
  }

  getStatusBadgeClass(status: EnrollmentRequestStatus): string {
    switch (status) {
      case EnrollmentRequestStatus.Pending:
        return 'bg-warning text-dark';
      case EnrollmentRequestStatus.Approved:
        return 'bg-success';
      case EnrollmentRequestStatus.Rejected:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
