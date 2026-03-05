import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';
import { lastValueFrom } from 'rxjs';

type Step = 'course' | 'teacher' | 'group' | 'success';

@Component({
  selector: 'app-parent-enroll-child',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="enroll-page" dir="rtl">

      <!-- Hero Header -->
      <div class="hero-header">
        <button class="back-btn" (click)="onBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="hero-text">
          <h1><i class="fas fa-user-plus me-2"></i>تسجيل في مقرر</h1>
          <p *ngIf="student()">{{ getStudentName() }} — {{ student()!.studentCode }} · الصف {{ student()!.currentGrade }}</p>
          <p *ngIf="!student()">تسجيل ابنك في مقرر دراسي</p>
        </div>
      </div>

      <!-- Step Indicator -->
      <div class="step-bar" *ngIf="step() !== 'success'">
        <div class="step-item" [class.active]="step() === 'course'" [class.done]="step() !== 'course'">
          <div class="step-dot"><i class="fas fa-book"></i></div>
          <span>المقرر</span>
        </div>
        <div class="step-line" [class.done]="step() === 'teacher' || step() === 'group'"></div>
        <div class="step-item" [class.active]="step() === 'teacher'" [class.done]="step() === 'group'">
          <div class="step-dot"><i class="fas fa-chalkboard-teacher"></i></div>
          <span>المعلم</span>
        </div>
        <div class="step-line" [class.done]="step() === 'group'"></div>
        <div class="step-item" [class.active]="step() === 'group'">
          <div class="step-dot"><i class="fas fa-users"></i></div>
          <span>المجموعة</span>
        </div>
      </div>

      <!-- Breadcrumb context -->
      <div class="context-bar" *ngIf="selectedCourse() && step() !== 'course'">
        <button class="crumb-btn" (click)="backToCourses()">
          <i class="fas fa-book me-1"></i>{{ selectedCourse()!.nameAr || selectedCourse()!.nameEn || selectedCourse()!.id }}
          <i class="fas fa-times-circle ms-1 crumb-clear"></i>
        </button>
        <i class="fas fa-chevron-left crumb-sep"></i>
        <button class="crumb-btn" *ngIf="selectedTeacher() && step() !== 'teacher'" (click)="backToTeachers()">
          <i class="fas fa-chalkboard-teacher me-1"></i>{{ selectedTeacher()!.nameArabic || selectedTeacher()!.displayName }}
          <i class="fas fa-times-circle ms-1 crumb-clear"></i>
        </button>
        <span class="crumb-current" *ngIf="step() === 'teacher'">اختر المعلم</span>
        <span class="crumb-current" *ngIf="step() === 'group'">
          <i class="fas fa-chevron-left crumb-sep"></i> اختر المجموعة
        </span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Error -->
      <div *ngIf="errorMessage() && !loading()" class="error-banner">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
        <button class="dismiss-btn" (click)="errorMessage.set('')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- STEP 1: Course -->
      <div *ngIf="!loading() && step() === 'course'" class="step-content">
        <div class="step-title">اختر المقرر الدراسي</div>

        <div *ngIf="courses().length === 0" class="empty-state">
          <i class="fas fa-book-open"></i>
          <p *ngIf="student()?.currentGrade">لا توجد مقررات للصف {{ student()!.currentGrade }}</p>
          <p *ngIf="!student()?.currentGrade">لا توجد مقررات متاحة حالياً</p>
        </div>

        <div class="cards-list">
          <div *ngFor="let course of courses()" class="select-card" (click)="selectCourse(course)">
            <div class="card-icon"><i class="fas fa-book-open"></i></div>
            <div class="card-info">
              <div class="card-name">{{ course.nameAr || course.nameEn }}</div>
              <div class="card-chips">
                <span class="chip grade-chip" *ngIf="course.gradeName">{{ course.gradeName }}</span>
                <span class="chip code-chip" *ngIf="course.code">{{ course.code }}</span>
              </div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-left"></i></div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Teacher -->
      <div *ngIf="!loading() && step() === 'teacher'" class="step-content">
        <div class="step-title">اختر المعلم</div>

        <div *ngIf="teachers().length === 0" class="empty-state">
          <i class="fas fa-chalkboard-teacher"></i>
          <p>لا يوجد معلمون لهذا المقرر حالياً</p>
        </div>

        <div class="cards-list">
          <div *ngFor="let teacher of teachers()" class="select-card" (click)="selectTeacher(teacher)">
            <div class="card-icon teacher-icon"><i class="fas fa-chalkboard-teacher"></i></div>
            <div class="card-info">
              <div class="card-name">{{ teacher.nameArabic || teacher.displayName }}</div>
              <div class="card-chips" *ngIf="teacher.code">
                <span class="chip code-chip">{{ teacher.code }}</span>
              </div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-left"></i></div>
          </div>
        </div>
      </div>

      <!-- STEP 3: Group -->
      <div *ngIf="!loading() && step() === 'group'" class="step-content">
        <div class="step-title">اختر المجموعة</div>

        <div *ngIf="groups().length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <p>لا توجد مجموعات لهذا المعلم حالياً</p>
        </div>

        <div class="group-cards-list">
          <div *ngFor="let group of groups()" class="group-card">
            <div class="group-header">
              <div class="group-icon"><i class="fas fa-users"></i></div>
              <div class="group-meta">
                <div class="group-name">{{ group.name }}</div>
                <div class="group-chips">
                  <span class="chip code-chip" *ngIf="group.groupCode">{{ group.groupCode }}</span>
                  <span class="chip sessions-chip" *ngIf="group.schedules?.length">
                    <i class="fas fa-calendar-alt me-1"></i>{{ group.schedules.length }} حصة/أسبوع
                  </span>
                </div>
              </div>
            </div>

            <div class="schedules" *ngIf="group.schedules?.length">
              <div class="schedule-row" *ngFor="let s of group.schedules">
                <span class="day-chip">{{ getDayName(s.dayOfWeek) }}</span>
                <span class="time">
                  <i class="fas fa-clock me-1"></i>{{ formatTime(s.startTime) }} — {{ formatTime(s.endTime) }}
                </span>
                <span class="location" *ngIf="s.location">
                  <i class="fas fa-map-marker-alt me-1"></i>{{ s.location }}
                </span>
              </div>
            </div>

            <button class="btn-enroll" (click)="selectGroup(group)" [disabled]="submitting()">
              <span *ngIf="!submitting()"><i class="fas fa-user-plus me-1"></i> تسجيل في هذه المجموعة</span>
              <span *ngIf="submitting()"><i class="fas fa-spinner fa-spin me-1"></i> جاري الإرسال...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- SUCCESS -->
      <div *ngIf="step() === 'success'" class="success-state">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h2>تم إرسال طلب التسجيل!</h2>
        <p>سيتم مراجعة الطلب من قبل المعلم والموافقة عليه قريباً.</p>
        <div class="success-details">
          <div class="success-row" *ngIf="selectedCourse()">
            <i class="fas fa-book me-2"></i>
            {{ selectedCourse()!.nameAr || selectedCourse()!.nameEn }}
          </div>
          <div class="success-row" *ngIf="selectedTeacher()">
            <i class="fas fa-chalkboard-teacher me-2"></i>
            {{ selectedTeacher()!.nameArabic || selectedTeacher()!.displayName }}
          </div>
          <div class="success-row" *ngIf="selectedGroup()">
            <i class="fas fa-users me-2"></i>
            {{ selectedGroup()!.name }}
          </div>
        </div>
        <button class="btn-done" (click)="goBack()">
          <i class="fas fa-arrow-right me-1"></i> العودة لصفحة الطالب
        </button>
      </div>

    </div>
  `,
  styles: [`
    .enroll-page {
      min-height: 100vh;
      background: #f4f6fb;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* ── Hero ─────────────────────────────────────────────── */
    .hero-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .back-btn {
      background: rgba(255,255,255,0.2);
      border: none; color: white;
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; cursor: pointer; flex-shrink: 0;
      touch-action: manipulation;
    }
    .hero-text {
      flex: 1;
      h1 { font-size: 1.1rem; font-weight: 700; color: white; margin: 0 0 0.15rem; }
      p  { font-size: 0.8rem; color: rgba(255,255,255,0.85); margin: 0; }
    }

    /* ── Step Bar ─────────────────────────────────────────── */
    .step-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.875rem 1rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      gap: 0;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      .step-dot {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex; align-items: center; justify-content: center;
        i { font-size: 0.85rem; color: #a0aec0; }
        transition: background 0.2s;
      }
      span {
        font-size: 0.68rem;
        color: #a0aec0;
        white-space: nowrap;
      }
      &.active .step-dot {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        i { color: white; }
      }
      &.active span { color: #667eea; font-weight: 600; }
      &.done .step-dot {
        background: #48bb78;
        i { color: white; }
      }
      &.done span { color: #38a169; }
    }
    .step-line {
      flex: 1; max-width: 40px;
      height: 2px; background: #e2e8f0;
      margin: 0 0.25rem;
      margin-bottom: 1.25rem;
      &.done { background: #48bb78; }
    }

    /* ── Breadcrumb Context ───────────────────────────────── */
    .context-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      background: #edf2ff;
      flex-wrap: wrap;
    }
    .crumb-btn {
      background: none; border: none;
      font-size: 0.78rem; color: #667eea;
      padding: 0.2rem 0.4rem;
      border-radius: 4px; cursor: pointer;
      display: flex; align-items: center; gap: 0.2rem;
      &:hover { background: rgba(102,126,234,0.1); }
      .crumb-clear { color: #a0aec0; font-size: 0.7rem; }
    }
    .crumb-sep { font-size: 0.65rem; color: #a0aec0; }
    .crumb-current { font-size: 0.78rem; color: #718096; }

    /* ── States ───────────────────────────────────────────── */
    .loading-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.75rem; padding: 3rem 1rem;
      color: #718096;
      p { font-size: 0.9rem; margin: 0; }
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      margin: 0.75rem 1rem;
      background: #fff5f5; color: #c53030;
      border: 1px solid #feb2b2;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.88rem;
      .dismiss-btn {
        margin-right: auto; background: none; border: none;
        color: #c53030; cursor: pointer; font-size: 0.85rem;
        padding: 0;
      }
    }

    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.75rem; padding: 3rem 1rem;
      color: #a0aec0;
      i { font-size: 2.5rem; }
      p { font-size: 0.9rem; margin: 0; }
    }

    /* ── Step Content ─────────────────────────────────────── */
    .step-content { padding: 1rem; }

    .step-title {
      font-size: 0.9rem; font-weight: 600;
      color: #4a5568; margin-bottom: 0.75rem;
    }

    /* Course & Teacher cards */
    .cards-list { display: flex; flex-direction: column; gap: 0.6rem; }

    .select-card {
      background: white;
      border-radius: 12px;
      padding: 0.875rem 1rem;
      display: flex; align-items: center; gap: 0.75rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07);
      cursor: pointer;
      touch-action: manipulation;
      transition: box-shadow 0.15s, transform 0.15s;
      &:active { transform: scale(0.98); }
      &:hover  { box-shadow: 0 3px 12px rgba(102,126,234,0.18); }

      .card-icon {
        width: 42px; height: 42px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        i { color: white; font-size: 1rem; }
        &.teacher-icon {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        }
      }

      .card-info {
        flex: 1;
        .card-name { font-size: 0.95rem; font-weight: 600; color: #1a202c; }
      }

      .card-arrow i { color: #cbd5e0; font-size: 0.85rem; }
    }

    /* Chips shared */
    .card-chips, .group-chips {
      display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.3rem;
    }
    .chip {
      font-size: 0.68rem; font-weight: 600;
      padding: 0.15rem 0.45rem; border-radius: 4px;
      display: inline-flex; align-items: center;
    }
    .grade-chip { background: #edf2ff; color: #667eea; }
    .code-chip  { background: #f0fff4; color: #38a169; }
    .sessions-chip { background: #fff8e1; color: #b7791f; }

    /* Group cards */
    .group-cards-list { display: flex; flex-direction: column; gap: 0.875rem; }

    .group-card {
      background: white;
      border-radius: 14px;
      padding: 1.1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);

      .group-header {
        display: flex; align-items: center; gap: 0.75rem;
        margin-bottom: 0.875rem;

        .group-icon {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          i { color: white; font-size: 1rem; }
        }
        .group-meta {
          .group-name { font-size: 0.95rem; font-weight: 700; color: #1a202c; }
          .group-code { font-size: 0.75rem; color: #a0aec0; margin-top: 0.1rem; }
        }
      }

      .schedules {
        display: flex; flex-direction: column; gap: 0.4rem;
        margin-bottom: 0.875rem;
      }
      .schedule-row {
        display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
        background: #f7fafc;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }
      .day-chip {
        background: #edf2ff; color: #667eea;
        padding: 0.15rem 0.5rem; border-radius: 4px;
        font-weight: 600; font-size: 0.75rem;
      }
      .time { color: #4a5568; }
      .location { color: #718096; }
    }

    .btn-enroll {
      width: 100%;
      padding: 0.7rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border: none;
      border-radius: 10px; font-size: 0.9rem; font-weight: 500;
      cursor: pointer; touch-action: manipulation;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
      &:not(:disabled):hover { opacity: 0.92; }
    }

    /* ── Success ──────────────────────────────────────────── */
    .success-state {
      display: flex; flex-direction: column;
      align-items: center; text-align: center;
      padding: 2.5rem 1.5rem; gap: 0.75rem;

      .success-icon i {
        font-size: 4rem; color: #48bb78;
        filter: drop-shadow(0 4px 12px rgba(72,187,120,0.3));
      }
      h2 { font-size: 1.25rem; font-weight: 700; color: #1a202c; margin: 0; }
      p  { font-size: 0.88rem; color: #718096; margin: 0; }
    }
    .success-details {
      background: #f7fafc; border-radius: 12px;
      padding: 1rem 1.25rem; width: 100%;
      display: flex; flex-direction: column; gap: 0.6rem;
      .success-row {
        font-size: 0.88rem; color: #4a5568;
        display: flex; align-items: center;
        i { color: #667eea; width: 20px; }
      }
    }
    .btn-done {
      width: 100%; max-width: 300px;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border: none;
      border-radius: 12px; font-size: 0.95rem; font-weight: 600;
      cursor: pointer; margin-top: 0.5rem;
    }

    @media (min-width: 480px) {
      .step-content, .success-state { max-width: 480px; margin: 0 auto; }
    }
  `]
})
export class ParentEnrollChildComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly groupService = inject(GroupService);
  private readonly teacherService = inject(TeacherService);
  private readonly studentService = inject(StudentService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);

  studentId      = signal<string>('');
  student        = signal<StudentDto | null>(null);
  courses        = signal<CourseDto[]>([]);
  teachers       = signal<TeacherAutocompleteDto[]>([]);
  groups         = signal<GroupWithSchedulesDto[]>([]);
  selectedCourse = signal<CourseDto | null>(null);
  selectedTeacher= signal<TeacherAutocompleteDto | null>(null);
  selectedGroup  = signal<GroupWithSchedulesDto | null>(null);
  step           = signal<Step>('course');
  loading        = signal(false);
  submitting     = signal(false);
  errorMessage   = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('studentId');
    if (!id) { this.router.navigate(['/parent']); return; }
    this.studentId.set(id);
    await this.loadStudent(id);
    await this.loadCourses();
  }

  private async loadStudent(id: string): Promise<void> {
    try {
      const s = await lastValueFrom(this.studentService.get(id));
      this.student.set(s);
    } catch { /* non-critical */ }
  }

  private async loadCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const grade = this.student()?.currentGrade;
      if (grade != null) {
        const res = await lastValueFrom(this.courseService.getCoursesByGrade(grade));
        this.courses.set(res ?? []);
      } else {
        // Fallback when student grade is unavailable
        const res = await lastValueFrom(this.courseService.getList({ skipCount: 0, maxResultCount: 200 }));
        this.courses.set(res.items ?? []);
      }
    } catch {
      this.errorMessage.set('حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.loading.set(false);
    }
  }

  selectCourse(course: CourseDto): void {
    this.selectedCourse.set(course);
    this.step.set('teacher');
    this.loadTeachers(course.id!);
  }

  private loadTeachers(courseId: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.teacherService.getTeachersByCourse(courseId, undefined, 100).subscribe({
      next: teachers => { this.teachers.set(teachers); this.loading.set(false); },
      error: () => { this.errorMessage.set('حدث خطأ أثناء تحميل المعلمين'); this.loading.set(false); }
    });
  }

  selectTeacher(teacher: TeacherAutocompleteDto): void {
    this.selectedTeacher.set(teacher);
    this.step.set('group');
    this.loading.set(true);
    this.errorMessage.set('');
    this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.selectedCourse()!.id!).subscribe({
      next: groups => { this.groups.set(groups); this.loading.set(false); },
      error: () => { this.errorMessage.set('حدث خطأ أثناء تحميل المجموعات'); this.loading.set(false); }
    });
  }

  selectGroup(group: GroupWithSchedulesDto): void {
    this.selectedGroup.set(group);
    this.submitEnrollmentRequest(group);
  }

  private async submitEnrollmentRequest(group: GroupWithSchedulesDto): Promise<void> {
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      await lastValueFrom(this.enrollmentRequestService.create({
        studentId: this.studentId(),
        courseId: this.selectedCourse()!.id!,
        teacherId: this.selectedTeacher()!.id!,
        groupId: group.groupId!,
        initiator: EnrollmentRequestInitiator.Parent,
      }));
      this.step.set('success');
    } catch (error: any) {
      this.errorMessage.set(error?.error?.error?.message || 'حدث خطأ أثناء إرسال طلب التسجيل');
    } finally {
      this.submitting.set(false);
    }
  }

  backToCourses(): void {
    this.selectedCourse.set(null);
    this.selectedTeacher.set(null);
    this.groups.set([]);
    this.teachers.set([]);
    this.step.set('course');
  }

  backToTeachers(): void {
    this.selectedTeacher.set(null);
    this.groups.set([]);
    this.step.set('teacher');
  }

  onBack(): void {
    if (this.step() === 'teacher') { this.backToCourses(); return; }
    if (this.step() === 'group')   { this.backToTeachers(); return; }
    this.goBack();
  }

  goBack(): void {
    this.router.navigate(['/parent/child', this.studentId()]);
  }

  getStudentName(): string {
    const s = this.student();
    return s ? [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') : '';
  }

  getDayName(dayOfWeek: number): string {
    return ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][dayOfWeek] ?? '';
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const period = h >= 12 ? 'م' : 'ص';
      const disp = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${disp}:${parts[1]} ${period}`;
    }
    return time;
  }
}
