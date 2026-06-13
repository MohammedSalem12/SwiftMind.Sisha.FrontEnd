import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { SecretaryTeacherService } from '@proxy/teachers';

@Component({
  selector: 'app-secretary-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-text">
          <h1>طلبات الربط</h1>
          <p>الطلبات المرسلة للمعلمين</p>
        </div>
      </div>

      <!-- Loading shimmer -->
      @if (loading()) {
        <div class="shimmer-list">
          @for (i of [1,2,3]; track i) {
            <div class="shimmer-card">
              <div class="shimmer-avatar"></div>
              <div class="shimmer-lines">
                <div class="shimmer-line w70"></div>
                <div class="shimmer-line w40"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="state-box error-box">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="load()">إعادة المحاولة</button>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && !error() && requests().length === 0) {
        <div class="state-box empty-box">
          <i class="fas fa-paper-plane fa-3x"></i>
          <h3>لا توجد طلبات مرسلة</h3>
          <p>اذهب إلى "ربط معلم" لإرسال طلب جديد</p>
          <button class="action-btn" (click)="goToLinkTeacher()">
            <i class="fas fa-link me-1"></i> ربط معلم جديد
          </button>
        </div>
      }

      <!-- Requests list -->
      @if (!loading() && !error() && requests().length > 0) {
        <div class="list-header">
          <span class="count-pill">{{ requests().length }}</span>
          <span>طلب مرسل</span>
          <button class="link-btn ms-auto" (click)="goToLinkTeacher()">
            <i class="fas fa-plus me-1"></i> طلب جديد
          </button>
        </div>

        <div class="requests-list">
          @for (req of requests(); track req.id) {
            <div class="request-card" [class]="'status-' + req.status">
              <div class="req-avatar">
                <i class="fas fa-chalkboard-teacher"></i>
              </div>
              <div class="req-info">
                <h4>{{ req.teacherName || 'معلم غير معروف' }}</h4>
                <span class="req-date">{{ formatDate(req.creationTime) }}</span>
                @if (req.decidedAt) {
                  <span class="req-decided">
                    <i class="fas fa-clock me-1"></i>
                    {{ formatDate(req.decidedAt) }}
                  </span>
                }
              </div>
              <div class="status-badge" [class]="'badge-' + req.status">
                @if (req.status === 0) { <i class="fas fa-hourglass-half me-1"></i> بانتظار الموافقة }
                @if (req.status === 1) { <i class="fas fa-check-circle me-1"></i> مقبول }
                @if (req.status === 2) { <i class="fas fa-times-circle me-1"></i> مرفوض }
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f4f5fb; direction: rtl; }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: .875rem;
    }
    .back-btn {
      width: 40px; height: 40px; min-width: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .header-text h1 { font-size: 1.2rem; font-weight: 700; margin: 0; }
    .header-text p { font-size: .8rem; margin: .1rem 0 0; opacity: .8; }

    /* Shimmer */
    .shimmer-list { padding: .75rem; display: flex; flex-direction: column; gap: .625rem; }
    .shimmer-card {
      background: white; border-radius: 14px; padding: 1rem;
      display: flex; align-items: center; gap: .875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
    }
    .shimmer-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e9ecef; flex-shrink: 0;
      animation: pulse 1.4s ease-in-out infinite; }
    .shimmer-lines { flex: 1; display: flex; flex-direction: column; gap: .5rem; }
    .shimmer-line { height: 12px; border-radius: 6px; background: #e9ecef;
      animation: pulse 1.4s ease-in-out infinite; }
    .shimmer-line.w70 { width: 70%; }
    .shimmer-line.w40 { width: 40%; }
    @keyframes pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }

    /* States */
    .state-box { text-align: center; padding: 4rem 1.5rem; color: #6c757d; }
    .state-box i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .state-box h3 { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: .5rem; }
    .error-box i { color: #dc3545; }
    .empty-box i { color: #adb5bd; }
    .retry-btn, .action-btn {
      margin-top: 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none;
      padding: .75rem 1.5rem; border-radius: 12px;
      font-size: .9rem; font-weight: 600; cursor: pointer;
    }

    /* List header */
    .list-header {
      display: flex; align-items: center; gap: .5rem;
      padding: .875rem 1rem; font-size: .9rem; font-weight: 600; color: #444;
    }
    .count-pill {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border-radius: 20px;
      padding: .1rem .55rem; font-size: .75rem; font-weight: 700;
    }
    .link-btn {
      background: rgba(102,126,234,.1); color: #667eea;
      border: 1.5px solid rgba(102,126,234,.3); border-radius: 10px;
      padding: .4rem .875rem; font-size: .82rem; font-weight: 600; cursor: pointer;
    }

    /* Request cards */
    .requests-list { padding: 0 .75rem .75rem; display: flex; flex-direction: column; gap: .625rem; }
    .request-card {
      background: white; border-radius: 14px; border: 1.5px solid #e9ecef;
      padding: 1rem; display: flex; align-items: center; gap: .875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
    }
    .request-card.status-1 { border-color: rgba(16,185,129,.35); background: #f0fdf4; }
    .request-card.status-2 { border-color: rgba(239,68,68,.25); background: #fff8f8; }

    .req-avatar {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.25rem;
    }
    .request-card.status-1 .req-avatar { background: linear-gradient(135deg, #10b981, #059669); }
    .request-card.status-2 .req-avatar { background: linear-gradient(135deg, #f87171, #dc2626); }

    .req-info { flex: 1; min-width: 0; }
    .req-info h4 { margin: 0 0 .2rem; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .req-date, .req-decided { font-size: .78rem; color: #9090aa; display: block; }

    .status-badge {
      font-size: .72rem; font-weight: 600; border-radius: 20px;
      padding: .25rem .65rem; white-space: nowrap; flex-shrink: 0;
    }
    .badge-0 { background: rgba(251,191,36,.15); color: #d97706; }
    .badge-1 { background: rgba(16,185,129,.15); color: #059669; }
    .badge-2 { background: rgba(239,68,68,.12); color: #dc2626; }
  `],
})
export class SecretaryRequestsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);

  loading  = signal(true);
  error    = signal<string | null>(null);
  requests = signal<any[]>([]);

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await lastValueFrom(this.secretaryTeacherService.getMyRequestsAsSecretary());
      this.requests.set(data ?? []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(d?: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  }

  goBack()          { this.router.navigate(['/secretary']); }
  goToLinkTeacher() { this.router.navigate(['/secretary/link-teacher']); }
}
