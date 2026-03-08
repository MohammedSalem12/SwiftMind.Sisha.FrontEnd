import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { StudentService } from '@proxy/students';
import { StudentDto } from '@proxy/students/models';
import { TeacherService } from '@proxy/teachers';
import { TeacherEnrolledCourseDto } from '@proxy/teachers/models';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { EnrolledStudentDto } from '@proxy/student-enrollments/dtos/models';

interface CourseTab {
  id: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
  students: EnrolledStudentDto[];
  loaded: boolean;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="blob b1"></div><div class="blob b2"></div>
        <div class="header-content">
          <div class="header-text">
            <h1>{{ isTeacher() ? 'طلابي' : 'الطلاب' }}</h1>
            <p>{{ isTeacher() ? 'الطلاب المسجّلون في مقرراتي' : 'إدارة جميع الطلاب' }}</p>
            <p class="subtitle-en">{{ isTeacher() ? 'Students in my courses' : 'Manage all students' }}</p>
          </div>
          @if (!isTeacher()) {
            <button class="add-btn" (click)="goToAdd()">
              <i class="fas fa-plus"></i>
              إضافة طالب
            </button>
          }
        </div>
      </div>

      <!-- ══════════════ TEACHER VIEW ══════════════ -->
      @if (isTeacher()) {

        <!-- Course tabs -->
        @if (!loadingCourses()) {
          <div class="course-tabs-wrap">
            <div class="course-tabs">
              @for (c of courseTabs(); track c.id) {
                <button class="course-tab"
                        [class.active]="activeCourseId() === c.id"
                        (click)="selectCourse(c)">
                  <span class="ct-name">{{ c.nameAr || c.nameEn }}</span>
                  <span class="ct-code">{{ c.code }}</span>
                </button>
              }
              @if (courseTabs().length === 0) {
                <span class="no-courses">لا توجد مقررات مسجّلة</span>
              }
            </div>
          </div>
        }

        @if (loadingCourses()) {
          <div class="shimmer-tabs">
            @for (i of [1,2,3]; track i) { <div class="shimmer-tab"></div> }
          </div>
        }

        <!-- Teacher code search -->
        <div class="search-section">
          <div class="search-label">
            <i class="fas fa-hashtag"></i>
            البحث بالكود الداخلي · Search by internal code
          </div>
          <div class="search-row">
            <input class="search-input" type="text" placeholder="أدخل الكود الداخلي للطالب…"
                   [ngModel]="teacherCodeFilter()"
                   (ngModelChange)="teacherCodeFilter.set($event)"
                   (keyup.enter)="searchByCode()" />
            <button class="search-btn" (click)="searchByCode()" [disabled]="codeLoading()">
              @if (codeLoading()) { <span class="spinner"></span> }
              @else { <i class="fas fa-search"></i> }
              بحث
            </button>
            @if (codeSearchDone()) {
              <button class="clear-btn" (click)="clearCodeSearch()">
                <i class="fas fa-times"></i>
              </button>
            }
          </div>

          @if (codeSearchDone()) {
            @if (isStudentDto(codeResult())) {
              <div class="code-result-card">
                <div class="student-avatar">
                  <span>{{ initials(codeResult()!) }}</span>
                </div>
                <div class="student-info">
                  <span class="student-name">{{ codeResult()?.firstName }} {{ codeResult()?.lastName }}</span>
                  <span class="student-meta">الصف {{ codeResult()?.currentGrade }} · {{ codeResult()?.schoolName || '' }}</span>
                  <span class="student-code">كود: {{ codeResult()?.studentCode }}</span>
                </div>
                <button class="detail-btn" (click)="showDetails(codeResult()!)">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            } @else {
              <div class="code-empty">
                <i class="fas fa-search"></i>
                لا يوجد طالب بهذا الكود
              </div>
            }
          }
        </div>

        <!-- Students of selected course -->
        @if (activeCourse()) {
          <div class="section">
            <div class="section-title">
              <i class="fas fa-user-graduate"></i>
              طلاب {{ activeCourse()!.nameAr || activeCourse()!.nameEn }}
              @if (activeCourse()!.students.length > 0) {
                <span class="count-pill">{{ activeCourse()!.students.length }}</span>
              }
            </div>

            @if (!activeCourse()!.loaded) {
              <div class="shimmer-list">
                @for (i of [1,2,3,4]; track i) { <div class="shimmer-row"></div> }
              </div>
            }

            @if (activeCourse()!.loaded && activeCourse()!.students.length === 0) {
              <div class="empty-box">
                <i class="fas fa-user-slash"></i>
                <p>لا يوجد طلاب مسجّلون في هذا المقرر</p>
                <span>No enrolled students in this course</span>
              </div>
            }

            @if (activeCourse()!.loaded && activeCourse()!.students.length > 0) {
              <div class="students-list">
                @for (s of activeCourse()!.students; track s.studentId) {
                  <div class="student-row">
                    <div class="student-avatar">
                      <span>{{ (s.studentName || '?').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="student-info">
                      <span class="student-name">{{ s.studentName || 'طالب' }}</span>
                      <span class="student-meta">{{ s.studentCode }}</span>
                    </div>
                    @if (s.enrolledAt) {
                      <span class="enrolled-date">
                        {{ formatDate(s.enrolledAt) }}
                      </span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ══════════════ SECRETARY VIEW ══════════════ -->
      @if (!isTeacher()) {

        <!-- Search bar -->
        <div class="search-section">
          <div class="search-row">
            <input class="search-input" type="text" placeholder="البحث بالاسم أو الكود…"
                   [ngModel]="filter()"
                   (ngModelChange)="onFilter($event)" />
            <button class="search-btn" (click)="onFilter(filter())">
              <i class="fas fa-search"></i>
              بحث
            </button>
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="shimmer-list" style="padding:0 1rem">
            @for (i of [1,2,3,4,5]; track i) { <div class="shimmer-row"></div> }
          </div>
        }

        <!-- Student list -->
        @if (!loading()) {
          <div class="section">
            <div class="section-title">
              <i class="fas fa-users"></i>
              جميع الطلاب · All Students
              <span class="count-pill">{{ totalCount() }}</span>
            </div>

            @if (students().length === 0) {
              <div class="empty-box">
                <i class="fas fa-user-slash"></i>
                <p>لا يوجد طلاب</p>
                <span>No students found</span>
              </div>
            }

            <div class="students-list">
              @for (s of students(); track s.id) {
                <div class="student-row student-row-action">
                  <div class="student-avatar">
                    <span>{{ initials(s) }}</span>
                  </div>
                  <div class="student-info">
                    <span class="student-name">{{ s.firstName }} {{ s.lastName }}</span>
                    <span class="student-meta">
                      الصف {{ s.currentGrade }}
                      @if (s.studentCode) { · {{ s.studentCode }} }
                      @if (s.schoolName) { · {{ s.schoolName }} }
                    </span>
                    @if (s.teacherStudentCode) {
                      <span class="internal-code">كود داخلي: {{ s.teacherStudentCode }}</span>
                    }
                  </div>
                  <div class="row-actions">
                    <button class="action-icon-btn view-btn" (click)="showDetails(s)" title="تفاصيل">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-icon-btn enroll-btn" (click)="goToEnroll(s.id!)" title="تسجيل">
                      <i class="fas fa-plus-circle"></i>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (totalCount() > pageSize()) {
              <div class="pager">
                <button class="page-btn" (click)="onPageChange(page() - 1)" [disabled]="page() <= 1">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <span class="page-info">{{ page() }} / {{ Math.ceil(totalCount() / pageSize()) }}</span>
                <button class="page-btn" (click)="onPageChange(page() + 1)"
                        [disabled]="page() * pageSize() >= totalCount()">
                  <i class="fas fa-chevron-left"></i>
                </button>
              </div>
            }
          </div>
        }
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1rem) 1.25rem 1.5rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:180px; height:180px; top:-60px; right:-50px; }
    .b2 { width:120px; height:120px; bottom:-40px; left:-20px; }
    .header-content {
      position:relative; z-index:1;
      display:flex; align-items:center; justify-content:space-between; gap:1rem;
    }
    .header-text h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-text p  { margin:.15rem 0 0; font-size:.82rem; color:rgba(255,255,255,.8); }
    .header-text .subtitle-en { font-size:.7rem; color:rgba(255,255,255,.55); margin-top:.05rem; }
    .add-btn {
      display:flex; align-items:center; gap:.4rem;
      background:rgba(255,255,255,.2); border:1.5px solid rgba(255,255,255,.35);
      color:#fff; padding:.6rem 1rem; border-radius:12px;
      font-size:.82rem; font-weight:700; cursor:pointer; flex-shrink:0;
      white-space:nowrap; transition:background .15s;
    }
    .add-btn:hover { background:rgba(255,255,255,.3); }

    /* ── Course tabs ── */
    .course-tabs-wrap {
      padding:.875rem 1rem .25rem;
      overflow-x:auto;
      -webkit-overflow-scrolling:touch;
    }
    .course-tabs {
      display:flex; gap:.5rem; width:max-content; min-width:100%;
    }
    .course-tab {
      display:flex; flex-direction:column; align-items:center; gap:.15rem;
      padding:.6rem .875rem; border-radius:12px;
      background:#fff; border:1.5px solid #e9ecef;
      cursor:pointer; white-space:nowrap;
      transition:all .15s; min-width:90px;
      box-shadow:0 2px 6px rgba(0,0,0,.04);
    }
    .course-tab.active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      border-color:transparent;
      box-shadow:0 4px 12px rgba(102,126,234,.3);
    }
    .ct-name { font-size:.78rem; font-weight:700; color:#1a1a2e; }
    .course-tab.active .ct-name { color:#fff; }
    .ct-code { font-size:.65rem; color:#9090aa; }
    .course-tab.active .ct-code { color:rgba(255,255,255,.75); }
    .no-courses { padding:.75rem 1rem; color:#9090aa; font-size:.85rem; }

    .shimmer-tabs { display:flex; gap:.5rem; padding:.875rem 1rem .25rem; }
    .shimmer-tab {
      width:100px; height:54px; border-radius:12px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }

    /* ── Search ── */
    .search-section { padding:.875rem 1rem .25rem; }
    .search-label {
      font-size:.75rem; font-weight:700; color:#555;
      display:flex; align-items:center; gap:.35rem; margin-bottom:.5rem;
    }
    .search-label i { color:#667eea; }
    .search-row { display:flex; gap:.5rem; }
    .search-input {
      flex:1; padding:.7rem .875rem; border-radius:12px;
      border:1.5px solid #e9ecef; background:#fff;
      font-size:.88rem; min-height:44px;
      outline:none; transition:border-color .15s;
    }
    .search-input:focus { border-color:#667eea; }
    .search-btn {
      padding:.7rem 1rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; cursor:pointer;
      font-size:.82rem; font-weight:700; flex-shrink:0;
      display:flex; align-items:center; gap:.35rem; min-height:44px;
    }
    .clear-btn {
      width:44px; height:44px; border-radius:12px;
      background:#f3f4f6; border:none; cursor:pointer;
      color:#6c757d; font-size:.9rem; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }

    .code-result-card {
      display:flex; align-items:center; gap:.875rem;
      background:#fff; border-radius:14px; border:1.5px solid rgba(102,126,234,.2);
      padding:.875rem; margin-top:.75rem;
      box-shadow:0 2px 8px rgba(0,0,0,.06);
    }
    .code-empty {
      display:flex; align-items:center; gap:.5rem;
      color:#9090aa; font-size:.85rem; padding:.75rem 0; margin-top:.5rem;
    }
    .code-empty i { color:#c4c4d4; }

    /* ── Sections ── */
    .section { padding:.875rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem;
      font-size:.78rem; font-weight:700; color:#555;
      text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.82rem; }
    .count-pill {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.7rem; font-weight:700; padding:.12rem .45rem; border-radius:20px;
    }

    /* ── Student rows ── */
    .students-list { display:flex; flex-direction:column; gap:.5rem; }
    .student-row {
      display:flex; align-items:center; gap:.875rem;
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 6px rgba(0,0,0,.04);
    }
    .student-avatar {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1rem; font-weight:700;
    }
    .student-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:.1rem; }
    .student-name { font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .student-meta { font-size:.75rem; color:#9090aa; }
    .internal-code {
      font-size:.7rem; font-weight:600; color:#667eea;
      background:rgba(102,126,234,.1); padding:.1rem .4rem;
      border-radius:8px; width:fit-content;
    }
    .enrolled-date { font-size:.72rem; color:#9090aa; flex-shrink:0; }

    /* Secretary row actions */
    .row-actions { display:flex; gap:.4rem; flex-shrink:0; }
    .action-icon-btn {
      width:36px; height:36px; border-radius:10px; border:none;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      font-size:.85rem; transition:transform .15s;
    }
    .action-icon-btn:active { transform:scale(.9); }
    .view-btn   { background:rgba(102,126,234,.12); color:#667eea; }
    .enroll-btn { background:rgba(16,185,129,.12);  color:#059669; }

    /* Code result detail button */
    .detail-btn {
      width:40px; height:40px; border-radius:50%; flex-shrink:0;
      background:rgba(102,126,234,.1); border:none; cursor:pointer;
      color:#667eea; font-size:.9rem;
      display:flex; align-items:center; justify-content:center;
    }

    /* Shimmer */
    .shimmer-list { display:flex; flex-direction:column; gap:.5rem; padding:.875rem 1rem 0; }
    .shimmer-row {
      height:72px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty-box {
      text-align:center; padding:2.5rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2.5rem; color:#c4c4d4; display:block; margin-bottom:.75rem; }
    .empty-box p { font-size:.95rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.78rem; color:#9090aa; }

    /* Pagination */
    .pager {
      display:flex; align-items:center; justify-content:center;
      gap:1rem; padding:1rem 0 .5rem;
    }
    .page-btn {
      width:40px; height:40px; border-radius:10px;
      background:#fff; border:1.5px solid #e9ecef;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      color:#555; font-size:.85rem; transition:all .15s;
    }
    .page-btn:disabled { opacity:.4; cursor:not-allowed; }
    .page-btn:not(:disabled):hover { border-color:#667eea; color:#667eea; }
    .page-info { font-size:.85rem; font-weight:600; color:#555; }

    /* Spinner */
    .spinner {
      width:14px; height:14px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class StudentsComponent implements OnInit {
  private readonly router         = inject(Router);
  private readonly configSvc      = inject(ConfigStateService);
  private readonly studentSvc     = inject(StudentService);
  private readonly teacherSvc     = inject(TeacherService);
  private readonly enrollmentSvc  = inject(StudentEnrollmentService);

  readonly Math = Math;

  // ── Role detection ──────────────────────────────────────────────────────────
  isTeacher = signal(false);

  // ── Secretary state ─────────────────────────────────────────────────────────
  filter       = signal('');
  students     = signal<StudentDto[]>([]);
  totalCount   = signal(0);
  loading      = signal(false);
  page         = signal(1);
  pageSize     = signal(15);

  // ── Teacher state ───────────────────────────────────────────────────────────
  loadingCourses  = signal(true);
  courseTabs      = signal<CourseTab[]>([]);
  activeCourseId  = signal<string | null>(null);

  activeCourse = computed(() =>
    this.courseTabs().find(c => c.id === this.activeCourseId()) ?? null
  );

  // Teacher code search
  teacherCodeFilter  = signal('');
  codeLoading        = signal(false);
  codeSearchDone     = signal(false);
  codeResult         = signal<StudentDto | 'not-found'>('not-found');

  // ── Init ────────────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    const cu = this.configSvc.getOne('currentUser') as any;
    const roles: string[] = (cu?.roles || cu?.roleNames || cu?.userRoles || [])
      .map((r: any) => typeof r === 'string' ? r.toUpperCase() : '');
    const teacher = roles.includes('TEACHER');
    this.isTeacher.set(teacher);

    if (teacher) {
      await this.loadTeacherCourses();
    } else {
      await this.loadStudents();
    }
  }

  // ── Teacher: load courses then auto-select first ────────────────────────────
  private async loadTeacherCourses(): Promise<void> {
    this.loadingCourses.set(true);
    try {
      const courses = await lastValueFrom(this.teacherSvc.getCoursesWithEnrollmentStatus());
      const enrolled = (courses ?? []).filter(c => c.isEnrolled);
      const tabs: CourseTab[] = enrolled.map(c => ({
        id: c.id!,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        code: c.code,
        students: [],
        loaded: false,
      }));
      this.courseTabs.set(tabs);
      if (tabs.length > 0) {
        await this.selectCourse(tabs[0]);
      }
    } catch (e) {
      console.error('Error loading courses', e);
    } finally {
      this.loadingCourses.set(false);
    }
  }

  async selectCourse(tab: CourseTab): Promise<void> {
    this.activeCourseId.set(tab.id);
    if (tab.loaded) return;

    try {
      const students = await lastValueFrom(
        this.enrollmentSvc.getEnrolledStudentsByCourse(tab.id)
      );
      this.courseTabs.update(tabs =>
        tabs.map(t => t.id === tab.id ? { ...t, students: students ?? [], loaded: true } : t)
      );
    } catch (e) {
      console.error('Error loading students for course', e);
      this.courseTabs.update(tabs =>
        tabs.map(t => t.id === tab.id ? { ...t, loaded: true } : t)
      );
    }
  }

  // ── Teacher: code search ────────────────────────────────────────────────────
  async searchByCode(): Promise<void> {
    const code = this.teacherCodeFilter().trim();
    if (!code) return;
    this.codeLoading.set(true);
    this.codeSearchDone.set(false);
    try {
      const result = await lastValueFrom(this.studentSvc.getByTeacherStudentCode(code));
      this.codeResult.set(result ?? 'not-found');
    } catch {
      this.codeResult.set('not-found');
    } finally {
      this.codeLoading.set(false);
      this.codeSearchDone.set(true);
    }
  }

  clearCodeSearch(): void {
    this.teacherCodeFilter.set('');
    this.codeResult.set('not-found');
    this.codeSearchDone.set(false);
  }

  // ── Secretary: student list ─────────────────────────────────────────────────
  async loadStudents(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(this.studentSvc.getList({
        skipCount: (this.page() - 1) * this.pageSize(),
        maxResultCount: this.pageSize(),
        sorting: 'creationTime desc',
      } as any));
      this.students.set(res?.items ?? []);
      this.totalCount.set(res?.totalCount ?? 0);
    } catch (e) {
      console.error('Error loading students', e);
    } finally {
      this.loading.set(false);
    }
  }

  onFilter(value: string): void {
    this.filter.set(value);
    this.page.set(1);
    this.loadStudents();
  }

  onPageChange(p: number): void {
    if (p < 1) return;
    this.page.set(p);
    this.loadStudents();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  goToAdd(): void    { this.router.navigate(['/add-student']); }
  goToEnroll(id: string): void { this.router.navigate(['/enroll', id]); }
  showDetails(s: any): void { this.router.navigate(['/students', s.id]); }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  isStudentDto(val: any): val is StudentDto {
    return val && typeof val === 'object' && 'id' in val;
  }

  initials(s: any): string {
    return ((s?.firstName?.[0] || '') + (s?.lastName?.[0] || '')).toUpperCase() || '?';
  }

  formatDate(d?: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  }
}
