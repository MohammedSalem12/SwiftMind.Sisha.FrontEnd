import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../shared/components/page-header.component';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { CourseService } from '@proxy/courses';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';

interface CourseInfo {
  courseName: string;
  teacherName: string;
  groupName: string;
  gradeName: string;
  schedules: { day: string; time: string }[];
}

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

@Component({
  selector: 'app-parent-child-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'نظرة عامة'" [titleEn]="'Child Overview'" [backTo]="'/parent'"></app-page-header>

      <!-- Student identity -->
      @if (student()) {
        <div class="child-id">
          <span class="child-id-name">{{ student()?.firstName }} {{ student()?.lastName }}</span>
          @if (student()?.studentCode) {
            <span class="child-id-code">{{ student()?.studentCode }}</span>
          }
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="list">
          @for (i of [1,2,3]; track i) { <div class="shimmer"></div> }
        </div>
      }

      <!-- Tabs -->
      @if (!loading() && courses().length > 0) {
        <div class="tabs">
          <button class="tab" [class.tab--active]="activeTab() === 'current'" (click)="activeTab.set('current')">
            <i class="fas fa-graduation-cap"></i> الصف الحالي · Current
          </button>
          <button class="tab" [class.tab--active]="activeTab() === 'previous'" (click)="activeTab.set('previous')">
            <i class="fas fa-history"></i> صفوف سابقة · Previous
          </button>
        </div>
      }

      <!-- Courses -->
      @if (!loading() && filteredCourses().length > 0) {
        <div class="list">
          @for (c of filteredCourses(); track $index) {
            <div class="card">
              <div class="card-top">
                <div class="card-icon"><i class="fas fa-book-open"></i></div>
                <div class="card-main">
                  <span class="card-course">{{ c.courseName }}</span>
                  <span class="card-teacher"><i class="fas fa-chalkboard-teacher"></i> {{ c.teacherName }}</span>
                  @if (c.groupName) {
                    <span class="card-group"><i class="fas fa-layer-group"></i> {{ c.groupName }}</span>
                  }
                </div>
              </div>
              @if (c.schedules.length > 0) {
                <div class="sched-row">
                  @for (s of c.schedules; track $index) {
                    <span class="sched-chip"><i class="fas fa-clock"></i> {{ s.day }} {{ s.time }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Empty -->
      @if (!loading() && filteredCourses().length === 0) {
        <div class="empty">
          <i class="fas fa-book"></i>
          <p>لا توجد مقررات مسجلة</p>
          <span>No enrolled courses</span>
        </div>
      }

      <!-- Detail link -->
      @if (!loading()) {
        <div class="detail-wrap">
          <a class="detail-link" [routerLink]="['/parent/child', studentId]">
            <i class="fas fa-chart-bar"></i> عرض التفاصيل الكاملة — حضور، درجات، وأكثر · Full Details
          </a>
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .child-id {
      display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;
      padding:.75rem 1rem .25rem;
    }
    .child-id-name { font-size:1rem; font-weight:800; color:#1a1a2e; }
    .child-id-code {
      font-size:.72rem; color:#667eea;
      background:rgba(102,126,234,.08); border:1px solid rgba(102,126,234,.18);
      padding:.1rem .5rem; border-radius:8px;
    }

    .tabs {
      display:flex; gap:.25rem; padding:.6rem 1rem 0;
      background:#fff; margin:0 .75rem; border-radius:12px;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .tab {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.3rem;
      padding:.55rem; border:none; background:transparent; border-radius:10px;
      font-size:.78rem; font-weight:600; color:#6c757d; cursor:pointer; min-height:40px;
    }
    .tab--active {
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      box-shadow:0 2px 8px rgba(102,126,234,.3);
    }
    .tab i { font-size:.7rem; }

    .list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.6rem; }

    .card {
      background:#fff; border-radius:16px; padding:1rem;
      box-shadow:0 2px 10px rgba(0,0,0,.05); border:1.5px solid #f0f0f5;
    }
    .card-top { display:flex; align-items:flex-start; gap:.75rem; }
    .card-icon {
      width:42px; height:42px; border-radius:12px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1rem;
      box-shadow:0 3px 10px rgba(102,126,234,.25);
    }
    .card-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:.2rem; }
    .card-course { font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .card-teacher {
      font-size:.75rem; color:#6b7280; display:flex; align-items:center; gap:.25rem;
      i { font-size:.6rem; color:#667eea; }
    }
    .card-group {
      font-size:.72rem; color:#9ca3af; display:flex; align-items:center; gap:.25rem;
      i { font-size:.58rem; color:#764ba2; }
    }

    .sched-row {
      display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.6rem;
      padding-top:.5rem; border-top:1px solid #f5f5f5;
    }
    .sched-chip {
      font-size:.65rem; font-weight:600; color:#4a4a6a;
      background:#f5f3ff; padding:.2rem .5rem; border-radius:6px;
      display:flex; align-items:center; gap:.2rem;
      i { font-size:.5rem; color:#764ba2; }
    }

    .shimmer {
      height:100px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty {
      text-align:center; padding:3rem 1.5rem; color:#9ca3af;
      i { font-size:2rem; color:#d1d5db; display:block; margin-bottom:.5rem; }
      p { font-size:.9rem; color:#555; margin:0 0 .2rem; font-weight:600; }
      span { font-size:.75rem; }
    }

    .detail-wrap { padding:1rem; text-align:center; }
    .detail-link {
      display:inline-flex; align-items:center; gap:.4rem;
      font-size:.8rem; font-weight:600; color:#667eea; text-decoration:none;
      padding:.55rem 1.1rem; border-radius:10px;
      background:rgba(102,126,234,.06); border:1px solid rgba(102,126,234,.15);
    }
    .detail-link:active { background:rgba(102,126,234,.12); }
    .detail-link i { font-size:.72rem; }
  `],
})
export class ParentChildOverviewComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly studentSvc = inject(StudentService);
  private readonly enrollmentSvc = inject(EnrollmentRequestService);
  private readonly groupSvc = inject(GroupService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly courseSvc = inject(CourseService);

  studentId = '';
  student = signal<StudentDto | null>(null);
  courses = signal<CourseInfo[]>([]);
  loading = signal(true);
  activeTab = signal<'current' | 'previous'>('current');

  filteredCourses(): CourseInfo[] {
    const s = this.student();
    const currentGrade = s?.currentGrade ?? 0;
    const all = this.courses();
    const wantCurrent = this.activeTab() === 'current';
    return all.filter(c => this.isCurrentGradeCourse(c, currentGrade) === wantCurrent);
  }

  /**
   * Decide whether a course belongs to the student's *current* grade.
   * Compares grade names tolerantly (Arabic grade labels are spelled out and may
   * carry a "الصف" prefix, so exact-string / digit matching mis-buckets current
   * courses into "Previous"). A course with no grade info is treated as current.
   */
  private isCurrentGradeCourse(c: CourseInfo, currentGrade: number): boolean {
    if (!c.gradeName) return true;
    const norm = (v: string) =>
      (v || '').replace(/الصف/g, '').replace(/\s+/g, ' ').trim();
    const cur = norm(this.getGradeName(currentGrade));
    const g = norm(c.gradeName);
    if (!cur) return true;
    return g === cur || g.includes(cur) || cur.includes(g)
      || (currentGrade > 0 && g.includes(String(currentGrade)));
  }

  private getGradeName(grade: number): string {
    const names: Record<number, string> = {
      1:'الأول الابتدائي',2:'الثاني الابتدائي',3:'الثالث الابتدائي',
      4:'الرابع الابتدائي',5:'الخامس الابتدائي',6:'السادس الابتدائي',
      7:'الأول الإعدادي',8:'الثاني الإعدادي',9:'الثالث الإعدادي',
      10:'الأول الثانوي',11:'الثاني الثانوي',12:'الثالث الثانوي',
    };
    return names[grade] ?? `الصف ${grade}`;
  }

  async ngOnInit(): Promise<void> {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    if (!this.studentId) { this.router.navigate(['/parent']); return; }

    try {
      const [student, allRequests] = await Promise.all([
        lastValueFrom(this.studentSvc.get(this.studentId)).catch(() => null),
        lastValueFrom(this.enrollmentSvc.getList({ skipHandleError: true } as any)).catch(() => []),
      ]);
      this.student.set(student);

      const approved = (allRequests || []).filter(
        (r: EnrollmentRequestDto) => r.studentId === this.studentId && r.status === EnrollmentRequestStatus.Approved
      );

      // Load group schedules + teacher names for each enrollment
      const courseInfos: CourseInfo[] = [];
      for (const req of approved) {
        const schedules: { day: string; time: string }[] = [];
        let groupName = req.groupName || '';
        let teacherName = req.teacherName || '';

        let myGroup: any = null;
        if (req.teacherId && req.courseId) {
          try {
            const groups = await lastValueFrom(
              this.groupSvc.getGroupsForTeacherAndCourse(req.teacherId, req.courseId)
            ).catch(() => []);
            myGroup = req.groupId
              ? groups?.find(g => g.groupId === req.groupId) ?? groups?.[0]
              : groups?.[0];
            if (myGroup) {
              groupName = myGroup.name || groupName;
              teacherName = (myGroup as any).teacherName || teacherName;
              for (const s of (myGroup.schedules || [])) {
                const day = DAYS[s.dayOfWeek] ?? '';
                const start = this.fmtTime(s.startTime);
                const end = this.fmtTime(s.endTime);
                schedules.push({ day, time: `${start}-${end}` });
              }
            }
          } catch { /* silent */ }
        }

        // Fallback: load teacher name directly if still empty
        if (!teacherName && req.teacherId) {
          try {
            const t = await lastValueFrom(this.teacherSvc.get(req.teacherId)).catch(() => null);
            if (t) teacherName = `${t.firstName || ''} ${t.lastName || ''}`.trim();
          } catch { /* silent */ }
        }

        // Fallback: load course name if empty
        let courseName = req.courseName || '';
        if (!courseName && req.courseId) {
          try {
            const c = await lastValueFrom(this.courseSvc.get(req.courseId)).catch(() => null);
            if (c) courseName = (c as any).nameAr || (c as any).nameEn || '';
          } catch { /* silent */ }
        }

        // Get grade name from group data
        const gradeName = (myGroup as any)?.gradeName || '';

        courseInfos.push({
          courseName,
          teacherName,
          groupName,
          gradeName,
          schedules,
        });
      }
      this.courses.set(courseInfos);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      this.loading.set(false);
    }
  }

  private fmtTime(t?: string): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const d = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${d}:${m}${hr >= 12 ? 'م' : 'ص'}`;
  }
}
