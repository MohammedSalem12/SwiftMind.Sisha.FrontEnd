import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { ExamGradeService } from '@proxy/exam-grades';
import { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-student-my-grades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <app-page-header
        [title]="'درجاتي'"
        [titleEn]="'My Grades'"></app-page-header>

      <!-- ── Summary block ── -->
      @if (!loading() && grades().length > 0) {
        <div class="summary-block">
          <div class="blob b1"></div>
          <div class="blob b2"></div>

          <div class="summary-top">
            <div class="summary-heading">
              <span class="summary-label">المعدل العام</span>
              <span class="summary-sub">Overall Average</span>
            </div>
            <div class="avg-circle" [class]="avgCircleClass()">
              <svg viewBox="0 0 44 44" class="circle-svg">
                <circle cx="22" cy="22" r="18" class="circle-bg"/>
                <circle cx="22" cy="22" r="18" class="circle-fill"
                        [style.stroke-dasharray]="circleProgress() + ' 113'"
                        [style.stroke]="avgColor()"/>
              </svg>
              <div class="circle-inner">
                <span class="circle-val">{{ avg() | number:'1.0-0' }}<small>%</small></span>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="header-stats">
            <div class="hstat">
              <span class="hstat-val">{{ grades().length }}</span>
              <span class="hstat-lbl">اختبار</span>
            </div>
            <div class="hstat-sep"></div>
            <div class="hstat">
              <span class="hstat-val" style="color:#16a34a">{{ highest() | number:'1.0-0' }}%</span>
              <span class="hstat-lbl">أعلى</span>
            </div>
            <div class="hstat-sep"></div>
            <div class="hstat">
              <span class="hstat-val" style="color:#dc2626">{{ lowest() | number:'1.0-0' }}%</span>
              <span class="hstat-lbl">أدنى</span>
            </div>
            <div class="hstat-sep"></div>
            <div class="hstat">
              <span class="hstat-val">{{ courses().length }}</span>
              <span class="hstat-lbl">مقرر</span>
            </div>
          </div>
        </div>
      }

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-tabs">
            @for (i of [1,2,3]; track i) { <div class="shimmer-tab"></div> }
          </div>
          @for (i of [1,2,3,4]; track i) {
            <div class="shimmer-card"></div>
          }
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && grades().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <h3>لا توجد درجات بعد</h3>
          <p>ستظهر هنا درجات اختباراتك</p>
          <span>Your exam grades will appear here</span>
        </div>
      }

      @if (!loading() && grades().length > 0) {

        <!-- ── Course filter tabs ── -->
        <div class="course-tabs-wrap">
          <div class="course-tabs">
            <button class="course-tab" [class.active]="activeCourse() === null"
                    (click)="activeCourse.set(null)">
              <span>الكل</span>
              <span class="tab-count">{{ grades().length }}</span>
            </button>
            @for (c of courses(); track c) {
              <button class="course-tab" [class.active]="activeCourse() === c"
                      (click)="activeCourse.set(c)">
                <span>{{ c }}</span>
                <span class="tab-count">{{ gradesByCourse(c).length }}</span>
              </button>
            }
          </div>
        </div>

        <!-- ── Grade cards ── -->
        <div class="grades-list">
          @for (g of filteredGrades(); track g.id) {
            <div class="grade-card" [class]="cardClass(g)">

              <!-- Left: course + exam info -->
              <div class="grade-left">
                <div class="course-pill">{{ g.courseName || 'مقرر' }}</div>
                <div class="exam-name">{{ g.examName || 'اختبار' }}</div>
                @if (g.examCode) {
                  <div class="exam-code">{{ g.examCode }}</div>
                }
                @if (g.date) {
                  <div class="exam-date">
                    <i class="fas fa-calendar-alt"></i>
                    {{ formatDate(g.date) }}
                  </div>
                }
              </div>

              <!-- Right: score -->
              <div class="grade-right">
                <div class="score-fraction">
                  <span class="score-num">{{ g.grade }}</span>
                  <span class="score-sep">/</span>
                  <span class="score-max">{{ g.maxGrade }}</span>
                </div>
                <div class="score-bar-wrap">
                  <div class="score-bar">
                    <div class="score-fill" [style.width.%]="pct(g)" [class]="barClass(g)"></div>
                  </div>
                  <span class="score-pct" [class]="pctClass(g)">{{ pct(g) | number:'1.0-0' }}%</span>
                </div>
                <div class="grade-badge" [class]="badgeClass(g)">
                  {{ gradeLabel(g) }}
                </div>
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

    /* ── Summary block ── */
    .summary-block {
      background:#fff;
      margin:.75rem 1rem 0; border-radius:18px;
      padding:1.1rem 1.25rem 1.25rem;
      position:relative; overflow:hidden;
      border:1.5px solid #eef0f6;
      box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .blob { display:none; }

    .summary-top {
      position:relative; z-index:1;
      display:flex; align-items:center; justify-content:space-between; gap:1rem;
    }
    .summary-heading { display:flex; flex-direction:column; gap:.15rem; }
    .summary-label { font-size:1rem; font-weight:800; color:#1a1a2e; }
    .summary-sub   { font-size:.72rem; color:#9090aa; }

    /* Circular progress */
    .avg-circle {
      position:relative; width:72px; height:72px; flex-shrink:0;
    }
    .circle-svg { position:absolute; inset:0; transform:rotate(-90deg); }
    .circle-bg   { fill:none; stroke:#eef0f6; stroke-width:3.5; }
    .circle-fill { fill:none; stroke-width:3.5; stroke-linecap:round;
                   transition:stroke-dasharray .6s ease; }
    .circle-inner {
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
    }
    .circle-val {
      font-size:1.05rem; font-weight:800; color:#1a1a2e; line-height:1;
    }
    .circle-val small { font-size:.6rem; font-weight:600; }

    /* Stats */
    .header-stats {
      position:relative; z-index:1;
      display:flex; align-items:center; justify-content:space-around;
      margin-top:1.1rem;
      background:#f6f7fb;
      border-radius:14px; padding:.75rem .5rem;
    }
    .hstat { display:flex; flex-direction:column; align-items:center; gap:.1rem; }
    .hstat-val { font-size:1.05rem; font-weight:800; color:#1a1a2e; }
    .hstat-lbl { font-size:.65rem; color:#9090aa; }
    .hstat-sep { width:1px; height:28px; background:#e6e8f0; }

    /* ── Course filter tabs ── */
    .course-tabs-wrap {
      overflow-x:auto; -webkit-overflow-scrolling:touch;
      padding:.875rem 1rem .25rem;
    }
    .course-tabs { display:flex; gap:.5rem; width:max-content; min-width:100%; }
    .course-tab {
      display:flex; align-items:center; gap:.4rem;
      padding:.5rem .875rem; border-radius:20px;
      background:#fff; border:1.5px solid #e9ecef;
      font-size:.8rem; font-weight:600; color:#555;
      cursor:pointer; white-space:nowrap;
      transition:all .15s;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .course-tab.active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      border-color:transparent; color:#fff;
      box-shadow:0 4px 12px rgba(102,126,234,.3);
    }
    .tab-count {
      background:rgba(0,0,0,.08); border-radius:20px;
      padding:.05rem .4rem; font-size:.68rem; font-weight:700;
    }
    .course-tab.active .tab-count { background:rgba(255,255,255,.25); }

    /* ── Grade cards ── */
    .grades-list {
      padding:.75rem 1rem 0;
      display:flex; flex-direction:column; gap:.625rem;
    }

    .grade-card {
      background:#fff; border-radius:16px;
      border-right:4px solid transparent;
      border-top:1.5px solid #f0f0f0;
      border-bottom:1.5px solid #f0f0f0;
      border-left:1.5px solid #f0f0f0;
      padding:.875rem;
      display:flex; align-items:flex-start; justify-content:space-between; gap:.75rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .grade-card.excellent  { border-right-color:#22c55e; }
    .grade-card.very-good  { border-right-color:#3b82f6; }
    .grade-card.good       { border-right-color:#f59e0b; }
    .grade-card.pass       { border-right-color:#f97316; }
    .grade-card.fail       { border-right-color:#ef4444; }

    /* Left */
    .grade-left { flex:1; min-width:0; display:flex; flex-direction:column; gap:.3rem; }

    .course-pill {
      display:inline-block; width:fit-content;
      background:rgba(102,126,234,.1); color:#667eea;
      font-size:.65rem; font-weight:700;
      padding:.12rem .5rem; border-radius:20px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;
    }
    .exam-name {
      font-size:.92rem; font-weight:700; color:#1a1a2e;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .exam-code {
      font-size:.7rem; color:#9090aa;
    }
    .exam-date {
      display:flex; align-items:center; gap:.3rem;
      font-size:.72rem; color:#9090aa;
    }
    .exam-date i { font-size:.65rem; }

    /* Right */
    .grade-right {
      display:flex; flex-direction:column; align-items:flex-end;
      gap:.4rem; flex-shrink:0; min-width:90px;
    }
    .score-fraction {
      display:flex; align-items:baseline; gap:.15rem;
    }
    .score-num { font-size:1.3rem; font-weight:800; color:#1a1a2e; line-height:1; }
    .score-sep { font-size:.9rem; color:#c4c4d4; }
    .score-max { font-size:.8rem; color:#9090aa; }

    .score-bar-wrap {
      display:flex; align-items:center; gap:.4rem; width:100%;
    }
    .score-bar {
      flex:1; height:5px; background:#f0f0f5; border-radius:3px; overflow:hidden;
    }
    .score-fill {
      height:100%; border-radius:3px;
      transition:width .5s ease;
    }
    .fill-excellent { background:#22c55e; }
    .fill-very-good { background:#3b82f6; }
    .fill-good      { background:#f59e0b; }
    .fill-pass      { background:#f97316; }
    .fill-fail      { background:#ef4444; }

    .score-pct { font-size:.72rem; font-weight:700; white-space:nowrap; }
    .pct-excellent { color:#16a34a; }
    .pct-very-good { color:#2563eb; }
    .pct-good      { color:#d97706; }
    .pct-pass      { color:#ea580c; }
    .pct-fail      { color:#dc2626; }

    .grade-badge {
      font-size:.68rem; font-weight:700;
      padding:.18rem .55rem; border-radius:20px;
    }
    .badge-excellent { background:rgba(34,197,94,.12);  color:#16a34a; }
    .badge-very-good { background:rgba(59,130,246,.12); color:#2563eb; }
    .badge-good      { background:rgba(245,158,11,.12); color:#d97706; }
    .badge-pass      { background:rgba(249,115,22,.12); color:#ea580c; }
    .badge-fail      { background:rgba(239,68,68,.1);   color:#dc2626; }

    /* ── Shimmer ── */
    .shimmer-area { padding:.875rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }
    .shimmer-tabs { display:flex; gap:.5rem; margin-bottom:.25rem; }
    .shimmer-tab {
      width:80px; height:34px; border-radius:20px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    .shimmer-card {
      height:90px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Empty ── */
    .empty-state {
      display:flex; flex-direction:column; align-items:center;
      padding:4rem 1.5rem; text-align:center;
    }
    .empty-icon {
      width:80px; height:80px; border-radius:50%;
      background:rgba(102,126,234,.1);
      display:flex; align-items:center; justify-content:center;
      font-size:2rem; color:#667eea;
      margin-bottom:1.25rem;
    }
    .empty-state h3 { font-size:1.1rem; font-weight:700; color:#1a1a2e; margin:0 0 .4rem; }
    .empty-state p   { font-size:.88rem; color:#555; margin:0 0 .2rem; }
    .empty-state span{ font-size:.78rem; color:#9090aa; }
  `],
})
export class StudentMyGradesComponent implements OnInit {
  private readonly examGradeSvc   = inject(ExamGradeService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);

  loading      = signal(true);
  grades       = signal<ExamGradeDto[]>([]);
  activeCourse = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  courses = computed(() =>
    [...new Set(this.grades().map(g => g.courseName).filter(Boolean))] as string[]
  );

  filteredGrades = computed(() => {
    const c = this.activeCourse();
    return c ? this.grades().filter(g => g.courseName === c) : this.grades();
  });

  avg = computed(() => {
    const g = this.grades();
    if (!g.length) return 0;
    return g.reduce((s, x) => s + this.pct(x), 0) / g.length;
  });

  highest = computed(() => {
    const g = this.grades();
    return g.length ? Math.max(...g.map(x => this.pct(x))) : 0;
  });

  lowest = computed(() => {
    const g = this.grades();
    return g.length ? Math.min(...g.map(x => this.pct(x))) : 0;
  });

  circleProgress = computed(() => {
    // circumference = 2π×18 ≈ 113.1
    return (this.avg() / 100) * 113;
  });

  avgColor = computed(() => {
    const a = this.avg();
    if (a >= 90) return '#22c55e';
    if (a >= 75) return '#3b82f6';
    if (a >= 60) return '#f59e0b';
    if (a >= 50) return '#f97316';
    return '#ef4444';
  });

  avgCircleClass = computed(() => 'avg-circle');

  // ── Init ──────────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      const studentId = info?.actorId;
      if (!studentId) return;

      const result = await lastValueFrom(
        this.examGradeSvc.getGradesByStudent(studentId, { skipCount: 0, maxResultCount: 200 })
      );
      // Sort newest first
      const sorted = (result.items ?? []).sort((a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
      );
      this.grades.set(sorted);
    } catch (e) {
      console.error('Error loading grades', e);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  pct(g: ExamGradeDto): number {
    if (!g.maxGrade) return 0;
    return Math.min(100, (g.grade / g.maxGrade) * 100);
  }

  gradesByCourse(course: string): ExamGradeDto[] {
    return this.grades().filter(g => g.courseName === course);
  }

  private level(g: ExamGradeDto): string {
    const p = this.pct(g);
    if (p >= 90) return 'excellent';
    if (p >= 75) return 'very-good';
    if (p >= 60) return 'good';
    if (p >= 50) return 'pass';
    return 'fail';
  }

  cardClass(g: ExamGradeDto): string   { return `grade-card ${this.level(g)}`; }
  barClass(g: ExamGradeDto): string    { return `score-fill fill-${this.level(g)}`; }
  pctClass(g: ExamGradeDto): string    { return `score-pct pct-${this.level(g)}`; }
  badgeClass(g: ExamGradeDto): string  { return `grade-badge badge-${this.level(g)}`; }

  gradeLabel(g: ExamGradeDto): string {
    const p = this.pct(g);
    if (p >= 90) return 'ممتاز';
    if (p >= 75) return 'جيد جداً';
    if (p >= 60) return 'جيد';
    if (p >= 50) return 'مقبول';
    return 'راسب';
  }

  formatDate(d?: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  }
}
