import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { AcademyTeacherStatus } from '@proxy/academies/academy-teacher-status.enum';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-teacher-academy-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="hub-page" dir="rtl">
      <div class="page-header">
        <button class="btn-back" (click)="router.navigate(['/teacher'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1><i class="fas fa-university me-2"></i>أكاديميتي</h1>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <ng-container *ngIf="!loading()">

        <!-- Supervisor: has own academy -->
        <ng-container *ngIf="myAcademy()">
          <div class="academy-card supervisor-card">
            <div class="card-badge"><i class="fas fa-crown me-1"></i> مشرف</div>
            <div class="card-header">
              <div class="avatar"><i class="fas fa-university"></i></div>
              <div class="meta">
                <h2>{{ myAcademy()!.nameAr }}</h2>
                <p>{{ myAcademy()!.nameEn }}</p>
                <span class="code">{{ myAcademy()!.code }}</span>
              </div>
            </div>
            <div class="stats-row">
              <div class="stat">
                <i class="fas fa-users"></i>
                <span>{{ myAcademy()!.memberCount }} عضو</span>
              </div>
              <div class="stat">
                <i class="fas fa-book-open"></i>
                <span>{{ myAcademy()!.courseCount }} مقرر</span>
              </div>
              <div class="stat pending-stat" *ngIf="pendingCount() > 0">
                <i class="fas fa-clock"></i>
                <span>{{ pendingCount() }} طلب انضمام</span>
              </div>
            </div>
            <div class="card-actions">
              <button class="btn-action btn-primary"
                      (click)="router.navigate(['/academies', myAcademy()!.id, 'manage'])">
                <i class="fas fa-cog me-1"></i> إدارة الأكاديمية
              </button>
              <button class="btn-action btn-secondary"
                      (click)="router.navigate(['/academies', myAcademy()!.id, 'profile'])">
                <i class="fas fa-eye me-1"></i> عرض الملف
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Member: approved in another academy -->
        <ng-container *ngIf="!myAcademy() && membership() && membership()!.status === approvedStatus">
          <div class="academy-card member-card">
            <div class="card-badge member-badge"><i class="fas fa-user-check me-1"></i> عضو</div>
            <div class="member-info">
              <h2>أنت عضو في أكاديمية</h2>
              <p class="hint">يمكنك عرض المقررات والتواصل مع الأعضاء</p>
            </div>
            <div class="card-actions">
              <button class="btn-action btn-primary" (click)="router.navigate(['/academies'])">
                <i class="fas fa-university me-1"></i> عرض الأكاديميات
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Pending -->
        <ng-container *ngIf="!myAcademy() && membership() && membership()!.status === pendingStatus">
          <div class="pending-card">
            <i class="fas fa-clock"></i>
            <h3>طلب انضمامك قيد المراجعة</h3>
            <p>سيتم إخطارك عند الموافقة على طلبك</p>
          </div>
        </ng-container>

        <!-- No academy and no membership -->
        <ng-container *ngIf="!myAcademy() && !membership()">
          <div class="action-cards">
            <div class="action-card create-card" (click)="router.navigate(['/academies/create'])">
              <div class="action-icon"><i class="fas fa-plus-circle"></i></div>
              <h3>إنشاء أكاديمية</h3>
              <p>أنشئ أكاديميتك الخاصة وكن مشرفاً عليها</p>
            </div>
            <div class="action-card join-card" (click)="router.navigate(['/academies'])">
              <div class="action-icon"><i class="fas fa-sign-in-alt"></i></div>
              <h3>الانضمام لأكاديمية</h3>
              <p>استعرض الأكاديميات المتاحة وأرسل طلب انضمام</p>
            </div>
          </div>
        </ng-container>

      </ng-container>
    </div>
  `,
  styles: [`
    .hub-page { padding: 16px; max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .btn-back {
      background: #f5f5f5; border: none; border-radius: 50%;
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #555;
    }
    .page-header h1 { font-size: 22px; font-weight: 700; color: #333; margin: 0; }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .academy-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden; margin-bottom: 16px; position: relative;
    }
    .card-badge {
      position: absolute; top: 10px; left: 10px;
      background: #f1c40f; color: #333; font-size: 11px; font-weight: 700;
      padding: 3px 10px; border-radius: 20px;
    }
    .member-badge { background: #27ae60; color: #fff; }
    .card-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 20px 16px; display: flex; align-items: center; gap: 14px;
    }
    .avatar {
      width: 52px; height: 52px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 22px; flex-shrink: 0;
    }
    .meta h2 { color: #fff; font-size: 17px; margin: 0 0 2px; }
    .meta p { color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 4px; }
    .code { font-size: 11px; background: rgba(255,255,255,0.2); color: #fff; padding: 2px 8px; border-radius: 6px; }
    .stats-row { display: flex; gap: 16px; padding: 12px 16px; flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; }
    .stat i { color: #764ba2; }
    .pending-stat { color: #e67e22; }
    .pending-stat i { color: #e67e22; }
    .card-actions { padding: 12px 16px; display: flex; gap: 8px; }
    .btn-action {
      flex: 1; padding: 10px; border: none; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
    .btn-secondary { background: #f5f5f5; color: #555; }
    .member-card { padding: 24px 16px; }
    .member-info h2 { font-size: 17px; color: #333; margin: 0 0 4px; }
    .member-info .hint { font-size: 13px; color: #888; margin: 0 0 14px; }
    .pending-card {
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 16px;
      text-align: center; padding: 36px 20px;
    }
    .pending-card i { font-size: 40px; color: #f57c00; margin-bottom: 12px; display: block; }
    .pending-card h3 { font-size: 17px; color: #e67e22; margin: 0 0 6px; }
    .pending-card p { font-size: 13px; color: #999; margin: 0; }
    .action-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .action-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 24px 16px; text-align: center; cursor: pointer;
      transition: transform 0.2s;
    }
    .action-card:hover { transform: translateY(-2px); }
    .action-icon { font-size: 32px; margin-bottom: 10px; }
    .create-card .action-icon { color: #667eea; }
    .join-card .action-icon { color: #11998e; }
    .action-card h3 { font-size: 15px; font-weight: 700; color: #333; margin: 0 0 6px; }
    .action-card p { font-size: 12px; color: #777; margin: 0; line-height: 1.4; }
    @media (max-width: 480px) {
      .action-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class TeacherAcademyHubComponent implements OnInit {
  readonly router = inject(Router);
  private readonly academyService = inject(AcademyService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  loading = signal(true);
  myAcademy = signal<AcademyDto | null>(null);
  membership = signal<AcademyMemberDto | null>(null);
  pendingCount = signal(0);

  readonly approvedStatus = AcademyTeacherStatus.Approved;
  readonly pendingStatus = AcademyTeacherStatus.Pending;

  async ngOnInit(): Promise<void> {
    try {
      const [academy, membership] = await Promise.all([
        lastValueFrom(this.academyService.getMyAcademy()).catch(() => null),
        lastValueFrom(this.academyService.getMyMembership()).catch(() => null),
      ]);
      this.myAcademy.set(academy || null);
      this.membership.set(membership || null);

      // If supervisor, load pending count
      if (academy?.id) {
        const pending = await lastValueFrom(this.academyService.getPendingRequests(academy.id)).catch(() => []);
        this.pendingCount.set((pending || []).length);
      }
    } catch (err) {
      console.error('Error loading academy hub:', err);
    } finally {
      this.loading.set(false);
    }
  }
}
