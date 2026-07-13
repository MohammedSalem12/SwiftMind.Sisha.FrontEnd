import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { MarketingLeadService } from '@proxy/marketing-leads';
import type { MarketingLeadDto } from '@proxy/marketing-leads';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-marketer-lead-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="mk-detail-page" dir="rtl">
      <app-page-header [title]="'تفاصيل الجهة'" [titleEn]="'Contact details'" [backTo]="'/marketer/leads'">
        <button ph-actions class="ph-action" *ngIf="lead()" (click)="edit()" aria-label="تعديل · Edit">
          <i class="fas fa-pen"></i>
        </button>
      </app-page-header>

      <div class="mk-body">
        <div *ngIf="loading()" class="mk-skel"></div>

        <div *ngIf="error()" class="mk-error">
          <i class="fas fa-triangle-exclamation"></i> {{ error() }}
          <button (click)="load()">إعادة · Retry</button>
        </div>

        <ng-container *ngIf="lead() as l">
          <div class="mk-hero">
            <div class="mk-avatar" [class.called]="l.isCalled">{{ initials(l.name) }}</div>
            <div class="mk-hero-name">{{ l.name }}</div>
            <div class="mk-badge" [class.on]="l.isCalled">
              <i class="fas" [class.fa-circle-check]="l.isCalled" [class.fa-phone-slash]="!l.isCalled"></i>
              {{ l.isCalled ? 'تم الاتصال · Called' : 'لم يتم الاتصال · Not called' }}
            </div>
          </div>

          <div class="mk-rows">
            <a class="mk-row" [href]="'tel:' + l.mobile">
              <i class="fas fa-phone"></i>
              <div class="mk-row-c"><span class="mk-row-l">الموبايل · Mobile</span><span class="mk-row-v">{{ l.mobile }}</span></div>
              <i class="fas fa-arrow-up-right-from-square mk-row-go"></i>
            </a>
            <div class="mk-row" *ngIf="l.course">
              <i class="fas fa-book"></i>
              <div class="mk-row-c"><span class="mk-row-l">الكورس · Course</span><span class="mk-row-v">{{ l.course }}</span></div>
            </div>
            <div class="mk-row" *ngIf="l.city">
              <i class="fas fa-location-dot"></i>
              <div class="mk-row-c"><span class="mk-row-l">المدينة · City</span><span class="mk-row-v">{{ l.city }}</span></div>
            </div>
            <div class="mk-row" *ngIf="l.address">
              <i class="fas fa-map"></i>
              <div class="mk-row-c"><span class="mk-row-l">العنوان · Address</span><span class="mk-row-v">{{ l.address }}</span></div>
            </div>
          </div>

          <div class="mk-actions">
            <button class="mk-btn mk-btn--call" [class.on]="l.isCalled" (click)="toggleCalled()" [disabled]="busy()">
              <i class="fas" [class.fa-circle-check]="!l.isCalled" [class.fa-rotate-left]="l.isCalled"></i>
              {{ l.isCalled ? 'تعليم كغير متصل · Mark not called' : 'تعليم كمتصل · Mark called' }}
            </button>
            <button class="mk-btn mk-btn--edit" (click)="edit()">
              <i class="fas fa-pen"></i> تعديل · Edit
            </button>
            <button class="mk-btn mk-btn--del" (click)="confirmDelete()" [disabled]="busy()">
              <i class="fas fa-trash"></i> حذف · Delete
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .mk-detail-page { min-height: 100vh; background: #f4f5fb; }
    .mk-body { padding: 14px; padding-bottom: 90px; }
    .mk-hero {
      background: #fff; border: 1.5px solid #f0f0f0; border-radius: 16px; padding: 22px 16px;
      text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .mk-avatar {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 12px; color: #fff; font-weight: 800; font-size: 1.6rem;
      background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;
    }
    .mk-avatar.called { background: linear-gradient(135deg, #16a34a, #15803d); }
    .mk-hero-name { font-size: 1.3rem; font-weight: 800; color: #1a1a2e; }
    .mk-badge {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 6px 14px; border-radius: 999px;
      font-size: .78rem; font-weight: 700; background: #fef2f2; color: #dc2626;
    }
    .mk-badge.on { background: #dcfce7; color: #16a34a; }
    .mk-rows { margin-top: 14px; display: flex; flex-direction: column; gap: 1px; background: #fff; border: 1.5px solid #f0f0f0; border-radius: 16px; overflow: hidden; }
    .mk-row { display: flex; align-items: center; gap: 12px; padding: 14px; text-decoration: none; color: inherit; border-bottom: 1px solid #f4f4f8; }
    .mk-row:last-child { border-bottom: none; }
    .mk-row > i { color: var(--ngx-primary, #667eea); width: 22px; text-align: center; font-size: 1rem; }
    .mk-row-c { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .mk-row-l { font-size: .68rem; color: #9090aa; }
    .mk-row-v { font-size: .95rem; color: #1a1a2e; font-weight: 600; word-break: break-word; }
    .mk-row-go { color: #c4c4d4; font-size: .8rem; }
    .mk-actions { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
    .mk-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
      min-height: 50px; border-radius: 14px; font-size: .95rem; font-weight: 800; cursor: pointer; border: 1.5px solid transparent;
    }
    .mk-btn--call { background: #16a34a; color: #fff; }
    .mk-btn--call.on { background: #fff; color: #b45309; border-color: #fcd34d; }
    .mk-btn--edit { background: #fff; color: var(--ngx-primary, #667eea); border-color: #dfe3fb; }
    .mk-btn--del { background: #fff; color: #dc2626; border-color: #fecaca; }
    .mk-btn:disabled { opacity: .6; }
    .mk-skel { height: 220px; border-radius: 16px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .mk-error { background:#fff0f4; color:#dc2626; border:1px solid #fecaca; border-radius:12px; padding:14px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .mk-error button { margin-inline-start:auto; background:var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:8px; padding:8px 12px; min-height:40px; cursor:pointer; }
  `],
})
export class MarketerLeadDetailComponent implements OnInit {
  private readonly leadService = inject(MarketingLeadService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertCtrl = inject(AlertController);

  loading = signal(false);
  busy = signal(false);
  error = signal<string | null>(null);
  lead = signal<MarketingLeadDto | null>(null);
  private id = '';

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.load();
  }

  async load(): Promise<void> {
    if (!this.id) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const dto = await lastValueFrom(this.leadService.get(this.id));
      this.lead.set(dto);
    } catch {
      this.error.set('تعذّر تحميل الجهة · Failed to load contact');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleCalled(): Promise<void> {
    this.busy.set(true);
    try {
      const updated = await lastValueFrom(this.leadService.toggleCalled(this.id));
      this.lead.set(updated);
    } catch {
      this.error.set('تعذّر تحديث الحالة · Failed to update status');
    } finally {
      this.busy.set(false);
    }
  }

  edit(): void {
    void this.router.navigate(['/marketer/leads', this.id, 'edit']);
  }

  async confirmDelete(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'حذف الجهة · Delete contact',
      message: 'هل أنت متأكد من حذف هذه الجهة؟ · Are you sure you want to delete this contact?',
      buttons: [
        { text: 'إلغاء · Cancel', role: 'cancel' },
        { text: 'حذف · Delete', role: 'destructive', handler: () => void this.doDelete() },
      ],
    });
    await alert.present();
  }

  private async doDelete(): Promise<void> {
    this.busy.set(true);
    try {
      await lastValueFrom(this.leadService.delete(this.id));
      await this.router.navigate(['/marketer/leads']);
    } catch {
      this.error.set('تعذّر الحذف · Failed to delete');
      this.busy.set(false);
    }
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }
}
