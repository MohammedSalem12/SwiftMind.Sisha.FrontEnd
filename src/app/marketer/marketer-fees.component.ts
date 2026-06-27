import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { MarketerStatsDto } from '@proxy/marketers';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-marketer-fees',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="fe-page" dir="rtl">
      <app-page-header [title]="'أرباحي'" [titleEn]="'My Fees'" [backTo]="'/marketer'"></app-page-header>

      <div *ngIf="loading()" class="fe-skel"></div>
      <div *ngIf="error()" class="fe-error"><i class="fas fa-triangle-exclamation"></i> {{ error() }}
        <button (click)="load()">إعادة · Retry</button>
      </div>

      <ng-container *ngIf="!loading() && !error()">
        <div class="fe-big">
          <div class="fe-big-lbl">إجمالي المستحق · Total owed</div>
          <div class="fe-big-val">{{ stats()?.amountOwed ?? 0 }} <span>EGP</span></div>
        </div>
        <div class="fe-rows">
          <div class="fe-row"><span>عدد المعلمين · Teachers onboarded</span><b>{{ stats()?.teacherCount ?? 0 }}</b></div>
          <div class="fe-row"><span>العمولة لكل معلم · Fee per teacher</span><b>{{ stats()?.feePerTeacher ?? 0 }} EGP</b></div>
          <div class="fe-row"><span>كود المسوّق · Marketer code</span><b>{{ stats()?.marketerCode || '—' }}</b></div>
        </div>
        <p class="fe-note"><i class="fas fa-info-circle"></i> العمولة يحددها مالك التطبيق · The fee rate is set by the app owner.</p>
      </ng-container>
    </div>
  `,
  styles: [`
    .fe-page { padding: 12px; padding-bottom: 90px; }
    .fe-big { background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; border-radius: 18px; padding: 22px; text-align: center; box-shadow: 0 8px 24px rgba(102,126,234,.3); }
    .fe-big-lbl { font-size: .85rem; opacity: .9; }
    .fe-big-val { font-size: 2.4rem; font-weight: 800; margin-top: 6px; }
    .fe-big-val span { font-size: 1rem; opacity: .85; }
    .fe-rows { margin-top: 14px; background: #fff; border-radius: 14px; border: 1.5px solid #f0f0f0; overflow: hidden; }
    .fe-row { display: flex; justify-content: space-between; align-items: center; padding: 14px; border-bottom: 1px solid #f3f4f6; font-size: .9rem; }
    .fe-row:last-child { border-bottom: none; }
    .fe-row b { color: var(--ngx-primary, #667eea); }
    .fe-note { margin-top: 14px; font-size: .78rem; color: #9090aa; display: flex; gap: 6px; align-items: center; }
    .fe-skel { height: 120px; border-radius: 18px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .fe-error { background:#fff0f4; color:#dc2626; border:1px solid #fecaca; border-radius:12px; padding:14px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .fe-error button { margin-inline-start:auto; background:var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:8px; padding:8px 12px; min-height:40px; cursor:pointer; }
  `],
})
export class MarketerFeesComponent implements OnInit {
  private readonly marketerService = inject(MarketerService);

  loading = signal(false);
  error = signal<string | null>(null);
  stats = signal<MarketerStatsDto | null>(null);

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.stats.set(await lastValueFrom(this.marketerService.getMyStats()) ?? null);
    } catch {
      this.error.set('تعذّر تحميل الأرباح · Failed to load fees');
    } finally {
      this.loading.set(false);
    }
  }
}
