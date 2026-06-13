import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { GroupService } from '@proxy/groups';
import { AcademyService } from '@proxy/academies';
import type { AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-teacher-course-action',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-course-action.component.html',
  styleUrls: ['./teacher-course-action.component.scss'],
})
export class TeacherCourseActionComponent implements OnInit {
  private readonly router          = inject(Router);
  private readonly route           = inject(ActivatedRoute);
  private readonly location        = inject(Location);
  private readonly courseSvc       = inject(CourseService);
  private readonly enrollmentSvc   = inject(StudentEnrollmentService);
  private readonly groupSvc        = inject(GroupService);
  private readonly academySvc      = inject(AcademyService);
  private readonly currentUserSvc  = inject(CurrentUserInfoService);

  loading       = signal(false);
  course        = signal<CourseDto | null>(null);
  courseId      = signal<string | null>(null);
  academy       = signal<AcademyDto | null>(null);
  academyId     = signal<string | null>(null);
  studentCount  = signal<number | null>(null);
  groupCount    = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    const id        = this.route.snapshot.paramMap.get('courseId');
    const aId       = this.route.snapshot.queryParamMap.get('academyId');
    this.courseId.set(id);
    this.academyId.set(aId);
    if (!id) return;
    this.loading.set(true);
    try {
      const [c, userInfo] = await Promise.all([
        lastValueFrom(this.courseSvc.get(id)),
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
      ]);
      this.course.set(c);

      // Load academy info if academyId provided
      if (aId) {
        lastValueFrom(this.academySvc.get(aId)).then(a => this.academy.set(a)).catch(() => null);
      }

      // Load counts in parallel (non-blocking failures)
      const [enrolledResult, groupsResult] = await Promise.all([
        lastValueFrom(this.enrollmentSvc.getEnrolledStudentsByCourse(id)).catch(() => null),
        userInfo?.actorId
          ? lastValueFrom(this.groupSvc.getGroupsForTeacherAndCourse(userInfo.actorId, id)).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (enrolledResult !== null) this.studentCount.set((enrolledResult as any[])?.length ?? 0);
      if (groupsResult !== null) this.groupCount.set((groupsResult as any[])?.length ?? 0);
    } catch (e) {
      console.error('Failed to load course', e);
    } finally {
      this.loading.set(false);
    }
  }

  private extraParams(): Record<string, string> {
    const aId = this.academyId();
    return aId ? { academyId: aId } : {};
  }

  goToAttendance(): void {
    this.router.navigate(['/attendance'], {
      queryParams: { courseId: this.courseId(), ...this.extraParams() }
    });
  }

  goToMarks(): void {
    this.router.navigate(['/marks-entry'], {
      queryParams: { courseId: this.courseId(), ...this.extraParams() }
    });
  }

  goToGroups(): void {
    this.router.navigate(['/teacher-groups'], {
      queryParams: { courseId: this.courseId(), ...this.extraParams() }
    });
  }

  goToStudents(): void {
    this.router.navigate(['/students'], {
      queryParams: { courseId: this.courseId(), ...this.extraParams() }
    });
  }

  goBack(): void {
    this.location.back();
  }

  async shareCourse(): Promise<void> {
    const c = this.course();
    if (!c) return;
    const name = c.nameAr || c.nameEn || 'مقرر';
    const link = `https://sesha-9999.web.app/register`;
    const text = `أُدرّس ${name} على تطبيق KAI التعليمي! سجّل الآن وانضم لطلابي\nI teach ${c.nameEn || name} on KAI! Register now and join my students\n${link}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `KAI - ${name}`, text, url: link });
      } else {
        await navigator.clipboard?.writeText(text);
      }
    } catch { /* user cancelled */ }
  }
}
