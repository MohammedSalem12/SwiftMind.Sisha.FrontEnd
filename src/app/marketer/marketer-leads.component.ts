import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { MarketingLeadService } from '@proxy/marketing-leads';
import type { MarketingLeadDto } from '@proxy/marketing-leads';
import { PullToRefreshDirective } from '../shared/directives/pull-to-refresh.directive';
import { PageHeaderComponent } from '../shared/components/page-header.component';

type CalledFilter = 'all' | 'called' | 'pending';

@Component({
  selector: 'app-marketer-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, PullToRefreshDirective, PageHeaderComponent],
  template: `
    <div class="mk-list-page" dir="rtl">
      <app-page-header [title]="'قائمة التسويق'" [titleEn]="'Marketing list'" [backTo]="'/marketer'">
        <button ph-actions class="ph-action" (click)="go('/marketer/leads/new')" aria-label="إضافة جهة · Add contact">
          <i class="fas fa-plus"></i>
        </button>
      </app-page-header>

      <div class="mk-body" appPullToRefresh (appPullToRefresh)="refreshData($event)">
        <!-- Search -->
        <div class="mk-search">
          <i class="fas fa-search"></i>
          <input
            type="text"
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
            inputmode="search"
            placeholder="بحث بالاسم أو الموبايل · Search name / mobile" />
          <button *ngIf="search()" class="mk-search-clear" (click)="clearSearch()" aria-label="مسح">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Status filter -->
        <div class="mk-segs">
          <button class="mk-seg" [class.active]="filter() === 'all'" (click)="setFilter('all')">
            الكل · All
          </button>
          <button class="mk-seg" [class.active]="filter() === 'pending'" (click)="setFilter('pending')">
            لم يتم · Not called
          </button>
          <button class="mk-seg" [class.active]="filter() === 'called'" (click)="setFilter('called')">
            تم الاتصال · Called
          </button>
        </div>

        <div class="mk-count" *ngIf="!loading() && !error()">
          {{ leads().length }} جهة · contacts
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="mk-skel-list">
          <div class="mk-skel-row" *ngFor="let _ of [1,2,3,4]"></div>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="mk-error">
          <i class="fas fa-triangle-exclamation"></i> {{ error() }}
          <button (click)="load()">إعادة · Retry</button>
        </div>

        <ng-container *ngIf="!loading() && !error()">
          <!-- Empty -->
          <div *ngIf="leads().length === 0" class="mk-empty">
            <i class="fas fa-address-book"></i>
            <p>لا توجد جهات بعد</p>
            <small>No contacts yet — add your first lead</small>
            <button class="mk-empty-btn" (click)="go('/marketer/leads/new')">إضافة جهة · Add contact</button>
          </div>

          <!-- Cards -->
          <div class="mk-cards">
            <div class="mk-lcard ion-activatable" *ngFor="let l of leads()" (click)="openDetail(l)">
              <div class="mk-avatar" [class.called]="l.isCalled">{{ initials(l.name) }}</div>
              <div class="mk-linfo">
                <div class="mk-lname">{{ l.name }}</div>
                <div class="mk-lmeta">
                  <span><i class="fas fa-phone"></i> {{ l.mobile }}</span>
                  <span *ngIf="l.course"><i class="fas fa-book"></i> {{ l.course }}</span>
                  <span *ngIf="l.city"><i class="fas fa-location-dot"></i> {{ l.city }}</span>
                </div>
              </div>
              <button
                class="mk-callbtn"
                [class.on]="l.isCalled"
                (click)="toggleCalled(l, $event)"
                [attr.aria-label]="l.isCalled ? 'تم الاتصال' : 'لم يتم الاتصال'">
                <i class="fas" [class.fa-circle-check]="l.isCalled" [class.fa-phone-slash]="!l.isCalled"></i>
              </button>
              <ion-ripple-effect></ion-ripple-effect>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .mk-list-page { min-height: 100vh; background: #f4f5fb; }
    .mk-body { padding: 12px; padding-bottom: 90px; }
    .mk-search {
      display: flex; align-items: center; gap: 8px; background: #fff; border: 1.5px solid #f0f0f0;
      border-radius: 12px; padding: 0 12px; min-height: 48px; box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .mk-search i { color: #9090aa; }
    .mk-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 16px; color: #1a1a2e; }
    .mk-search-clear { border: none; background: transparent; color: #9090aa; min-width: 44px; min-height: 44px; cursor: pointer; }
    .mk-segs { display: flex; gap: 6px; margin-top: 10px; background: #eef0f6; padding: 4px; border-radius: 12px; }
    .mk-seg {
      flex: 1; border: none; background: transparent; border-radius: 9px; padding: 9px 4px; min-height: 40px;
      font-size: .72rem; font-weight: 700; color: #6b7280; cursor: pointer;
    }
    .mk-seg.active { background: #fff; color: var(--ngx-primary, #667eea); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .mk-count { font-size: .72rem; color: #9090aa; margin: 10px 2px 6px; }
    .mk-cards { display: flex; flex-direction: column; gap: 10px; }
    .mk-lcard {
      position: relative; overflow: hidden;
      display: flex; align-items: center; gap: 12px; width: 100%; text-align: right;
      background: #fff; border: 1.5px solid #f0f0f0; border-radius: 14px; padding: 12px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .mk-lcard:active { transform: scale(.99); }
    .mk-lcard ion-ripple-effect { color: rgba(102,126,234,.3); }
    .mk-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; color: #fff; font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;
    }
    .mk-avatar.called { background: linear-gradient(135deg, #16a34a, #15803d); }
    .mk-linfo { flex: 1; min-width: 0; }
    .mk-lname { font-weight: 700; color: #1a1a2e; }
    .mk-lmeta { display: flex; flex-wrap: wrap; gap: 10px; font-size: .72rem; color: #9090aa; margin-top: 3px; }
    .mk-lmeta i { color: var(--ngx-primary, #667eea); margin-inline-end: 2px; }
    .mk-callbtn {
      flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e5e7eb;
      background: #fff; color: #9090aa; font-size: 1.05rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .mk-callbtn.on { background: #dcfce7; border-color: #86efac; color: #16a34a; }
    .mk-empty { text-align: center; padding: 40px 16px; color: #9090aa; }
    .mk-empty i { font-size: 2.4rem; color: #c4c4d4; }
    .mk-empty p { margin: 10px 0 2px; font-weight: 700; color: #555; }
    .mk-empty-btn { margin-top: 14px; background: var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:12px; padding: 12px 18px; min-height: 44px; cursor:pointer; font-weight:700; }
    .mk-skel-list { display:flex; flex-direction:column; gap:10px; margin-top: 10px; }
    .mk-skel-row { height: 70px; border-radius: 14px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .mk-error { margin-top: 12px; background:#fff0f4; color:#dc2626; border:1px solid #fecaca; border-radius:12px; padding:14px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .mk-error button { margin-inline-start:auto; background:var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:8px; padding:8px 12px; min-height:40px; cursor:pointer; }
  `],
})
export class MarketerLeadsComponent implements OnInit {
  private readonly leadService = inject(MarketingLeadService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  leads = signal<MarketingLeadDto[]>([]);
  filter = signal<CalledFilter>('all');
  search = signal('');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  isCalledParam = computed<boolean | undefined>(() => {
    const f = this.filter();
    return f === 'called' ? true : f === 'pending' ? false : undefined;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(
        this.leadService.getList({
          filter: this.search().trim() || undefined,
          isCalled: this.isCalledParam(),
          maxResultCount: 200,
          skipCount: 0,
          sorting: 'isCalled asc, creationTime desc',
        } as any),
      );
      this.leads.set(res?.items ?? []);
    } catch {
      this.error.set('تعذّر تحميل القائمة · Failed to load list');
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(f: CalledFilter): void {
    if (this.filter() === f) return;
    this.filter.set(f);
    void this.load();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), 350);
  }

  clearSearch(): void {
    this.search.set('');
    void this.load();
  }

  async toggleCalled(lead: MarketingLeadDto, ev: Event): Promise<void> {
    ev.stopPropagation();
    const previous = lead.isCalled;
    // optimistic
    this.leads.update(list => list.map(l => (l.id === lead.id ? { ...l, isCalled: !previous } : l)));
    try {
      await lastValueFrom(this.leadService.toggleCalled(lead.id));
      // If a status filter is active, the item may now drop out of the view
      if (this.filter() !== 'all') await this.load();
    } catch {
      // revert on failure
      this.leads.update(list => list.map(l => (l.id === lead.id ? { ...l, isCalled: previous } : l)));
    }
  }

  async refreshData(e: { complete: () => void }): Promise<void> {
    try { await this.load(); } finally { e.complete(); }
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  openDetail(l: MarketingLeadDto): void {
    void this.router.navigate(['/marketer/leads', l.id]);
  }

  go(path: string): void { void this.router.navigate([path]); }
}
