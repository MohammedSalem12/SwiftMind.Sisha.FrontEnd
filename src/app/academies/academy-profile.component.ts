import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { AcademyTeacherStatus } from '@proxy/academies/academy-teacher-status.enum';
import { CurrentUserInfoService } from '@proxy/common';
import type { CourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-academy-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="profile-page" dir="rtl">
      <!-- Header -->
      <div class="page-header">
        <button class="btn-back" (click)="router.navigate(['/academies'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1>ملف الأكاديمية</h1>
        <button *ngIf="isSupervisorOrAdmin()" class="btn-manage"
                (click)="router.navigate(['/academies', academyId, 'manage'])">
          <i class="fas fa-cog me-1"></i> إدارة
        </button>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <ng-container *ngIf="!loading() && academy()">
        <!-- Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div class="avatar"><i class="fas fa-university"></i></div>
            <div class="meta">
              <h2>{{ academy()!.nameAr }}</h2>
              <p class="name-en">{{ academy()!.nameEn }}</p>
              <span class="code-badge">{{ academy()!.code }}</span>
            </div>
          </div>
          <p *ngIf="academy()!.description" class="description">{{ academy()!.description }}</p>
          <div class="stats-row">
            <div class="stat">
              <i class="fas fa-user-tie"></i>
              <div><small>المشرف</small><strong>{{ academy()!.supervisorName || 'غير محدد' }}</strong></div>
            </div>
            <div class="stat">
              <i class="fas fa-users"></i>
              <div><small>الأعضاء</small><strong>{{ academy()!.memberCount }}</strong></div>
            </div>
            <div class="stat">
              <i class="fas fa-book-open"></i>
              <div><small>المقررات</small><strong>{{ academy()!.courseCount }}</strong></div>
            </div>
          </div>
        </div>

        <!-- Join Button (for non-member teachers) -->
        <div *ngIf="canJoin()" class="join-section">
          <button class="btn-join" (click)="requestJoin()" [disabled]="joining()">
            <span *ngIf="!joining()"><i class="fas fa-user-plus me-1"></i> طلب الانضمام</span>
            <span *ngIf="joining()">جاري الإرسال...</span>
          </button>
          <p *ngIf="joinSuccess()" class="success-msg">
            <i class="fas fa-check-circle me-1"></i> تم إرسال طلب الانضمام بنجاح!
          </p>
          <p *ngIf="joinError()" class="error-msg">{{ joinError() }}</p>
        </div>

        <!-- Pending Badge for teacher -->
        <div *ngIf="isPending()" class="pending-badge">
          <i class="fas fa-clock me-1"></i> طلب انضمامك قيد المراجعة
        </div>

        <!-- Courses Section -->
        <div class="section">
          <h3><i class="fas fa-book-open me-2"></i>مقررات الأكاديمية</h3>
          <div *ngIf="courses().length === 0" class="empty-section">
            <p>لا توجد مقررات مضافة بعد</p>
          </div>
          <div class="courses-grid">
            <div *ngFor="let course of courses()" class="course-card">
              <div class="course-icon"><i class="fas fa-book-open"></i></div>
              <div class="course-info">
                <strong>{{ course.nameAr }}</strong>
                <small>{{ course.nameEn }}</small>
                <span class="code-badge-sm">{{ course.code }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .profile-page { padding: 16px; max-width: 700px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
    .page-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .page-header h1 { flex: 1; font-size: 20px; font-weight: 700; margin: 0; color: #333; }
    .btn-back, .btn-manage {
      background: #f5f5f5;
      border: none;
      border-radius: 50%;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #555;
    }
    .btn-manage { border-radius: 10px; width: auto; padding: 0 14px; font-size: 13px; font-weight: 600; }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .info-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-bottom: 16px;
    }
    .info-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 20px;
      display: flex; align-items: center; gap: 14px;
    }
    .avatar {
      width: 56px; height: 56px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 24px; flex-shrink: 0;
    }
    .meta h2 { color: #fff; font-size: 18px; margin: 0 0 2px; }
    .name-en { color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 6px; }
    .code-badge {
      background: rgba(255,255,255,0.25);
      color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 6px;
    }
    .description { padding: 14px 20px; font-size: 14px; color: #555; line-height: 1.6; margin: 0; border-bottom: 1px solid #f0f0f0; }
    .stats-row { display: flex; padding: 14px 20px; gap: 20px; flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 10px; color: #444; }
    .stat i { font-size: 20px; color: #764ba2; }
    .stat small { display: block; font-size: 11px; color: #999; }
    .stat strong { display: block; font-size: 15px; font-weight: 700; }
    .join-section { margin-bottom: 16px; }
    .btn-join {
      width: 100%;
      background: linear-gradient(135deg, #11998e, #38ef7d);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 13px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-join:disabled { opacity: 0.6; cursor: not-allowed; }
    .success-msg { color: #27ae60; text-align: center; font-size: 14px; margin: 8px 0 0; }
    .error-msg { color: #c0392b; text-align: center; font-size: 14px; margin: 8px 0 0; }
    .pending-badge {
      background: #fff8e1;
      color: #f57c00;
      border: 1px solid #ffe082;
      border-radius: 10px;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .section { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 16px; }
    .section h3 { font-size: 16px; font-weight: 700; color: #333; margin: 0 0 14px; }
    .empty-section { text-align: center; color: #999; padding: 20px; }
    .courses-grid { display: flex; flex-direction: column; gap: 10px; }
    .course-card {
      display: flex; align-items: center; gap: 12px;
      background: #f8f6ff; border-radius: 10px; padding: 12px;
    }
    .course-icon {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 16px; flex-shrink: 0;
    }
    .course-info { display: flex; flex-direction: column; gap: 2px; }
    .course-info strong { font-size: 14px; color: #333; }
    .course-info small { font-size: 12px; color: #777; }
    .code-badge-sm { font-size: 10px; color: #764ba2; background: #ede7f6; padding: 1px 6px; border-radius: 5px; }
  `]
})
export class AcademyProfileComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly academyService = inject(AcademyService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  loading = signal(true);
  academy = signal<AcademyDto | null>(null);
  courses = signal<CourseDto[]>([]);
  joining = signal(false);
  joinSuccess = signal(false);
  joinError = signal<string | null>(null);

  academyId = '';
  private actorId: string | null = null;
  private actorType: string | null = null;
  private memberStatus: AcademyTeacherStatus | null = null;

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('id') || '';
    try {
      const [userInfo, academyData, coursesData] = await Promise.all([
        lastValueFrom(this.currentUserService.getCurrentUserActorInfo()),
        lastValueFrom(this.academyService.get(this.academyId)),
        lastValueFrom(this.academyService.getAcademyCourses(this.academyId)).catch(() => []),
      ]);
      this.actorId = userInfo?.actorId || null;
      this.actorType = userInfo?.actorType || null;
      this.academy.set(academyData);
      this.courses.set(coursesData || []);

      // Check membership
      if (this.actorType === 'Teacher' && this.actorId) {
        try {
          const membership = await lastValueFrom(this.academyService.getMyMembership());
          this.memberStatus = membership?.status ?? null;
        } catch { /* not a member */ }
      }
    } catch (err) {
      console.error('Error loading academy profile:', err);
    } finally {
      this.loading.set(false);
    }
  }

  isSupervisorOrAdmin(): boolean {
    const ac = this.academy();
    if (!ac) return false;
    const userInfo = this.actorId;
    return ac.supervisorTeacherId === userInfo;
  }

  canJoin(): boolean {
    if (this.actorType !== 'Teacher') return false;
    const ac = this.academy();
    if (!ac || ac.supervisorTeacherId === this.actorId) return false;
    return this.memberStatus === null;
  }

  isPending(): boolean {
    return this.memberStatus === AcademyTeacherStatus.Pending;
  }

  async requestJoin(): Promise<void> {
    this.joining.set(true);
    this.joinError.set(null);
    try {
      await lastValueFrom(this.academyService.requestToJoin(this.academyId));
      this.joinSuccess.set(true);
      this.memberStatus = AcademyTeacherStatus.Pending;
    } catch (err: any) {
      const msg = err?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب.';
      this.joinError.set(msg);
    } finally {
      this.joining.set(false);
    }
  }
}
