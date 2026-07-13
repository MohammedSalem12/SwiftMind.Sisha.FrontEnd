import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AttendanceService } from '@proxy/attendances';
import { AttendanceStatus } from '@proxy/enums';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import { AcademyService } from '@proxy/academies';
import type { AcademyDto } from '@proxy/academies/models';
import type { GroupScheduleDto } from '@proxy/groups/dtos/models';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { lastValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface StudentEntry {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  teacherStudentCode: string;
  studentName: string;
  photoUrl: string;
  status: AttendanceStatus;
  /** Convenience mirror of status ∈ {Absent, Excused}; the roster UI is still absence-oriented. */
  isAbsent: boolean;
  /** Student marked themselves present and no staff member has confirmed it yet. */
  isSelfReported: boolean;
  attendanceId: string | null;
  selected: boolean;
}

interface GroupOption {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  schedules: GroupScheduleDto[];
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonicModule, PageHeaderComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit {
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly courseSvc = inject(CourseService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly groupSvc = inject(GroupService);
  private readonly academySvc = inject(AcademyService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // Role state
  isTeacher = signal(false);
  teacherId = signal<string | null>(null);

  // ── Attendance marking mode (per-session) ──
  // 'absentees' (Mode A): all present by default, mark the absentees (existing behavior)
  // 'attendees' (Mode B): all unmarked, mark attendees via tap/search/QR; finalize → rest become absent
  attendanceMode = signal<'absentees' | 'attendees'>('absentees');
  markedPresent = signal<Set<string>>(new Set());
  attSearch = signal('');
  scanning = signal(false);
  qrSupported = signal(Capacitor.isNativePlatform() || typeof (globalThis as any).BarcodeDetector !== 'undefined');
  markedCount = computed(() => this.markedPresent().size);

  // List search — filter the roster by name, external (StudentCode) or internal
  // (TeacherStudentCode) code. Works in both attendance modes.
  listSearch = signal('');
  filteredStudents = computed(() => {
    const q = this.listSearch().trim().toLowerCase();
    const list = this.students();
    if (!q) return list;
    return list.filter(s =>
      (s.studentName || '').toLowerCase().includes(q) ||
      (s.studentCode || '').toLowerCase().includes(q) ||
      (s.teacherStudentCode || '').toLowerCase().includes(q));
  });
  private scanFillsSearch = false;

  private scanStream: MediaStream | null = null;
  private scanRAF = 0;
  private lastScanValue = '';
  private lastScanAt = 0;

  // Locked mode: when arriving with ?courseId= the dropdown becomes a read-only label
  lockedCourseId = signal<string | null>(null);

  // Academy context (when arriving with ?academyId=)
  academy = signal<AcademyDto | null>(null);

  // Course
  courses = signal<any[]>([]);
  selectedCourseId = signal<string | null>(null);
  selectedCourseName = signal<string>('');

  // Group (before date — user picks group first, then dates from schedule)
  groups = signal<GroupOption[]>([]);
  selectedGroupId = signal<string | null>(null);
  effectiveTeacherId = signal<string | null>(null);

  // Attendance is session-based: nothing can be marked until the session for this group+date
  // exists and its roster has been materialised. Null means "not started yet".
  sessionId = signal<string | null>(null);
  startingSession = signal(false);
  pendingSelfCheckIns = signal(0);
  sessionStarted = computed(() => this.sessionId() !== null);

  // The currently selected group, and whether it still has no schedule set.
  // Attendance is schedule-driven, so a group with no schedule must be set up first.
  selectedGroup = computed(() => this.groups().find(g => g.id === this.selectedGroupId()) ?? null);
  selectedGroupHasNoSchedule = computed(() => {
    const g = this.selectedGroup();
    return !!g && (g.schedules?.length ?? 0) === 0;
  });

  // Schedule dates (computed from selected group's schedule)
  scheduleDates = signal<{ date: string; label: string }[]>([]);
  weekOffset = signal(0);
  weekLabel = signal('');

  // Date (default today)
  attendanceDate = signal<string>(new Date().toISOString().slice(0, 10));

  // Students
  students = signal<StudentEntry[]>([]);

  // UI
  loading = signal(false);
  saving = signal(false);
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error'>('success');
  showStats = signal(false);

  // Paging
  page = signal(1);
  readonly pageSize = 20;
  totalStudentCount = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalStudentCount() / this.pageSize)));

  // Computed stats
  presentCount = computed(() => this.students().filter(s => !s.isAbsent).length);
  absentCount = computed(() => this.students().filter(s => s.isAbsent).length);
  selectedCount = computed(() => this.students().filter(s => s.selected).length);
  allSelected = computed(
    () => this.students().length > 0 && this.students().every(s => s.selected)
  );

  // Pie chart data (SVG donut, circumference = 2π×40 ≈ 251.33)
  readonly C = 251.33;
  pieChart = computed(() => {
    const total = this.students().length;
    const present = this.presentCount();
    const absent = this.absentCount();
    if (total === 0) return { presentDash: `0 ${this.C}`, absentDash: `0 ${this.C}`, absentOffset: 0, presentPct: 0, absentPct: 0 };
    const pLen = (present / total) * this.C;
    const aLen = (absent / total) * this.C;
    return {
      presentDash: `${pLen} ${this.C}`,
      absentDash: `${aLen} ${this.C}`,
      absentOffset: -pLen,
      presentPct: Math.round((present / total) * 100),
      absentPct: Math.round((absent / total) * 100),
    };
  });

  async ngOnInit(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      const actorType = userInfo?.actorType;
      const actorId = userInfo?.actorId;

      const qpCourseId  = this.route.snapshot.queryParamMap.get('courseId');
      const qpTeacherId = this.route.snapshot.queryParamMap.get('teacherId');
      const qpAcademyId = this.route.snapshot.queryParamMap.get('academyId');

      if (actorType === 'Teacher' && actorId) {
        this.isTeacher.set(true);
        this.teacherId.set(actorId);
        this.effectiveTeacherId.set(actorId);
        await this.loadTeacherCourses(actorId);
      } else if (qpTeacherId) {
        this.isTeacher.set(false);
        this.teacherId.set(qpTeacherId);
        this.effectiveTeacherId.set(qpTeacherId);
        await this.loadTeacherCourses(qpTeacherId);
      } else {
        this.isTeacher.set(false);
        await this.loadAllCourses();
      }

      // If academy course: fetch academy + inject course into list if missing
      if (qpAcademyId && qpCourseId) {
        await this.enrichLockedAcademyCourse(qpCourseId, qpAcademyId);
      }

      // Auto-select and lock course
      if (qpCourseId && this.courses().some(c => c.id === qpCourseId)) {
        this.lockedCourseId.set(qpCourseId);
        await this.onCourseChange(qpCourseId);
      }
    } catch (e) {
      console.error('Failed to initialize attendance component:', e);
    }
  }

  private async enrichLockedAcademyCourse(courseId: string, academyId: string): Promise<void> {
    try {
      const [academy, courseFromApi] = await Promise.all([
        lastValueFrom(this.academySvc.get(academyId)).catch(() => null),
        this.courses().some(c => c.id === courseId)
          ? Promise.resolve(null)
          : lastValueFrom(this.courseSvc.get(courseId)).catch(() => null),
      ]);
      if (academy) this.academy.set(academy);
      const academyName = academy?.nameAr || academy?.nameEn || '';
      if (courseFromApi) {
        // Not in list — add it tagged with academy info
        this.courses.update(list => [...list, { ...courseFromApi, academyId, academyName }]);
      } else {
        // Already in list — just tag it
        this.courses.update(list =>
          list.map(c => c.id === courseId ? { ...c, academyId, academyName } : c)
        );
      }
    } catch (e) {
      console.error('Failed to enrich academy course', e);
    }
  }

  private async loadTeacherCourses(teacherId: string): Promise<void> {
    this.loading.set(true);
    try {
      const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(teacherId));
      this.courses.set(res || []);
    } catch (e) {
      console.error('Failed to load teacher courses', e);
      this.courses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAllCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const res: any = await lastValueFrom(
        this.courseSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any)
      );
      this.courses.set(res?.items || []);
    } catch (e) {
      console.error('Failed to load all courses', e);
      this.courses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId || null);
    this.selectedGroupId.set(null);
    this.groups.set([]);
    this.students.set([]);
    this.message.set(null);
    this.page.set(1);

    const course = this.courses().find(c => c.id === courseId);
    this.selectedCourseName.set(course ? (course.nameAr || course.nameEn || '') : '');

    if (!courseId) return;

    this.effectiveTeacherId.set(this.teacherId());

    await this.loadGroups(courseId);
    // Don't load students yet — wait for group selection
  }

  private async loadGroups(courseId: string): Promise<void> {
    try {
      if (this.teacherId()) {
        // Teacher (own courses) or Secretary (specific teacher's courses)
        const res: any[] = await lastValueFrom(
          this.groupSvc.getGroupsByCourseAndTeacher(courseId, this.teacherId()!)
        );
        this.groups.set(
          (res || []).map(g => ({
            id: g.groupId || g.id,
            name: g.name || '',
            teacherId: g.teacherId || '',
            teacherName: g.teacherName || '',
            schedules: g.schedules || [],
          }))
        );
      } else {
        // Admin without specific teacher context: load all groups and filter
        const res: any = await lastValueFrom(this.groupSvc.getList());
        const allGroups: any[] = res?.items || [];
        this.groups.set(
          allGroups
            .filter(g => g.courseId === courseId)
            .map(g => ({
              id: g.id || g.groupId,
              name: g.name || '',
              teacherId: g.teacherId || '',
              teacherName: g.teacherName || '',
              schedules: g.schedules || [],
            }))
        );
      }
    } catch (e) {
      console.error('Failed to load groups', e);
      this.groups.set([]);
    }
  }

  async onGroupChange(groupId: string): Promise<void> {
    this.selectedGroupId.set(groupId || null);
    this.students.set([]);
    this.message.set(null);
    this.page.set(1);
    this.weekOffset.set(0);

    if (groupId) {
      const group = this.groups().find(g => g.id === groupId);
      this.effectiveTeacherId.set(group?.teacherId || this.teacherId());
      // Compute schedule dates from group's schedule
      this.computeScheduleDates(group?.schedules || []);
    } else {
      this.effectiveTeacherId.set(this.teacherId());
      this.scheduleDates.set([]);
      this.weekLabel.set('');
    }

    await this.loadStudents();
  }

  /** Navigate to set up the selected group's weekly schedule, then return to take attendance. */
  goSetSchedule(): void {
    const gid = this.selectedGroupId();
    if (gid) this.router.navigate(['/teacher-groups/add-schedule', gid]);
  }

  private _currentSchedules: GroupScheduleDto[] = [];

  private computeScheduleDates(schedules?: GroupScheduleDto[]): void {
    if (schedules) this._currentSchedules = schedules;
    const sched = this._currentSchedules;
    if (sched.length === 0) {
      this.scheduleDates.set([]);
      this.weekLabel.set('');
      return;
    }

    const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const scheduleDays = sched.map(s => s.dayOfWeek); // 0=Sunday .. 6=Saturday

    const dates: { date: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find start of target week (Saturday as first day for Arabic calendar)
    const todayDow = today.getDay(); // 0=Sun
    const satOffset = todayDow === 6 ? 0 : -(todayDow + 1); // offset to previous Saturday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + satOffset + (this.weekOffset() * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Week label
    this.weekLabel.set(
      `${weekStart.getDate()}/${weekStart.getMonth() + 1} — ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
    );

    // Generate only this week's schedule days (Sat–Fri = 7 days)
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const jsDow = d.getDay();
      if (scheduleDays.includes(jsDow)) {
        const iso = d.toISOString().slice(0, 10);
        const dayName = ARABIC_DAYS[jsDow];
        const label = `${dayName} ${d.getDate()}/${d.getMonth() + 1}`;
        dates.push({ date: iso, label });
      }
    }

    this.scheduleDates.set(dates);

    // Auto-select today if it's a schedule day, otherwise pick the most recent past schedule date
    const todayIso = today.toISOString().slice(0, 10);
    if (dates.some(d => d.date === todayIso)) {
      this.attendanceDate.set(todayIso);
    } else {
      const pastDates = dates.filter(d => d.date <= todayIso);
      if (pastDates.length > 0) {
        this.attendanceDate.set(pastDates[pastDates.length - 1].date);
      } else if (dates.length > 0) {
        this.attendanceDate.set(dates[0].date);
      }
    }
  }

  prevWeek(): void {
    this.weekOffset.update(v => v - 1);
    this.computeScheduleDates();
  }

  nextWeek(): void {
    this.weekOffset.update(v => v + 1);
    this.computeScheduleDates();
  }

  goToCurrentWeek(): void {
    this.weekOffset.set(0);
    this.computeScheduleDates();
  }

  selectScheduleDate(date: string): void {
    this.attendanceDate.set(date);
    this.message.set(null);
    this.page.set(1);
    if (this.selectedCourseId()) {
      this.loadStudents();
    }
  }

  async onDateChange(date: string): Promise<void> {
    this.attendanceDate.set(date);
    this.message.set(null);
    this.page.set(1);
    if (this.selectedCourseId()) {
      await this.loadStudents();
    }
  }

  toggleStats(): void {
    this.showStats.update(v => !v);
  }

  async goToPage(p: number): Promise<void> {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    await this.loadStudents();
  }

  private async loadStudents(): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId) return;

    this.loading.set(true);
    this.students.set([]);

    try {
      const params: any = {
        courseId,
        date: this.attendanceDate(),
        skipCount: (this.page() - 1) * this.pageSize,
        maxResultCount: this.pageSize,
      };

      if (this.effectiveTeacherId()) {
        params.teacherId = this.effectiveTeacherId();
      }

      const response: any = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceStatus(params)
      );

      this.totalStudentCount.set(response?.totalCount ?? 0);

      const rawEntries: StudentEntry[] = (response?.items || []).map((item: any) => {
        const status: AttendanceStatus = item.status ?? AttendanceStatus.NotYet;
        return {
          enrollmentId: item.enrollmentId,
          studentId: item.studentId,
          studentCode: item.studentCode || '',
          teacherStudentCode: item.teacherStudentCode || '',
          studentName:
            item.fullName ||
            `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          photoUrl: item.photoUrl || '',
          status,
          isAbsent: status === AttendanceStatus.Absent || status === AttendanceStatus.Excused,
          isSelfReported: !!item.isSelfReported,
          attendanceId: item.attendanceId || null,
          selected: false,
        };
      });

      // Deduplicate by studentId — prefer the row that has been decided
      const seen = new Map<string, StudentEntry>();
      for (const entry of rawEntries) {
        const prev = seen.get(entry.studentId);
        const prevDecided = prev && prev.status !== AttendanceStatus.NotYet;
        const entryDecided = entry.status !== AttendanceStatus.NotYet;
        if (!prev || (!prevDecided && entryDecided)) {
          seen.set(entry.studentId, entry);
        }
      }
      this.students.set(Array.from(seen.values()));

      // The session exists once the roster has been materialised — any row with an attendanceId
      // proves it. Everything that mutates attendance needs this id.
      this.sessionId.set(
        (response?.items || []).find((i: any) => i.groupSessionId)?.groupSessionId ?? null,
      );
      this.pendingSelfCheckIns.set(
        this.students().filter(s => s.isSelfReported).length,
      );
    } catch (e) {
      console.error('Failed to load students:', e);
      this.students.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSelectAll(): void {
    const shouldSelect = !this.allSelected();
    this.students.update(list => list.map(s => ({ ...s, selected: shouldSelect })));
  }

  toggleSelect(index: number): void {
    this.students.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  }

  /**
   * Opens attendance for the selected group and date. Creates the session if it doesn't exist and
   * materialises the roster (every enrolled student at NotYet). Re-running reconciles the roster:
   * students who joined the group are added, students who left are removed, existing marks kept.
   */
  async startSession(): Promise<void> {
    const groupId = this.selectedGroupId();
    if (!groupId) {
      this.showMessage('اختر المجموعة أولاً · Select a group first', 'error');
      return;
    }

    this.startingSession.set(true);
    this.message.set(null);
    try {
      const session: any = await lastValueFrom(
        this.attendanceSvc.startSession(
          { groupId, date: new Date(this.attendanceDate()).toISOString() } as any,
          { skipHandleError: true },
        ),
      );

      await this.loadStudents();

      const parts = [`${session?.totalCount ?? 0} طالب`];
      if (session?.addedCount) parts.push(`أضيف ${session.addedCount}`);
      if (session?.removedCount) parts.push(`أزيل ${session.removedCount}`);
      this.showMessage(`تم بدء تسجيل الحضور — ${parts.join(' · ')}`, 'success');
    } catch (e: any) {
      const msg =
        e?.error?.error?.message ||
        'تعذر بدء الحصة — تأكد أن المجموعة لديها حصة مجدولة في هذا اليوم';
      this.showMessage(msg, 'error');
    } finally {
      this.startingSession.set(false);
    }
  }

  async markSelectedAbsent(): Promise<void> {
    const toMark = this.students().filter(s => s.selected && !s.isAbsent);
    if (toMark.length === 0) {
      this.showMessage('لا يوجد طلاب محددون غير مسجل غيابهم', 'error');
      return;
    }
    await this.bulkSetStatus(AttendanceStatus.Absent, toMark);
  }

  async markAllAbsent(): Promise<void> {
    await this.bulkSetStatus(AttendanceStatus.Absent);
  }

  async markAllPresent(): Promise<void> {
    await this.bulkSetStatus(AttendanceStatus.Present);
  }

  /** Sets a status for the whole roster, or just the given subset, in one request. */
  private async bulkSetStatus(status: AttendanceStatus, subset?: StudentEntry[]): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId) {
      this.showMessage('ابدأ تسجيل الحضور أولاً · Start attendance first', 'error');
      return;
    }

    this.saving.set(true);
    this.message.set(null);
    try {
      const changed: any = await lastValueFrom(
        this.attendanceSvc.bulkSetStatus(
          {
            groupSessionId: sessionId,
            status,
            enrollmentIds: subset?.map(s => s.enrollmentId) ?? [],
          } as any,
          { skipHandleError: true },
        ),
      );

      await this.loadStudents();

      const label = status === AttendanceStatus.Present ? 'حضور' : 'غياب';
      this.showMessage(`تم تسجيل ${label} ${changed ?? 0} طالب وإرسال الإشعارات`, 'success');
    } catch (e: any) {
      this.showMessage(e?.error?.error?.message || 'فشلت العملية، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  /** Cycles a single student between Present and Absent. */
  async toggleStudentAbsent(student: StudentEntry, index: number): Promise<void> {
    if (!student.attendanceId) {
      this.showMessage('ابدأ تسجيل الحضور أولاً · Start attendance first', 'error');
      return;
    }

    const next = student.isAbsent ? AttendanceStatus.Present : AttendanceStatus.Absent;
    await this.setStudentStatus(student, next);
  }

  async setStudentStatus(student: StudentEntry, status: AttendanceStatus): Promise<void> {
    if (!student.attendanceId) {
      this.showMessage('ابدأ تسجيل الحضور أولاً · Start attendance first', 'error');
      return;
    }

    this.saving.set(true);
    this.message.set(null);
    try {
      await lastValueFrom(
        this.attendanceSvc.setStatus(
          { attendanceId: student.attendanceId, status } as any,
          { skipHandleError: true },
        ),
      );

      await this.loadStudents();
      this.showMessage(this.statusMessage(status), 'success');
    } catch (e: any) {
      console.error('Set attendance status failed:', e);
      const msg = e?.error?.error?.message || 'فشلت العملية، يرجى المحاولة مرة أخرى';
      this.showMessage(msg, 'error');
    } finally {
      this.saving.set(false);
    }
  }

  private statusMessage(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.Present: return 'تم تسجيل الحضور وإرسال الإشعار';
      case AttendanceStatus.Absent: return 'تم تسجيل الغياب وإرسال الإشعار';
      case AttendanceStatus.Excused: return 'تم تسجيل الغياب بعذر';
      default: return 'تم التحديث';
    }
  }

  // ── Student self check-in review ────────────────────────────
  async confirmAllSelfCheckIns(): Promise<void> {
    await this.reviewSelfCheckIns(true);
  }

  async rejectAllSelfCheckIns(): Promise<void> {
    await this.reviewSelfCheckIns(false);
  }

  private async reviewSelfCheckIns(confirm: boolean): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId) return;

    this.saving.set(true);
    try {
      const count: any = await lastValueFrom(
        confirm
          ? this.attendanceSvc.confirmAllSelfReported(sessionId, { skipHandleError: true })
          : this.attendanceSvc.rejectAllSelfReported(sessionId, { skipHandleError: true }),
      );
      await this.loadStudents();
      this.showMessage(
        confirm
          ? `تم تأكيد حضور ${count ?? 0} طالب`
          : `تم رفض ${count ?? 0} طلب وتسجيلهم غائبين`,
        'success',
      );
    } catch (e: any) {
      this.showMessage(e?.error?.error?.message || 'فشلت العملية', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(null), 5000);
  }

  // ── Mode B: mark attendees ──────────────────────────────────
  setMode(mode: 'absentees' | 'attendees'): void {
    this.attendanceMode.set(mode);
    if (mode === 'attendees') {
      this.markedPresent.set(new Set());
    } else {
      this.stopScan();
    }
  }

  isPresent(enrollmentId: string): boolean {
    return this.markedPresent().has(enrollmentId);
  }

  togglePresent(s: StudentEntry): void {
    this.markedPresent.update(set => {
      const next = new Set(set);
      if (next.has(s.enrollmentId)) next.delete(s.enrollmentId);
      else next.add(s.enrollmentId);
      return next;
    });
  }

  markPresentByValue(value: string): void {
    const v = (value || '').trim().toLowerCase();
    if (!v) return;
    const match = this.students().find(s =>
      (s.studentCode || '').toLowerCase() === v ||
      (s.teacherStudentCode || '').toLowerCase() === v ||
      (s.studentName || '').toLowerCase() === v ||
      (s.studentId || '').toLowerCase() === v ||
      (s.enrollmentId || '').toLowerCase() === v);
    if (match) {
      this.markedPresent.update(set => new Set(set).add(match.enrollmentId));
      this.showMessage(`تم تعليم ${match.studentName} حاضراً · Present`, 'success');
      this.attSearch.set('');
    } else {
      this.showMessage(`لم يتم العثور على طالب بالكود: ${value}`, 'error');
    }
  }

  async startScan(): Promise<void> {
    // Native devices: use the ML Kit native scanner (full-screen, fast, works offline).
    if (Capacitor.isNativePlatform()) {
      await this.scanNative();
      return;
    }
    // Browser / WebView fallback: BarcodeDetector.
    if (!this.qrSupported()) {
      this.showMessage('مسح QR غير مدعوم على هذا الجهاز · QR scan not supported here', 'error');
      return;
    }
    try {
      this.scanning.set(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.scanStream = stream;
      // wait a tick for the video element to render
      setTimeout(async () => {
        const video = document.getElementById('att-scan-video') as HTMLVideoElement | null;
        if (!video) { this.stopScan(); return; }
        video.srcObject = stream;
        try { await video.play(); } catch { /* autoplay */ }
        const detector = new (globalThis as any).BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (!this.scanning()) return;
          try {
            const codes = await detector.detect(video);
            if (codes && codes.length) this.handleScan(String(codes[0].rawValue ?? ''));
          } catch { /* per-frame errors ignored */ }
          this.scanRAF = requestAnimationFrame(tick);
        };
        this.scanRAF = requestAnimationFrame(tick);
      }, 100);
    } catch (e) {
      console.error('scan start failed', e);
      this.showMessage('تعذّر فتح الكاميرا · Camera unavailable', 'error');
      this.stopScan();
    }
  }

  /** Native (Capacitor) QR scanning via ML Kit — scans repeatedly until cancelled. */
  private async scanNative(): Promise<void> {
    try {
      const perm = await BarcodeScanner.requestPermissions();
      if (perm.camera !== 'granted' && perm.camera !== 'limited') {
        this.showMessage('تم رفض إذن الكاميرا · Camera permission denied', 'error');
        return;
      }

      // Android: ensure Google's barcode module is installed (downloaded on demand).
      if (Capacitor.getPlatform() === 'android') {
        try {
          const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
          if (!available) {
            this.showMessage('جاري تجهيز الماسح... · Preparing scanner...', 'success');
            await BarcodeScanner.installGoogleBarcodeScannerModule();
          }
        } catch { /* best effort — scan() may still work */ }
      }

      // Scan repeatedly so the teacher can mark many students; cancel ends the loop.
      let keepScanning = true;
      while (keepScanning) {
        const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
        if (!barcodes || barcodes.length === 0) {
          keepScanning = false;
          break;
        }
        this.handleScan(barcodes[0].rawValue ?? '');
      }
    } catch (e) {
      console.error('native scan failed', e);
      this.showMessage('تعذّر فتح الماسح · Scanner unavailable', 'error');
    }
  }

  private extractCode(raw: string): string {
    let value = raw;
    try {
      const obj = JSON.parse(raw);
      value = obj.studentCode || obj.teacherStudentCode || obj.code || obj.studentId || obj.id || raw;
    } catch { /* plain string code */ }
    return String(value);
  }

  private handleScan(raw: string): void {
    if (!raw) return;
    const now = Date.now();
    // ignore the same code re-detected within 2.5s (continuous frames)
    if (raw === this.lastScanValue && now - this.lastScanAt < 2500) return;
    this.lastScanValue = raw;
    this.lastScanAt = now;
    const value = this.extractCode(raw);
    if (this.scanFillsSearch) {
      // QR search: drop the scanned code into the list filter to locate the student.
      this.scanFillsSearch = false;
      this.listSearch.set(value);
      this.stopScan();
    } else {
      // A scanned code is verified by the server against this session's roster, so a code
      // belonging to a student outside the group is rejected rather than silently ignored.
      void this.markPresentByScan(value);
    }
  }

  /**
   * Server-verified present. Unlike the typed search (which matches locally, including by name),
   * a scan resolves the code against the session roster and records who verified it.
   */
  async markPresentByScan(code: string): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId) {
      this.showMessage('ابدأ تسجيل الحضور أولاً · Start attendance first', 'error');
      return;
    }

    this.saving.set(true);
    try {
      const row: any = await lastValueFrom(
        this.attendanceSvc.scanQr({ groupSessionId: sessionId, code } as any, { skipHandleError: true }),
      );

      if (row?.enrollmentId) {
        this.markedPresent.update(set => new Set(set).add(row.enrollmentId));
      }
      await this.loadStudents();
      this.showMessage(`تم تسجيل حضور ${row?.fullName || code}`, 'success');
      this.attSearch.set('');
    } catch (e: any) {
      const msg =
        e?.error?.error?.message || `لم يتم العثور على طالب بهذا الكود في هذه الحصة: ${code}`;
      this.showMessage(msg, 'error');
    } finally {
      this.saving.set(false);
    }
  }

  /** Scan a QR code and place its value into the list search filter (find a student). */
  async scanToFilter(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await BarcodeScanner.requestPermissions();
        if (perm.camera !== 'granted' && perm.camera !== 'limited') {
          this.showMessage('تم رفض إذن الكاميرا · Camera permission denied', 'error');
          return;
        }
        const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
        if (barcodes && barcodes.length) {
          this.listSearch.set(this.extractCode(barcodes[0].rawValue ?? ''));
        }
      } catch {
        this.showMessage('تعذّر فتح الماسح · Scanner unavailable', 'error');
      }
      return;
    }
    // Browser/WebView: reuse the live-camera scanner but fill the search instead of marking.
    this.scanFillsSearch = true;
    this.startScan();
  }

  stopScan(): void {
    this.scanning.set(false);
    if (this.scanRAF) cancelAnimationFrame(this.scanRAF);
    this.scanRAF = 0;
    if (this.scanStream) {
      this.scanStream.getTracks().forEach(t => t.stop());
      this.scanStream = null;
    }
  }

  async finalizeAttendees(): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId) {
      this.showMessage('ابدأ تسجيل الحضور أولاً · Start attendance first', 'error');
      return;
    }

    const marked = this.markedPresent();
    const list = this.students();
    const toPresent = list.filter(s => marked.has(s.enrollmentId) && s.status !== AttendanceStatus.Present);
    const toAbsent = list.filter(s => !marked.has(s.enrollmentId) && s.status !== AttendanceStatus.Absent);

    if (toAbsent.length === 0 && toPresent.length === 0) {
      this.showMessage('لا تغييرات للحفظ · Nothing to save', 'error');
      return;
    }
    if (!confirm(`سيتم تعليم ${marked.size} حاضر و ${toAbsent.length} غائب. متابعة؟`)) return;

    this.stopScan();
    this.saving.set(true);
    this.message.set(null);
    try {
      // Two bulk calls rather than one request per student.
      if (toPresent.length > 0) {
        await lastValueFrom(this.attendanceSvc.bulkSetStatus({
          groupSessionId: sessionId,
          status: AttendanceStatus.Present,
          enrollmentIds: toPresent.map(s => s.enrollmentId),
        } as any, { skipHandleError: true }));
      }

      if (toAbsent.length > 0) {
        await lastValueFrom(this.attendanceSvc.bulkSetStatus({
          groupSessionId: sessionId,
          status: AttendanceStatus.Absent,
          enrollmentIds: toAbsent.map(s => s.enrollmentId),
        } as any, { skipHandleError: true }));
      }

      await this.loadStudents();
      this.markedPresent.set(new Set());
      this.showMessage(`تم الحفظ: ${marked.size} حاضر · ${toAbsent.length} غائب`, 'success');
    } catch (e: any) {
      this.showMessage(e?.error?.error?.message || 'فشل الحفظ', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void { this.stopScan(); this.location.back(); }

  trackByEnrollment = (_: number, item: StudentEntry) => item.enrollmentId;
}
