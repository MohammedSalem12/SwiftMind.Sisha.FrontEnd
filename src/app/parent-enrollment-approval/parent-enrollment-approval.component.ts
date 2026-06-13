import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-parent-enrollment-approval',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="parent-approval-container">
      <div class="container py-4">
        <div class="mb-4">
          <h2><i class="bi bi-clipboard-check"></i> طلبات تسجيل أبنائي</h2>
          <p class="text-muted">راجع ووافق على طلبات التسجيل المقدمة من أبنائك</p>
        </div>

        <!-- Tabs -->
        <div class="tabs-container mb-4">
          <div class="tabs-nav">
            <button 
              class="tab-btn" 
              [class.active]="activeTab() === 'pending'" 
              (click)="activeTab.set('pending')">
              <i class="bi bi-clock-history me-2"></i>
              طلبات معلقة
              <span class="tab-badge" *ngIf="requests().length > 0">{{ requests().length }}</span>
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab() === 'approved'" 
              (click)="activeTab.set('approved')">
              <i class="bi bi-check-circle me-2"></i>
              طلبات معتمدة
              <span class="tab-badge" *ngIf="approvedRequests().length > 0">{{ approvedRequests().length }}</span>
            </button>
          </div>
        </div>

        <!-- Pending Requests Tab -->
        <div *ngIf="activeTab() === 'pending'">
          <div *ngIf="loading()" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">جاري التحميل...</span>
            </div>
          </div>

          <div *ngIf="!loading()" class="requests-list">
            <!-- Debug info (remove in production) -->
            <div class="alert alert-info mb-3" *ngIf="requests().length === 0">
              <small>
                <i class="bi bi-info-circle"></i>
                تم العثور على {{ requests().length }} طلب معلق. 
                إذا كنت تتوقع وجود طلبات، يرجى التحقق من:
                <br>• أنك مسجل كولي أمر
                <br>• أن أبنائك قدموا طلبات تسجيل
                <br>• أن الطلبات لا تزال معلقة
              </small>
            </div>

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
                        <i class="bi" [ngClass]="request.isParentApproved ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
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
              <button class="btn btn-outline-primary mt-2" (click)="loadRequests()">
                <i class="bi bi-arrow-clockwise"></i> تحديث
              </button>
            </div>
          </div>
        </div>

        <!-- Approved Requests Tab -->
        <div *ngIf="activeTab() === 'approved'">
          <div *ngIf="approvedLoading()" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">جاري التحميل...</span>
            </div>
          </div>

          <div *ngIf="!approvedLoading()" class="approved-requests-list">
            <!-- Debug info for approved requests -->
            <div class="alert alert-info mb-3" *ngIf="approvedRequests().length === 0">
              <small>
                <i class="bi bi-info-circle"></i>
                تم العثور على {{ approvedRequests().length }} طلب معتمد. 
                <br>• تحقق من وجود طلبات موافق عليها من المعلم وولي الأمر
                <br>• قد تحتاج إلى تحديث الصفحة لرؤية أحدث الطلبات المعتمدة
                <br>• افتح وحدة التحكم للمزيد من معلومات التصحيح
              </small>
            </div>

            <div class="alert alert-success mb-3" *ngIf="approvedRequests().length > 0">
              <i class="bi bi-check-circle me-2"></i>
              <strong>ممتاز!</strong> لديك {{ approvedRequests().length }} طلب معتمد
            </div>

            <div class="row g-3">
              <div class="col-md-6" *ngFor="let request of approvedRequests()">
                <div class="card request-card approved-card h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 class="card-title mb-1">{{ request.studentName }}</h5>
                        <p class="text-muted mb-0">
                          <small>كود الطالب: {{ request.studentCode }}</small>
                        </p>
                      </div>
                      <span class="badge bg-success">تمت الموافقة</span>
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
                        <i class="bi bi-check-circle-fill text-success"></i>
                        <span>موافقة المعلم</span>
                      </div>
                      <div class="status-item">
                        <i class="bi bi-check-circle-fill text-success"></i>
                        <span>موافقة ولي الأمر</span>
                      </div>
                    </div>

                    <!-- Debug info -->
                    <div class="debug-info mb-2" style="font-size: 0.75rem; color: #6c757d;">
                      <small>
                        <strong>Debug:</strong> 
                        Status: {{ request.status }} | 
                        Parent: {{ request.isParentApproved }} | 
                        Teacher: {{ request.isTeacherApproved }}
                      </small>
                    </div>

                    <div class="approved-info">
                      <div class="alert alert-success mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        <small>تم تسجيل الطالب في هذا المقرر بنجاح</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="approvedRequests().length === 0" class="text-center py-5">
              <i class="bi bi-check-circle fs-1 text-muted"></i>
              <p class="text-muted mt-3">لا توجد طلبات معتمدة لأبنائك حالياً</p>
              <button class="btn btn-outline-primary mt-2" (click)="loadApprovedRequests()">
                <i class="bi bi-arrow-clockwise"></i> تحديث
              </button>
            </div>
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
    .request-card.approved-card { border-color: #28a745; background: #f8fff9; }
    .detail-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-item:last-child { border-bottom: none; }
    .detail-item i { color: #6c757d; margin-right: 8px; width: 20px; }
    .detail-item .fw-bold { margin-right: 8px; min-width: 80px; display: inline-block; }
    .approval-status { background-color: #f8f9fa; padding: 12px; border-radius: 8px; }
    .status-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .status-item i { font-size: 1.2rem; }
    .action-buttons { display: flex; gap: 8px; }
    
    /* Tabs Styles */
    .tabs-container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .tabs-nav { display: flex; border-bottom: 2px solid #e9ecef; }
    .tab-btn { 
      background: none; 
      border: none; 
      padding: 12px 20px; 
      font-weight: 500; 
      color: #6c757d; 
      border-bottom: 3px solid transparent; 
      margin-bottom: -2px; 
      cursor: pointer; 
      transition: all 0.2s; 
      display: flex; 
      align-items: center; 
      gap: 8px;
      position: relative;
    }
    .tab-btn.active { color: var(--ngx-primary); border-bottom-color: var(--ngx-primary); background: rgba(51, 102, 255, 0.05); }
    .tab-btn:hover { color: var(--ngx-primary); }
    .tab-badge { 
      background: var(--ngx-primary); 
      color: white; 
      border-radius: 12px; 
      padding: 2px 8px; 
      font-size: 0.75rem; 
      font-weight: 600; 
      min-width: 20px; 
      text-align: center;
    }
    .tab-btn.active .tab-badge { background: var(--ngx-primary); }
    .tab-btn:not(.active) .tab-badge { background: #6c757d; }
    
    .approved-info .alert { margin-bottom: 0; border: none; background: #d4edda; color: #155724; }
  `]
})
export class ParentEnrollmentApprovalComponent implements OnInit {
  requests = signal<EnrollmentRequestDto[]>([]);
  approvedRequests = signal<EnrollmentRequestDto[]>([]);
  allRequests = signal<EnrollmentRequestDto[]>([]); // For debugging
  loading = signal(false);
  approvedLoading = signal(false);
  processingRequest = signal<string>('');
  successMessage = signal('');
  errorMessage = signal('');
  activeTab = signal<'pending' | 'approved'>('pending');
  showDebugInfo = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private enrollmentRequestService: EnrollmentRequestService,
    private currentUserService: CurrentUserInfoService
  ) {}

  ngOnInit() {
    this.loadRequests();
    this.loadApprovedRequests();
  }

  async loadApprovedRequests() {
    this.approvedLoading.set(true);

    try {
      // Get current user info
      const currentUser = await this.currentUserService.getCurrentUserActorInfo().toPromise();
      
      if (!currentUser) {
        console.log('No current user found');
        this.approvedLoading.set(false);
        return;
      }

      console.log('Loading approved requests for user:', currentUser);

      // Try to get all requests and filter for approved ones
      try {
        const allRequests = await this.enrollmentRequestService.getList().toPromise();
        console.log('All requests from API:', allRequests);
        
        if (allRequests && allRequests.length > 0) {
          // Filter for approved requests - try multiple conditions
          const approved = allRequests.filter(request => {
            console.log('Checking request:', request);
            
            // Check multiple approval conditions
            const isStatusApproved = request.status === EnrollmentRequestStatus.Approved;
            const isParentApproved = request.isParentApproved === true;
            const isTeacherApproved = request.isTeacherApproved === true;
            
            // Include if status is approved OR both parent and teacher approved
            const isApproved = isStatusApproved || (isParentApproved && isTeacherApproved);
            
            console.log(`Request ${request.id}: status=${request.status}, parentApproved=${request.isParentApproved}, teacherApproved=${request.isTeacherApproved}, isApproved=${isApproved}`);
            
            return isApproved;
          });
          
          console.log('Filtered approved requests:', approved);
          this.approvedRequests.set(approved);
          
          if (approved.length === 0) {
            console.log('No approved requests found. Debug info:');
            allRequests.forEach((req, index) => {
              console.log(`Request ${index}:`, {
                id: req.id,
                status: req.status,
                isParentApproved: req.isParentApproved,
                isTeacherApproved: req.isTeacherApproved,
                studentName: req.studentName
              });
            });
          }
        } else {
          console.log('No requests returned from API');
          this.approvedRequests.set([]);
        }
      } catch (error) {
        console.error('Error loading approved requests:', error);
        this.approvedRequests.set([]);
      }
    } catch (error) {
      console.error('Error in loadApprovedRequests:', error);
      this.approvedRequests.set([]);
    } finally {
      this.approvedLoading.set(false);
    }
  }

  async loadRequests() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      // First try to get current user info to verify we're logged in as parent
      const currentUser = await this.currentUserService.getCurrentUserActorInfo().toPromise();
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        this.errorMessage.set('لم يتم العثور على معلومات المستخدم');
        this.loading.set(false);
        return;
      }

      // Try the parent-specific endpoint first
      try {
        const parentRequests = await this.enrollmentRequestService.getPendingRequestsForCurrentParent().toPromise();
        console.log('Parent requests:', parentRequests);
        
        if (parentRequests && parentRequests.length > 0) {
          this.requests.set(parentRequests);
        } else {
          // If no requests from parent endpoint, try general list and filter
          console.log('No parent requests found, trying general list...');
          const allRequests = await this.enrollmentRequestService.getList().toPromise();
          console.log('All requests:', allRequests);
          
          if (allRequests) {
            // Filter requests that might belong to this parent's children
            // This is a fallback - ideally the backend should handle this filtering
            const filteredRequests = allRequests.filter(request => {
              // For now, show all pending requests that need parent approval
              return request.status === EnrollmentRequestStatus.Pending && 
                     !request.isParentApproved;
            });
            console.log('Filtered requests:', filteredRequests);
            this.requests.set(filteredRequests);
          }
        }
      } catch (parentError) {
        console.error('Error with parent endpoint:', parentError);
        // Fallback to general list
        const allRequests = await this.enrollmentRequestService.getList().toPromise();
        console.log('All requests (fallback):', allRequests);
        
        if (allRequests) {
          const filteredRequests = allRequests.filter(request => {
            return request.status === EnrollmentRequestStatus.Pending && 
                   !request.isParentApproved;
          });
          this.requests.set(filteredRequests);
        }
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      this.errorMessage.set('حدث خطأ أثناء تحميل الطلبات: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      this.loading.set(false);
    }
  }

  approveRequest(request: EnrollmentRequestDto) {
    this.processingRequest.set(request.id!);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentRequestService.approve({
      requestId: request.id!,
      isParent: true
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.successMessage.set(`تمت الموافقة على طلب تسجيل ${request.studentName} بنجاح`);
        this.processingRequest.set('');
        this.loadRequests();
        this.loadApprovedRequests(); // Refresh approved requests too
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

    this.enrollmentRequestService.reject(request.id!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.successMessage.set(`تم رفض طلب تسجيل ${request.studentName}`);
        this.processingRequest.set('');
        this.loadRequests();
        this.loadApprovedRequests(); // Refresh approved requests too
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.errorMessage.set('حدث خطأ أثناء رفض الطلب');
        this.processingRequest.set('');
      }
    });
  }
}
