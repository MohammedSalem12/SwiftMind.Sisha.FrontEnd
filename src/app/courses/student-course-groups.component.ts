import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos';
import type { TeacherSimpleDto } from '@proxy/courses/models';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto, GroupScheduleDto } from '@proxy/groups/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { CurrentUserInfoService } from '@proxy/common';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';

interface StudentEnrollmentInfo {
  groupId: string;
  groupName: string;
  groupCode: string;
  teacherId: string;
  teacherName: string;
  schedules: GroupScheduleDto[];
}

@Component({
  selector: 'app-student-course-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-course-groups.component.html',
  styleUrls: ['./student-course-groups.component.scss'],
})
export class StudentCourseGroupsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly groupService = inject(GroupService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  courseId = signal<string>('');
  course = signal<CourseDto | null>(null);
  currentEnrollment = signal<StudentEnrollmentInfo | null>(null);
  teachers = signal<TeacherSimpleDto[]>([]);
  allGroups = signal<GroupWithSchedulesDto[]>([]);
  selectedTeacher = signal<TeacherSimpleDto | null>(null);
  teacherGroups = signal<GroupWithSchedulesDto[]>([]);
  loading = signal(false);
  loadingGroups = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Course ID is missing');
      return;
    }

    this.courseId.set(id);
    await this.loadCourseData();
  }

  private async loadCourseData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load course details
      const courseData = await lastValueFrom(
        this.courseService.get(this.courseId())
      );
      this.course.set(courseData);

      // Load teachers for this course
      const teachersData = await lastValueFrom(
        this.courseService.getTeachersForCourse(this.courseId())
      );
      this.teachers.set(teachersData || []);

      // Check if student is already enrolled in this course
      await this.checkCurrentEnrollment();

      // Load all groups for all teachers
      await this.loadAllGroups();
    } catch (err) {
      console.error('Error loading course data:', err);
      this.error.set('Failed to load course information. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private async checkCurrentEnrollment(): Promise<void> {
    try {
      // Get current user info
      const userInfo = await lastValueFrom(
        this.currentUserInfoService.getCurrentUserActorInfo()
      );
      
      if (!userInfo || !userInfo.actorId) {
        return;
      }

      // Get all enrollment requests for this student and course
      const requests = await lastValueFrom(
        this.enrollmentRequestService.getList()
      );

      // Find approved enrollment for this course
      const approvedRequest = requests?.find(
        (req) =>
          req.studentId === userInfo.actorId &&
          req.courseId === this.courseId() &&
          req.isParentApproved &&
          req.isTeacherApproved &&
          req.groupId
      );

      if (approvedRequest && approvedRequest.groupId) {
        this.currentEnrollment.set({
          groupId: approvedRequest.groupId,
          groupName: approvedRequest.groupName || '',
          groupCode: '',
          teacherId: approvedRequest.teacherId || '',
          teacherName: approvedRequest.teacherName || '',
          schedules: [],
        });
      }
    } catch (err) {
      console.error('Error checking current enrollment:', err);
      // Don't set error, just log it - not being enrolled is ok
    }
  }

  private async loadAllGroups(): Promise<void> {
    try {
      const allGroupsPromises = this.teachers().map((teacher) =>
        lastValueFrom(
          this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId())
        )
      );

      const groupsArrays = await Promise.all(allGroupsPromises);
      
      // Flatten the array manually for older TypeScript targets
      const flatGroups: GroupWithSchedulesDto[] = [];
      for (const groupArray of groupsArrays) {
        flatGroups.push(...groupArray);
      }
      
      this.allGroups.set(flatGroups);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  }

  async selectTeacher(teacher: TeacherSimpleDto): Promise<void> {
    this.selectedTeacher.set(teacher);
    this.loadingGroups.set(true);
    this.error.set(null);

    try {
      const groups = await lastValueFrom(
        this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId())
      );
      this.teacherGroups.set(groups || []);
    } catch (err) {
      console.error('Error loading teacher groups:', err);
      this.error.set('Failed to load groups for this teacher.');
    } finally {
      this.loadingGroups.set(false);
    }
  }

  async enrollInGroup(group: GroupWithSchedulesDto): Promise<void> {
    if (this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const userInfo = await lastValueFrom(
        this.currentUserInfoService.getCurrentUserActorInfo()
      );

      if (!userInfo || !userInfo.actorId) {
        this.error.set('Unable to identify student. Please log in again.');
        this.submitting.set(false);
        return;
      }

      const request = {
        studentId: userInfo.actorId,
        courseId: this.courseId(),
        teacherId: group.teacherId!,
        groupId: group.groupId!,
        initiator: EnrollmentRequestInitiator.Student,
      };

      await lastValueFrom(this.enrollmentRequestService.create(request));
      this.successMessage.set('تم إرسال طلب التسجيل بنجاح! سيتم مراجعته قريباً.');
      
      // Reload enrollment status
      await this.checkCurrentEnrollment();
    } catch (err: any) {
      console.error('Error enrolling in group:', err);
      let errorMsg = 'حدث خطأ أثناء إرسال طلب التسجيل.';
      if (err?.error?.error?.message) {
        errorMsg = err.error.error.message;
      }
      this.error.set(errorMsg);
    } finally {
      this.submitting.set(false);
    }
  }

  clearTeacherSelection(): void {
    this.selectedTeacher.set(null);
    this.teacherGroups.set([]);
  }

  goBack(): void {
    this.router.navigate(['/courses', this.courseId(), 'teachers']);
  }

  getDayName(dayOfWeek: number): string {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayOfWeek] || '';
  }

  formatTime(time?: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const period = hours >= 12 ? 'م' : 'ص';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes} ${period}`;
    }
    return time;
  }

  trackByGroupId = (_: number, item: GroupWithSchedulesDto) => item.groupId;
  trackByTeacherId = (_: number, item: TeacherSimpleDto) => item.id;
}
