import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ConfigStateService } from '@abp/ng.core';
import { PullToRefreshDirective } from '../shared/directives/pull-to-refresh.directive';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ParentStudentDto } from '@proxy/parents/models';
import { ParentStudentLinkStatus } from '@proxy/enums/parent-student-link-status.enum';

@Component({
  selector: 'app-parent-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonicModule, PullToRefreshDirective],
  template: `
    <div class="page" dir="rtl" appPullToRefresh (appPullToRefresh)="refreshData($event)">

      <!-- Header -->
      <div class="header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-inner">
          <div class="avatar">
            <span>{{ getInitials(parentName()) }}</span>
          </div>
          <h1>مرحباً {{ parentName() }}</h1>
          <p>اختر ابنك لمتابعة تفاصيله · Select a child</p>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid">
          @for (i of [1,2]; track i) {
            <div class="shimmer-card"></div>
          }
        </div>
      }

      <!-- Children grid -->
      @if (!loading() && children().length > 0) {
        <div class="grid">
          @for (child of children(); track child.studentId) {
            <div class="child-card ion-activatable" (click)="goToChild(child)">
              <div class="card-bg"></div>
              <div class="card-avatar">
                <span>{{ getInitials(child.studentName) }}</span>
              </div>
              <div class="card-body">
                <h3 class="card-name">{{ child.studentName }}</h3>
                @if (child.gradeName) {
                  <span class="card-grade"><i class="fas fa-graduation-cap"></i> {{ child.gradeName }}</span>
                }
                @if (child.studentCode) {
                  <span class="card-code">{{ child.studentCode }}</span>
                }
              </div>
              <div class="card-arrow"><i class="fas fa-chevron-left"></i></div>
              <ion-ripple-effect></ion-ripple-effect>
            </div>
          }
        </div>
      }

      <!-- Empty -->
      @if (!loading() && children().length === 0) {
        <div class="empty">
          <div class="empty-icon"><i class="fas fa-child"></i></div>
          <h3>لا يوجد أبناء مرتبطون</h3>
          <p>No linked children yet</p>
          <button class="link-btn" routerLink="/parent/link-child">
            <i class="fas fa-user-plus"></i> ربط طالب · Link Child
          </button>
        </div>
      }

      <!-- Dashboard link -->
      @if (!loading() && children().length > 0) {
        <div class="detail-link-wrap">
          <a class="detail-link" routerLink="/parent/home">
            <i class="fas fa-th-large"></i> عرض لوحة التفاصيل الكاملة · View Full Dashboard
          </a>
        </div>
      }

      <!-- Floating action buttons -->
      <div class="fab-group">
        <button class="fab fab-link" routerLink="/parent/link-child">
          <i class="fas fa-user-plus"></i>
          <span>ربط طالب</span>
        </button>
        <button class="fab fab-excuse" routerLink="/parent/absence-excuse">
          <i class="fas fa-file-medical"></i>
          <span>عذر غياب</span>
        </button>
        <button class="fab fab-message" routerLink="/parent/message-teacher">
          <i class="fas fa-paper-plane"></i>
          <span>رسالة معلم</span>
        </button>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.5rem) 1.25rem 2.5rem;
      position:relative; overflow:hidden; text-align:center;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.06); pointer-events:none; }
    .b1 { width:220px; height:220px; top:-80px; right:-70px; }
    .b2 { width:150px; height:150px; bottom:-60px; left:-40px; }
    .header-inner { position:relative; z-index:1; }
    .avatar {
      width:72px; height:72px; border-radius:50%; margin:0 auto .75rem;
      background:rgba(255,255,255,.18); border:3px solid rgba(255,255,255,.35);
      display:flex; align-items:center; justify-content:center;
      font-size:1.6rem; font-weight:800; color:#fff;
    }
    .header h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header p { margin:.25rem 0 0; font-size:.78rem; color:rgba(255,255,255,.6); }

    .grid {
      display:flex; flex-direction:column; gap:.75rem;
      padding:0 1rem; margin-top:-1.25rem; position:relative; z-index:2;
    }

    .child-card {
      background:#fff; border-radius:18px; padding:1.15rem;
      display:flex; align-items:center; gap:1rem;
      position:relative; overflow:hidden;
      box-shadow:0 4px 16px rgba(0,0,0,.06); cursor:pointer;
      transition:transform .12s; -webkit-tap-highlight-color:transparent;
      ion-ripple-effect { color: rgba(102,126,234,.3); }
    }
    .child-card:active { transform:scale(.97); }
    .card-bg {
      position:absolute; top:-30px; right:-30px;
      width:100px; height:100px; border-radius:50%;
      background:linear-gradient(135deg,rgba(102,126,234,.06),rgba(118,75,162,.06));
    }
    .card-avatar {
      width:60px; height:60px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.2rem; font-weight:800;
      box-shadow:0 4px 14px rgba(102,126,234,.3);
      position:relative; z-index:1;
    }
    .card-body { flex:1; min-width:0; position:relative; z-index:1; }
    .card-name {
      margin:0 0 .3rem; font-size:1.05rem; font-weight:800; color:#1a1a2e;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .card-grade {
      display:inline-flex; align-items:center; gap:.25rem;
      font-size:.75rem; font-weight:700; color:#667eea;
      background:rgba(102,126,234,.08); padding:.2rem .6rem; border-radius:8px;
      i { font-size:.6rem; }
    }
    .card-code {
      display:block; margin-top:.3rem;
      font-size:.68rem; color:#9ca3af; letter-spacing:.03em;
    }
    .card-arrow {
      color:#d1d5db; font-size:.85rem; flex-shrink:0;
      position:relative; z-index:1;
    }

    .shimmer-card {
      height:160px; border-radius:18px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty {
      display:flex; flex-direction:column; align-items:center;
      padding:4rem 1.5rem; text-align:center;
    }
    .empty-icon {
      width:72px; height:72px; border-radius:50%;
      background:linear-gradient(135deg,rgba(102,126,234,.12),rgba(118,75,162,.12));
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; color:#667eea; margin-bottom:1rem;
    }
    .empty h3 { margin:0 0 .25rem; font-size:1rem; font-weight:700; color:#1a1a2e; }
    .empty p { margin:0 0 1rem; font-size:.82rem; color:#9ca3af; }
    .link-btn {
      display:flex; align-items:center; gap:.4rem;
      padding:.7rem 1.25rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.85rem; font-weight:700; cursor:pointer;
    }

    .detail-link-wrap { padding:1.25rem 1rem 0; text-align:center; }
    .detail-link {
      display:inline-flex; align-items:center; gap:.4rem;
      font-size:.82rem; font-weight:600; color:#667eea; text-decoration:none;
      padding:.5rem 1rem; border-radius:10px;
      background:rgba(102,126,234,.06); border:1px solid rgba(102,126,234,.15);
      transition:background .15s;
    }
    .detail-link:active { background:rgba(102,126,234,.12); }
    .detail-link i { font-size:.75rem; }

    /* Floating action buttons */
    .fab-group {
      position:fixed; bottom:calc(80px + env(safe-area-inset-bottom,0px) + 12px);
      left:1rem; z-index:90;
      display:flex; flex-direction:column; gap:.5rem;
    }
    .fab {
      display:flex; align-items:center; gap:.4rem;
      padding:.6rem 1rem; border:none; border-radius:14px;
      font-size:.78rem; font-weight:700; cursor:pointer;
      box-shadow:0 4px 16px rgba(0,0,0,.15);
      color:#fff; transition:transform .1s;
      -webkit-tap-highlight-color:transparent;
    }
    .fab:active { transform:scale(.94); }
    .fab i { font-size:.85rem; }
    .fab-link { background:linear-gradient(135deg,#22c55e,#16a34a); }
    .fab-excuse { background:linear-gradient(135deg,#f59e0b,#d97706); }
    .fab-message { background:linear-gradient(135deg,#667eea,#764ba2); }
  `],
})
export class ParentLandingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly configSvc = inject(ConfigStateService);
  private readonly parentSvc = inject(ParentService);

  loading = signal(true);
  parentName = signal('');
  children = signal<ParentStudentDto[]>([]);

  getInitials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || '?';
  }

  async ngOnInit(): Promise<void> {
    await this.loadChildren();
  }

  async refreshData(e: { complete: () => void }): Promise<void> {
    try { await this.loadChildren(); } finally { e.complete(); }
  }

  private async loadChildren(): Promise<void> {
    try {
      const userId = this.configSvc.getOne('currentUser')?.id;
      if (!userId) return;

      const parent = await lastValueFrom(this.parentSvc.getByUserId(userId));
      if (!parent) return;

      this.parentName.set(`${parent.firstName || ''} ${parent.lastName || ''}`.trim());

      const students = await lastValueFrom(this.parentSvc.getLinkedStudentsByParentId(parent.id!));
      const confirmed = (students || []).filter(
        (s: any) => s.linkStatus === ParentStudentLinkStatus.Confirmed
      );
      this.children.set(confirmed);
    } catch (e) {
      console.error('Error loading children:', e);
    } finally {
      this.loading.set(false);
    }
  }

  goToChild(child: ParentStudentDto): void {
    this.router.navigate(['/parent/child-overview', child.studentId]);
  }
}
