import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import { AcademyService } from '@proxy/academies';
import type { CourseDto } from '@proxy/courses/dtos/models';
import type { AcademyDto } from '@proxy/academies/models';

interface AcademyCourseGroup {
  academy: AcademyDto;
  courses: any[];
}

@Component({
  selector: 'app-teacher-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-home.component.html',
  styleUrls: ['./teacher-home.component.scss'],
})
export class TeacherHomeComponent implements OnInit {
  private readonly router             = inject(Router);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly teacherService     = inject(TeacherService);
  private readonly academyService     = inject(AcademyService);
  loading          = signal(false);
  teacherName      = signal<string>('');
  teacherId        = signal<string | null>(null);
  courses          = signal<CourseDto[]>([]);
  academyGroups    = signal<AcademyCourseGroup[]>([]);
  myAcademy        = signal<AcademyDto | null>(null);
  loadingAcademies = signal(false);

  async ngOnInit(): Promise<void> {
    // Load courses first — academy section filters by teacher's courses
    await this.loadCourses();
    await this.loadAcademies();
  }

  private async loadCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.teacherName.set(userInfo?.actorName ?? '');
      this.teacherId.set(userInfo?.actorId ?? null);
      const id = userInfo?.actorId;
      if (!id) return;
      const courses = await lastValueFrom(this.teacherService.getTeacherCourses(id, { skipHandleError: true }));
      this.courses.set(courses || []);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAcademies(): Promise<void> {
    this.loadingAcademies.set(true);
    try {
      const tId = this.teacherId();
      if (!tId) return;

      // Load all academies visible to this teacher
      const allAcademies = await lastValueFrom(
        this.academyService.getList({ skipHandleError: true })
      ).catch(() => [] as AcademyDto[]);

      if (!allAcademies?.length) return;

      // Filter: only academies the teacher owns (supervisor) or has joined (approved member)
      const myAcademies: AcademyDto[] = [];
      for (const a of allAcademies) {
        if (a.supervisorTeacherId === tId) {
          this.myAcademy.set(a);
          myAcademies.push(a);
          continue;
        }
        // Check membership for non-supervised academies
        try {
          const m = await lastValueFrom(
            this.academyService.getMyMembership(a.id, { skipHandleError: true })
          );
          if (m?.teacherId && m.status === 1) { // Approved
            myAcademies.push(a);
          }
        } catch { /* not a member */ }
      }

      if (myAcademies.length === 0) return;

      // Get teacher's own course IDs to filter academy courses
      const teacherCourseIds = new Set(this.courses().map(c => c.id));

      const groups: AcademyCourseGroup[] = [];
      for (const academy of myAcademies) {
        try {
          const allCourses = await lastValueFrom(
            this.academyService.getAcademyCourses(academy.id!, { skipHandleError: true })
          );
          // Only keep courses assigned to this teacher
          const teacherCourses = (allCourses || []).filter(c => {
            return c.courseId && teacherCourseIds.has(c.courseId);
          });
          if (teacherCourses.length > 0) {
            groups.push({ academy, courses: teacherCourses });
          }
        } catch { /* silent */ }
      }
      this.academyGroups.set(groups);
    } catch { /* silent — teacher may not be in any academy */ } finally {
      this.loadingAcademies.set(false);
    }
  }

  selectCourse(course: CourseDto): void {
    this.router.navigate(['/teacher/course', course.id]);
  }

  openQrCodes(event: Event, course: CourseDto): void {
    event.stopPropagation();
    this.router.navigate(['/teacher/qr-codes'], { queryParams: { courseId: course.id } });
  }

  goToEnroll(): void {
    this.router.navigate(['/teacher/enroll']);
  }

  goToReports(): void {
    this.router.navigate(['/reports/absence']);
  }

  selectAcademyCourse(course: any): void {
    const id = course.courseId ?? course.id;
    const academyId = course.academyId;
    if (id) this.router.navigate(['/teacher/course', id], {
      queryParams: academyId ? { academyId } : {}
    });
  }

  goAcademyAttendance(event: Event, course: any): void {
    event.stopPropagation();
    const id = course.courseId ?? course.id;
    const academyId = course.academyId;
    if (id) this.router.navigate(['/attendance'], {
      queryParams: { courseId: id, ...(academyId ? { academyId } : {}) }
    });
  }

  goAcademyMarks(event: Event, course: any): void {
    event.stopPropagation();
    const id = course.courseId ?? course.id;
    const academyId = course.academyId;
    if (id) this.router.navigate(['/marks-entry'], {
      queryParams: { courseId: id, ...(academyId ? { academyId } : {}) }
    });
  }

  trackById = (_: number, item: any) => item.id;
  trackByAcademy = (_: number, item: AcademyCourseGroup) => item.academy.id;
}
