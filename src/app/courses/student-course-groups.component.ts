import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto, GroupScheduleDto } from '@proxy/groups/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { CurrentUserInfoService } from '@proxy/common';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-student-course-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
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
  private readonly teacherService = inject(TeacherService);

  courseId = signal('');
  course = signal<CourseDto | null>(null);
  teachers = signal<TeacherAutocompleteDto[]>([]);
  searchQuery = signal('');
  selectedTeacher = signal<TeacherAutocompleteDto | null>(null);
  teacherGroups = signal<GroupWithSchedulesDto[]>([]);
  loading = signal(false);
  loadingGroups = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  filteredTeachers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.teachers();
    return this.teachers().filter(t =>
      t.code?.toLowerCase().includes(q) ||
      t.displayName?.toLowerCase().includes(q) ||
      t.nameArabic?.toLowerCase().includes(q) ||
      t.nameEnglish?.toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('معرف المقرر مفقود'); return; }
    this.courseId.set(id);
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [courseData, teachersData] = await Promise.all([
        lastValueFrom(this.courseService.get(this.courseId())),
        lastValueFrom(this.teacherService.getTeachersByCourse(this.courseId(), undefined, 100)),
      ]);
      this.course.set(courseData);
      this.teachers.set(teachersData || []);
    } catch (err) {
      console.error('Error loading enrollment data:', err);
      this.error.set('حدث خطأ أثناء تحميل بيانات المقرر');
    } finally {
      this.loading.set(false);
    }
  }

  async selectTeacher(teacher: TeacherAutocompleteDto): Promise<void> {
    // Toggle: deselect if clicking the same teacher
    if (this.selectedTeacher()?.id === teacher.id) {
      this.selectedTeacher.set(null);
      this.teacherGroups.set([]);
      return;
    }
    this.selectedTeacher.set(teacher);
    this.loadingGroups.set(true);
    this.error.set(null);
    try {
      const groups = await lastValueFrom(
        this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId())
      );
      this.teacherGroups.set(groups || []);
    } catch (err) {
      console.error('Error loading groups:', err);
      this.error.set('حدث خطأ أثناء تحميل المجموعات');
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
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      if (!userInfo?.actorId) {
        this.error.set('تعذر التعرف على الطالب. يرجى تسجيل الدخول مجدداً.');
        return;
      }
      await lastValueFrom(this.enrollmentRequestService.create({
        studentId: userInfo.actorId,
        courseId: this.courseId(),
        teacherId: group.teacherId!,
        groupId: group.groupId!,
        initiator: EnrollmentRequestInitiator.Student,
      }));
      this.successMessage.set('تم إرسال طلب التسجيل بنجاح! سيتم مراجعته من المعلم وولي الأمر.');
      this.selectedTeacher.set(null);
      this.teacherGroups.set([]);
    } catch (err: any) {
      console.error('Error enrolling:', err);
      this.error.set(err?.error?.error?.message || 'حدث خطأ أثناء إرسال طلب التسجيل');
    } finally {
      this.submitting.set(false);
    }
  }

  goToRequests(): void {
    this.router.navigate(['/student/requests']);
  }

  getDayName(dayOfWeek: number): string {
    return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek] || '';
  }

  formatTime(time?: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const m = parts[1];
      return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${h >= 12 ? 'م' : 'ص'}`;
    }
    return time;
  }

  trackByTeacherId = (_: number, t: TeacherAutocompleteDto) => t.id;
  trackByGroupId = (_: number, g: GroupWithSchedulesDto) => g.groupId;
  trackBySchedule = (_: number, s: GroupScheduleDto) => `${s.dayOfWeek}-${s.startTime}`;
}
