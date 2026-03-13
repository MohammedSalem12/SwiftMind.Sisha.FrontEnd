import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { SecretaryTeacherService } from '@proxy/teachers';
import { SecretaryTeacherDto, SecretaryTeacherRequestDto } from '@proxy/teachers/models';
import { SecretaryTeacherRequestStatus } from '@proxy/teachers/secretary-teacher-request-status.enum';

@Component({
  selector: 'app-secretary-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-blobs">
          <div class="blob b1"></div>
          <div class="blob b2"></div>
        </div>

        <!-- Avatar -->
        <div class="avatar-wrap">
          <div class="avatar">
            <span>{{ initials() }}</span>
          </div>
          <div class="role-badge">
            <i class="fas fa-user-tie"></i>
            سكرتير · Secretary
          </div>
        </div>

        <!-- Name & code -->
        <div class="header-info">
          <h1 class="user-name">{{ userInfo()?.actorName || 'السكرتير' }}</h1>
          @if (userInfo()?.actorCode) {
            <span class="user-code">{{ userInfo()?.actorCode }}</span>
          }
          @if (userInfo()?.email) {
            <span class="user-email">{{ userInfo()?.email }}</span>
          }
          @if (userInfo()?.userName) {
            <span class="user-username">&#64;{{ userInfo()?.userName }}</span>
          }
        </div>

        <!-- Logout -->
        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i>
          خروج
        </button>
      </div>

      <!-- ── Stats row ── -->
      @if (!loading()) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon icon-teachers">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="stat-value">{{ teachers().length }}</div>
            <div class="stat-label">معلم مرتبط</div>
            <div class="stat-label-en">Linked Teachers</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-pending">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-value">{{ pendingRequests() }}</div>
            <div class="stat-label">طلب معلق</div>
            <div class="stat-label-en">Pending Requests</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-approved">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-value">{{ approvedRequests() }}</div>
            <div class="stat-label">طلب مقبول</div>
            <div class="stat-label-en">Approved</div>
          </div>
        </div>
      }

      <!-- ── Loading shimmer ── -->
      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-stats">
            @for (i of [1,2,3]; track i) {
              <div class="shimmer-stat"></div>
            }
          </div>
          <div class="shimmer-section"></div>
          @for (i of [1,2]; track i) {
            <div class="shimmer-card"></div>
          }
        </div>
      }

      @if (!loading()) {

        <!-- ── Quick actions ── -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-bolt"></i>
            إجراءات سريعة · Quick Actions
          </div>
          <div class="actions-grid">
            <a class="action-btn" routerLink="/secretary/link-teacher">
              <div class="action-icon icon-link">
                <i class="fas fa-user-plus"></i>
              </div>
              <span class="action-label">ربط معلم</span>
              <span class="action-label-en">Link Teacher</span>
            </a>
            <a class="action-btn" routerLink="/secretary/requests">
              <div class="action-icon icon-requests">
                <i class="fas fa-paper-plane"></i>
              </div>
              <span class="action-label">طلباتي</span>
              <span class="action-label-en">My Requests</span>
            </a>
            <a class="action-btn" routerLink="/enrollment-requests">
              <div class="action-icon icon-enroll">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <span class="action-label">طلبات التسجيل</span>
              <span class="action-label-en">Enrollment</span>
            </a>
            <a class="action-btn" routerLink="/students">
              <div class="action-icon icon-students">
                <i class="fas fa-user-graduate"></i>
              </div>
              <span class="action-label">الطلاب</span>
              <span class="action-label-en">Students</span>
            </a>
          </div>
        </div>

        <!-- ── Linked teachers ── -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-chalkboard-teacher"></i>
            المعلمون المرتبطون · Linked Teachers
            @if (teachers().length > 0) {
              <span class="count-pill">{{ teachers().length }}</span>
            }
          </div>

          @if (teachers().length === 0) {
            <div class="empty-box">
              <i class="fas fa-user-slash"></i>
              <p>لا يوجد معلمون مرتبطون</p>
              <span>No linked teachers yet</span>
              <a class="link-now-btn" routerLink="/secretary/link-teacher">ربط معلم الآن</a>
            </div>
          }

          @if (teachers().length > 0) {
            <div class="teachers-list">
              @for (t of teachers(); track t.id) {
                <button class="teacher-row" (click)="goToTeacher(t)">
                  <div class="teacher-avatar">
                    <i class="fas fa-chalkboard-teacher"></i>
                  </div>
                  <div class="teacher-info">
                    <span class="teacher-name">{{ t.teacherName || 'معلم' }}</span>
                    @if (t.teacherCode) {
                      <span class="teacher-code">{{ t.teacherCode }}</span>
                    }
                  </div>
                  <i class="fas fa-chevron-left teacher-arrow"></i>
                </button>
              }
            </div>
          }
        </div>


      }

      <!-- safe area -->
      <div style="height: calc(80px + env(safe-area-inset-bottom, 0px))"></div>

    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f4f5fb;
      direction: rtl;
    }

    /* ── Header ── */
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.25rem 2rem;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }
    .blob {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.07);
      pointer-events: none;
    }
    .b1 { width: 200px; height: 200px; top: -70px; right: -60px; }
    .b2 { width: 140px; height: 140px; bottom: -50px; left: -30px; }

    .avatar-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      z-index: 1;
    }
    .avatar {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: 3px solid rgba(255,255,255,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 800; color: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .role-badge {
      display: flex; align-items: center; gap: 0.35rem;
      background: rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.92);
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
      border: 1px solid rgba(255,255,255,0.25);
    }

    .header-info {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
    }
    .user-name {
      margin: 0;
      font-size: 1.3rem; font-weight: 800; color: #fff;
    }
    .user-code {
      font-size: 0.82rem; font-weight: 600;
      color: rgba(255,255,255,0.7);
      background: rgba(255,255,255,0.12);
      padding: 0.15rem 0.6rem; border-radius: 12px;
    }
    .user-email, .user-username {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.65);
    }

    .logout-btn {
      position: absolute; top: max(1rem, env(safe-area-inset-top, 0px)); left: 1rem;
      z-index: 2;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.9);
      padding: 0.4rem 0.875rem; border-radius: 12px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 0.35rem;
      transition: background 0.15s;
    }
    .logout-btn:hover { background: rgba(255,255,255,0.25); }

    /* ── Stats ── */
    .stats-row {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1rem 0;
    }
    .stat-card {
      flex: 1;
      background: #fff;
      border-radius: 16px;
      padding: 1rem 0.75rem;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
    }
    .stat-icon {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
    }
    .icon-teachers { background: rgba(102,126,234,0.12); color: #667eea; }
    .icon-pending  { background: rgba(245,158,11,0.12);  color: #d97706; }
    .icon-approved { background: rgba(16,185,129,0.12);  color: #059669; }

    .stat-value {
      font-size: 1.5rem; font-weight: 800; color: #1a1a2e; line-height: 1;
    }
    .stat-label    { font-size: 0.72rem; font-weight: 600; color: #555; }
    .stat-label-en { font-size: 0.62rem; color: #9090aa; }

    /* ── Shimmer ── */
    .shimmer-area { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .shimmer-stats {
      display: flex; gap: 0.75rem;
    }
    .shimmer-stat {
      flex: 1; height: 96px; border-radius: 16px;
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .shimmer-section {
      height: 20px; width: 40%; border-radius: 8px;
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .shimmer-card {
      height: 72px; border-radius: 16px;
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Sections ── */
    .section {
      padding: 1rem 1rem 0;
    }
    .section-title {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8rem; font-weight: 700; color: #555;
      text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    .section-title i { color: #667eea; font-size: 0.85rem; }
    .count-pill {
      background: rgba(102,126,234,0.12); color: #667eea;
      font-size: 0.72rem; font-weight: 700;
      padding: 0.15rem 0.5rem; border-radius: 20px;
    }

    /* ── Quick actions grid ── */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.625rem;
    }
    .action-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.4rem; padding: 0.875rem 0.5rem;
      background: #fff; border-radius: 14px;
      border: 1.5px solid #f0f0f0;
      text-decoration: none; color: #374151;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .action-btn:active { transform: scale(0.96); }
    .action-icon {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
    }
    .icon-link     { background: rgba(102,126,234,0.12); color: #667eea; }
    .icon-requests { background: rgba(245,158,11,0.12);  color: #d97706; }
    .icon-enroll   { background: rgba(16,185,129,0.12);  color: #059669; }
    .icon-students { background: rgba(239,68,68,0.1);    color: #dc2626; }

    .action-label    { font-size: 0.68rem; font-weight: 700; text-align: center; color: #1a1a2e; }
    .action-label-en { font-size: 0.58rem; color: #9090aa; text-align: center; }

    /* ── Teachers list ── */
    .teachers-list {
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .teacher-row {
      display: flex; align-items: center; gap: 0.875rem;
      background: #fff; border-radius: 14px;
      border: 1.5px solid #f0f0f0;
      padding: 0.875rem;
      cursor: pointer; width: 100%; text-align: right;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .teacher-row:active { transform: scale(0.98); }

    .teacher-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1rem;
    }
    .teacher-info { flex: 1; min-width: 0; }
    .teacher-name {
      display: block; font-size: 0.95rem; font-weight: 700; color: #1a1a2e;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .teacher-code {
      display: inline-block; margin-top: 0.2rem;
      font-size: 0.72rem; font-weight: 600;
      background: rgba(102,126,234,0.1); color: #667eea;
      padding: 0.1rem 0.45rem; border-radius: 10px;
    }
    .teacher-arrow { color: #c4c4d4; font-size: 0.85rem; }

    /* ── Empty ── */
    .empty-box {
      text-align: center;
      padding: 2.5rem 1.5rem;
      background: #fff; border-radius: 16px;
      border: 1.5px solid #f0f0f0;
    }
    .empty-box i { font-size: 2.5rem; color: #c4c4d4; display: block; margin-bottom: 0.75rem; }
    .empty-box p { font-size: 0.95rem; font-weight: 600; color: #555; margin: 0 0 0.25rem; }
    .empty-box span { font-size: 0.78rem; color: #9090aa; display: block; margin-bottom: 1rem; }
    .link-now-btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff; text-decoration: none;
      padding: 0.625rem 1.25rem; border-radius: 12px;
      font-size: 0.85rem; font-weight: 600;
    }

  `],
})
export class SecretaryProfileComponent implements OnInit {
  private readonly router         = inject(Router);
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly secretarySvc   = inject(SecretaryTeacherService);
  loading  = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);
  teachers = signal<SecretaryTeacherDto[]>([]);
  requests = signal<SecretaryTeacherRequestDto[]>([]);

  pendingRequests  = () => this.requests().filter(r => r.status === SecretaryTeacherRequestStatus.Pending).length;
  approvedRequests = () => this.requests().filter(r => r.status === SecretaryTeacherRequestStatus.Approved).length;

  initials(): string {
    const name = this.userInfo()?.actorName || this.userInfo()?.userName || 'S';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    try {
      const [info, teachers, requests] = await Promise.all([
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.secretarySvc.getTeachersForCurrentSecretary()),
        lastValueFrom(this.secretarySvc.getMyRequestsAsSecretary()),
      ]);
      this.userInfo.set(info);
      this.teachers.set(teachers ?? []);
      this.requests.set(requests ?? []);
    } catch (e) {
      console.error('Error loading secretary profile', e);
    } finally {
      this.loading.set(false);
    }
  }

  goToTeacher(t: SecretaryTeacherDto): void {
    this.router.navigate(['/secretary/teacher', t.teacherId], {
      state: { teacherName: t.teacherName },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
