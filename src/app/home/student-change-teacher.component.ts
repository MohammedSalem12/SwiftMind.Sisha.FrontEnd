import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TeacherService } from '@proxy/teachers';
import { GroupService } from '@proxy/groups';
import { StudentService } from '@proxy/students';
import { CurrentUserInfoService } from '@proxy/common';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';

@Component({
  selector: 'app-student-change-teacher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <div class="header-icon"><i class="fas fa-exchange-alt"></i></div>
          <div class="header-text">
            <h1>تغيير المعلم · Change Teacher</h1>
            <p>اختر المعلم والمجموعة الجديدة</p>
          </div>
        </div>
      </div>

      <!-- Success -->
      @if (success()) {
        <div class="success-area">
          <div class="success-icon"><i class="fas fa-check-circle"></i></div>
          <h3>تم إرسال الطلب بنجاح!</h3>
          <p>سيتم مراجعة طلبك من المعلم الجديد · Request sent to new teacher</p>
          <button class="back-btn-lg" (click)="goBack()">
            <i class="fas fa-home"></i> العودة · Back
          </button>
        </div>
      }

      @if (!success()) {
        <!-- Current teacher info -->
        @if (currentTeacherName()) {
          <div class="current-teacher-bar">
            <i class="fas fa-user-check"></i>
            <span>المعلم الحالي · Current: <strong>{{ currentTeacherName() }}</strong></span>
          </div>
        }

        <!-- Step 1: Select Teacher -->
        @if (!selectedTeacher()) {
          <div class="section-title"><i class="fas fa-chalkboard-teacher"></i> اختر المعلم الجديد · Select New Teacher</div>

          @if (loading()) {
            <div class="shimmer-area">
              @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
            </div>
          }

          @if (!loading() && teachers().length === 0) {
            <div class="empty-state">
              <i class="fas fa-user-slash"></i>
              <p>لا يوجد معلمون آخرون لهذا المقرر</p>
              <small>No other teachers available for this course</small>
            </div>
          }

          @if (!loading() && teachers().length > 0) {
            <div class="list">
              @for (t of teachers(); track t.id) {
                <button class="teacher-card" (click)="selectTeacher(t)">
                  <div class="tc-avatar">{{ getInitials(t.displayName) }}</div>
                  <div class="tc-info">
                    <span class="tc-name">{{ t.displayName }}</span>
                  </div>
                  <i class="fas fa-chevron-left tc-arrow"></i>
                </button>
              }
            </div>
          }
        }

        <!-- Step 2: Select Group -->
        @if (selectedTeacher()) {
          <div class="selected-bar">
            <div class="sb-avatar">{{ getInitials(selectedTeacher()!.displayName) }}</div>
            <span class="sb-name">{{ selectedTeacher()!.displayName }}</span>
            <button class="sb-change" (click)="selectedTeacher.set(null)">تغيير</button>
          </div>

          <div class="section-title"><i class="fas fa-users"></i> اختر المجموعة · Select Group</div>

          <!-- Reason -->
          <div class="reason-field">
            <label><i class="fas fa-comment-dots"></i> سبب الانتقال (اختياري) · Reason</label>
            <input type="text" [(ngModel)]="reason" placeholder="مثال: تغيير الموعد · e.g. schedule change" />
          </div>

          @if (loadingGroups()) {
            <div class="shimmer-area">
              <div class="shimmer-card"></div>
            </div>
          }

          @if (!loadingGroups() && groups().length === 0) {
            <div class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>لا توجد مجموعات متاحة</p>
            </div>
          }

          @if (!loadingGroups() && groups().length > 0) {
            <div class="list">
              @for (g of groups(); track g.groupId) {
                <div class="group-card">
                  <div class="gc-name">{{ g.name }}</div>
                  @if (g.schedules?.length) {
                    <div class="gc-schedules">
                      @for (s of g.schedules; track s.dayOfWeek) {
                        <span class="gc-schedule">
                          <i class="fas fa-calendar-day"></i>
                          {{ getDayName(s.dayOfWeek) }} {{ formatTime(s.startTime) }}-{{ formatTime(s.endTime) }}
                        </span>
                      }
                    </div>
                  }
                  <button class="gc-btn" [disabled]="submitting()" (click)="submitRequest(g)">
                    @if (submitting()) { <span class="spinner"></span> }
                    @else { <i class="fas fa-paper-plane"></i> }
                    إرسال الطلب · Send Request
                  </button>
                </div>
              }
            </div>
          }
        }
      }

      <!-- Error -->
      @if (error()) {
        <div class="error-bar">
          <i class="fas fa-exclamation-triangle"></i> {{ error() }}
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    .page-header {
      background:linear-gradient(135deg,#667eea,#764ba2);
      padding:calc(env(safe-area-inset-top,0px) + .75rem) 1.25rem 1rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:180px; height:180px; top:-60px; right:-50px; }
    .b2 { width:120px; height:120px; bottom:-40px; left:-25px; }
    .header-row { position:relative; z-index:1; display:flex; align-items:center; gap:.75rem; }
    .header-icon {
      width:42px; height:42px; border-radius:50%;
      background:rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center;
      font-size:1rem; color:white; flex-shrink:0;
    }
    .header-text h1 { margin:0; font-size:1.1rem; font-weight:800; color:white; }
    .header-text p { margin:.1rem 0 0; font-size:.72rem; color:rgba(255,255,255,.65); }

    .current-teacher-bar {
      margin:.5rem 1rem 0; padding:.6rem .85rem; border-radius:10px;
      background:rgba(102,126,234,.06); border:1.5px solid rgba(102,126,234,.15);
      font-size:.82rem; color:#4a4a6a; display:flex; align-items:center; gap:.5rem;
      i { color:#667eea; flex-shrink:0; }
      strong { color:#1a1a2e; }
    }

    .section-title {
      display:flex; align-items:center; gap:.4rem;
      padding:.75rem 1rem .4rem; font-size:.82rem; font-weight:700; color:#4a4a6a;
      i { color:#667eea; font-size:.8rem; }
    }

    .shimmer-area { padding:0 1rem; display:flex; flex-direction:column; gap:.5rem; }
    .shimmer-card {
      height:72px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state { text-align:center; padding:3rem 1.5rem; color:#9090aa; }
    .empty-state i { font-size:2rem; color:#c4c4d4; display:block; margin-bottom:.5rem; }
    .empty-state p { font-size:.9rem; color:#555; margin:0; }
    .empty-state small { font-size:.75rem; }

    .list { padding:0 1rem; display:flex; flex-direction:column; gap:.5rem; }

    .teacher-card {
      display:flex; align-items:center; gap:.75rem; padding:.85rem;
      background:white; border-radius:14px; border:1.5px solid #f0f0f5;
      box-shadow:0 2px 6px rgba(0,0,0,.04); cursor:pointer;
      transition:all .15s; min-height:60px; width:100%; border:none; text-align:right;
      &:active { transform:scale(.98); }
    }
    .tc-avatar {
      width:42px; height:42px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; font-size:.9rem; font-weight:700;
      display:flex; align-items:center; justify-content:center;
    }
    .tc-info { flex:1; min-width:0; }
    .tc-name { font-size:.9rem; font-weight:700; color:#1a1a2e; }
    .tc-arrow { color:#c4c4d4; font-size:.8rem; flex-shrink:0; }

    .selected-bar {
      display:flex; align-items:center; gap:.6rem;
      margin:.5rem 1rem; padding:.6rem .85rem;
      background:white; border-radius:12px; border:1.5px solid rgba(102,126,234,.2);
    }
    .sb-avatar {
      width:34px; height:34px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; font-size:.75rem; font-weight:700;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .sb-name { flex:1; font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .sb-change {
      background:none; border:1.5px solid #667eea; color:#667eea;
      border-radius:8px; padding:.25rem .6rem; font-size:.72rem; font-weight:600; cursor:pointer;
    }

    .reason-field {
      margin:.25rem 1rem .5rem;
      label {
        display:flex; align-items:center; gap:.3rem;
        font-size:.75rem; font-weight:600; color:#4a4a6a; margin-bottom:.3rem;
        i { color:#667eea; font-size:.7rem; }
      }
      input {
        width:100%; padding:.6rem .85rem; border:1.5px solid #e5e7eb;
        border-radius:12px; font-size:16px; box-sizing:border-box;
        font-family:inherit; background:white;
        &:focus { outline:none; border-color:#667eea; }
        &::placeholder { color:#b0b0c0; font-size:.82rem; }
      }
    }

    .group-card {
      background:white; border-radius:14px; padding:.85rem;
      border:1.5px solid #f0f0f5; box-shadow:0 2px 6px rgba(0,0,0,.04);
    }
    .gc-name { font-size:.9rem; font-weight:700; color:#1a1a2e; margin-bottom:.4rem; }
    .gc-schedules { display:flex; flex-wrap:wrap; gap:.3rem; margin-bottom:.6rem; }
    .gc-schedule {
      font-size:.68rem; font-weight:600; color:#4a4a6a;
      background:#f4f3ff; padding:.2rem .5rem; border-radius:6px;
      display:flex; align-items:center; gap:.2rem;
      i { color:#764ba2; font-size:.6rem; }
    }
    .gc-btn {
      width:100%; padding:.65rem; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; border:none; font-size:.85rem; font-weight:700;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.4rem;
      min-height:44px;
      &:disabled { opacity:.6; cursor:not-allowed; }
      &:active:not(:disabled) { transform:scale(.98); }
    }

    .error-bar {
      margin:.5rem 1rem; padding:.6rem .85rem; border-radius:10px;
      background:#fef2f2; border:1px solid #fecaca; color:#dc2626;
      font-size:.82rem; display:flex; align-items:center; gap:.4rem;
    }

    .success-area {
      display:flex; flex-direction:column; align-items:center;
      padding:3rem 1.5rem; text-align:center;
    }
    .success-icon { font-size:3.5rem; color:#22c55e; margin-bottom:1rem; animation:popIn .4s ease; }
    @keyframes popIn { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
    .success-area h3 { font-size:1.1rem; font-weight:700; color:#1a1a2e; margin:0 0 .25rem; }
    .success-area p { font-size:.82rem; color:#9090aa; margin:0 0 1.5rem; }
    .back-btn-lg {
      display:flex; align-items:center; gap:.4rem;
      padding:.7rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; border:none; font-size:.88rem; font-weight:700; cursor:pointer;
    }

    .spinner {
      width:14px; height:14px; border:2px solid rgba(255,255,255,.4);
      border-top-color:white; border-radius:50%; animation:spin .7s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class StudentChangeTeacherComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);
  private readonly groupService = inject(GroupService);
  private readonly studentService = inject(StudentService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);

  courseId = '';
  loading = signal(true);
  loadingGroups = signal(false);
  submitting = signal(false);
  success = signal(false);
  error = signal<string | null>(null);
  teachers = signal<TeacherAutocompleteDto[]>([]);
  groups = signal<GroupWithSchedulesDto[]>([]);
  selectedTeacher = signal<TeacherAutocompleteDto | null>(null);
  currentTeacherName = signal<string | null>(null);
  reason = '';

  private studentId = '';
  private enrollmentId = '';
  private currentTeacherId = '';

  async ngOnInit(): Promise<void> {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    try {
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.studentId = userInfo?.actorId || '';

      // Load current enrollment to get current teacher ID
      const requests = await lastValueFrom(
        this.enrollmentRequestService.getRequestsForCurrentStudent()
      ).catch(() => [] as any[]);
      const currentEnrollment = (requests as any[]).find(
        (r: any) => r.courseId === this.courseId && r.status === EnrollmentRequestStatus.Approved
      );
      if (currentEnrollment) {
        this.currentTeacherId = currentEnrollment.teacherId || '';
        this.enrollmentId = currentEnrollment.id || '';
        this.currentTeacherName.set(currentEnrollment.teacherName || null);
      }

      // Load teachers for this course, excluding current teacher
      const allTeachers = await lastValueFrom(
        this.teacherService.getTeachersByCourse(this.courseId, undefined, 100)
      );
      const filtered = (allTeachers || []).filter(t => t.id !== this.currentTeacherId);
      this.teachers.set(filtered);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async selectTeacher(teacher: TeacherAutocompleteDto): Promise<void> {
    this.selectedTeacher.set(teacher);
    this.loadingGroups.set(true);
    this.error.set(null);
    try {
      const groups = await lastValueFrom(
        this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId)
      );
      this.groups.set(groups || []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل المجموعات');
    } finally {
      this.loadingGroups.set(false);
    }
  }

  async submitRequest(group: GroupWithSchedulesDto): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(
        this.studentService.requestGroupChange({
          studentId: this.studentId,
          courseId: this.courseId,
          enrollmentId: this.enrollmentId || this.studentId, // fallback
          toGroupId: group.groupId!,
          reason: this.reason || undefined,
        } as any)
      );
      this.success.set(true);
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      this.submitting.set(false);
    }
  }

  getInitials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getDayName(d: number): string {
    return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d] || '';
  }

  formatTime(t?: string): string {
    if (!t) return '';
    const p = t.split(':');
    if (p.length >= 2) {
      const h = parseInt(p[0]);
      return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${p[1]} ${h >= 12 ? 'م' : 'ص'}`;
    }
    return t;
  }

  goBack(): void { this.router.navigate(['/student']); }
}
