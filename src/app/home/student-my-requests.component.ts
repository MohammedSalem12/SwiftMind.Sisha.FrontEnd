import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-student-my-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-requests" dir="rtl">
      <div class="container py-4">
        <button class="btn btn-link mb-3 p-0" (click)="goBack()">
          <i class="fas fa-arrow-right me-1"></i> العودة للرئيسية
        </button>

        <h2 class="mb-4"><i class="fas fa-clipboard-list me-2"></i>طلبات التسجيل</h2>

        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <div *ngIf="!loading()">
          <div *ngIf="requests().length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>لا توجد طلبات تسجيل
          </div>

          <div class="row g-3">
            <div class="col-md-6" *ngFor="let req of requests()">
              <div class="request-card">
                <div class="request-header">
                  <h5 class="mb-0">{{ req.courseName }}</h5>
                  <span class="badge"
                        [class.bg-warning]="getStatus(req) === 'pending'"
                        [class.bg-success]="getStatus(req) === 'approved'"
                        [class.bg-danger]="getStatus(req) === 'rejected'">
                    {{ getStatusText(req) }}
                  </span>
                </div>
                <div class="request-body">
                  <div class="info-row" *ngIf="req.courseCode">
                    <i class="fas fa-code"></i>
                    <span>كود المقرر: {{ req.courseCode }}</span>
                  </div>
                  <div class="info-row" *ngIf="req.teacherName">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span>المعلم: {{ req.teacherName }}</span>
                  </div>
                  <div class="info-row" *ngIf="req.groupName">
                    <i class="fas fa-users"></i>
                    <span>المجموعة: {{ req.groupName }}</span>
                  </div>
                  <div class="approval-status mt-3">
                    <div class="d-flex gap-3">
                      <span class="approval-item">
                        <i class="fas"
                           [class.fa-check-circle]="req.isTeacherApproved"
                           [class.fa-clock]="!req.isTeacherApproved"
                           [class.text-success]="req.isTeacherApproved"
                           [class.text-muted]="!req.isTeacherApproved"></i>
                        موافقة المعلم
                      </span>
                      <span class="approval-item">
                        <i class="fas"
                           [class.fa-check-circle]="req.isParentApproved"
                           [class.fa-clock]="!req.isParentApproved"
                           [class.text-success]="req.isParentApproved"
                           [class.text-muted]="!req.isParentApproved"></i>
                        موافقة ولي الأمر
                      </span>
                    </div>
                  </div>
                  <div class="mt-3" *ngIf="req.status === 0">
                    <button class="btn btn-sm btn-outline-danger w-100"
                            [disabled]="cancellingId() === req.id"
                            (click)="cancelRequest(req.id)">
                      <span *ngIf="cancellingId() !== req.id">
                        <i class="fas fa-times me-1"></i>إلغاء الطلب
                      </span>
                      <span *ngIf="cancellingId() === req.id">
                        <i class="fas fa-spinner fa-spin me-1"></i>جاري الإلغاء...
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-requests { min-height: calc(100vh - 200px); background: #f8f9fa; }
    h2 { font-weight: 600; color: #1a202c; }
    .request-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: 100%; }
    .request-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; }
    .request-header h5 { font-size: 1rem; font-weight: 600; color: #1a202c; }
    .request-body { padding: 1rem 1.25rem; }
    .info-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem; }
    .info-row i { color: #667eea; width: 18px; }
    .approval-status { background: #f8f9fa; border-radius: 8px; padding: 0.75rem; }
    .approval-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; }
  `],
})
export class StudentMyRequestsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  requests = signal<EnrollmentRequestDto[]>([]);
  loading = signal(false);
  cancellingId = signal<string | null>(null);
  private studentId = '';

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      this.studentId = userInfo?.actorId || '';
      await this.loadRequests();
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRequests(): Promise<void> {
    const allRequests = await lastValueFrom(this.enrollmentRequestService.getList());
    const myRequests = this.studentId
      ? allRequests.filter(r => r.studentId === this.studentId)
      : allRequests;
    this.requests.set(myRequests);
  }

  async cancelRequest(requestId?: string): Promise<void> {
    if (!requestId || this.cancellingId()) return;
    this.cancellingId.set(requestId);
    try {
      await lastValueFrom(this.enrollmentRequestService.reject(requestId));
      await this.loadRequests();
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      this.cancellingId.set(null);
    }
  }

  getStatus(req: EnrollmentRequestDto): string {
    if (req.status === 2) return 'rejected';
    if (req.status === 1) return 'approved';
    return 'pending';
  }

  getStatusText(req: EnrollmentRequestDto): string {
    const s = this.getStatus(req);
    if (s === 'approved') return 'مقبول';
    if (s === 'rejected') return 'مرفوض';
    return 'قيد الانتظار';
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }
}
