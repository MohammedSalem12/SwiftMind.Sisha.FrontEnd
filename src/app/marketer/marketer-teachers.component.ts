import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { MarketerTeacherDto } from '@proxy/marketers';

@Component({
  selector: 'app-marketer-teachers',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  template: `
    <div class="mk-list-page" dir="rtl">
      <div class="mk-head">
        <button class="mk-back" (click)="back()"><i class="fas fa-arrow-right"></i></button>
        <div class="mk-head-txt">
          <h1>معلميني</h1>
          <p>My teachers · {{ teachers().length }}</p>
        </div>
        <button class="mk-add" (click)="go('/marketer/onboard')"><i class="fas fa-user-plus"></i></button>
      </div>

      <div *ngIf="loading()" class="mk-skel-list">
        <div class="mk-skel-row" *ngFor="let _ of [1,2,3]"></div>
      </div>

      <div *ngIf="error()" class="mk-error">
        <i class="fas fa-triangle-exclamation"></i> {{ error() }}
        <button (click)="load()">إعادة · Retry</button>
      </div>

      <ng-container *ngIf="!loading() && !error()">
        <div *ngIf="teachers().length === 0" class="mk-empty">
          <i class="fas fa-chalkboard-teacher"></i>
          <p>لا يوجد معلمون بعد</p>
          <small>No teachers yet — onboard your first one</small>
          <button class="mk-empty-btn" (click)="go('/marketer/onboard')">تسجيل معلم · Onboard</button>
        </div>

        <div class="mk-cards">
          <button class="mk-tcard ion-activatable" *ngFor="let t of teachers()" (click)="openSetup(t)">
            <div class="mk-avatar">{{ initials(t.fullName) }}</div>
            <div class="mk-tinfo">
              <div class="mk-tname">{{ t.fullName }}</div>
              <div class="mk-tmeta">
                <span><i class="fas fa-id-card"></i> {{ t.teacherCode }}</span>
                <span><i class="fas fa-phone"></i> {{ t.phoneNumber }}</span>
              </div>
            </div>
            <i class="fas fa-chevron-left mk-chev"></i>
            <ion-ripple-effect></ion-ripple-effect>
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .mk-list-page { padding: 12px; padding-bottom: 90px; }
    .mk-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .mk-back, .mk-add { width: 44px; height: 44px; border-radius: 12px; border: none; cursor: pointer; }
    .mk-back { background: #f3f4f6; color: #374151; }
    .mk-add { background: var(--ngx-primary, #667eea); color: #fff; margin-inline-start: auto; }
    .mk-head-txt h1 { margin: 0; font-size: 1.2rem; }
    .mk-head-txt p { margin: 0; font-size: .8rem; color: #6b7280; }
    .mk-cards { display: flex; flex-direction: column; gap: 10px; }
    .mk-tcard {
      position: relative; overflow: hidden;
      display: flex; align-items: center; gap: 12px; width: 100%; text-align: right;
      background: #fff; border: 1.5px solid #f0f0f0; border-radius: 14px; padding: 12px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .mk-tcard:active { transform: scale(.99); }
    .mk-tcard ion-ripple-effect { color: rgba(102,126,234,.3); }
    .mk-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; color: #fff; font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;
    }
    .mk-tinfo { flex: 1; min-width: 0; }
    .mk-tname { font-weight: 700; color: #1a1a2e; }
    .mk-tmeta { display: flex; flex-wrap: wrap; gap: 10px; font-size: .72rem; color: #9090aa; margin-top: 3px; }
    .mk-tmeta i { color: var(--ngx-primary, #667eea); margin-inline-end: 2px; }
    .mk-chev { color: #c4c4d4; }
    .mk-empty { text-align: center; padding: 36px 16px; color: #9090aa; }
    .mk-empty i { font-size: 2.2rem; color: #c4c4d4; }
    .mk-empty p { margin: 10px 0 2px; font-weight: 700; color: #555; }
    .mk-empty-btn { margin-top: 14px; background: var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:12px; padding: 12px 18px; min-height: 44px; cursor:pointer; font-weight:700; }
    .mk-skel-list { display:flex; flex-direction:column; gap:10px; }
    .mk-skel-row { height: 68px; border-radius: 14px; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%); background-size:200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .mk-error { background:#fff0f4; color:#dc2626; border:1px solid #fecaca; border-radius:12px; padding:14px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .mk-error button { margin-inline-start:auto; background:var(--ngx-primary,#667eea); color:#fff; border:none; border-radius:8px; padding:8px 12px; min-height:40px; cursor:pointer; }
  `],
})
export class MarketerTeachersComponent implements OnInit {
  private readonly marketerService = inject(MarketerService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  teachers = signal<MarketerTeacherDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const list = await lastValueFrom(this.marketerService.getMyTeachers());
      this.teachers.set(list ?? []);
    } catch {
      this.error.set('تعذّر تحميل المعلمين · Failed to load teachers');
    } finally {
      this.loading.set(false);
    }
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  openSetup(t: MarketerTeacherDto): void {
    void this.router.navigate(['/marketer/teacher', t.id]);
  }

  go(path: string): void { void this.router.navigate([path]); }
  back(): void { void this.router.navigate(['/marketer']); }
}
