import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { AttendanceService } from '@proxy/attendances';
import { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService, SecretaryTeacherService } from '@proxy/teachers';
import { GroupService } from '@proxy/groups';
import { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { AcademyService } from '@proxy/academies';
import { RestService } from '@abp/ng.core';

interface CourseOption {
  id: string;
  nameAr: string;
  nameEn: string;
  gradeName?: string;
  isAcademy?: boolean;
  academyName?: string;
}

type Period = 'today' | 'current-week' | 'week' | 'month' | 'quarter' | '6months';

@Component({
  selector: 'app-absence-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rpt-page" dir="rtl">

      <!-- ── Hero ── -->
      <div class="hero">
        <div class="hero-blob b1"></div>
        <div class="hero-blob b2"></div>
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="hero-text">
          <h1>تقرير الغياب</h1>
          <p>Absence Report · {{ periodLabel() }}</p>
        </div>
        <div class="hero-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
      </div>

      <!-- ── Period selector ── -->
      <div class="period-strip">
        @for (p of periods; track p.value) {
          <button class="period-btn"
            [class.active]="selectedPeriod() === p.value"
            (click)="onPeriodChange(p.value)">
            {{ p.label }}
          </button>
        }
      </div>

      <!-- ── Filters ── -->
      <div class="filters-wrap">

        <!-- Course source toggle (teacher only) -->
        @if (!isSecretary() && academyCourses().length > 0) {
          <div class="source-toggle">
            <button class="src-btn" [class.active]="!useAcademy()" (click)="useAcademy.set(false)">
              <i class="fas fa-book"></i> مقرراتي
            </button>
            <button class="src-btn" [class.active]="useAcademy()" (click)="onSwitchToAcademy()">
              <i class="fas fa-university"></i> الأكاديمية
            </button>
          </div>
        }

        <!-- Course -->
        <div class="filter-group">
          <label class="filter-label">
            <i class="fas fa-book"></i>
            @if (useAcademy()) { مقرر الأكاديمية } @else { المقرر }
          </label>
          <select class="filter-select"
            [ngModel]="selectedCourseId()"
            (ngModelChange)="onCourseChange($event)">
            <option value="">-- اختر المقرر --</option>
            @for (c of activeCourses(); track c.id) {
              <option [value]="c.id">
                {{ c.nameAr || c.nameEn }}{{ c.gradeName ? ' · ' + c.gradeName : '' }}{{ c.isAcademy && c.academyName ? ' (' + c.academyName + ')' : '' }}
              </option>
            }
          </select>
        </div>

        <!-- Group (loads after course selected) -->
        @if (groups().length > 0) {
          <div class="filter-group">
            <label class="filter-label"><i class="fas fa-layer-group"></i> المجموعة</label>
            <select class="filter-select"
              [ngModel]="selectedGroupId()"
              (ngModelChange)="onGroupChange($event)">
              <option value="">-- كل المجموعات --</option>
              @for (g of groups(); track g.groupId) {
                <option [value]="g.groupId">{{ g.name }} · {{ g.groupCode }}</option>
              }
            </select>
          </div>
        }

        <!-- Load button -->
        <button class="btn-load"
          [disabled]="!selectedCourseId() || loading()"
          (click)="loadReport()">
          @if (loading()) {
            <div class="spinner"></div>
          } @else {
            <i class="fas fa-search"></i>
          }
          <span>{{ loading() ? 'جاري التحميل...' : 'عرض التقرير' }}</span>
        </button>

      </div>

      <!-- ── Active filters chips ── -->
      @if (selectedCourseId()) {
        <div class="active-chips">
          <span class="chip chip-period">
            <i class="fas fa-clock"></i> {{ periodLabel() }}
          </span>
          <span class="chip chip-course">
            <i class="fas fa-book"></i> {{ selectedCourseName() }}
          </span>
          @if (selectedGroupId()) {
            <span class="chip chip-group">
              <i class="fas fa-layer-group"></i> {{ selectedGroupName() }}
            </span>
          }
        </div>
      }

      <!-- ── Error ── -->
      @if (error()) {
        <div class="error-banner">
          <i class="fas fa-exclamation-circle"></i>
          {{ error() }}
        </div>
      }

      <!-- ── Prompt ── -->
      @if (!loading() && !error() && records().length === 0 && !hasLoaded()) {
        <div class="prompt-state">
          <div class="prompt-icon"><i class="fas fa-filter"></i></div>
          <p>اختر المقرر والفترة الزمنية ثم اضغط "عرض التقرير"</p>
          <small>Select course and period then tap Load</small>
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && !error() && records().length === 0 && hasLoaded()) {
        <div class="prompt-state">
          <div class="prompt-icon"><i class="fas fa-check-circle"></i></div>
          <p>لا توجد بيانات غياب لهذه الفترة</p>
          <small>No absence data for this period</small>
        </div>
      }

      <!-- ── Stats cards ── -->
      @if (!loading() && displayedRecords().length > 0) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-val">{{ totalStudents() }}</div>
            <div class="stat-lbl">طالب · Students</div>
          </div>
          <div class="stat-card stat-absent">
            <div class="stat-val">{{ avgAbsent() }}</div>
            <div class="stat-lbl">متوسط أيام غياب</div>
          </div>
          <div class="stat-card stat-risk">
            <div class="stat-val">{{ atRiskCount() }}</div>
            <div class="stat-lbl">خطر الرسوب &lt;75%</div>
          </div>
          <div class="stat-card stat-good">
            <div class="stat-val">{{ goodCount() }}</div>
            <div class="stat-lbl">حضور ممتاز ≥90%</div>
          </div>
        </div>

        <!-- ── Student rows ── -->
        <div class="section-label">
          <i class="fas fa-users"></i>
          <span>تفاصيل الطلاب · Student Details</span>
          <span class="count-pill">{{ displayedRecords().length }}</span>
        </div>

        <div class="records-list">
          @for (r of displayedRecords(); track r.studentId; let i = $index) {
            <div class="record-card" [class]="rateClass(r.attendancePercentage)">
              <div class="rank">{{ i + 1 }}</div>

              <div class="student-info">
                <div class="student-avatar" [class]="'av-' + (i % 6)">
                  {{ (r.studentNameAr || r.studentNameEn || '?').charAt(0) }}
                </div>
                <div class="student-meta">
                  <div class="student-name">{{ r.studentNameAr || r.studentNameEn }}</div>
                  <div class="student-code">{{ r.studentCode }}</div>
                </div>
              </div>

              <div class="attendance-stats">
                <div class="stat-item absent-days">
                  <span class="val">{{ r.absentDays }}</span>
                  <span class="lbl">غياب</span>
                </div>
                <div class="stat-item present-days">
                  <span class="val">{{ r.attendedDays }}</span>
                  <span class="lbl">حضور</span>
                </div>
                <div class="stat-item total-days">
                  <span class="val">{{ r.totalDaysInMonth }}</span>
                  <span class="lbl">الكل</span>
                </div>
              </div>

              <div class="pct-ring" [class]="rateClass(r.attendancePercentage)">
                {{ r.attendancePercentage }}%
              </div>
            </div>
          }
        </div>
      }

      <!-- Bottom padding -->
      <div style="height: 2rem"></div>
    </div>
  `,
  styles: [`
    /* ── Design tokens ── */
    :host {
      --g1: #667eea; --g2: #764ba2;
      --bg: #f4f5fb; --white: #ffffff;
      --dark: #1a1a2e; --mid: #4a4a6a; --light: #9090aa;
      --radius: 16px;
    }

    .rpt-page {
      direction: rtl;
      min-height: 100vh;
      background: var(--bg);
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(145deg, var(--g1) 0%, var(--g2) 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.25rem 1.5rem;
      position: relative; overflow: hidden;
      display: flex; align-items: center; gap: 0.875rem;
    }
    .hero-blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,.07); pointer-events: none; }
    .b1 { width: 200px; height: 200px; top: -70px; right: -50px; }
    .b2 { width: 130px; height: 130px; bottom: -50px; left: -25px; }
    .back-btn {
      flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.25);
      color: #fff; font-size: 1rem; display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 1; transition: background .15s;
      &:active { background: rgba(255,255,255,.28); }
    }
    .hero-text { flex: 1; z-index: 1; min-width: 0; }
    .hero-text h1 { font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 .15rem; }
    .hero-text p { font-size: .72rem; color: rgba(255,255,255,.65); margin: 0; }
    .hero-icon {
      z-index: 1; width: 52px; height: 52px; border-radius: 50%;
      background: rgba(255,255,255,.15); border: 2px solid rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { font-size: 1.3rem; color: #fff; }
    }

    /* ── Period strip ── */
    .period-strip {
      display: flex; gap: .5rem; padding: .875rem 1rem;
      overflow-x: auto; background: var(--white);
      border-bottom: 1px solid rgba(0,0,0,.05);
      &::-webkit-scrollbar { display: none; }
    }
    .period-btn {
      flex-shrink: 0; padding: .45rem .9rem; border-radius: 999px;
      border: 1.5px solid #e5e7eb; background: var(--white);
      color: var(--mid); font-size: .8rem; font-weight: 600; cursor: pointer;
      transition: border-color .15s, background .15s, color .15s;
      min-height: 36px;
      &.active { border-color: var(--g1); background: rgba(102,126,234,.09); color: var(--g1); }
    }

    /* ── Source toggle ── */
    .source-toggle {
      display: flex; gap: .5rem; background: #f0f0f8; border-radius: 12px; padding: .25rem;
    }
    .src-btn {
      flex: 1; padding: .45rem .75rem; border: none; border-radius: 10px;
      font-size: .8rem; font-weight: 700; cursor: pointer;
      background: transparent; color: var(--mid);
      display: flex; align-items: center; justify-content: center; gap: .35rem;
      transition: background .15s, color .15s;
      min-height: 40px;
      i { font-size: .75rem; }
      &.active { background: var(--white); color: var(--g1); box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    }

    /* ── Filters ── */
    .filters-wrap {
      padding: .875rem 1rem; display: flex; flex-direction: column; gap: .75rem;
    }
    .filter-group { display: flex; flex-direction: column; gap: .3rem; }
    .filter-label {
      font-size: .75rem; font-weight: 700; color: var(--mid);
      display: flex; align-items: center; gap: .3rem;
      i { color: var(--g1); font-size: .65rem; }
    }
    .filter-select {
      padding: .7rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 12px;
      font-size: .9rem; background: var(--white); width: 100%;
      &:focus { outline: none; border-color: var(--g1); box-shadow: 0 0 0 3px rgba(102,126,234,.12); }
    }
    .btn-load {
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      background: linear-gradient(145deg, var(--g1), var(--g2));
      color: #fff; border: none; padding: .875rem; border-radius: 12px;
      font-size: .9rem; font-weight: 700; cursor: pointer; min-height: 50px;
      box-shadow: 0 4px 14px rgba(102,126,234,.35); transition: opacity .15s;
      &:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
    }
    .spinner {
      width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,.4);
      border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Active chips ── */
    .active-chips { display: flex; flex-wrap: wrap; gap: .4rem; padding: 0 1rem .75rem; }
    .chip {
      display: inline-flex; align-items: center; gap: .3rem;
      padding: .25rem .65rem; border-radius: 999px; font-size: .72rem; font-weight: 700;
      i { font-size: .62rem; }
    }
    .chip-period  { background: rgba(102,126,234,.1); color: var(--g1); }
    .chip-course  { background: rgba(118,75,162,.1); color: var(--g2); }
    .chip-group   { background: rgba(16,185,129,.1); color: #059669; }

    /* ── Error ── */
    .error-banner {
      margin: .75rem 1rem; padding: .875rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
      color: #dc2626; font-size: .85rem;
      display: flex; align-items: center; gap: .6rem;
      i { font-size: 1rem; flex-shrink: 0; }
    }

    /* ── Prompt / Empty ── */
    .prompt-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 3rem 2rem; text-align: center;
    }
    .prompt-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(145deg, var(--g1), var(--g2));
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem; box-shadow: 0 6px 20px rgba(102,126,234,.3);
      i { font-size: 1.8rem; color: #fff; }
    }
    .prompt-state p { font-size: 1rem; font-weight: 700; color: var(--dark); margin: 0 0 .25rem; }
    .prompt-state small { font-size: .78rem; color: var(--light); }

    /* ── Stats row ── */
    .stats-row {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: .6rem;
      padding: .75rem 1rem;
    }
    .stat-card {
      background: var(--white); border-radius: var(--radius);
      padding: .875rem .75rem; text-align: center;
      box-shadow: 0 2px 8px rgba(51,102,255,.07);
    }
    .stat-val { font-size: 1.6rem; font-weight: 800; color: var(--g1); line-height: 1; }
    .stat-lbl { font-size: .7rem; font-weight: 600; color: var(--light); margin-top: .25rem; }
    .stat-absent .stat-val { color: #f59e0b; }
    .stat-risk   .stat-val { color: #ef4444; }
    .stat-good   .stat-val { color: #10b981; }

    /* ── Section label ── */
    .section-label {
      display: flex; align-items: center; gap: .5rem;
      padding: .25rem 1.25rem .6rem; font-size: .8rem; font-weight: 700; color: var(--mid);
      i { color: var(--g1); }
    }
    .count-pill {
      margin-right: auto; background: rgba(102,126,234,.1); color: var(--g1);
      font-size: .7rem; font-weight: 700; padding: .15rem .5rem; border-radius: 999px;
    }

    /* ── Records list ── */
    .records-list {
      display: flex; flex-direction: column; gap: .6rem; padding: 0 1rem;
    }
    .record-card {
      background: var(--white); border-radius: var(--radius);
      box-shadow: 0 2px 8px rgba(51,102,255,.07);
      display: flex; align-items: center; gap: .75rem; padding: .875rem 1rem;
      border-right: 4px solid #e5e7eb;
      &.excellent { border-right-color: #10b981; }
      &.good      { border-right-color: #f59e0b; }
      &.poor      { border-right-color: #ef4444; }
    }
    .rank {
      font-size: .7rem; font-weight: 800; color: var(--light);
      width: 20px; text-align: center; flex-shrink: 0;
    }
    .student-info { display: flex; align-items: center; gap: .6rem; flex: 1; min-width: 0; }
    .student-avatar {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem; color: #fff;
    }
    .av-0 { background: linear-gradient(135deg, #667eea, #764ba2); }
    .av-1 { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .av-2 { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    .av-3 { background: linear-gradient(135deg, #43e97b, #38f9d7); }
    .av-4 { background: linear-gradient(135deg, #fa709a, #fee140); }
    .av-5 { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }

    .student-name { font-size: .875rem; font-weight: 700; color: var(--dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .student-code { font-size: .7rem; color: var(--light); font-family: monospace; }

    .attendance-stats { display: flex; gap: .5rem; flex-shrink: 0; }
    .stat-item { display: flex; flex-direction: column; align-items: center; min-width: 32px; }
    .stat-item .val { font-size: .875rem; font-weight: 800; }
    .stat-item .lbl { font-size: .6rem; color: var(--light); }
    .absent-days .val  { color: #ef4444; }
    .present-days .val { color: #10b981; }
    .total-days .val   { color: var(--mid); }

    .pct-ring {
      width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 800;
      border: 3px solid #e5e7eb;
      &.excellent { border-color: #10b981; color: #10b981; }
      &.good      { border-color: #f59e0b; color: #f59e0b; }
      &.poor      { border-color: #ef4444; color: #ef4444; }
    }
  `],
})
export class AbsenceReportComponent implements OnInit {
  private readonly router             = inject(Router);
  private readonly attendanceSvc      = inject(AttendanceService);
  private readonly teacherSvc         = inject(TeacherService);
  private readonly secretaryTeacherSvc = inject(SecretaryTeacherService);
  private readonly groupSvc           = inject(GroupService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);
  private readonly academySvc         = inject(AcademyService);
  private readonly restSvc            = inject(RestService);

  teacherId        = signal<string | null>(null);
  isSecretary      = signal(false);
  courses          = signal<CourseOption[]>([]);
  academyCourses   = signal<CourseOption[]>([]);
  useAcademy       = signal(false);
  activeCourses    = computed(() => this.useAcademy() ? this.academyCourses() : this.courses());
  groups           = signal<GroupWithSchedulesDto[]>([]);
  selectedCourseId = signal<string>('');
  selectedGroupId  = signal<string>('');
  selectedPeriod   = signal<Period>('today');
  records          = signal<StudentAttendanceReportDto[]>([]);
  loading          = signal(false);
  error            = signal<string | null>(null);
  hasLoaded        = signal(false);

  periods = [
    { value: 'today'        as Period, label: 'اليوم' },
    { value: 'current-week' as Period, label: 'الأسبوع الحالي' },
    { value: 'week'         as Period, label: 'الأسبوع الماضي' },
    { value: 'month'        as Period, label: 'الشهر الماضي' },
    { value: 'quarter'      as Period, label: 'ربع سنة' },
    { value: '6months'      as Period, label: '٦ أشهر' },
  ];

  // Computed
  displayedRecords = computed(() => {
    const recs = [...this.records()].sort((a, b) => b.absentDays - a.absentDays);
    return recs;
  });

  totalStudents = computed(() => this.displayedRecords().length);
  avgAbsent     = computed(() => {
    const r = this.displayedRecords();
    return r.length ? (r.reduce((s, x) => s + x.absentDays, 0) / r.length).toFixed(1) : '0';
  });
  atRiskCount   = computed(() => this.displayedRecords().filter(r => r.attendancePercentage < 75).length);
  goodCount     = computed(() => this.displayedRecords().filter(r => r.attendancePercentage >= 90).length);

  periodLabel = computed(() => this.periods.find(p => p.value === this.selectedPeriod())?.label ?? '');

  selectedCourseName = computed(() => {
    const c = this.activeCourses().find(c => c.id === this.selectedCourseId());
    return c ? (c.nameAr || c.nameEn) : '';
  });

  selectedGroupName = computed(() => {
    const g = this.groups().find(g => g.groupId === this.selectedGroupId());
    return g ? g.name ?? '' : '';
  });

  async ngOnInit(): Promise<void> {
    await this.loadTeacherCourses();
  }

  onSwitchToAcademy(): void {
    this.useAcademy.set(true);
    this.selectedCourseId.set('');
    this.selectedGroupId.set('');
    this.groups.set([]);
    this.records.set([]);
    this.hasLoaded.set(false);
  }

  private async loadTeacherCourses(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      const id = userInfo?.actorId;
      const roles: string[] = userInfo?.userRoles ?? [];
      const secretary = roles.some(r => r.toUpperCase() === 'SECRETARY');
      this.isSecretary.set(secretary);

      if (secretary) {
        // Secretary: aggregate courses from all linked teachers
        const linkedTeachers: any[] = await lastValueFrom(
          this.secretaryTeacherSvc.getTeachersForCurrentSecretary()
        ).catch(() => []);

        const allCourses: CourseOption[] = [];
        for (const t of linkedTeachers) {
          const tid = t.teacherId ?? t.id;
          if (!tid) continue;
          const res: any[] = await lastValueFrom(
            this.teacherSvc.getTeacherCourses(tid)
          ).catch(() => []);
          for (const c of res || []) {
            if (!allCourses.find(x => x.id === c.id)) {
              allCourses.push({
                id: c.id,
                nameAr: c.nameAr || '',
                nameEn: c.nameEn || c.name || '',
                gradeName: c.gradeName || '',
              });
            }
          }
        }
        // Keep first teacher id for group loading fallback
        if (linkedTeachers.length > 0) {
          this.teacherId.set(linkedTeachers[0].teacherId ?? linkedTeachers[0].id ?? null);
        }
        this.courses.set(allCourses);
      } else {
        // Teacher
        if (!id) return;
        this.teacherId.set(id);
        const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(id));
        const mapped: CourseOption[] = (res || []).map(c => ({
          id: c.id,
          nameAr: c.nameAr || '',
          nameEn: c.nameEn || c.name || '',
          gradeName: c.gradeName || '',
        }));
        this.courses.set(mapped);
        if (mapped.length === 1) this.selectedCourseId.set(mapped[0].id);

        // Also load academy courses for teacher
        await this.loadAcademyCourses();
      }
    } catch { /* ignore */ }
  }

  private async loadAcademyCourses(): Promise<void> {
    try {
      // Check if teacher owns or belongs to an academy
      const ownAcademy = await lastValueFrom(
        this.restSvc.request<any, any>(
          { method: 'GET', url: '/api/sesha/academies/my-academy' },
          { apiName: 'Default', skipHandleError: true }
        )
      ).catch(() => null);

      if (ownAcademy?.id) {
        const acadCourses: any[] = await lastValueFrom(
          this.academySvc.getAcademyCourses(ownAcademy.id)
        ).catch(() => []);
        const mapped: CourseOption[] = (acadCourses || []).map(c => ({
          id: c.courseId ?? c.id,
          nameAr: c.courseNameAr || c.nameAr || '',
          nameEn: c.courseNameEn || c.nameEn || '',
          gradeName: c.gradeName || '',
          isAcademy: true,
          academyName: ownAcademy.nameAr || ownAcademy.nameEn || '',
        }));
        this.academyCourses.set(mapped);
        return;
      }

      // Teacher is a member — try to get membership academy
      const membership = await lastValueFrom(
        this.academySvc.getMyMembership(undefined, { skipHandleError: true })
      ).catch(() => null);

      if (membership?.academyId) {
        const acadCourses: any[] = await lastValueFrom(
          this.academySvc.getAcademyCourses(membership.academyId)
        ).catch(() => []);
        const academyName = membership.academyNameAr || membership.academyNameEn || '';
        const mapped: CourseOption[] = (acadCourses || []).map(c => ({
          id: c.courseId ?? c.id,
          nameAr: c.courseNameAr || c.nameAr || '',
          nameEn: c.courseNameEn || c.nameEn || '',
          gradeName: c.gradeName || '',
          isAcademy: true,
          academyName,
        }));
        this.academyCourses.set(mapped);
      }
    } catch { /* silent */ }
  }

  async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId);
    this.selectedGroupId.set('');
    this.groups.set([]);
    this.records.set([]);
    this.hasLoaded.set(false);
    if (courseId) await this.loadGroups(courseId);
  }

  private async loadGroups(courseId: string): Promise<void> {
    const tid = this.teacherId();
    if (!tid) return;
    try {
      const res = await lastValueFrom(this.groupSvc.getGroupsForTeacherAndCourse(tid, courseId));
      this.groups.set(res || []);
    } catch { this.groups.set([]); }
  }

  onGroupChange(groupId: string): void {
    this.selectedGroupId.set(groupId);
  }

  onPeriodChange(p: Period): void {
    this.selectedPeriod.set(p);
    this.records.set([]);
    this.hasLoaded.set(false);
  }

  async loadReport(): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId) return;

    this.loading.set(true);
    this.error.set(null);
    this.hasLoaded.set(false);

    try {
      const months = this.getMonthsForPeriod(this.selectedPeriod());
      const allMonthData: StudentAttendanceReportDto[][] = await Promise.all(
        months.map(d =>
          lastValueFrom(
            this.attendanceSvc.getStudentAttendanceReport({
              courseId,
              date: d.toISOString(),
              skipCount: 0,
              maxResultCount: 500,
            })
          ).then(r => r?.items || []).catch(() => [] as StudentAttendanceReportDto[])
        )
      );
      this.records.set(this.aggregateRecords(allMonthData));
      this.hasLoaded.set(true);
    } catch (err: any) {
      this.error.set(err?.message || 'حدث خطأ أثناء تحميل تقرير الغياب');
    } finally {
      this.loading.set(false);
    }
  }

  /** Returns the 1st-of-month Date objects to query for the selected period */
  private getMonthsForPeriod(period: Period): Date[] {
    const now = new Date();
    const months: Date[] = [];
    switch (period) {
      case 'today':
        months.push(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'current-week':
        months.push(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'week':
        months.push(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        break;
      case 'month':
        months.push(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        break;
      case 'quarter':
        for (let i = 2; i >= 0; i--)
          months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
        break;
      case '6months':
        for (let i = 5; i >= 0; i--)
          months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
        break;
    }
    return months;
  }

  /** Merge multi-month records per student by summing days */
  private aggregateRecords(all: StudentAttendanceReportDto[][]): StudentAttendanceReportDto[] {
    const map = new Map<string, StudentAttendanceReportDto>();
    for (const month of all) {
      for (const r of month) {
        const key = r.studentId ?? r.studentCode ?? '';
        if (!key) continue;
        if (map.has(key)) {
          const ex = map.get(key)!;
          ex.totalDaysInMonth  += r.totalDaysInMonth;
          ex.attendedDays      += r.attendedDays;
          ex.absentDays        += r.absentDays;
          ex.attendancePercentage = ex.totalDaysInMonth > 0
            ? Math.round((ex.attendedDays / ex.totalDaysInMonth) * 100) : 0;
        } else {
          map.set(key, { ...r });
        }
      }
    }
    return Array.from(map.values());
  }

  rateClass(pct: number): string {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'good';
    return 'poor';
  }

  goBack(): void {
    this.router.navigate(['/teacher']);
  }
}
