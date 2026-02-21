import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { EnrollmentRequestDto } from '@proxy/student-enrollments/models';

@Component({
  selector: 'app-parent-enrollment-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="parent-approval-container">
      <div class="container py-4">
        <div class="mb-4">
          <h2><i class="bi bi-clipboard-check"></i> طلبات تسجيل أبنائي</h2>
          <p class="text-muted">راجع ووافق على طلبات التسجيل المقدمة من أبنائك</p>
        </div>

        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <div *ngIf="!loading()" class="requests-list">
          <div class="row g-3">
            <div class="col-md-6" *ngFor="let request of requests()">
              <div class="card request-card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 class="card-title mb-1">{{ request.studentName }}</h5>
                      <p class="text-muted mb-0">
                        <small>كود الطالب: {{ request.studentCode }}</small>
                      </p>
                    </div>
                    <span class="badge bg-warning text-dark">في انتظار موافقتك</span>
                  </div>

                  <div class="request-details mb-3">
                    <div class="detail-item">
                      <i class="bi bi-book"></i>
                      <span class="fw-bold">المقرر:</span>
                      <span>{{ request.courseName }} ({{ request.courseCode }})</span>
                    </div>
                    <div class="detail-item">
                      <i class="bi bi-person"></i>
                      <span class="fw-bold">المعلم:</span>
                      <span>{{ request.teacherName }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="bi bi-people"></i>
                      <span class="fw-bold">المجموعة:</span>
                      <span>{{ request.groupName }}</span>
                    </div>
                  </div>

                  <div class="approval-status mb-3">
                    <div class="status-item">
                      <i class="bi" [ngClass]="request.isTeacherApproved ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                      <span>موافقة المعلم</span>
                    </div>
                    <div class="status-item">
                      <i class="bi bi-circle text-muted"></i>
                      <span>موافقة ولي الأمر (أنت)</span>
                    </div>
                  </div>

                  <div class="action-buttons">
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
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="requests().length === 0" class="text-center py-5">
            <i class="bi bi-inbox fs-1 text-muted"></i>
            <p class="text-muted mt-3">لا توجد طلبات تسجيل معلقة لأبنائك حالياً</p>
          </div>
        </div>

        <div *ngIf="successMessage()" class="alert alert-success alert-dismissible fade show mt-3" role="alert">
          <i class="bi bi-check-circle"></i> {{ successMessage() }}
          <button type="button" class="btn-close" (click)="successMessage.set('')"></button>
        </div>

        <div *ngIf="errorMessage()" class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
          <i class="bi bi-exclamation-triangle"></i> {{ errorMessage() }}
          <button type="button" class="btn-close" (click)="errorMessage.set('')"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .request-card { border: 1px solid #dee2e6; transition: box-shadow 0.2s; }
    .request-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .detail-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-item:last-child { border-bottom: none; }
    .detail-item i { color: #6c757d; margin-right: 8px; width: 20px; }
    .detail-item .fw-bold { margin-right: 8px; min-width: 80px; display: inline-block; }
    .approval-status { background-color: #f8f9fa; padding: 12px; border-radius: 8px; }
    .status-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .status-item i { font-size: 1.2rem; }
    .action-buttons { display: flex; gap: 8px; }
  `]
})
export class ParentEnrollmentApprovalComponent implements OnInit {
  requests = signal<EnrollmentRequestDto[]>([]);
  loading = signal(false);
  processingRequest = signal<string>('');
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private enrollmentRequestService: EnrollmentRequestService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.enrollmentRequestService.getPendingRequestsForCurrentParent().subscribe({
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

    this.enrollmentRequestService.approve({
      requestId: request.id!,
      isParent: true
    }).subscribe({
      next: () => {
        this.successMessage.set(`تمت الموافقة على طلب تسجيل ${request.studentName} بنجاح`);
        this.processingRequest.set('');
        this.loadRequests();
      },
      error: (error) => {
        console.error('Error approving request:', error);
        this.errorMessage.set('حدث خطأ أثناء الموافقة على الطلب');
        this.processingRequest.set('');
      }
    });
  }

  rejectRequest(request: EnrollmentRequestDto) {
    if (!confirm(`هل أنت متأكد من رفض طلب تسجيل ${request.studentName}؟`)) return;

    this.processingRequest.set(request.id!);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentRequestService.reject(request.id!).subscribe({
      next: () => {
        this.successMessage.set(`تم رفض طلب تسجيل ${request.studentName}`);
        this.processingRequest.set('');
        this.loadRequests();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.errorMessage.set('حدث خطأ أثناء رفض الطلب');
        this.processingRequest.set('');
      }
    });
  }
}
