import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { MarketerStatsDto } from '@proxy/marketers';

@Component({
  selector: 'app-marketer-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mk-page" dir="rtl">
      <div class="mk-hero">
        <div class="mk-hero-top">
          <div>
            <div class="mk-hello">لوحة المسوّق · Marketer</div>
            <div class="mk-name">{{ stats()?.fullName || '—' }}</div>
            <div class="mk-code" *ngIf="stats()?.marketerCode">{{ stats()?.marketerCode }}</div>
          </div>
          <div class="mk-hero-icon"><i class="fas fa-bullhorn"></i></div>
        </div>
      </div>

      <div *ngIf="loading()" class="mk-skeletons">
        <div class="mk-skel" *ngFor="let _ of [1,2,3]"></div>
      </div>

      <div *ngIf="error()" class="mk-error">
        <i class="fas fa-triangle-exclamation"></i> {{ error() }}
        <button (click)="load()">إعادة المحاولة · Retry</button>
      </div>

      <ng-container *ngIf="!loading() && !error()">
        <div class="mk-stats">
          <div class="mk-stat">
            <div class="mk-stat-val">{{ stats()?.teacherCount ?? 0 }}</div>
            <div class="mk-stat-lbl">معلمون · Teachers</div>
          </div>
          <div class="mk-stat">
            <div class="mk-stat-val">{{ stats()?.feePerTeacher ?? 0 }}</div>
            <div class="mk-stat-lbl">العمولة/معلم · Fee/Teacher</div>
          </div>
          <div class="mk-stat mk-stat--accent">
            <div class="mk-stat-val">{{ stats()?.amountOwed ?? 0 }}</div>
            <div class="mk-stat-lbl">المستحق · Owed (EGP)</div>
          </div>
        </div>

        <div class="mk-actions">
          <button class="mk-action mk-action--primary" (click)="go('/marketer/onboard')">
            <i class="fas fa-user-plus"></i>
            <span>تسجيل معلم جديد · Onboard a teacher</span>
          </button>
          <button class="mk-action" (click)="go('/marketer/teachers')">
            <i class="fas fa-chalkboard-teacher"></i>
            <span>معلميني · My teachers</span>
          </button>
          <button class="mk-action" (click)="go('/marketer/fees')">
            <i class="fas fa-coins"></i>
            <span>أرباحي · My fees</span>
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .mk-page { padding: 12px; padding-bottom: 90px; }
    .mk-hero {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 18px; padding: 18px; color: #fff;
      box-shadow: 0 8px 24px rgba(102,126,234,.3);
    }
    .mk-hero-top { display: flex; align-items: center; justify-content: space-between; }
    .mk-hello { font-size: .8rem; opacity: .9; }
    .mk-name { font-size: 1.3rem; font-weight: 800; margin-top: 2px; }
    .mk-code { font-size: .75rem; opacity: .85; margin-top: 4px; letter-spacing: .04em; }
    .mk-hero-icon {
      width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
      background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem;
    }
    .mk-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
    .mk-stat {
      background: #fff; border-radius: 14px; padding: 14px 8px; text-align: center;
      border: 1.5px solid #f0f0f0; box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .mk-stat--accent { background: var(--ngx-primary-light, #eef0fd); border-color: rgba(102,126,234,.25); }
    .mk-stat-val { font-size: 1.5rem; font-weight: 800; color: var(--ngx-primary, #667eea); }
    .mk-stat-lbl { font-size: .68rem; color: #6b7280; margin-top: 4px; }
    .mk-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .mk-action {
      display: flex; align-items: center; gap: 12px; width: 100%;
      min-height: 56px; padding: 0 16px; border-radius: 14px; cursor: pointer;
      background: #fff; border: 1.5px solid #eef0fd; color: #1a1a2e;
      font-size: .95rem; font-weight: 700; text-align: right;
    }
    .mk-action i { color: var(--ngx-primary, #667eea); font-size: 1.1rem; width: 24px; text-align: center; }
    .mk-action:active { transform: scale(.99); }
    .mk-action--primary { background: var(--ngx-primary, #667eea); color: #fff; border-color: transparent; }
    .mk-action--primary i { color: #fff; }
    .mk-skeletons { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 14px; }
    .mk-skel { height: 80px; border-radius: 14px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size: 200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .mk-error {
      margin-top: 16px; background: #fff0f4; color: #dc2626; border: 1px solid #fecaca;
      border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .mk-error button { margin-inline-start: auto; background: var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:8px; padding:8px 12px; min-height:40px; cursor:pointer; }
  `],
})
export class MarketerHomeComponent implements OnInit {
  private readonly marketerService = inject(MarketerService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  stats = signal<MarketerStatsDto | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const s = await lastValueFrom(this.marketerService.getMyStats());
      this.stats.set(s ?? null);
    } catch {
      this.error.set('تعذّر تحميل البيانات · Failed to load data');
    } finally {
      this.loading.set(false);
    }
  }

  go(path: string): void {
    void this.router.navigate([path]);
  }
}
