import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AttendanceService } from '@proxy/attendances';
import type { StudentAttendanceReportDto } from '@proxy/attendances/dtos';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { ExamGradeService } from '@proxy/exam-grades';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos';
import { StudentService } from '@proxy/students';
import type { ParentStudentDto } from '@proxy/parents/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { GradeThemeService } from '../shared/services/grade-theme.service';

interface EnrolledCourseInfo {
  courseId: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  groupName: string;
}

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-home.component.html',
  styleUrls: ['./student-home.component.scss'],
})
export class StudentHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly studentService = inject(StudentService);
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly examGradeSvc = inject(ExamGradeService);
  private readonly enrollmentRequestSvc = inject(EnrollmentRequestService);
  private readonly gradeThemeService = inject(GradeThemeService);
  private readonly courseService = inject(CourseService);

  studentName = signal('');
  studentId = signal<string | null>(null);
  studentGrade = signal<number | null>(null);
  enrolledCourses = signal<EnrolledCourseInfo[]>([]);
  academyCourseGroups = signal<{ academyName: string; courses: CourseDto[] }[]>([]);
  attendanceStats = signal<StudentAttendanceReportDto[]>([]);
  lastGrades = signal<ExamGradeDto[]>([]);
  pendingRequests = signal<EnrollmentRequestDto[]>([]);
  pendingParentLinks = signal<ParentStudentDto[]>([]);
  loading = signal(true);
  cancellingId = signal<string | null>(null);

  // Computed properties for theme
  currentTheme = computed(() => {
    const grade = this.studentGrade();
    return grade ? this.gradeThemeService.getThemeForGrade(grade) : null;
  });

  totalAbsenceDays = computed(() =>
    this.attendanceStats().reduce((sum, s) => sum + (s.absentDays || 0), 0)
  );

  pendingRequestsCount = computed(() => this.pendingRequests().length);

  lastGradePercent = computed(() => {
    const grades = this.lastGrades();
    if (!grades.length) return null;
    const g = grades[0];
    return g.maxGrade > 0 ? Math.round((g.grade / g.maxGrade) * 100) : null;
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      if (userInfo) {
        this.studentName.set(userInfo.actorName || '');
        this.studentId.set(userInfo.actorId || null);
        this.studentGrade.set(userInfo.currentGrade || null);
        
        // Apply grade-based theme
        if (userInfo.currentGrade) {
          this.gradeThemeService.setThemeByGrade(userInfo.currentGrade);
        }
      }
      await Promise.all([
        this.loadEnrollmentRequests(userInfo?.actorId),
        this.loadAttendanceStats(userInfo?.actorId),
        this.loadLastGrades(userInfo?.actorId),
        this.loadPendingParentLinks(),
        this.loadAcademyCourses(),
      ]);
    } catch (err) {
      console.error('Error loading student home:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAttendanceStats(studentId?: string | null): Promise<void> {
    if (!studentId) return;
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const result = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceReport({
          studentId,
          date: dateStr,
          maxResultCount: 100,
          skipCount: 0,
        })
      );
      this.attendanceStats.set(result?.items || []);
    } catch (err) {
      console.error('Error loading attendance stats:', err);
    }
  }

  private async loadLastGrades(studentId?: string | null): Promise<void> {
    if (!studentId) return;
    try {
      const grades = await lastValueFrom(this.examGradeSvc.getLastTwoByStudent(studentId));
      this.lastGrades.set(grades || []);
    } catch (err) {
      console.error('Error loading last grades:', err);
    }
  }

  private async loadEnrollmentRequests(studentId?: string | null): Promise<void> {
    if (!studentId) return;
    try {
      const mine = await lastValueFrom(this.enrollmentRequestSvc.getRequestsForCurrentStudent());

      // Enrolled = status Approved — deduplicate by courseId
      const seen = new Set<string>();
      const enrolled: EnrolledCourseInfo[] = [];
      for (const r of (mine || [])) {
        if (r.status === EnrollmentRequestStatus.Approved && r.courseId && !seen.has(r.courseId)) {
          seen.add(r.courseId);
          enrolled.push({
            courseId: r.courseId,
            courseName: r.courseName || '',
            courseCode: r.courseCode || '',
            teacherName: r.teacherName || '',
            groupName: r.groupName || '',
          });
        }
      }
      this.enrolledCourses.set(enrolled);

      // Pending = status Pending (waiting for approval)
      const pending = (mine || []).filter(r => r.status === EnrollmentRequestStatus.Pending);
      this.pendingRequests.set(pending);
    } catch (err) {
      console.error('Error loading enrollment requests:', err);
    }
  }

  private async loadAcademyCourses(): Promise<void> {
    try {
      const result = await lastValueFrom(
        this.courseService.getList({ maxResultCount: 100, skipCount: 0, sorting: '' })
      );
      const withAcademy = (result?.items || []).filter(c => c.academyId);
      // Group by academy name
      const groupMap = new Map<string, CourseDto[]>();
      for (const c of withAcademy) {
        const key = c.academyName || c.academyId || 'أكاديمية';
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(c);
      }
      this.academyCourseGroups.set(
        Array.from(groupMap.entries()).map(([academyName, courses]) => ({ academyName, courses }))
      );
    } catch (err) {
      console.error('Error loading academy courses:', err);
    }
  }

  private async loadPendingParentLinks(): Promise<void> {
    try {
      const links = await lastValueFrom(this.studentService.getPendingLinksForCurrentStudent());
      this.pendingParentLinks.set(links || []);
    } catch (err) {
      console.error('Error loading pending parent links:', err);
    }
  }

  getCourseAbsences(courseId: string): number {
    return this.attendanceStats().find(s => s.courseId === courseId)?.absentDays || 0;
  }

  getCourseAttendancePct(courseId: string): number {
    return this.attendanceStats().find(s => s.courseId === courseId)?.attendancePercentage ?? 100;
  }

  getCourseLastGrade(courseName: string): ExamGradeDto | null {
    return this.lastGrades().find(g => g.courseName === courseName) || null;
  }

  getGradePercent(grade: ExamGradeDto): number {
    return grade.maxGrade > 0 ? Math.round((grade.grade / grade.maxGrade) * 100) : 0;
  }

  async cancelRequest(requestId?: string): Promise<void> {
    if (!requestId || this.cancellingId()) return;
    this.cancellingId.set(requestId);
    try {
      await lastValueFrom(this.enrollmentRequestSvc.reject(requestId));
      await this.loadEnrollmentRequests(this.studentId());
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      this.cancellingId.set(null);
    }
  }

  async confirmParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.studentService.confirmParentStudentLink(link.parentId!, link.studentId!));
      await this.loadPendingParentLinks();
    } catch (err) {
      console.error('Error confirming parent link:', err);
    }
  }

  async rejectParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.studentService.rejectParentStudentLink(link.parentId!, link.studentId!));
      await this.loadPendingParentLinks();
    } catch (err) {
      console.error('Error rejecting parent link:', err);
    }
  }

  viewCourse(course: EnrolledCourseInfo): void {
    this.router.navigate(['/student/courses']);
  }

  enrollInCourse(): void {
    this.router.navigate(['/student/courses']);
  }

  goToMyRequests(): void {
    this.router.navigate(['/student/requests']);
  }

  goToMyGrades(): void {
    this.router.navigate(['/student/grades']);
  }

  goToFeeds(): void {
    this.router.navigate(['/feeds']);
  }

  goToMyQR(): void {
    this.router.navigate(['/student/qr']);
  }

  trackByCourseId = (_: number, item: EnrolledCourseInfo) => item.courseId;
  trackByReqId = (_: number, item: EnrollmentRequestDto) => item.id;
}
