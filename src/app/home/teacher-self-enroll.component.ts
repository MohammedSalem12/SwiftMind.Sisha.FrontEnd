import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TeacherService } from '@proxy/teachers';
import type { TeacherEnrolledCourseDto, TeacherEnrollmentResultDto } from '@proxy/teachers';
import { UnenrollRequestStatus } from '@proxy/teachers';


@Component({
  selector: 'app-teacher-self-enroll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div><div class="blob b2"></div>
        <div class="header-content header-row">
          <button class="back-btn" (click)="goBack()" aria-label="رجوع">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div>
            <h1>التسجيل في المقررات</h1>
            <p>اختر المقررات التي تريد التسجيل فيها · Enroll in Courses</p>
          </div>
        </div>
      </div>

      <!-- Result banners -->
      @if (enrollResult()) {
        <div class="banner" [class.banner-success]="enrollResult()!.success"
             [class.banner-warn]="!enrollResult()!.success">
          <i [class]="enrollResult()!.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
          <div class="banner-body">
            <strong>{{ enrollResult()!.success ? 'تم التسجيل بنجاح' : 'تنبيه' }}</strong>
            <span>{{ enrollResult()!.message }}</span>
          </div>
          <button class="banner-close" (click)="enrollResult.set(null)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      }
      @if (unenrollMsg()) {
        <div class="banner" [class.banner-success]="unenrollMsgSuccess()"
             [class.banner-warn]="!unenrollMsgSuccess()">
          <i [class]="unenrollMsgSuccess() ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
          <div class="banner-body"><span>{{ unenrollMsg() }}</span></div>
          <button class="banner-close" (click)="unenrollMsg.set(null)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-filters"></div>
          @for (i of [1,2,3,4]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading() && courses().length > 0) {

        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-wrap">
            <i class="fas fa-search si"></i>
            <input class="search-input" type="text" placeholder="ابحث باسم المقرر…"
                   [(ngModel)]="searchTextValue"
                   (ngModelChange)="searchText.set($event)" />
            @if (searchText()) {
              <button class="search-clear" (click)="searchText.set(''); searchTextValue = ''">
                <i class="fas fa-times"></i>
              </button>
            }
          </div>
          <select class="grade-select" [(ngModel)]="gradeFilterValue"
                  (ngModelChange)="selectedGrade.set($event)">
            <option value="">كل الصفوف</option>
            @for (g of availableGrades(); track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>
          <button class="filter-toggle" [class.active]="showEnrolledOnly()"
                  (click)="toggleEnrolledOnly()">
            <i class="fas fa-chalkboard-teacher"></i>
            مقرراتي
          </button>
        </div>

        <!-- Count row -->
        <div class="count-row">
          <span class="count-label">
            <i class="fas fa-book"></i>
            المقررات
            <span class="count-pill">{{ filteredCourses().length }}</span>
            @if (filteredCourses().length !== courses().length) {
              <span class="count-total">من {{ courses().length }}</span>
            }
          </span>
          @if (selectedCourseIds().length > 0) {
            <span class="selected-hint">
              <i class="fas fa-check-square"></i>
              {{ selectedCourseIds().length }} مختار
            </span>
          }
        </div>

        <!-- No results -->
        @if (filteredCourses().length === 0) {
          <div class="empty-filter">
            <i class="fas fa-search"></i>
            <p>لا توجد نتائج مطابقة</p>
          </div>
        }

        <!-- Course list -->
        <div class="courses-list">
          @for (course of filteredCourses(); track course.id) {

            <!-- ENROLLED card -->
            @if (course.isEnrolled) {
              <div class="course-card enrolled-card">
                <div class="enrolled-mark">
                  <i class="fas fa-check-circle"></i>
                  مسجّل · Enrolled
                </div>
                <div class="course-body">
                  <div class="course-main">
                    <span class="course-name-ar">{{ course.nameAr }}</span>
                    @if (course.nameEn) { <span class="course-name-en">{{ course.nameEn }}</span> }
                    <div class="course-chips">
                      @if (course.code) { <span class="chip chip-code"><i class="fas fa-code"></i>{{ course.code }}</span> }
                      @if (course.gradeName) { <span class="chip chip-grade"><i class="fas fa-graduation-cap"></i>{{ course.gradeName }}</span> }
                    </div>
                  </div>
                  <div class="course-action">
                    @if (course.pendingUnenrollStatus == null) {
                      <button class="unenroll-btn"
                              [disabled]="requestingUnenroll() === course.id"
                              (click)="requestUnenroll(course)">
                        @if (requestingUnenroll() === course.id) { <span class="spinner"></span> }
                        @else { <i class="fas fa-sign-out-alt"></i> }
                        إلغاء
                      </button>
                    }
                    @if (course.pendingUnenrollStatus === 0) {
                      <div class="pending-badge">
                        <i class="fas fa-hourglass-half"></i>
                        بانتظار الموافقة
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- SELECTABLE card -->
            @if (!course.isEnrolled) {
              <div class="course-card selectable-card"
                   [class.selected]="isSelected(course.id!)"
                   (click)="toggleCourse(course.id!)">
                <div class="select-box" [class.checked]="isSelected(course.id!)">
                  @if (isSelected(course.id!)) { <i class="fas fa-check"></i> }
                </div>
                <div class="course-body">
                  <div class="course-main">
                    <span class="course-name-ar">{{ course.nameAr }}</span>
                    @if (course.nameEn) { <span class="course-name-en">{{ course.nameEn }}</span> }
                    <div class="course-chips">
                      @if (course.code) { <span class="chip chip-code"><i class="fas fa-code"></i>{{ course.code }}</span> }
                      @if (course.gradeName) { <span class="chip chip-grade"><i class="fas fa-graduation-cap"></i>{{ course.gradeName }}</span> }
                    </div>
                  </div>
                </div>
              </div>
            }

          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && courses().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-book-open"></i></div>
          <h3>لا توجد مقررات متاحة</h3>
          <p>No courses available at the moment</p>
        </div>
      }

      <!-- Sticky enroll button -->
      @if (selectedCourseIds().length > 0) {
        <div class="sticky-enroll">
          <button class="enroll-btn" [disabled]="submitting()" (click)="submitEnrollment()">
            @if (submitting()) { <span class="spinner"></span> }
            @else { <i class="fas fa-check"></i> }
            تسجيل في {{ selectedCourseIds().length }} مقرر
          </button>
        </div>
      }

      <div [style.height]="selectedCourseIds().length > 0 ? 'calc(140px + env(safe-area-inset-bottom,0px))' : 'calc(80px + env(safe-area-inset-bottom,0px))'"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.1rem) 1.25rem 1.5rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:130px; height:130px; bottom:-50px; left:-25px; }
    .header-content { position:relative; z-index:1; }
    .header-row { display:flex; align-items:center; gap:.75rem; }
    .back-btn {
      width:40px; height:40px; min-width:40px; flex-shrink:0;
      background:rgba(255,255,255,.2); border:none; border-radius:12px;
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .header-content h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-content p  { margin:.2rem 0 0; font-size:.76rem; color:rgba(255,255,255,.7); }

    /* ── Banners ── */
    .banner {
      display:flex; align-items:flex-start; gap:.75rem;
      margin:.75rem 1rem 0; padding:.875rem 1rem; border-radius:14px;
    }
    .banner-success { background:rgba(34,197,94,.12); border:1.5px solid rgba(34,197,94,.25); color:#15803d; }
    .banner-warn    { background:rgba(245,158,11,.1);  border:1.5px solid rgba(245,158,11,.25); color:#b45309; }
    .banner i { font-size:1.1rem; flex-shrink:0; margin-top:.1rem; }
    .banner-body { flex:1; display:flex; flex-direction:column; gap:.2rem; font-size:.85rem; }
    .banner-body strong { font-weight:700; }
    .banner-close {
      background:none; border:none; cursor:pointer; color:currentColor;
      font-size:.8rem; padding:.2rem; opacity:.7; flex-shrink:0;
    }

    /* ── Filter bar ── */
    .filter-bar {
      display:flex; gap:.5rem; flex-wrap:wrap;
      padding:.875rem 1rem .25rem;
    }
    .search-wrap { flex:1; min-width:160px; position:relative; display:flex; align-items:center; }
    .si { position:absolute; right:.875rem; color:#9090aa; font-size:.82rem; pointer-events:none; }
    .search-input {
      width:100%; padding:.7rem 2.25rem .7rem .75rem;
      border:1.5px solid #e9ecef; border-radius:12px;
      font-size:.88rem; background:#fff; outline:none; direction:rtl;
      min-height:44px; transition:border-color .15s;
    }
    .search-input:focus { border-color:#667eea; }
    .search-clear {
      position:absolute; left:.625rem; background:none; border:none;
      color:#9090aa; cursor:pointer; font-size:.8rem; padding:.25rem;
    }
    .grade-select {
      padding:.7rem .875rem; border:1.5px solid #e9ecef; border-radius:12px;
      font-size:.85rem; background:#fff; outline:none; cursor:pointer;
      min-height:44px; min-width:120px; direction:rtl;
    }
    .grade-select:focus { border-color:#667eea; }
    .filter-toggle {
      display:flex; align-items:center; gap:.35rem;
      padding:.7rem .875rem; border:1.5px solid #e9ecef; border-radius:12px;
      font-size:.82rem; font-weight:600; background:#fff; cursor:pointer;
      white-space:nowrap; min-height:44px; transition:all .15s;
    }
    .filter-toggle.active { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-color:transparent; }

    /* ── Count row ── */
    .count-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:.5rem 1rem .25rem;
      font-size:.8rem; font-weight:600; color:#555;
    }
    .count-label { display:flex; align-items:center; gap:.4rem; }
    .count-label i { color:#667eea; }
    .count-pill {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.7rem; font-weight:700; padding:.1rem .45rem; border-radius:20px;
    }
    .count-total { color:#9090aa; font-weight:400; }
    .selected-hint {
      display:flex; align-items:center; gap:.35rem;
      color:#667eea; font-size:.78rem;
    }

    /* ── Courses list ── */
    .courses-list {
      padding:.5rem 1rem 0;
      display:flex; flex-direction:column; gap:.5rem;
    }

    .course-card {
      background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f0;
      box-shadow:0 2px 6px rgba(0,0,0,.04);
      overflow:hidden; transition:all .15s;
    }

    /* Enrolled */
    .enrolled-card { border-top:3px solid #22c55e; }
    .enrolled-mark {
      display:flex; align-items:center; gap:.4rem;
      background:rgba(34,197,94,.08); color:#16a34a;
      font-size:.72rem; font-weight:700;
      padding:.45rem .875rem;
      border-bottom:1px solid rgba(34,197,94,.12);
    }
    .enrolled-mark i { font-size:.82rem; }

    .course-body {
      display:flex; align-items:center; gap:.75rem;
      padding:.875rem;
    }
    .course-main { flex:1; min-width:0; }
    .course-name-ar {
      display:block; font-size:.95rem; font-weight:700; color:#1a1a2e;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .course-name-en {
      display:block; font-size:.72rem; color:#9090aa; margin-top:.1rem;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .course-chips { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.4rem; }
    .chip {
      display:inline-flex; align-items:center; gap:.25rem;
      font-size:.66rem; font-weight:600; padding:.12rem .45rem; border-radius:8px;
    }
    .chip-code  { background:rgba(102,126,234,.1); color:#667eea; }
    .chip-grade { background:rgba(245,158,11,.12); color:#d97706; }

    .course-action { flex-shrink:0; }

    .unenroll-btn {
      display:flex; align-items:center; gap:.3rem;
      padding:.5rem .75rem; border-radius:10px;
      background:rgba(239,68,68,.1); color:#dc2626;
      border:1px solid rgba(239,68,68,.2);
      font-size:.75rem; font-weight:700; cursor:pointer;
      min-height:40px; transition:background .15s; white-space:nowrap;
    }
    .unenroll-btn:disabled { opacity:.55; cursor:not-allowed; }
    .unenroll-btn:not(:disabled):hover { background:rgba(239,68,68,.2); }

    .pending-badge {
      display:flex; align-items:center; gap:.3rem;
      font-size:.7rem; font-weight:700; color:#d97706;
      background:rgba(245,158,11,.1); padding:.35rem .6rem;
      border-radius:10px; border:1px solid rgba(245,158,11,.2);
      white-space:nowrap;
    }

    /* Selectable */
    .selectable-card { cursor:pointer; -webkit-tap-highlight-color:transparent; }
    .selectable-card:active { transform:scale(.99); }
    .selectable-card.selected { border-color:rgba(102,126,234,.35); background:rgba(102,126,234,.03); }

    .select-box {
      width:24px; height:24px; border-radius:7px; flex-shrink:0;
      border:2px solid #d1d5db;
      display:flex; align-items:center; justify-content:center;
      font-size:.75rem; color:#fff; transition:all .15s;
    }
    .select-box.checked { background:#667eea; border-color:#667eea; }

    /* ── Sticky enroll button ── */
    .sticky-enroll {
      position:fixed; bottom:calc(68px + env(safe-area-inset-bottom,0px));
      left:1rem; right:1rem;
      z-index:800;
    }
    .enroll-btn {
      width:100%; padding:.9rem 1.5rem;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; border-radius:16px;
      font-size:.95rem; font-weight:800; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      box-shadow:0 8px 24px rgba(102,126,234,.4);
      min-height:52px; transition:opacity .15s;
    }
    .enroll-btn:disabled { opacity:.7; cursor:not-allowed; }

    /* ── Empty & shimmer ── */
    .shimmer-area { padding:.875rem 1rem 0; display:flex; flex-direction:column; gap:.5rem; }
    .shimmer-filters {
      height:44px; border-radius:12px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    .shimmer-card {
      height:80px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-filter { text-align:center; padding:2rem 1rem; color:#9090aa; }
    .empty-filter i { font-size:2rem; display:block; margin-bottom:.75rem; color:#c4c4d4; }
    .empty-filter p { font-size:.9rem; font-weight:600; margin:0; }

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
    .empty-state p   { font-size:.85rem; color:#9090aa; margin:0; }

    .spinner {
      width:16px; height:16px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class TeacherSelfEnrollComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);

  courses = signal<TeacherEnrolledCourseDto[]>([]);
  selectedCourseIds = signal<string[]>([]);
  loading = signal(false);
  submitting = signal(false);
  requestingUnenroll = signal<string | null>(null);
  enrollResult = signal<TeacherEnrollmentResultDto | null>(null);
  unenrollMsg = signal<string | null>(null);
  unenrollMsgSuccess = signal(false);

  searchText = signal('');
  selectedGrade = signal('');
  showEnrolledOnly = signal(false);
  searchTextValue = '';
  gradeFilterValue = '';

  availableGrades = computed(() =>
    [...new Set(this.courses().map(c => c.gradeName).filter(Boolean) as string[])].sort()
  );

  filteredCourses = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    const grade = this.selectedGrade();
    const enrolledOnly = this.showEnrolledOnly();
    return this.courses().filter(c => {
      const matchName = !q ||
        (c.nameAr ?? '').toLowerCase().includes(q) ||
        (c.nameEn ?? '').toLowerCase().includes(q) ||
        (c.code ?? '').toLowerCase().includes(q);
      const matchGrade = !grade || c.gradeName === grade;
      const matchEnrolled = !enrolledOnly || c.isEnrolled;
      return matchName && matchGrade && matchEnrolled;
    });
  });

  toggleEnrolledOnly() { this.showEnrolledOnly.update(v => !v); }

  async ngOnInit() {
    await this.loadCourses();
  }

  private async loadCourses() {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.teacherService.getCoursesWithEnrollmentStatus({ skipHandleError: true })
      );
      this.courses.set(res ?? []);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      this.loading.set(false);
    }
  }

  toggleCourse(courseId: string) {
    const course = this.courses().find(c => c.id === courseId);
    if (course?.isEnrolled) return; // Can't select enrolled courses for re-enrollment
    this.selectedCourseIds.update(ids =>
      ids.includes(courseId) ? ids.filter(id => id !== courseId) : [...ids, courseId]
    );
  }

  isSelected(courseId: string): boolean {
    return this.selectedCourseIds().includes(courseId);
  }

  async submitEnrollment() {
    if (this.selectedCourseIds().length === 0) return;
    this.submitting.set(true);
    this.enrollResult.set(null);
    try {
      const res = await lastValueFrom(
        this.teacherService.selfEnrollInCourses(this.selectedCourseIds(), { skipHandleError: true })
      );
      this.enrollResult.set(res);
      if (res.success) {
        this.selectedCourseIds.set([]);
        await this.loadCourses(); // Refresh to show newly enrolled courses
      }
    } catch (err) {
      console.error('Error enrolling:', err);
      this.enrollResult.set({
        success: false,
        message: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.',
        enrolledCourses: [],
        alreadyEnrolledCourses: [],
        failedCourses: [],
      });
    } finally {
      this.submitting.set(false);
    }
  }

  async requestUnenroll(course: TeacherEnrolledCourseDto) {
    this.requestingUnenroll.set(course.id!);
    this.unenrollMsg.set(null);
    try {
      await lastValueFrom(
        this.teacherService.requestUnenrollFromCourse(course.id!, { skipHandleError: true })
      );
      this.unenrollMsgSuccess.set(true);
      this.unenrollMsg.set(`تم إرسال طلب إلغاء التسجيل من مقرر "${course.nameAr}". سيتم إلغاء تسجيلك بعد موافقة المشرف.`);
      // Update local state to show pending badge immediately
      this.courses.update(list =>
        list.map(c => c.id === course.id ? { ...c, pendingUnenrollStatus: 0 } : c)
      );
    } catch (err: any) {
      this.unenrollMsgSuccess.set(false);
      const msg = err?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
      this.unenrollMsg.set(msg);
    } finally {
      this.requestingUnenroll.set(null);
    }
  }

  goBack() {
    this.router.navigate(['/teacher']);
  }

  trackById = (_: number, item: TeacherEnrolledCourseDto) => item.id;
}
