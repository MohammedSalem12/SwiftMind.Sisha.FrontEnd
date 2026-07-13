import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../shared/components/page-header.component';
import { ToastService } from '../shared/toast.service';

interface FeeCourse {
  courseId: string;
  name: string;
}

interface FeeGroup {
  groupId: string;
  name: string;
  courseId: string;
}

interface FilterOptions {
  courses: FeeCourse[];
  groups: FeeGroup[];
}

interface FeeStudent {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  photoUrl?: string;
  courseId: string;
  courseName: string;
  groupId?: string;
  groupName: string;
  year: number;
  wholeCoursePaid: boolean;
  paidMonths: number[];
}

interface MonthLabel {
  num: number;
  short: string;
  full: string;
}

@Component({
  selector: 'app-fees',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <app-page-header [title]="'رسوم الطلاب'" [titleEn]="'Student Fees'" [showBack]="true"></app-page-header>

      <!-- Filters -->
      <div class="filters">
        <div class="field">
          <label>المقرر · Course</label>
          <div class="select-wrap">
            <select [ngModel]="selectedCourseId()" (ngModelChange)="onCourseChange($event)">
              <option [ngValue]="''">كل المقررات · All courses</option>
              @for (c of courses(); track c.courseId) {
                <option [ngValue]="c.courseId">{{ c.name }}</option>
              }
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>

        <div class="field">
          <label>المجموعة · Group</label>
          <div class="select-wrap">
            <select [ngModel]="selectedGroupId()" (ngModelChange)="onGroupChange($event)">
              <option [ngValue]="''">كل المجموعات · All groups</option>
              @for (g of visibleGroups(); track g.groupId) {
                <option [ngValue]="g.groupId">{{ g.name }}</option>
              }
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>

        <div class="field field-year">
          <label>السنة · Year</label>
          <div class="select-wrap">
            <select [ngModel]="selectedYear()" (ngModelChange)="onYearChange($event)">
              @for (y of yearOptions(); track y) {
                <option [ngValue]="y">{{ y }}</option>
              }
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="list">
          @for (i of [1,2,3,4]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- Error -->
      @if (!loading() && error()) {
        <div class="empty-box">
          <i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadStudents()">
            <i class="fas fa-redo"></i> إعادة المحاولة · Retry
          </button>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && !error() && students().length === 0) {
        <div class="empty-box">
          <i class="fas fa-user-slash"></i>
          <p>لا يوجد طلاب</p>
          <span>No students</span>
        </div>
      }

      <!-- List -->
      @if (!loading() && !error() && students().length > 0) {
        <div class="list">
          @for (s of students(); track s.enrollmentId) {
            <div class="student-card" [class.paid-full]="s.wholeCoursePaid">
              <!-- Header row -->
              <div class="s-head">
                <div class="s-avatar">
                  @if (s.photoUrl) {
                    <img [src]="s.photoUrl" alt="" />
                  } @else {
                    <span>{{ initials(s.studentName) }}</span>
                  }
                </div>
                <div class="s-info">
                  <span class="s-name">{{ s.studentName }}</span>
                  <div class="s-meta">
                    <span class="s-code">{{ s.studentCode }}</span>
                    @if (s.groupName) {
                      <span class="s-group"><i class="fas fa-layer-group"></i> {{ s.groupName }}</span>
                    }
                  </div>
                </div>
                @if (s.wholeCoursePaid) {
                  <span class="paid-badge"><i class="fas fa-check-circle"></i> مدفوع بالكامل</span>
                }
              </div>

              <!-- Whole course toggle -->
              <button
                class="whole-toggle"
                [class.on]="s.wholeCoursePaid"
                [disabled]="isBusy(wholeKey(s))"
                (click)="toggleWholeCourse(s)">
                <span class="wt-check"><i class="fas" [class.fa-check]="s.wholeCoursePaid" [class.fa-money-bill-wave]="!s.wholeCoursePaid"></i></span>
                <span class="wt-text">
                  <span class="wt-ar">كل رسوم المقرر مدفوعة</span>
                  <span class="wt-en">Whole course paid</span>
                </span>
                @if (isBusy(wholeKey(s))) {
                  <span class="wt-spin"><i class="fas fa-spinner fa-spin"></i></span>
                }
              </button>

              <!-- Months grid -->
              <div class="months" [class.dim]="s.wholeCoursePaid">
                @for (m of months; track m.num) {
                  <button
                    class="month-cell"
                    [class.paid]="isMonthPaid(s, m.num)"
                    [class.covered]="s.wholeCoursePaid"
                    [disabled]="s.wholeCoursePaid || isBusy(monthKey(s, m.num))"
                    [attr.aria-label]="m.full"
                    (click)="toggleMonth(s, m.num)">
                    @if (isBusy(monthKey(s, m.num))) {
                      <i class="fas fa-spinner fa-spin mc-spin"></i>
                    } @else if (isMonthPaid(s, m.num) || s.wholeCoursePaid) {
                      <i class="fas fa-check mc-tick"></i>
                    }
                    <span class="mc-label">{{ m.short }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* Filters */
    .filters {
      display:flex; flex-wrap:wrap; gap:.6rem; padding:.85rem 1rem 0;
    }
    .field { flex:1 1 45%; min-width:140px; display:flex; flex-direction:column; gap:.3rem; }
    .field-year { flex:1 1 100%; }
    .field label {
      font-size:.72rem; font-weight:700; color:#6b7280;
      text-transform:uppercase; letter-spacing:.03em;
    }
    .select-wrap { position:relative; display:flex; align-items:center; }
    .select-wrap select {
      width:100%; box-sizing:border-box; appearance:none; -webkit-appearance:none;
      padding:.7rem 2.2rem .7rem .8rem; min-height:44px;
      border:1.5px solid #e0e0f0; border-radius:14px; background:#fff;
      font-size:16px; font-family:inherit; color:#1a1a2e; font-weight:600;
    }
    .select-wrap select:focus { outline:none; border-color:#667eea; box-shadow:0 0 0 3px rgba(102,126,234,.1); }
    .select-wrap i {
      position:absolute; left:.85rem; color:#9090aa; font-size:.75rem; pointer-events:none;
    }

    /* List */
    .list { padding:1rem; display:flex; flex-direction:column; gap:.85rem; }
    .shimmer-card {
      height:180px; border-radius:18px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Student card */
    .student-card {
      background:#fff; border:1.5px solid #f0f0f0; border-radius:18px;
      box-shadow:0 2px 12px rgba(0,0,0,.05); padding:.9rem;
      display:flex; flex-direction:column; gap:.75rem;
    }
    .student-card.paid-full { border-color:rgba(16,185,129,.4); background:linear-gradient(180deg,#fff,#f4fdf9); }

    .s-head { display:flex; align-items:center; gap:.75rem; }
    .s-avatar {
      width:48px; height:48px; border-radius:50%; flex-shrink:0; overflow:hidden;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1rem; font-weight:800;
    }
    .s-avatar img { width:100%; height:100%; object-fit:cover; }
    .s-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:.2rem; }
    .s-name { font-size:.98rem; font-weight:800; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .s-meta { display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; }
    .s-code { font-size:.72rem; font-weight:700; color:#667eea; background:rgba(102,126,234,.08); padding:.1rem .45rem; border-radius:8px; }
    .s-group {
      font-size:.7rem; font-weight:600; color:#6b7280;
      display:inline-flex; align-items:center; gap:.25rem;
    }
    .s-group i { font-size:.62rem; color:#9090aa; }
    .paid-badge {
      flex-shrink:0; font-size:.66rem; font-weight:800; color:#059669;
      background:rgba(16,185,129,.12); padding:.25rem .5rem; border-radius:10px;
      display:inline-flex; align-items:center; gap:.25rem;
    }

    /* Whole-course toggle */
    .whole-toggle {
      display:flex; align-items:center; gap:.65rem; width:100%; text-align:right;
      min-height:52px; padding:.6rem .7rem; border-radius:14px; cursor:pointer;
      border:1.5px solid #e5e7eb; background:#fafafe;
      -webkit-tap-highlight-color:transparent; transition:background .15s, border-color .15s;
    }
    .whole-toggle:active { transform:scale(.99); }
    .whole-toggle:disabled { opacity:.6; cursor:default; }
    .whole-toggle.on { border-color:transparent; background:linear-gradient(135deg,#10b981,#059669); }
    .wt-check {
      width:34px; height:34px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      background:rgba(102,126,234,.1); color:#667eea; font-size:.9rem;
    }
    .whole-toggle.on .wt-check { background:rgba(255,255,255,.25); color:#fff; }
    .wt-text { flex:1; min-width:0; display:flex; flex-direction:column; }
    .wt-ar { font-size:.85rem; font-weight:800; color:#1a1a2e; }
    .wt-en { font-size:.66rem; font-weight:500; color:#9090aa; }
    .whole-toggle.on .wt-ar, .whole-toggle.on .wt-en { color:#fff; }
    .whole-toggle.on .wt-en { color:rgba(255,255,255,.8); }
    .wt-spin { color:#fff; font-size:.9rem; }

    /* Months grid */
    .months {
      display:grid; grid-template-columns:repeat(4, 1fr); gap:.4rem;
      transition:opacity .2s;
    }
    .months.dim { opacity:.65; }
    .month-cell {
      position:relative; min-height:44px; border-radius:12px; cursor:pointer;
      border:1.5px solid #e5e7eb; background:#fff; color:#6b7280;
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
      -webkit-tap-highlight-color:transparent; transition:background .15s, border-color .15s, color .15s;
      padding:.2rem;
    }
    .month-cell:active:not(:disabled) { transform:scale(.96); }
    .month-cell:disabled { cursor:default; }
    .month-cell.paid, .month-cell.covered {
      background:linear-gradient(135deg,#10b981,#059669); border-color:transparent; color:#fff;
    }
    .month-cell.covered { background:linear-gradient(135deg,#34d399,#10b981); }
    .mc-tick { font-size:.7rem; }
    .mc-spin { font-size:.75rem; }
    .mc-label { font-size:.68rem; font-weight:700; }

    /* Empty / error */
    .empty-box {
      margin:1.5rem 1rem; text-align:center; padding:2.5rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2.2rem; color:#c4c4d4; display:block; margin-bottom:.6rem; }
    .empty-box p { font-size:.95rem; font-weight:700; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.78rem; color:#9090aa; }
    .retry-btn {
      margin-top:.9rem; display:inline-flex; align-items:center; gap:.4rem;
      min-height:44px; padding:.5rem 1.1rem; border-radius:14px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:700; font-size:.82rem;
      -webkit-tap-highlight-color:transparent;
    }
  `],
})
export class FeesComponent implements OnInit {
  private readonly rest  = inject(RestService);
  private readonly toast = inject(ToastService);

  readonly months: MonthLabel[] = [
    { num: 1,  short: 'ينا', full: 'يناير · January' },
    { num: 2,  short: 'فبر', full: 'فبراير · February' },
    { num: 3,  short: 'مار', full: 'مارس · March' },
    { num: 4,  short: 'أبر', full: 'أبريل · April' },
    { num: 5,  short: 'ماي', full: 'مايو · May' },
    { num: 6,  short: 'يون', full: 'يونيو · June' },
    { num: 7,  short: 'يول', full: 'يوليو · July' },
    { num: 8,  short: 'أغس', full: 'أغسطس · August' },
    { num: 9,  short: 'سبت', full: 'سبتمبر · September' },
    { num: 10, short: 'أكت', full: 'أكتوبر · October' },
    { num: 11, short: 'نوف', full: 'نوفمبر · November' },
    { num: 12, short: 'ديس', full: 'ديسمبر · December' },
  ];

  loading  = signal(true);
  error    = signal<string | null>(null);
  students = signal<FeeStudent[]>([]);

  courses = signal<FeeCourse[]>([]);
  groups  = signal<FeeGroup[]>([]);

  selectedCourseId = signal<string>('');
  selectedGroupId  = signal<string>('');
  selectedYear     = signal<number>(new Date().getFullYear());

  private readonly busyKeys = signal<Set<string>>(new Set());

  yearOptions = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1];
  });

  // Groups filtered to the selected course (or all when no course chosen).
  visibleGroups = computed(() => {
    const cid = this.selectedCourseId();
    const all = this.groups();
    return cid ? all.filter(g => g.courseId === cid) : all;
  });

  async ngOnInit(): Promise<void> {
    await this.loadFilterOptions();
    await this.loadStudents();
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const opts = await lastValueFrom(
        this.rest.request<void, FilterOptions>({
          method: 'GET',
          url: '/api/sesha/fees/filter-options',
        })
      );
      this.courses.set(opts?.courses ?? []);
      this.groups.set(opts?.groups ?? []);
    } catch (e) {
      console.error('[Fees] filter options error:', e);
      // Non-fatal — the student list can still load unfiltered.
    }
  }

  async loadStudents(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const params: Record<string, string | number> = { Year: this.selectedYear() };
      if (this.selectedCourseId()) params['CourseId'] = this.selectedCourseId();
      if (this.selectedGroupId()) params['GroupId'] = this.selectedGroupId();

      const result = await lastValueFrom(
        this.rest.request<void, FeeStudent[]>({
          method: 'GET',
          url: '/api/sesha/fees/students',
          params,
        })
      );
      this.students.set((result ?? []).map(s => ({ ...s, paidMonths: s.paidMonths ?? [] })));
    } catch (e) {
      console.error('[Fees] load students error:', e);
      this.error.set('حدث خطأ أثناء تحميل الطلاب · Error loading students');
      this.students.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onCourseChange(courseId: string): void {
    this.selectedCourseId.set(courseId || '');
    // Reset a group that no longer belongs to the chosen course.
    const gid = this.selectedGroupId();
    if (gid && !this.visibleGroups().some(g => g.groupId === gid)) {
      this.selectedGroupId.set('');
    }
    this.loadStudents();
  }

  onGroupChange(groupId: string): void {
    this.selectedGroupId.set(groupId || '');
    this.loadStudents();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(Number(year));
    this.loadStudents();
  }

  // ── Month toggle ───────────────────────────────────────────────────────────
  isMonthPaid(s: FeeStudent, month: number): boolean {
    return s.paidMonths.includes(month);
  }

  async toggleMonth(s: FeeStudent, month: number): Promise<void> {
    if (s.wholeCoursePaid) return;
    const key = this.monthKey(s, month);
    if (this.isBusy(key)) return;

    const currentlyPaid = this.isMonthPaid(s, month);
    const nextPaid = !currentlyPaid;

    // Optimistic update
    this.patchStudent(s.enrollmentId, st => ({
      ...st,
      paidMonths: nextPaid
        ? [...st.paidMonths, month].sort((a, b) => a - b)
        : st.paidMonths.filter(m => m !== month),
    }));
    this.setBusy(key, true);

    try {
      await lastValueFrom(
        this.rest.request<any, void>({
          method: 'POST',
          url: '/api/sesha/fees/mark-month',
          body: { enrollmentId: s.enrollmentId, year: s.year, month, isPaid: nextPaid },
        })
      );
    } catch (e) {
      console.error('[Fees] mark-month error:', e);
      // Revert
      this.patchStudent(s.enrollmentId, st => ({
        ...st,
        paidMonths: currentlyPaid
          ? [...st.paidMonths, month].sort((a, b) => a - b)
          : st.paidMonths.filter(m => m !== month),
      }));
      this.toast.show('تعذّر تحديث الشهر · Failed to update month', 'error');
    } finally {
      this.setBusy(key, false);
    }
  }

  // ── Whole-course toggle ──────────────────────────────────────────────────────
  async toggleWholeCourse(s: FeeStudent): Promise<void> {
    const key = this.wholeKey(s);
    if (this.isBusy(key)) return;

    const nextPaid = !s.wholeCoursePaid;

    // Optimistic update
    this.patchStudent(s.enrollmentId, st => ({ ...st, wholeCoursePaid: nextPaid }));
    this.setBusy(key, true);

    try {
      await lastValueFrom(
        this.rest.request<any, void>({
          method: 'POST',
          url: '/api/sesha/fees/mark-whole-course',
          body: { enrollmentId: s.enrollmentId, isPaid: nextPaid },
        })
      );
    } catch (e) {
      console.error('[Fees] mark-whole-course error:', e);
      // Revert
      this.patchStudent(s.enrollmentId, st => ({ ...st, wholeCoursePaid: !nextPaid }));
      this.toast.show('تعذّر تحديث حالة الرسوم · Failed to update fees', 'error');
    } finally {
      this.setBusy(key, false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private patchStudent(enrollmentId: string, fn: (s: FeeStudent) => FeeStudent): void {
    this.students.update(list =>
      list.map(s => (s.enrollmentId === enrollmentId ? fn(s) : s))
    );
  }

  monthKey(s: FeeStudent, month: number): string {
    return `${s.enrollmentId}:m:${month}`;
  }

  wholeKey(s: FeeStudent): string {
    return `${s.enrollmentId}:whole`;
  }

  isBusy(key: string): boolean {
    return this.busyKeys().has(key);
  }

  private setBusy(key: string, busy: boolean): void {
    this.busyKeys.update(set => {
      const next = new Set(set);
      if (busy) next.add(key); else next.delete(key);
      return next;
    });
  }

  initials(name: string): string {
    return (name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
