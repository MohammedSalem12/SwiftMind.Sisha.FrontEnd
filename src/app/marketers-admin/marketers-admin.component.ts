import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { MarketerStatsDto, RegisterMarketerDto } from '@proxy/marketers';

@Component({
  selector: 'app-marketers-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ma-page" dir="rtl">
      <div class="ma-head">
        <button class="ma-back" (click)="back()"><i class="fas fa-arrow-right"></i></button>
        <div class="ma-head-txt">
          <h1>المسوّقون</h1>
          <p>Marketers · {{ stats().length }}</p>
        </div>
        <button class="ma-add" (click)="showForm.set(!showForm())"><i class="fas" [class.fa-plus]="!showForm()" [class.fa-times]="showForm()"></i></button>
      </div>

      <!-- Register form -->
      <section class="ma-card" *ngIf="showForm()">
        <div class="ma-title"><i class="fas fa-user-plus"></i> تسجيل مسوّق · Register marketer</div>
        <input class="ma-input" [(ngModel)]="reg.firstName" placeholder="الاسم الأول · First name" />
        <input class="ma-input" [(ngModel)]="reg.lastName" placeholder="الاسم الأخير · Last name" />
        <input class="ma-input" type="tel" [(ngModel)]="reg.phoneNumber" placeholder="الهاتف · Phone" />
        <input class="ma-input" type="email" [(ngModel)]="reg.email" placeholder="البريد · Email" />
        <input class="ma-input" [(ngModel)]="reg.userName" placeholder="اسم المستخدم · Username" />
        <input class="ma-input" [(ngModel)]="reg.password" placeholder="كلمة المرور · Password" />
        <input class="ma-input" [(ngModel)]="reg.company" placeholder="الشركة · Company (optional)" />
        <input class="ma-input" type="number" [(ngModel)]="reg.feePerTeacher" placeholder="العمولة لكل معلم · Fee per teacher (EGP)" />
        <button class="ma-btn" (click)="register()" [disabled]="saving() || !regValid()">
          <i class="fas fa-save"></i> تسجيل · Create marketer
        </button>
      </section>

      <div *ngIf="loading()" class="ma-skel-list"><div class="ma-skel" *ngFor="let _ of [1,2,3]"></div></div>
      <div *ngIf="error()" class="ma-error"><i class="fas fa-triangle-exclamation"></i> {{ error() }}
        <button (click)="load()">إعادة · Retry</button>
      </div>

      <ng-container *ngIf="!loading() && !error()">
        <div *ngIf="stats().length === 0 && !showForm()" class="ma-empty">
          <i class="fas fa-bullhorn"></i><p>لا يوجد مسوّقون بعد</p><small>No marketers yet</small>
        </div>

        <div class="ma-cards">
          <div class="ma-mcard" *ngFor="let m of stats()">
            <div class="ma-mtop">
              <div class="ma-avatar"><i class="fas fa-bullhorn"></i></div>
              <div class="ma-minfo">
                <div class="ma-mname">{{ m.fullName }}</div>
                <div class="ma-mcode">{{ m.marketerCode }}</div>
              </div>
              <div class="ma-owed">
                <div class="ma-owed-val">{{ m.amountOwed }}</div>
                <div class="ma-owed-lbl">EGP مستحق</div>
              </div>
            </div>
            <div class="ma-mstats">
              <span><i class="fas fa-chalkboard-teacher"></i> {{ m.teacherCount }} معلم</span>
              <div class="ma-fee">
                <label>العمولة/معلم:</label>
                <input type="number" [(ngModel)]="feeEdits[m.marketerId!]" [placeholder]="m.feePerTeacher" />
                <button (click)="saveFee(m)" [disabled]="saving()"><i class="fas fa-check"></i></button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div *ngIf="msg()" class="ma-toast ma-toast--ok"><i class="fas fa-check-circle"></i> {{ msg() }}</div>
      <div *ngIf="formErr()" class="ma-toast ma-toast--err"><i class="fas fa-times-circle"></i> {{ formErr() }}</div>
    </div>
  `,
  styles: [`
    .ma-page { padding: 12px; padding-bottom: 100px; }
    .ma-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .ma-back, .ma-add { width: 44px; height: 44px; border-radius: 12px; border: none; cursor: pointer; }
    .ma-back { background: #f3f4f6; color: #374151; }
    .ma-add { background: var(--ngx-primary, #667eea); color: #fff; margin-inline-start: auto; }
    .ma-head-txt h1 { margin: 0; font-size: 1.2rem; }
    .ma-head-txt p { margin: 0; font-size: .8rem; color: #6b7280; }
    .ma-card { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 16px; padding: 14px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .ma-title { font-weight: 800; font-size: .9rem; margin-bottom: 10px; display: flex; gap: 8px; align-items: center; }
    .ma-title i { color: var(--ngx-primary, #667eea); }
    .ma-input { width: 100%; box-sizing: border-box; min-height: 48px; padding: 0 12px; margin-bottom: 8px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 16px; font-family: inherit; direction: rtl; }
    .ma-input:focus { outline: none; border-color: var(--ngx-primary,#667eea); box-shadow: 0 0 0 3px rgba(102,126,234,.15); }
    .ma-btn { width: 100%; min-height: 48px; border: none; border-radius: 12px; background: var(--ngx-primary,#667eea); color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .ma-btn:disabled { opacity: .5; cursor: not-allowed; }
    .ma-cards { display: flex; flex-direction: column; gap: 10px; }
    .ma-mcard { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 14px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,.04); }
    .ma-mtop { display: flex; align-items: center; gap: 12px; }
    .ma-avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; display: flex; align-items: center; justify-content: center; }
    .ma-minfo { flex: 1; min-width: 0; }
    .ma-mname { font-weight: 700; color: #1a1a2e; }
    .ma-mcode { font-size: .72rem; color: #9090aa; }
    .ma-owed { text-align: center; }
    .ma-owed-val { font-weight: 800; color: var(--ngx-primary, #667eea); font-size: 1.1rem; }
    .ma-owed-lbl { font-size: .62rem; color: #9090aa; }
    .ma-mstats { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; }
    .ma-mstats > span { font-size: .8rem; color: #555; }
    .ma-mstats i { color: var(--ngx-primary, #667eea); }
    .ma-fee { display: flex; align-items: center; gap: 6px; }
    .ma-fee label { font-size: .72rem; color: #6b7280; }
    .ma-fee input { width: 70px; min-height: 40px; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0 8px; font-size: 16px; text-align: center; }
    .ma-fee button { width: 40px; height: 40px; border: none; border-radius: 10px; background: var(--ngx-primary,#667eea); color: #fff; cursor: pointer; }
    .ma-empty { text-align: center; padding: 36px 16px; color: #9090aa; }
    .ma-empty i { font-size: 2.2rem; color: #c4c4d4; }
    .ma-empty p { margin: 10px 0 2px; font-weight: 700; color: #555; }
    .ma-skel-list { display: flex; flex-direction: column; gap: 10px; }
    .ma-skel { height: 90px; border-radius: 14px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .ma-error { background:#fff0f4; color:#dc2626; border:1px solid #fecaca; border-radius:12px; padding:14px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .ma-error button { margin-inline-start:auto; background:var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:8px; padding:8px 12px; min-height:40px; cursor:pointer; }
    .ma-toast { position: fixed; left: 12px; right: 12px; bottom: 78px; border-radius: 12px; padding: 12px 14px; font-size: .88rem; display: flex; gap: 8px; align-items: center; box-shadow: 0 6px 20px rgba(0,0,0,.18); z-index: 50; }
    .ma-toast--ok { background: #15803d; color: #fff; }
    .ma-toast--err { background: #dc2626; color: #fff; }
  `],
})
export class MarketersAdminComponent implements OnInit {
  private readonly marketerService = inject(MarketerService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  msg = signal<string | null>(null);
  formErr = signal<string | null>(null);
  showForm = signal(false);

  stats = signal<MarketerStatsDto[]>([]);
  feeEdits: Record<string, number | null> = {};

  reg: RegisterMarketerDto = {
    userName: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', company: '', feePerTeacher: 0,
  };

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.stats.set(await lastValueFrom(this.marketerService.getAllStats()) ?? []);
    } catch {
      this.error.set('تعذّر تحميل المسوّقين · Failed to load marketers');
    } finally {
      this.loading.set(false);
    }
  }

  regValid(): boolean {
    const r = this.reg;
    return !!(r.firstName && r.lastName && r.phoneNumber && r.email && r.userName && r.password);
  }

  private flash(ok: string): void { this.msg.set(ok); setTimeout(() => this.msg.set(null), 2500); }
  private fail(e: any): void {
    this.formErr.set(e?.error?.error?.message || 'حدث خطأ · Something went wrong');
    setTimeout(() => this.formErr.set(null), 3500);
  }

  async register(): Promise<void> {
    if (!this.regValid()) return;
    this.saving.set(true);
    try {
      await lastValueFrom(this.marketerService.registerMarketer({ ...this.reg, feePerTeacher: Number(this.reg.feePerTeacher) || 0 }));
      this.reg = { userName: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', company: '', feePerTeacher: 0 };
      this.showForm.set(false);
      this.flash('تم تسجيل المسوّق · Marketer created');
      await this.load();
    } catch (e) { this.fail(e); } finally { this.saving.set(false); }
  }

  async saveFee(m: MarketerStatsDto): Promise<void> {
    const val = this.feeEdits[m.marketerId!];
    if (val === undefined || val === null || val < 0) return;
    this.saving.set(true);
    try {
      await lastValueFrom(this.marketerService.setFeePerTeacher({ marketerId: m.marketerId!, feePerTeacher: Number(val) }));
      this.feeEdits[m.marketerId!] = null;
      this.flash('تم تحديث العمولة · Fee updated');
      await this.load();
    } catch (e) { this.fail(e); } finally { this.saving.set(false); }
  }

  back(): void { void this.router.navigate(['/']); }
}
