import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { MarketerTeacherDto } from '@proxy/marketers';

interface LocalCourse { id: string; name: string; }
interface LocalGroup { id: string; name: string; }

@Component({
  selector: 'app-marketer-teacher-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ts-page" dir="rtl">
      <div class="ts-head">
        <button class="ts-back" (click)="back()"><i class="fas fa-arrow-right"></i></button>
        <div>
          <h1>إعداد المعلم</h1>
          <p>{{ teacherName() || 'Teacher setup' }}</p>
        </div>
      </div>

      <!-- 1. Course -->
      <section class="ts-card">
        <div class="ts-title"><i class="fas fa-book"></i> 1 · إضافة مقرر · Add course</div>
        <input class="ts-input" [(ngModel)]="courseAr" placeholder="اسم المقرر (عربي) · Name (AR)" />
        <input class="ts-input" [(ngModel)]="courseEn" placeholder="Course name (EN)" />
        <button class="ts-btn" (click)="addCourse()" [disabled]="busy() || !courseAr || !courseEn">
          <i class="fas fa-plus"></i> إضافة مقرر · Add course
        </button>
        <div class="ts-chips" *ngIf="courses().length">
          <span class="ts-chip" *ngFor="let c of courses()"><i class="fas fa-check"></i> {{ c.name }}</span>
        </div>
      </section>

      <!-- 2. Group -->
      <section class="ts-card">
        <div class="ts-title"><i class="fas fa-layer-group"></i> 2 · إضافة مجموعة · Add group</div>
        <p class="ts-hint" *ngIf="!courses().length">أضف مقرراً أولاً · Add a course first</p>
        <ng-container *ngIf="courses().length">
          <input class="ts-input" [(ngModel)]="groupName" placeholder="اسم المجموعة · Group name" />
          <select class="ts-input" [(ngModel)]="groupCourseId">
            <option [ngValue]="''">-- اختر المقرر · Select course --</option>
            <option *ngFor="let c of courses()" [ngValue]="c.id">{{ c.name }}</option>
          </select>
          <select class="ts-input" [(ngModel)]="groupType">
            <option [ngValue]="0">حضوري · Offline</option>
            <option [ngValue]="1">أونلاين · Online</option>
          </select>
          <input class="ts-input" [(ngModel)]="groupLocation" [placeholder]="groupType===1 ? 'رابط الحصة · Meeting link' : 'المكان · Location'" />
          <button class="ts-btn" (click)="addGroup()" [disabled]="busy() || !groupName || !groupCourseId">
            <i class="fas fa-plus"></i> إضافة مجموعة · Add group
          </button>
          <div class="ts-chips" *ngIf="groups().length">
            <span class="ts-chip" *ngFor="let g of groups()"><i class="fas fa-check"></i> {{ g.name }}</span>
          </div>
        </ng-container>
      </section>

      <!-- 3. Schedule -->
      <section class="ts-card">
        <div class="ts-title"><i class="fas fa-clock"></i> 3 · إضافة موعد · Add schedule</div>
        <p class="ts-hint" *ngIf="!groups().length">أضف مجموعة أولاً · Add a group first</p>
        <ng-container *ngIf="groups().length">
          <select class="ts-input" [(ngModel)]="schedGroupId">
            <option [ngValue]="''">-- اختر المجموعة · Select group --</option>
            <option *ngFor="let g of groups()" [ngValue]="g.id">{{ g.name }}</option>
          </select>
          <select class="ts-input" [(ngModel)]="schedDay">
            <option *ngFor="let d of days; let i = index" [ngValue]="i">{{ d }}</option>
          </select>
          <div class="ts-row">
            <input class="ts-input" type="time" [(ngModel)]="schedStart" />
            <input class="ts-input" type="time" [(ngModel)]="schedEnd" />
          </div>
          <button class="ts-btn" (click)="addSchedule()" [disabled]="busy() || !schedGroupId || !schedStart || !schedEnd">
            <i class="fas fa-plus"></i> إضافة موعد · Add schedule
          </button>
        </ng-container>
      </section>

      <!-- 4. Secretary -->
      <section class="ts-card">
        <div class="ts-title"><i class="fas fa-user-tie"></i> 4 · تسجيل سكرتير · Register secretary</div>
        <input class="ts-input" [(ngModel)]="secUser" placeholder="اسم المستخدم · Username" />
        <input class="ts-input" type="email" [(ngModel)]="secEmail" placeholder="البريد · Email" />
        <input class="ts-input" type="tel" [(ngModel)]="secPhone" placeholder="الهاتف · Phone" />
        <input class="ts-input" [(ngModel)]="secPass" placeholder="كلمة المرور · Password" />
        <button class="ts-btn" (click)="addSecretary()" [disabled]="busy() || !secUser || !secEmail || !secPhone || !secPass">
          <i class="fas fa-user-plus"></i> تسجيل وربط · Register & link
        </button>
      </section>

      <div *ngIf="msg()" class="ts-toast ts-toast--ok"><i class="fas fa-check-circle"></i> {{ msg() }}</div>
      <div *ngIf="err()" class="ts-toast ts-toast--err"><i class="fas fa-times-circle"></i> {{ err() }}</div>
    </div>
  `,
  styles: [`
    .ts-page { padding: 12px; padding-bottom: 100px; }
    .ts-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .ts-back { width: 44px; height: 44px; border-radius: 12px; border: none; background: #f3f4f6; color: #374151; cursor: pointer; }
    .ts-head h1 { margin: 0; font-size: 1.15rem; }
    .ts-head p { margin: 0; font-size: .8rem; color: #6b7280; }
    .ts-card { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 16px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
    .ts-title { font-weight: 800; font-size: .9rem; color: #1a1a2e; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .ts-title i { color: var(--ngx-primary, #667eea); }
    .ts-hint { color: #9090aa; font-size: .82rem; margin: 0; }
    .ts-input {
      width: 100%; box-sizing: border-box; min-height: 48px; padding: 0 12px; margin-bottom: 8px;
      border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 16px; font-family: inherit; direction: rtl; background:#fff;
    }
    .ts-input:focus { outline: none; border-color: var(--ngx-primary, #667eea); box-shadow: 0 0 0 3px rgba(102,126,234,.15); }
    .ts-row { display: flex; gap: 8px; }
    .ts-row .ts-input { flex: 1; }
    .ts-btn {
      width: 100%; min-height: 48px; border: none; border-radius: 12px; cursor: pointer;
      background: var(--ngx-primary, #667eea); color: #fff; font-weight: 700; font-size: .92rem;
      display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px;
    }
    .ts-btn:disabled { opacity: .5; cursor: not-allowed; }
    .ts-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .ts-chip { background: var(--ngx-primary-light, #eef0fd); color: var(--ngx-primary, #667eea); font-size: .72rem; font-weight: 700; padding: 4px 8px; border-radius: 8px; }
    .ts-chip i { font-size: .6rem; }
    .ts-toast { position: fixed; left: 12px; right: 12px; bottom: 78px; border-radius: 12px; padding: 12px 14px; font-size: .88rem; display: flex; gap: 8px; align-items: center; box-shadow: 0 6px 20px rgba(0,0,0,.18); z-index: 50; }
    .ts-toast--ok { background: #15803d; color: #fff; }
    .ts-toast--err { background: #dc2626; color: #fff; }
  `],
})
export class MarketerTeacherSetupComponent implements OnInit {
  private readonly marketerService = inject(MarketerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  teacherId = '';
  teacherName = signal<string>('');
  busy = signal(false);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  courses = signal<LocalCourse[]>([]);
  groups = signal<LocalGroup[]>([]);

  // course form
  courseAr = '';
  courseEn = '';
  // group form
  groupName = '';
  groupCourseId = '';
  groupType = 0;
  groupLocation = '';
  // schedule form
  schedGroupId = '';
  schedDay = 6;
  schedStart = '13:00';
  schedEnd = '15:00';
  // secretary form
  secUser = '';
  secEmail = '';
  secPhone = '';
  secPass = '';

  days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  async ngOnInit(): Promise<void> {
    this.teacherId = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      const list = await lastValueFrom(this.marketerService.getMyTeachers());
      this.teacherName.set(list?.find(t => t.id === this.teacherId)?.fullName ?? '');
    } catch { /* name is best-effort */ }
  }

  private flash(ok: string): void {
    this.msg.set(ok); this.err.set(null);
    setTimeout(() => this.msg.set(null), 2500);
  }
  private fail(e: any): void {
    this.err.set(e?.error?.error?.message || 'حدث خطأ · Something went wrong');
    setTimeout(() => this.err.set(null), 3500);
  }

  async addCourse(): Promise<void> {
    this.busy.set(true);
    try {
      const id = await lastValueFrom(this.marketerService.createCourseForTeacher({
        teacherId: this.teacherId, nameAr: this.courseAr, nameEn: this.courseEn,
      }));
      this.courses.update(c => [...c, { id, name: this.courseAr || this.courseEn }]);
      this.courseAr = ''; this.courseEn = '';
      this.flash('تمت إضافة المقرر · Course added');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }

  async addGroup(): Promise<void> {
    this.busy.set(true);
    try {
      const id = await lastValueFrom(this.marketerService.createGroupForTeacher({
        teacherId: this.teacherId,
        courseId: this.groupCourseId,
        name: this.groupName,
        groupType: this.groupType,
        meetingLink: this.groupType === 1 ? this.groupLocation : undefined,
        location: this.groupType === 0 ? this.groupLocation : undefined,
      }));
      this.groups.update(g => [...g, { id, name: this.groupName }]);
      this.groupName = ''; this.groupCourseId = ''; this.groupLocation = '';
      this.flash('تمت إضافة المجموعة · Group added');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }

  async addSchedule(): Promise<void> {
    this.busy.set(true);
    try {
      await lastValueFrom(this.marketerService.addSchedule({
        groupId: this.schedGroupId,
        dayOfWeek: this.schedDay,
        startTime: this.schedStart + ':00',
        endTime: this.schedEnd + ':00',
        location: this.groupLocation || undefined,
      }));
      this.flash('تمت إضافة الموعد · Schedule added');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }

  async addSecretary(): Promise<void> {
    this.busy.set(true);
    try {
      await lastValueFrom(this.marketerService.registerSecretaryForTeacher({
        teacherId: this.teacherId,
        userName: this.secUser,
        email: this.secEmail,
        phoneNumber: this.secPhone,
        password: this.secPass,
      }));
      this.secUser = ''; this.secEmail = ''; this.secPhone = ''; this.secPass = '';
      this.flash('تم تسجيل السكرتير وربطه · Secretary registered & linked');
    } catch (e) { this.fail(e); } finally { this.busy.set(false); }
  }

  back(): void { void this.router.navigate(['/marketer/teachers']); }
}
