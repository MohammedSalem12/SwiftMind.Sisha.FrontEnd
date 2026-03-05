import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LocalizationPipe } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import type { EnrolledStudentDto } from '@proxy/student-enrollments/dtos/models';

interface DashboardData {
  totalCourses: number;
  totalStudents: number;
  totalExams: number;
  absentTodayCount: number;
  unreadNotifications: number;
  recentAbsences: AbsentEntry[];
  recentNotifications: NotifEntry[];
}

interface AbsentEntry {
  studentName: string;
  studentCode: string;
  courseName: string;
  courseId: string;
}

interface NotifEntry {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: number;
}

@Component({
  selector: 'app-teacher-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LocalizationPipe],
  templateUrl: './teacher-home.component.html',
  styleUrls: ['./teacher-home.component.scss'],
})
export class TeacherHomeComponent implements OnInit {
  private readonly router               = inject(Router);
  private readonly currentUserService   = inject(CurrentUserInfoService);
  private readonly teacherService       = inject(TeacherService);
  private readonly enrollmentService    = inject(StudentEnrollmentService);

  // State
  loading                = signal(false);
  dashboard              = signal<DashboardData | null>(null);
  courses                = signal<CourseDto[]>([]);
  expandedCourseId       = signal<string | null>(null);
  loadingStudentsCourseId = signal<string | null>(null);
  enrolledStudentsMap    = signal<Record<string, EnrolledStudentDto[]>>({});

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      const teacherId = userInfo?.actorId;
      if (!teacherId) return;

      // Load courses and dashboard data in parallel
      const [courses, dashboardRaw] = await Promise.all([
        lastValueFrom(this.teacherService.getTeacherCourses(teacherId)),
        lastValueFrom(this.teacherService.getDashboard(teacherId)).catch(() => null),
      ]);

      this.courses.set(courses || []);

      if (dashboardRaw) {
        this.dashboard.set(dashboardRaw as unknown as DashboardData);
      } else {
        // Fallback: compute basic stats from courses only
        this.dashboard.set({
          totalCourses: (courses || []).length,
          totalStudents: 0,
          totalExams: 0,
          absentTodayCount: 0,
          unreadNotifications: 0,
          recentAbsences: [],
          recentNotifications: [],
        });
      }
    } catch (error) {
      console.error('Error loading teacher dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleStudents(course: CourseDto): Promise<void> {
    if (this.expandedCourseId() === course.id) {
      this.expandedCourseId.set(null);
      return;
    }
    this.expandedCourseId.set(course.id!);
    if (this.enrolledStudentsMap()[course.id!]) return;

    this.loadingStudentsCourseId.set(course.id!);
    try {
      const students = await lastValueFrom(
        this.enrollmentService.getEnrolledStudentsByCourse(course.id!)
      );
      this.enrolledStudentsMap.update(m => ({ ...m, [course.id!]: students || [] }));
    } catch {
      this.enrolledStudentsMap.update(m => ({ ...m, [course.id!]: [] }));
    } finally {
      this.loadingStudentsCourseId.set(null);
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  goToGroups(course?: CourseDto): void {
    if (course) {
      this.router.navigate(['/teacher-groups'], { queryParams: { courseId: course.id } });
    } else {
      this.router.navigate(['/teacher-groups']);
    }
  }

  goToAttendance(courseId?: string): void {
    if (courseId) {
      this.router.navigate(['/attendance'], { queryParams: { courseId } });
    } else {
      this.router.navigate(['/attendance']);
    }
  }

  goToMarksEntry(): void        { this.router.navigate(['/marks-entry']); }
  goToFeeds(): void              { this.router.navigate(['/feeds']); }
  goToAttendanceReport(): void   { this.router.navigate(['/teacher/attendance-report']); }

  trackById = (_: number, item: CourseDto) => item.id;
}
