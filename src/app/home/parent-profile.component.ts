import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { ParentService } from '@proxy/parents';
import { ParentStudentDto } from '@proxy/parents/models';
import { ParentStudentLinkStatus } from '@proxy/enums/parent-student-link-status.enum';

@Component({
  selector: 'app-parent-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="avatar-wrap">
          <div class="avatar"><span>{{ initials() }}</span></div>
          <div class="role-badge"><i class="fas fa-user-shield"></i> ولي أمر · Parent</div>
        </div>
        <div class="header-info">
          <h1 class="user-name">{{ userInfo()?.actorName || 'ولي الأمر' }}</h1>
          @if (userInfo()?.actorCode) {
            <span class="user-code">{{ userInfo()?.actorCode }}</span>
          }
          @if (userInfo()?.email) {
            <span class="user-email">{{ userInfo()?.email }}</span>
          }
          @if (userInfo()?.userName) {
            <span class="user-email">&#64;{{ userInfo()?.userName }}</span>
          }
        </div>
        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> خروج
        </button>
      </div>

      <!-- Stats -->
      @if (!loading()) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="stat-value">{{ children().length }}</div>
            <div class="stat-label">أبناء مرتبطون</div>
            <div class="stat-label-en">Linked Children</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#d97706">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-value">{{ pendingChildren() }}</div>
            <div class="stat-label">بانتظار التأكيد</div>
            <div class="stat-label-en">Pending</div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-stats">
            @for (i of [1,2]; track i) { <div class="shimmer-stat"></div> }
          </div>
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {

        <!-- Quick actions -->
        <div class="section">
          <div class="section-title"><i class="fas fa-bolt"></i> إجراءات سريعة · Quick Actions</div>
          <div class="actions-grid">
            <a class="action-btn" routerLink="/parent/link-child">
              <div class="action-icon" style="background:rgba(102,126,234,.12);color:#667eea"><i class="fas fa-user-plus"></i></div>
              <span class="al">ربط طالب</span><span class="ae">Link Child</span>
            </a>
            <a class="action-btn" routerLink="/parent/requests">
              <div class="action-icon" style="background:rgba(16,185,129,.12);color:#059669"><i class="fas fa-clipboard-check"></i></div>
              <span class="al">طلبات التسجيل</span><span class="ae">Enrollment</span>
            </a>
            <a class="action-btn" routerLink="/parent/requests">
              <div class="action-icon" style="background:rgba(245,158,11,.12);color:#d97706"><i class="fas fa-link"></i></div>
              <span class="al">طلبات الربط</span><span class="ae">Link Requests</span>
            </a>
            <a class="action-btn" routerLink="/feeds">
              <div class="action-icon" style="background:rgba(118,75,162,.12);color:#764ba2"><i class="fas fa-rss"></i></div>
              <span class="al">النشرات</span><span class="ae">Feeds</span>
            </a>
          </div>
        </div>

        <!-- Children list -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-user-graduate"></i> أبنائي · My Children
            @if (children().length > 0) { <span class="count-pill">{{ children().length }}</span> }
          </div>
          @if (children().length === 0) {
            <div class="empty-box">
              <i class="fas fa-child"></i>
              <p>لا يوجد أبناء مرتبطون</p>
              <span>No linked children yet</span>
            </div>
          }
          @if (children().length > 0) {
            <div class="list">
              @for (c of children(); track c.studentId) {
                <div class="list-row">
                  <div class="list-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2)">
                    <i class="fas fa-user-graduate"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ c.studentName || 'طالب' }}</span>
                    <span class="list-sub">
                      {{ c.studentCode }}
                      @if (c.gradeName) { · {{ c.gradeName }} }
                    </span>
                  </div>
                  <span class="status-chip" [class]="linkStatusClass(c.linkStatus)">
                    {{ linkStatusLabel(c.linkStatus) }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
      display:flex; flex-direction:column; align-items:center; text-align:center; gap:.5rem;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .avatar-wrap { display:flex; flex-direction:column; align-items:center; gap:.5rem; position:relative; z-index:1; }
    .avatar {
      width:80px; height:80px; border-radius:50%;
      background:rgba(255,255,255,.2); border:3px solid rgba(255,255,255,.5);
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; font-weight:800; color:#fff;
    }
    .role-badge {
      display:flex; align-items:center; gap:.35rem;
      background:rgba(255,255,255,.18); color:rgba(255,255,255,.92);
      padding:.3rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600;
      border:1px solid rgba(255,255,255,.25);
    }
    .header-info { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:.2rem; }
    .user-name { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .user-code {
      font-size:.82rem; font-weight:600; color:rgba(255,255,255,.7);
      background:rgba(255,255,255,.12); padding:.15rem .6rem; border-radius:12px;
    }
    .user-email { font-size:.78rem; color:rgba(255,255,255,.65); }
    .logout-btn {
      position:absolute; top:max(1rem,env(safe-area-inset-top,0px)); left:1rem; z-index:2;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:rgba(255,255,255,.9); padding:.4rem .875rem; border-radius:12px;
      font-size:.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:.35rem;
    }
    .stats-row { display:flex; gap:.75rem; padding:1rem 1rem 0; }
    .stat-card {
      flex:1; background:#fff; border-radius:16px; padding:1rem .75rem;
      text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06);
      display:flex; flex-direction:column; align-items:center; gap:.35rem;
    }
    .stat-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1rem; }
    .stat-value { font-size:1.5rem; font-weight:800; color:#1a1a2e; line-height:1; }
    .stat-label { font-size:.72rem; font-weight:600; color:#555; }
    .stat-label-en { font-size:.62rem; color:#9090aa; }
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-stats { display:flex; gap:.75rem; }
    .shimmer-stat {
      flex:1; height:96px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    .shimmer-card {
      height:72px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }
    .count-pill { background:rgba(102,126,234,.12); color:#667eea; font-size:.72rem; font-weight:700; padding:.15rem .5rem; border-radius:20px; }
    .actions-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.625rem; }
    .action-btn {
      display:flex; flex-direction:column; align-items:center; gap:.4rem;
      padding:.875rem .5rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f0; text-decoration:none; color:#374151;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .action-btn:active { transform:scale(.95); }
    .action-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1rem; }
    .al { font-size:.68rem; font-weight:700; text-align:center; color:#1a1a2e; }
    .ae { font-size:.58rem; color:#9090aa; text-align:center; }
    .list { display:flex; flex-direction:column; gap:.5rem; }
    .list-row {
      display:flex; align-items:center; gap:.875rem; background:#fff;
      border-radius:14px; border:1.5px solid #f0f0f0; padding:.875rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .list-avatar { width:44px; height:44px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem; }
    .list-info { flex:1; min-width:0; }
    .list-name { display:block; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .list-sub { display:block; font-size:.75rem; color:#9090aa; margin-top:.1rem; }
    .status-chip { font-size:.68rem; font-weight:700; padding:.15rem .5rem; border-radius:10px; flex-shrink:0; }
    .chip-confirmed { background:rgba(16,185,129,.1); color:#059669; }
    .chip-pending   { background:rgba(245,158,11,.1);  color:#d97706; }
    .chip-rejected  { background:rgba(239,68,68,.1);   color:#dc2626; }
    .empty-box {
      text-align:center; padding:2rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2rem; color:#c4c4d4; display:block; margin-bottom:.5rem; }
    .empty-box p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.75rem; color:#9090aa; }
  `],
})
export class ParentProfileComponent implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly parentSvc      = inject(ParentService);

  loading  = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);
  children = signal<ParentStudentDto[]>([]);

  pendingChildren = () => this.children().filter(
    c => c.linkStatus === ParentStudentLinkStatus.Pending
  ).length;

  initials(): string {
    const name = this.userInfo()?.actorName || '?';
    return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.userInfo.set(info);
      if (info?.actorId) {
        const children = await lastValueFrom(
          this.parentSvc.getLinkedStudentsByParentId(info.actorId)
        );
        this.children.set(children ?? []);
      }
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  linkStatusClass(status?: ParentStudentLinkStatus): string {
    if (status === ParentStudentLinkStatus.Confirmed) return 'status-chip chip-confirmed';
    if (status === ParentStudentLinkStatus.Rejected)  return 'status-chip chip-rejected';
    return 'status-chip chip-pending';
  }

  linkStatusLabel(status?: ParentStudentLinkStatus): string {
    if (status === ParentStudentLinkStatus.Confirmed) return 'مؤكد';
    if (status === ParentStudentLinkStatus.Rejected)  return 'مرفوض';
    return 'بانتظار التأكيد';
  }

  logout(): void { this.authService.logout(); }
}
