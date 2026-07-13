import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { AttendanceService } from '@proxy/attendances';
import { MyTodaySessionDto, StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { AttendanceStatus } from '@proxy/enums';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-student-my-attendance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <app-page-header
        [title]="'سجل الحضور'"
        [titleEn]="'Attendance Record'"></app-page-header>

      <!-- ── Summary block ── -->
      @if (todaySessions().length > 0) {
        <div class="today-block">
          <div class="today-head">
            <i class="fas fa-calendar-check"></i>
            <span>حصص اليوم · Today's sessions</span>
          </div>

          @for (s of todaySessions(); track s.groupSessionId) {
            <div class="today-card">
              <div class="today-info">
                <span class="today-course">{{ s.courseNameAr || s.courseNameEn }}</span>
                <span class="today-meta">
                  <i class="fas fa-users"></i> {{ s.groupName }}
                  <span class="dot">·</span>
                  <i class="fas fa-clock"></i> {{ formatTime(s.startTime) }} - {{ formatTime(s.endTime) }}
                </span>
              </div>

              @if (s.isSelfReported) {
                <span class="today-chip chip-pending">
                  <i class="fas fa-hourglass-half"></i> بانتظار تأكيد المعلم
                </span>
              } @else if (s.status === AttendanceStatus.Present) {
                <span class="today-chip chip-present"><i class="fas fa-check"></i> حاضر</span>
              } @else if (s.status === AttendanceStatus.Absent) {
                <span class="today-chip chip-absent"><i class="fas fa-xmark"></i> غائب</span>
              } @else if (s.status === AttendanceStatus.Excused) {
                <span class="today-chip chip-excused"><i class="fas fa-notes-medical"></i> بعذر</span>
              } @else if (s.canSelfCheckIn) {
                <ion-button size="small" class="checkin-btn"
                            (click)="selfCheckIn(s)" [disabled]="checkingIn() === s.groupSessionId">
                  @if (checkingIn() === s.groupSessionId) {
                    <ion-spinner name="crescent"></ion-spinner>
                  } @else {
                    <i class="fas fa-hand" style="margin-inline-end:.3rem"></i> أنا حاضر
                  }
                </ion-button>
              }
            </div>
          }

          @if (checkInMessage()) {
            <p class="today-msg" [class.today-msg--err]="checkInError()">{{ checkInMessage() }}</p>
          }
        </div>
      }

      @if (!loading() && reports().length > 0) {
        <div class="summary-block">
          <div class="blob b1"></div>
          <div class="blob b2"></div>

          <div class="summary-top">
            <div class="period-chip">
              <i class="fas fa-calendar-day"></i>
              <span>{{ periodLabel() }}</span>
            </div>
            <!-- Overall circular progress -->
            <div class="avg-circle">
              <svg viewBox="0 0 44 44" class="circle-svg">
                <circle cx="22" cy="22" r="18" class="circle-bg"/>
                <circle cx="22" cy="22" r="18" class="circle-fill"
                        [style.stroke-dasharray]="overallCircle() + ' 113'"
                        [style.stroke]="overallColor()"/>
              </svg>
              <div class="circle-inner">
                <span class="circle-val">{{ overallPct() | number:'1.0-0' }}<small>%</small></span>
              </div>
            </div>
          </div>

          <div class="header-stats">
            <div class="hstat">
              <span class="hstat-val">{{ totalDays() }}</span>
              <span class="hstat-lbl">أيام حتى اليوم</span>
            </div>
            <div class="hstat-sep"></div>
            <div class="hstat">
              <span class="hstat-val" style="color:#16a34a">{{ totalPresent() }}</span>
              <span class="hstat-lbl">حضور</span>
            </div>
            <div class="hstat-sep"></div>
            <div class="hstat">
              <span class="hstat-val" style="color:#dc2626">{{ totalAbsent() }}</span>
              <span class="hstat-lbl">غياب</span>
            </div>
            <div class="hstat-sep"></div>
            <div class="hstat">
              <span class="hstat-val">{{ reports().length }}</span>
              <span class="hstat-lbl">مقرر</span>
            </div>
          </div>
        </div>
      }

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && reports().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-calendar-check"></i></div>
          <h3>لا توجد بيانات حضور</h3>
          <p>سيظهر هنا سجل حضورك في المقررات</p>
          <span>Your attendance record will appear here</span>
        </div>
      }

      <!-- ── Course cards ── -->
      @if (!loading() && reports().length > 0) {
        <div class="section-title-bar">
          <i class="fas fa-book-open"></i>
          تفاصيل الحضور بالمقرر · Per-Course Breakdown
        </div>

        <div class="cards-grid">
          @for (r of reports(); track r.courseId) {
            <div class="course-card" [class]="cardClass(r)">

              <!-- Card header -->
              <div class="card-header">
                <div class="course-info">
                  <span class="course-name">{{ r.courseNameAr || r.courseNameEn }}</span>
                  @if (r.courseCode) {
                    <span class="course-code">{{ r.courseCode }}</span>
                  }
                </div>
                <div class="pct-badge" [class]="badgeClass(r)">
                  {{ r.attendancePercentage | number:'1.0-0' }}%
                </div>
              </div>

              <!-- Progress bar -->
              <div class="prog-wrap">
                <div class="prog-track">
                  <div class="prog-fill" [class]="fillClass(r)"
                       [style.width.%]="r.attendancePercentage"></div>
                </div>
              </div>

              <!-- Stats row -->
              <div class="card-stats">
                <div class="cstat present">
                  <i class="fas fa-check-circle"></i>
                  <span>{{ r.attendedDays }} حضور</span>
                </div>
                <div class="cstat absent">
                  <i class="fas fa-times-circle"></i>
                  <span>{{ r.absentDays }} غياب</span>
                </div>
                <div class="cstat total">
                  <i class="fas fa-calendar"></i>
                  <span>{{ r.totalDaysInMonth }} إجمالي</span>
                </div>
              </div>

              <!-- Status label -->
              <div class="status-label" [class]="statusClass(r)">
                <i [class]="statusIcon(r)"></i>
                {{ statusText(r) }}
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

    .period-chip {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.35rem .7rem;
      background:rgba(102,126,234,.1); border-radius:999px;
      font-size:.74rem; font-weight:600; color:#667eea;
    }
    .period-chip i { font-size:.72rem; opacity:.85; }

    /* Circular progress */
    .avg-circle { position:relative; width:72px; height:72px; flex-shrink:0; }
    .circle-svg { position:absolute; inset:0; transform:rotate(-90deg); }
    .circle-bg   { fill:none; stroke:#eef0f6; stroke-width:3.5; }
    .circle-fill { fill:none; stroke-width:3.5; stroke-linecap:round;
                   transition:stroke-dasharray .6s ease; }
    .circle-inner {
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
    }
    .circle-val { font-size:1.05rem; font-weight:800; color:#1a1a2e; line-height:1; }
    .circle-val small { font-size:.6rem; font-weight:600; }

    /* Stats */
    .header-stats {
      position:relative; z-index:1;
      display:flex; align-items:center; justify-content:space-around;
      margin-top:1.1rem; background:#f6f7fb;
      border-radius:14px; padding:.75rem .5rem;
    }
    .hstat { display:flex; flex-direction:column; align-items:center; gap:.1rem; }
    .hstat-val { font-size:1.05rem; font-weight:800; color:#1a1a2e; }
    .hstat-lbl { font-size:.65rem; color:#9090aa; }
    .hstat-sep { width:1px; height:28px; background:#e6e8f0; }

    /* ── Section title bar ── */
    .section-title-bar {
      display:flex; align-items:center; gap:.5rem;
      padding:.875rem 1rem .5rem;
      font-size:.78rem; font-weight:700; color:#555;
      text-transform:uppercase; letter-spacing:.05em;
    }
    .section-title-bar i { color:#667eea; font-size:.82rem; }

    /* ── Cards grid ── */
    .cards-grid {
      padding:0 1rem;
      display:flex; flex-direction:column; gap:.625rem;
    }

    .course-card {
      background:#fff; border-radius:16px;
      border-right:4px solid transparent;
      border-top:1.5px solid #f0f0f0;
      border-bottom:1.5px solid #f0f0f0;
      border-left:1.5px solid #f0f0f0;
      padding:1rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .course-card.card-great  { border-right-color:#22c55e; }
    .course-card.card-good   { border-right-color:#f59e0b; }
    .course-card.card-danger { border-right-color:#ef4444; }

    /* Card header */
    .card-header {
      display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem;
      margin-bottom:.75rem;
    }
    .course-info { flex:1; min-width:0; }
    .course-name {
      display:block; font-size:.95rem; font-weight:700; color:#1a1a2e;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .course-code { font-size:.7rem; color:#9090aa; display:block; margin-top:.1rem; }

    .pct-badge {
      font-size:.82rem; font-weight:800; padding:.25rem .65rem;
      border-radius:20px; flex-shrink:0;
    }
    .badge-great  { background:rgba(34,197,94,.12);  color:#16a34a; }
    .badge-good   { background:rgba(245,158,11,.12); color:#d97706; }
    .badge-danger { background:rgba(239,68,68,.1);   color:#dc2626; }

    /* Progress */
    .prog-wrap { margin-bottom:.75rem; }
    .prog-track {
      height:7px; background:#f0f0f5; border-radius:4px; overflow:hidden;
    }
    .prog-fill { height:100%; border-radius:4px; transition:width .5s ease; }
    .fill-great  { background:linear-gradient(90deg,#22c55e,#16a34a); }
    .fill-good   { background:linear-gradient(90deg,#f59e0b,#d97706); }
    .fill-danger { background:linear-gradient(90deg,#ef4444,#dc2626); }

    /* Card stats */
    .card-stats {
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:.625rem;
    }
    .cstat { display:flex; align-items:center; gap:.3rem; font-size:.75rem; font-weight:600; }
    .cstat.present i { color:#22c55e; }
    .cstat.absent  i { color:#ef4444; }
    .cstat.total   i { color:#9090aa; }
    .cstat.present { color:#16a34a; }
    .cstat.absent  { color:#dc2626; }
    .cstat.total   { color:#9090aa; }

    /* Status label */
    .status-label {
      display:inline-flex; align-items:center; gap:.35rem;
      font-size:.72rem; font-weight:700;
      padding:.2rem .6rem; border-radius:20px;
    }
    .sl-great  { background:rgba(34,197,94,.1);  color:#16a34a; }
    .sl-good   { background:rgba(245,158,11,.1); color:#d97706; }
    .sl-danger { background:rgba(239,68,68,.1);  color:#dc2626; }

    /* ── Shimmer ── */
    .shimmer-area { padding:.875rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }
    .shimmer-card {
      height:136px; border-radius:16px;
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
      font-size:2rem; color:#667eea; margin-bottom:1.25rem;
    }
    .empty-state h3 { font-size:1.1rem; font-weight:700; color:#1a1a2e; margin:0 0 .4rem; }
    .empty-state p   { font-size:.88rem; color:#555; margin:0 0 .2rem; }
    .empty-state span{ font-size:.78rem; color:#9090aa; }

    /* ── Today's sessions / self check-in ── */
    .today-block {
      background:#fff; border-radius:16px; padding:.9rem;
      margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,.05);
      border:1px solid #eef0f6;
    }
    .today-head {
      display:flex; align-items:center; gap:.45rem;
      font-size:.85rem; font-weight:700; color:#4c1d95; margin-bottom:.6rem;
    }
    .today-card {
      display:flex; align-items:center; justify-content:space-between; gap:.6rem;
      padding:.6rem .5rem; border-radius:12px; background:#faf9ff;
      border:1px solid #f0edff;
    }
    .today-card + .today-card { margin-top:.5rem; }
    .today-info { display:flex; flex-direction:column; gap:.2rem; min-width:0; }
    .today-course { font-size:.9rem; font-weight:700; color:#1a1a2e; }
    .today-meta { font-size:.72rem; color:#6b7280; display:flex; align-items:center; gap:.3rem; flex-wrap:wrap; }
    .today-meta .dot { opacity:.5; }

    .today-chip {
      display:inline-flex; align-items:center; gap:.3rem; white-space:nowrap;
      font-size:.72rem; font-weight:700; padding:.35rem .6rem; border-radius:999px;
    }
    .chip-pending  { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }
    .chip-present  { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
    .chip-absent   { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
    .chip-excused  { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }

    /* 44px min tap target */
    ion-button.checkin-btn {
      --background:linear-gradient(135deg,#667eea,#764ba2);
      --color:#fff; --border-radius:12px;
      min-height:44px; font-weight:700; margin:0;
    }

    .today-msg { margin:.6rem 0 0; font-size:.78rem; color:#047857; text-align:center; }
    .today-msg--err { color:#b91c1c; }
  `],
})
export class StudentMyAttendanceComponent implements OnInit {
  private readonly attendanceSvc  = inject(AttendanceService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);

  // Exposed so the template can compare against the enum rather than magic numbers.
  protected readonly AttendanceStatus = AttendanceStatus;

  loading = signal(true);
  reports = signal<StudentAttendanceReportDto[]>([]);

  todaySessions = signal<MyTodaySessionDto[]>([]);
  checkingIn = signal<string | null>(null);
  checkInMessage = signal<string | null>(null);
  checkInError = signal(false);

  // The report covers the current month up to today (server caps the day count at today).
  periodLabel = computed(() => {
    const now = new Date();
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return `${months[now.getMonth()]} ${now.getFullYear()} · حتى اليوم ${now.getDate()}`;
  });

  totalDays    = computed(() => this.reports().reduce((s, r) => s + r.totalDaysInMonth, 0));
  totalPresent = computed(() => this.reports().reduce((s, r) => s + r.attendedDays, 0));
  totalAbsent  = computed(() => this.reports().reduce((s, r) => s + r.absentDays, 0));

  overallPct = computed(() => {
    const days = this.totalDays();
    return days > 0 ? (this.totalPresent() / days) * 100 : 0;
  });

  overallCircle = computed(() => (this.overallPct() / 100) * 113);

  overallColor = computed(() => {
    const p = this.overallPct();
    if (p >= 90) return '#22c55e';
    if (p >= 75) return '#f59e0b';
    return '#ef4444';
  });

  async ngOnInit(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      if (!info?.actorId) return;
      const result = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceReport({
          studentId: info.actorId,
          date: new Date().toISOString(),
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      this.reports.set(result.items ?? []);
    } catch (e) {
      console.error('Error loading attendance', e);
    } finally {
      this.loading.set(false);
    }

    await this.loadTodaySessions();
  }

  /** Sessions only exist once a teacher opens attendance, so this is often empty. */
  private async loadTodaySessions(): Promise<void> {
    try {
      const sessions = await lastValueFrom(this.attendanceSvc.getMyTodaySessions());
      this.todaySessions.set(sessions ?? []);
    } catch (e) {
      console.error('Error loading today sessions', e);
      this.todaySessions.set([]);
    }
  }

  async selfCheckIn(session: MyTodaySessionDto): Promise<void> {
    this.checkingIn.set(session.groupSessionId);
    this.checkInMessage.set(null);
    try {
      await lastValueFrom(
        this.attendanceSvc.selfCheckIn({ groupSessionId: session.groupSessionId } as any),
      );
      await this.loadTodaySessions();
      this.checkInError.set(false);
      this.checkInMessage.set('تم إرسال طلب الحضور — بانتظار تأكيد المعلم');
    } catch (e: any) {
      this.checkInError.set(true);
      this.checkInMessage.set(e?.error?.error?.message || 'تعذر تسجيل الحضور');
    } finally {
      this.checkingIn.set(null);
    }
  }

  /** "09:30:00" → "09:30" */
  formatTime(value?: string): string {
    if (!value) return '';
    return value.slice(0, 5);
  }

  private level(r: StudentAttendanceReportDto): string {
    const p = r.attendancePercentage;
    if (p >= 90) return 'great';
    if (p >= 75) return 'good';
    return 'danger';
  }

  cardClass(r: StudentAttendanceReportDto)  { return `course-card card-${this.level(r)}`; }
  badgeClass(r: StudentAttendanceReportDto) { return `pct-badge badge-${this.level(r)}`; }
  fillClass(r: StudentAttendanceReportDto)  { return `prog-fill fill-${this.level(r)}`; }
  statusClass(r: StudentAttendanceReportDto){ return `status-label sl-${this.level(r)}`; }

  statusText(r: StudentAttendanceReportDto): string {
    const p = r.attendancePercentage;
    if (p >= 90) return 'حضور ممتاز';
    if (p >= 75) return 'حضور جيد';
    return 'يحتاج تحسين';
  }

  statusIcon(r: StudentAttendanceReportDto): string {
    const p = r.attendancePercentage;
    if (p >= 90) return 'fas fa-star';
    if (p >= 75) return 'fas fa-thumbs-up';
    return 'fas fa-exclamation-triangle';
  }
}
