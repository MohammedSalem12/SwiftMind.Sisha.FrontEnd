import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import { AcademyCourseDto, AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';

@Component({
  selector: 'app-teacher-academy-courses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="blob b1"></div><div class="blob b2"></div>
        <div class="header-top">
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-info">
            <h1>{{ academyName() || 'مقررات الأكاديمية' }}</h1>
            <p>{{ courses().length }} مقرر · Academy Courses</p>
          </div>
          @if (isSupervisor()) {
            <button class="add-btn" (click)="goToAddCourse()">
              <i class="fas fa-plus"></i>
              إضافة مقرر
            </button>
          }
        </div>
      </div>

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- ── Error ── -->
      @if (error() && !loading()) {
        <div class="error-banner">
          <i class="fas fa-exclamation-circle"></i> {{ error() }}
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && !error() && courses().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-book-open"></i></div>
          <h3>لا توجد مقررات</h3>
          <p>لم يتم إضافة أي مقرر لهذه الأكاديمية بعد</p>
          @if (isSupervisor()) {
            <button class="empty-btn" (click)="goToAddCourse()">
              <i class="fas fa-plus"></i>
              إضافة مقرر جديد
            </button>
          }
        </div>
      }

      <!-- ── Courses list ── -->
      @if (!loading() && courses().length > 0) {
        <div class="courses-list">
          @for (c of courses(); track c.courseId) {
            <div class="course-card" [class.inactive-course]="!c.isActive" [class.locked-course]="!isCourseAssigned(c)">

              <!-- Course info -->
              <div class="course-row"
                   [class.course-row--locked]="!isCourseAssigned(c)"
                   (click)="isCourseAssigned(c) && goToCourse(c)">
                <div class="course-icon" [class.course-icon--locked]="!isCourseAssigned(c)">
                  <i class="fas" [class]="isCourseAssigned(c) ? 'fas fa-book-open' : 'fas fa-lock'"></i>
                </div>
                <div class="course-info">
                  <span class="course-name">{{ c.courseNameAr || c.courseNameEn }}</span>
                  @if (c.courseNameAr && c.courseNameEn) {
                    <span class="course-name-en">{{ c.courseNameEn }}</span>
                  }
                  <div class="course-chips">
                    @if (c.courseCode) {
                      <span class="chip chip-code"><i class="fas fa-hashtag"></i>{{ c.courseCode }}</span>
                    }
                    @if (c.gradeName) {
                      <span class="chip chip-grade">{{ c.gradeName }}</span>
                    }
                    @if (!c.isActive) {
                      <span class="inactive-pill">مخفي</span>
                    }
                    @if (!isCourseAssigned(c) && isCoursePending(c)) {
                      <span class="chip chip-pending">طلب معلق · Pending</span>
                    }
                    @if (!isCourseAssigned(c) && !isCoursePending(c)) {
                      <span class="chip chip-locked">غير معيّن · Not Assigned</span>
                    }
                  </div>
                </div>
                @if (isCourseAssigned(c)) {
                  <i class="fas fa-chevron-left nav-arrow"></i>
                }
              </div>

              <!-- Quick actions: only for assigned courses -->
              @if (isCourseAssigned(c)) {
                <div class="action-row">
                  <button class="action-btn attendance-btn" (click)="goToAttendance(c)">
                    <i class="fas fa-user-check"></i>
                    الحضور
                  </button>
                  <button class="action-btn marks-btn" (click)="goToMarks(c)">
                    <i class="fas fa-star-half-alt"></i>
                    الدرجات
                  </button>
                  <button class="action-btn students-btn" (click)="goToCourse(c)">
                    <i class="fas fa-users"></i>
                    الطلاب
                  </button>
                  @if (isSupervisor()) {
                    <button class="action-btn"
                            [class.hide-btn]="c.isActive"
                            [class.show-btn]="!c.isActive"
                            [disabled]="togglingCourseId() === c.courseId"
                            (click)="toggleCourseActive(c)">
                      @if (togglingCourseId() === c.courseId) {
                        <span class="spinner-sm"></span>
                      } @else {
                        <i [class]="c.isActive ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      }
                      {{ c.isActive ? 'إخفاء' : 'إظهار' }}
                    </button>
                  }
                </div>
              }

              <!-- Supervisor self-assign: for unassigned courses -->
              @if (!isCourseAssigned(c) && isSupervisor()) {
                <div class="action-row">
                  <button class="action-btn assign-self-btn"
                          [disabled]="requestingCourseId() === c.courseId"
                          (click)="assignSelf(c)">
                    @if (requestingCourseId() === c.courseId) {
                      <span class="spinner-sm"></span>
                    } @else {
                      <i class="fas fa-user-plus"></i>
                    }
                    تعيين لنفسي · Assign to me
                  </button>
                </div>
              }

              <!-- Request to teach: for non-assigned, non-supervisor members -->
              @if (!isCourseAssigned(c) && !isSupervisor()) {
                <div class="action-row">
                  @if (isCoursePending(c)) {
                    <div class="action-btn pending-btn">
                      <i class="fas fa-hourglass-half"></i>
                      تم إرسال الطلب · Request Sent
                    </div>
                  } @else {
                    <button class="action-btn request-teach-btn"
                            [disabled]="requestingCourseId() === c.courseId"
                            (click)="requestToTeach(c)">
                      @if (requestingCourseId() === c.courseId) {
                        <span class="spinner-sm"></span>
                      } @else {
                        <i class="fas fa-hand-paper"></i>
                      }
                      طلب التدريس · Request to Teach
                    </button>
                  }
                </div>
              }

            </div>
          }
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1rem) 1.25rem 1.25rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:180px; height:180px; top:-60px; right:-50px; }
    .b2 { width:120px; height:120px; bottom:-40px; left:-25px; }
    .header-top {
      position:relative; z-index:1;
      display:flex; align-items:center; gap:.75rem;
    }
    .back-btn {
      width:40px; height:40px; border-radius:50%; flex-shrink:0;
      background:rgba(255,255,255,.2); border:none; color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:1rem; cursor:pointer;
    }
    .header-info { flex:1; min-width:0; }
    .header-info h1 {
      margin:0; font-size:1.1rem; font-weight:800; color:#fff;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .header-info p { margin:.1rem 0 0; font-size:.72rem; color:rgba(255,255,255,.7); }
    .add-btn {
      display:flex; align-items:center; gap:.35rem;
      background:rgba(255,255,255,.2); border:1.5px solid rgba(255,255,255,.35);
      color:#fff; padding:.45rem .875rem; border-radius:12px;
      font-size:.82rem; font-weight:700; cursor:pointer; flex-shrink:0; min-height:40px;
    }

    /* ── Shimmer ── */
    .shimmer-area { padding:.875rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }
    .shimmer-card {
      height:110px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Error ── */
    .error-banner {
      margin:.875rem 1rem; padding:.875rem 1rem; border-radius:14px;
      background:rgba(239,68,68,.08); color:#dc2626; font-size:.88rem;
      display:flex; align-items:center; gap:.5rem;
    }

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
    .empty-state p   { font-size:.85rem; color:#9090aa; margin:0 0 1rem; }
    .empty-btn {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.75rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.88rem; font-weight:700; cursor:pointer;
    }

    /* ── Course cards ── */
    .courses-list { padding:.875rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }

    .course-card {
      background:#fff; border-radius:16px;
      border:1.5px solid #f0f0f0;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
      overflow:hidden;
    }

    /* Main row (clickable) */
    .course-row {
      display:flex; align-items:center; gap:.875rem;
      padding:.875rem; cursor:pointer;
      border-bottom:1px solid #f4f5fb;
      -webkit-tap-highlight-color:transparent;
      transition:background .15s;
    }
    .course-row:active { background:#f9fafb; }

    .course-icon {
      width:46px; height:46px; border-radius:12px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.1rem;
    }
    .course-info { flex:1; min-width:0; }
    .course-name { display:block; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .course-name-en { display:block; font-size:.72rem; color:#9090aa; margin-top:.1rem; }
    .course-chips { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.35rem; }
    .chip {
      display:inline-flex; align-items:center; gap:.2rem;
      font-size:.66rem; font-weight:600; padding:.1rem .4rem; border-radius:8px;
    }
    .chip-code  { background:rgba(102,126,234,.1); color:#667eea; }
    .chip-grade { background:rgba(118,75,162,.1);  color:#764ba2; }
    .nav-arrow  { color:#c4c4d4; font-size:.8rem; flex-shrink:0; }

    /* Action row */
    .action-row {
      display:flex; gap:0;
    }
    .action-btn {
      flex:1; display:flex; flex-direction:column; align-items:center; gap:.3rem;
      padding:.625rem .5rem; border:none; background:transparent;
      font-size:.7rem; font-weight:700; cursor:pointer;
      transition:background .15s; min-height:52px;
      -webkit-tap-highlight-color:transparent;
      border-right:1px solid #f0f0f0;
    }
    .action-btn:last-child { border-right:none; }
    .action-btn i { font-size:1rem; }
    .action-btn:active { background:#f4f5fb; }

    .attendance-btn { color:#059669; }
    .attendance-btn:hover { background:rgba(16,185,129,.05); }
    .marks-btn { color:#667eea; }
    .marks-btn:hover { background:rgba(102,126,234,.05); }
    .students-btn { color:#d97706; }
    .students-btn:hover { background:rgba(245,158,11,.05); }
    .hide-btn { color:#dc2626; }
    .hide-btn:hover { background:rgba(239,68,68,.05); }
    .show-btn { color:#059669; }
    .show-btn:hover { background:rgba(16,185,129,.05); }

    .course-card.inactive-course { opacity:.65; }
    .course-card.locked-course { opacity:.55; }
    .course-row--locked { cursor:default; }
    .course-row--locked:active { background:transparent; }
    .course-icon--locked { background:linear-gradient(135deg,#9ca3af,#6b7280) !important; }
    .chip-locked { background:rgba(239,68,68,.1); color:#dc2626; }
    .chip-pending { background:rgba(245,158,11,.1); color:#d97706; }
    .request-teach-btn {
      color:#10b981 !important; font-weight:700 !important;
      flex:1 !important; justify-content:center;
    }
    .request-teach-btn:active { background:rgba(16,185,129,.08); }
    .pending-btn {
      color:#d97706 !important; cursor:default !important;
      flex:1 !important; justify-content:center;
    }
    .assign-self-btn {
      color:#667eea !important; font-weight:700 !important;
      flex:1 !important; justify-content:center;
    }
    .assign-self-btn:active { background:rgba(102,126,234,.08); }
    .inactive-pill {
      font-size:.6rem; font-weight:700; padding:.1rem .4rem; border-radius:20px;
      background:rgba(239,68,68,.1); color:#dc2626; margin-top:.2rem; display:inline-block;
    }

    .spinner-sm {
      width:12px; height:12px; border:2px solid currentColor;
      border-top-color:transparent; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
  `],
})
export class TeacherAcademyCoursesComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly academySvc = inject(AcademyService);
  private readonly userSvc    = inject(CurrentUserInfoService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly restSvc    = inject(RestService);

  loading      = signal(true);
  error        = signal<string | null>(null);
  academyName  = signal<string>('');
  courses      = signal<AcademyCourseDto[]>([]);
  isSupervisor = signal(false);
  togglingCourseId = signal<string | null>(null);
  assignedCourseIds = signal<Set<string>>(new Set());
  pendingRequestCourseIds = signal<Set<string>>(new Set());
  requestingCourseId = signal<string | null>(null);

  private academyId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('academyId');
    if (!this.academyId) {
      this.error.set('معرّف الأكاديمية غير موجود');
      this.loading.set(false);
      return;
    }
    await Promise.all([this.loadAcademy(), this.loadCourses()]);
    await this.loadAssignments();
  }

  private async loadAcademy(): Promise<void> {
    try {
      const [academy, userInfo] = await Promise.all([
        lastValueFrom(this.academySvc.get(this.academyId!, { skipHandleError: true })),
        lastValueFrom(this.userSvc.getCurrentUserActorInfo()),
      ]);
      this.academyName.set(academy?.nameAr || academy?.nameEn || '');

      // Check if current teacher is supervisor
      if (userInfo?.actorId && academy?.supervisorTeacherId === userInfo.actorId) {
        this.isSupervisor.set(true);
      }
    } catch { /* name stays empty */ }
  }

  private async loadCourses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.academySvc.getAcademyCourses(this.academyId!, { skipHandleError: true })
      );
      this.courses.set(result || []);
    } catch (err: any) {
      this.error.set(err?.error?.error?.message || 'حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAssignments(): Promise<void> {
    if (!this.academyId) return;
    try {
      // Load assigned courses (works for both supervisor and member)
      const assignments = await lastValueFrom(
        this.academySvc.getMyAcademyCourseAssignments(this.academyId, { skipHandleError: true })
      );
      const ids = new Set<string>();
      (assignments || []).forEach((a: any) => { if (a.courseId) ids.add(a.courseId); });
      this.assignedCourseIds.set(ids);

      // For non-supervisors: load pending requests
      if (!this.isSupervisor()) {
        const pending = await lastValueFrom(
          this.academySvc.getPendingCourseTeacherRequests(this.academyId, { skipHandleError: true })
        ).catch(() => []);
        const userInfo = await lastValueFrom(this.userSvc.getCurrentUserActorInfo());
        const myId = userInfo?.actorId;
        const pendingIds = new Set<string>();
        (pending || []).filter((p: any) => p.teacherId === myId).forEach((p: any) => {
          if (p.courseId) pendingIds.add(p.courseId);
        });
        this.pendingRequestCourseIds.set(pendingIds);
      }
    } catch { /* silent */ }
  }

  isCourseAssigned(c: AcademyCourseDto): boolean {
    return !!c.courseId && this.assignedCourseIds().has(c.courseId);
  }

  isCoursePending(c: AcademyCourseDto): boolean {
    return !!c.courseId && this.pendingRequestCourseIds().has(c.courseId);
  }

  async assignSelf(c: AcademyCourseDto): Promise<void> {
    if (!this.academyId || !c.courseId) return;
    this.requestingCourseId.set(c.courseId);
    try {
      // Get current teacher ID
      const userInfo = await lastValueFrom(this.userSvc.getCurrentUserActorInfo());
      const teacherId = userInfo?.actorId;
      if (!teacherId) return;
      await lastValueFrom(
        this.academySvc.assignTeacherToCourse(this.academyId, c.courseId, teacherId)
      );
      this.assignedCourseIds.update(s => { const ns = new Set(s); ns.add(c.courseId!); return ns; });
    } catch (err: any) {
      console.error('Self-assign error:', err);
    } finally {
      this.requestingCourseId.set(null);
    }
  }

  async requestToTeach(c: AcademyCourseDto): Promise<void> {
    if (!this.academyId || !c.courseId) return;
    this.requestingCourseId.set(c.courseId);
    try {
      await lastValueFrom(
        this.academySvc.requestToTeachCourse(this.academyId, c.courseId)
      );
      this.pendingRequestCourseIds.update(s => { const ns = new Set(s); ns.add(c.courseId!); return ns; });
    } catch (err: any) {
      console.error('Request to teach error:', err);
    } finally {
      this.requestingCourseId.set(null);
    }
  }

  goToCourse(c: AcademyCourseDto): void {
    if (c.courseId) this.router.navigate(['/teacher/course', c.courseId],
      { queryParams: this.academyId ? { academyId: this.academyId } : {} });
  }

  goToAttendance(c: AcademyCourseDto): void {
    this.router.navigate(['/attendance'], {
      queryParams: { courseId: c.courseId, ...(this.academyId ? { academyId: this.academyId } : {}) }
    });
  }

  goToMarks(c: AcademyCourseDto): void {
    this.router.navigate(['/marks-entry'], {
      queryParams: { courseId: c.courseId, ...(this.academyId ? { academyId: this.academyId } : {}) }
    });
  }

  async toggleCourseActive(c: AcademyCourseDto): Promise<void> {
    if (!this.academyId || !c.courseId) return;
    this.togglingCourseId.set(c.courseId);
    const currentIsActive = (c as any).isActive as boolean;
    try {
      await lastValueFrom(
        this.restSvc.request<any, void>(
          { method: 'POST',
            url: `/api/sesha/academies/${this.academyId}/courses/${c.courseId}/set-active`,
            params: { isActive: !currentIsActive } },
          { apiName: 'Default' }
        )
      );
      this.courses.update(list => list.map(x =>
        x.courseId === c.courseId ? { ...x, isActive: !currentIsActive } : x
      ));
    } catch { /* silent */ }
    finally { this.togglingCourseId.set(null); }
  }

  goToAddCourse(): void {
    this.router.navigate(['/academies', this.academyId, 'manage'], { queryParams: { tab: 'courses' } });
  }

  goBack(): void {
    this.router.navigate(['/teacher/academies']);
  }
}
