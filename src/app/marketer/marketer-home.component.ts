import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { MarketerStatsDto } from '@proxy/marketers';
import { PullToRefreshDirective } from '../shared/directives/pull-to-refresh.directive';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-marketer-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, PullToRefreshDirective, PageHeaderComponent],
  template: `
    <div class="mk-page" dir="rtl">
      <app-page-header
        [title]="'لوحة المسوّق'"
        [titleEn]="'Marketer'"
        [showBack]="false">
        <button ph-actions class="ph-action" (click)="load()" aria-label="تحديث · Refresh">
          <i class="fas fa-sync-alt" [class.fa-spin]="loading()"></i>
        </button>
      </app-page-header>

      <div class="mk-body" appPullToRefresh (appPullToRefresh)="refreshData($event)">
      <!-- Greeting card -->
      <div class="mk-greet-card">
        <div class="mk-greet-icon"><i class="fas fa-bullhorn"></i></div>
        <div class="mk-greet-text">
          <div class="mk-name">{{ stats()?.fullName || '—' }}</div>
          <div class="mk-code" *ngIf="stats()?.marketerCode">{{ stats()?.marketerCode }}</div>
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
          <button class="mk-action mk-action--primary ion-activatable" (click)="go('/marketer/onboard')">
            <i class="fas fa-user-plus"></i>
            <span>تسجيل معلم جديد · Onboard a teacher</span>
            <ion-ripple-effect></ion-ripple-effect>
          </button>
          <button class="mk-action ion-activatable" (click)="go('/marketer/teachers')">
            <i class="fas fa-chalkboard-teacher"></i>
            <span>معلميني · My teachers</span>
            <ion-ripple-effect></ion-ripple-effect>
          </button>
          <button class="mk-action ion-activatable" (click)="go('/marketer/leads')">
            <i class="fas fa-address-book"></i>
            <span>قائمة التسويق · Marketing list</span>
            <ion-ripple-effect></ion-ripple-effect>
          </button>
          <button class="mk-action ion-activatable" (click)="go('/marketer/fees')">
            <i class="fas fa-coins"></i>
            <span>أرباحي · My fees</span>
            <ion-ripple-effect></ion-ripple-effect>
          </button>
        </div>
      </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .mk-page { min-height: 100vh; background: #f4f5fb; }
    .mk-body { padding: 12px; padding-bottom: 90px; }
    .mk-greet-card {
      background: #fff; border-radius: 16px; padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
      border: 1.5px solid #f0f0f0; box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .mk-greet-icon {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: rgba(102,126,234,.1); color: #667eea;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem;
    }
    .mk-greet-text { min-width: 0; }
    .mk-name { font-size: 1.2rem; font-weight: 800; color: #1a1a2e; }
    .mk-code { font-size: .75rem; color: #6b7280; margin-top: 4px; letter-spacing: .04em; }
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
      position: relative; overflow: hidden;
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

  async refreshData(e: { complete: () => void }): Promise<void> {
    try { await this.load(); } finally { e.complete(); }
  }

  go(path: string): void {
    void this.router.navigate([path]);
  }
}
