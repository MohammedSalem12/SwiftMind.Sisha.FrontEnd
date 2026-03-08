import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { GroupService } from '@proxy/groups';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-teacher-course-action',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-course-action.component.html',
  styleUrls: ['./teacher-course-action.component.scss'],
})
export class TeacherCourseActionComponent implements OnInit {
  private readonly router          = inject(Router);
  private readonly route           = inject(ActivatedRoute);
  private readonly courseSvc       = inject(CourseService);
  private readonly enrollmentSvc   = inject(StudentEnrollmentService);
  private readonly groupSvc        = inject(GroupService);
  private readonly currentUserSvc  = inject(CurrentUserInfoService);

  loading       = signal(false);
  course        = signal<CourseDto | null>(null);
  courseId      = signal<string | null>(null);
  studentCount  = signal<number | null>(null);
  groupCount    = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('courseId');
    this.courseId.set(id);
    if (!id) return;
    this.loading.set(true);
    try {
      const [c, userInfo] = await Promise.all([
        lastValueFrom(this.courseSvc.get(id)),
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
      ]);
      this.course.set(c);

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

  goToAttendance(): void {
    this.router.navigate(['/attendance'], { queryParams: { courseId: this.courseId() } });
  }

  goToMarks(): void {
    this.router.navigate(['/marks-entry'], { queryParams: { courseId: this.courseId() } });
  }

  goToGroups(): void {
    this.router.navigate(['/teacher-groups'], { queryParams: { courseId: this.courseId() } });
  }

  goBack(): void {
    this.router.navigate(['/teacher']);
  }
}
