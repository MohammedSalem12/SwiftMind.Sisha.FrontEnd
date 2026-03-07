import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TeacherService } from '@proxy/teachers';
import type { TeacherEnrolledCourseDto, TeacherEnrollmentResultDto } from '@proxy/teachers';
import { UnenrollRequestStatus } from '@proxy/teachers';


@Component({
  selector: 'app-teacher-self-enroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="self-enroll-page">
      <div class="container py-4">
        <!-- Header -->
        <div class="page-header mb-4">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-outline-light btn-sm back-btn" (click)="goBack()">
              <i class="fas fa-arrow-right"></i>
            </button>
            <div>
              <h1 class="mb-1">التسجيل في المقررات</h1>
              <p class="mb-0 opacity-75">اختر المقررات التي تريد التسجيل فيها</p>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
          <p class="mt-2 text-muted">جاري تحميل المقررات...</p>
        </div>

        <!-- Enroll Result Message -->
        <div *ngIf="enrollResult()" class="result-card mb-4"
             [class.success]="enrollResult()!.success"
             [class.error]="!enrollResult()!.success">
          <div class="result-icon">
            <i [class]="enrollResult()!.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
          </div>
          <div class="result-body">
            <h4>{{ enrollResult()!.success ? 'تم التسجيل بنجاح' : 'تنبيه' }}</h4>
            <p>{{ enrollResult()!.message }}</p>
          </div>
          <button class="btn-close-result" (click)="enrollResult.set(null)">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Unenroll Request Result -->
        <div *ngIf="unenrollMsg()" class="result-card mb-4"
             [class.success]="unenrollMsgSuccess()"
             [class.error]="!unenrollMsgSuccess()">
          <div class="result-icon">
            <i [class]="unenrollMsgSuccess() ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
          </div>
          <div class="result-body">
            <p class="mb-0">{{ unenrollMsg() }}</p>
          </div>
          <button class="btn-close-result" (click)="unenrollMsg.set(null)">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Course List -->
        <div *ngIf="!loading() && courses().length > 0">

          <!-- Search & Grade Filter -->
          <div class="filter-bar mb-3">
            <div class="search-wrap">
              <i class="fas fa-search search-icon"></i>
              <input
                class="search-input"
                type="text"
                placeholder="ابحث باسم المقرر..."
                [(ngModel)]="searchTextValue"
                (ngModelChange)="searchText.set($event)" />
              <button *ngIf="searchText()" class="search-clear" (click)="searchText.set(''); searchTextValue = ''">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <select class="grade-select" [(ngModel)]="gradeFilterValue" (ngModelChange)="selectedGrade.set($event)">
              <option value="">كل الصفوف</option>
              <option *ngFor="let g of availableGrades()" [value]="g">{{ g }}</option>
            </select>
            <!-- Enrolled filter -->
            <button class="filter-toggle" [class.active]="showEnrolledOnly()"
                    (click)="toggleEnrolledOnly()">
              <i class="fas fa-chalkboard-teacher me-1"></i>
              مقرراتي فقط
            </button>
          </div>

          <!-- Enroll button row -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="h5 mb-0">
              المقررات
              <span class="count-badge">{{ filteredCourses().length }}</span>
              <span *ngIf="filteredCourses().length !== courses().length" class="text-muted small ms-1">
                من {{ courses().length }}
              </span>
            </h3>
            <button
              class="btn btn-primary"
              [disabled]="selectedCourseIds().length === 0 || submitting()"
              (click)="submitEnrollment()">
              <span *ngIf="submitting()" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <i *ngIf="!submitting()" class="fas fa-check me-1"></i>
              تسجيل ({{ selectedCourseIds().length }})
            </button>
          </div>

          <!-- No results -->
          <div *ngIf="filteredCourses().length === 0" class="text-center py-4">
            <i class="fas fa-search fa-2x text-muted mb-2"></i>
            <p class="text-muted">لا توجد نتائج</p>
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-6 col-lg-4"
                 *ngFor="let course of filteredCourses(); trackBy: trackById">

              <!-- ENROLLED COURSE CARD -->
              <div *ngIf="course.isEnrolled" class="course-card enrolled-card">
                <div class="enrolled-badge">
                  <i class="fas fa-check-circle"></i>
                  مسجّل
                </div>
                <div class="course-info">
                  <h5>{{ course.nameAr }}</h5>
                  <p class="text-muted mb-2">{{ course.nameEn }}</p>
                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <span class="badge bg-light text-dark">
                      <i class="fas fa-code me-1"></i>{{ course.code }}
                    </span>
                    <span *ngIf="course.gradeName" class="badge grade-badge">
                      <i class="fas fa-graduation-cap me-1"></i>{{ course.gradeName }}
                    </span>
                  </div>

                  <!-- No pending request → show button -->
                  <button
                    *ngIf="course.pendingUnenrollStatus == null"
                    class="btn btn-unenroll w-100"
                    [disabled]="requestingUnenroll() === course.id"
                    (click)="requestUnenroll(course)">
                    <span *ngIf="requestingUnenroll() === course.id"
                          class="spinner-border spinner-border-sm me-1" role="status"></span>
                    <i *ngIf="requestingUnenroll() !== course.id" class="fas fa-sign-out-alt me-1"></i>
                    طلب إلغاء التسجيل
                  </button>

                  <!-- Pending request exists -->
                  <div *ngIf="course.pendingUnenrollStatus === 0" class="unenroll-pending">
                    <i class="fas fa-hourglass-half me-1"></i>
                    بانتظار موافقة المشرف
                  </div>
                </div>
              </div>

              <!-- NON-ENROLLED COURSE CARD -->
              <div *ngIf="!course.isEnrolled"
                   class="course-card selectable-card"
                   [class.selected]="isSelected(course.id!)"
                   (click)="toggleCourse(course.id!)">
                <div class="select-indicator">
                  <i [class]="isSelected(course.id!) ? 'fas fa-check-square' : 'far fa-square'"></i>
                </div>
                <div class="course-info">
                  <h5>{{ course.nameAr }}</h5>
                  <p class="text-muted mb-1">{{ course.nameEn }}</p>
                  <div class="d-flex flex-wrap gap-2">
                    <span class="badge bg-light text-dark">
                      <i class="fas fa-code me-1"></i>{{ course.code }}
                    </span>
                    <span *ngIf="course.gradeName" class="badge grade-badge">
                      <i class="fas fa-graduation-cap me-1"></i>{{ course.gradeName }}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading() && courses().length === 0" class="text-center py-5">
          <i class="fas fa-book-open fa-3x text-muted mb-3"></i>
          <h4>لا توجد مقررات متاحة</h4>
          <p class="text-muted">لا توجد مقررات متاحة حالياً</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .self-enroll-page {
      min-height: calc(100vh - 200px);
      background: #f8f9fa;
    }

    .page-header {
      padding: 1.25rem 1.5rem;
      background: var(--ngx-hero-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      color: white;
      border-radius: 12px;
    }

    .page-header h1 { font-size: 1.5rem; font-weight: 600; }
    .back-btn { min-width: 44px; min-height: 44px; }

    /* ─── Result cards ─── */
    .result-card {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      align-items: flex-start;
      position: relative;
    }
    .result-card.success { background: #d4edda; border: 1px solid #c3e6cb; }
    .result-card.error   { background: #fff3cd; border: 1px solid #ffc107; }
    .result-icon { font-size: 1.5rem; }
    .result-card.success .result-icon { color: #28a745; }
    .result-card.error .result-icon   { color: #ffc107; }
    .result-body { flex: 1; }
    .result-body h4 { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
    .result-body p  { margin: 0; font-size: 0.9rem; }
    .btn-close-result {
      background: none; border: none; cursor: pointer;
      color: #6c757d; font-size: 0.85rem; padding: 0.25rem;
      min-width: 30px; min-height: 30px;
    }

    /* ─── Filter bar ─── */
    .filter-bar { display: flex; gap: 0.625rem; flex-wrap: wrap; align-items: center; }
    .search-wrap { flex: 1; min-width: 180px; position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; right: 0.875rem; color: #9090aa; font-size: 0.85rem; pointer-events: none; }
    .search-input {
      width: 100%; padding: 0.625rem 2.25rem 0.625rem 2rem;
      border: 1.5px solid #e2e4f0; border-radius: 12px; font-size: 0.9rem;
      background: white; outline: none; direction: rtl; transition: border-color 0.15s;
    }
    .search-input:focus { border-color: #667eea; }
    .search-clear { position: absolute; left: 0.625rem; background: none; border: none; color: #9090aa; cursor: pointer; padding: 0.25rem; font-size: 0.8rem; }
    .grade-select {
      padding: 0.625rem 0.875rem; border: 1.5px solid #e2e4f0; border-radius: 12px;
      font-size: 0.875rem; background: white; outline: none; cursor: pointer;
      direction: rtl; min-width: 130px; transition: border-color 0.15s;
    }
    .grade-select:focus { border-color: #667eea; }
    .filter-toggle {
      padding: 0.625rem 0.875rem; border: 1.5px solid #e2e4f0; border-radius: 12px;
      font-size: 0.875rem; background: white; cursor: pointer; white-space: nowrap;
      transition: all 0.15s;
    }
    .filter-toggle.active { background: #667eea; color: white; border-color: #667eea; }

    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: rgba(102,126,234,.12); color: #667eea;
      font-size: 0.78rem; font-weight: 700; padding: 0.1rem 0.5rem;
      border-radius: 20px; margin-right: 0.4rem;
    }

    /* ─── Course Cards ─── */
    .course-card {
      background: white; border-radius: 12px; padding: 1.25rem;
      height: 100%; border: 2px solid #e5e7eb; transition: all 0.2s ease;
    }

    /* Enrolled card */
    .enrolled-card { border-color: #28a745; position: relative; overflow: hidden; }
    .enrolled-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #28a745, #20c997);
    }
    .enrolled-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white; font-size: 0.78rem; font-weight: 600;
      padding: 0.25rem 0.625rem; border-radius: 20px; margin-bottom: 0.75rem;
    }

    /* Selectable card */
    .selectable-card { cursor: pointer; display: flex; gap: 1rem; }
    .selectable-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,.15); }
    .selectable-card.selected { border-color: #667eea; background: #f0f0ff; }
    .select-indicator { font-size: 1.5rem; color: #667eea; padding-top: 0.25rem; flex-shrink: 0; }

    .course-info h5 { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }

    /* Unenroll button */
    .btn-unenroll {
      background: linear-gradient(135deg, #dc3545, #c0392b); color: white; border: none;
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: opacity 0.2s; min-height: 44px;
    }
    .btn-unenroll:disabled { opacity: 0.65; cursor: not-allowed; }

    .unenroll-pending {
      text-align: center; padding: 0.5rem;
      background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;
      color: #856404; font-size: 0.85rem; font-weight: 600;
    }

    /* Enroll button */
    .btn-primary {
      background: var(--ngx-hero-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      border: none; padding: 0.5rem 1.5rem; border-radius: 8px; min-height: 44px;
    }

    .grade-badge {
      font-size: 0.85rem !important; font-weight: 600 !important;
      padding: 0.3rem 0.6rem !important;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
      color: white !important; border-radius: 6px;
    }
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
