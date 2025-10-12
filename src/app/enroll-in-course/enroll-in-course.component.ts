import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import type { CreateUpdateEnrollmentDto } from '@proxy/student-enrollments/dtos';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import type { CourseSimpleDto } from '@proxy/courses/models';
import { CourseService } from '@proxy/courses';
import type { TeacherDto, TeacherAutocompleteDto } from '@proxy/teachers/models';
import { TeacherService } from '@proxy/teachers';
import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';
import type { PagedResultDto } from '@abp/ng.core';

@Component({
  selector: 'app-enroll-in-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enroll-in-course.component.html',
  styleUrls: ['./enroll-in-course.component.scss'],
})
export class EnrollInCourseComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly enrollmentSvc = inject(EnrollmentService);
  private readonly courseSvc = inject(CourseService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly studentSvc = inject(StudentService);

  studentId = signal<string | null>(null);
  // student display info
  student = signal<StudentDto | null>(null);
  studentNameAr = signal<string | null>(null);
  studentNameEn = signal<string | null>(null);
  studentCode = signal<string | null>(null);
  studentGrade = signal<number | null>(null);
  courses = signal<CourseSimpleDto[]>([]);
  // teacher search
  teacherQuery = signal('');
  teacherResults = signal<TeacherAutocompleteDto[]>([]);
  private teacherSearchTimer: any = null;
  selectedTeacher = signal<TeacherDto | null>(null);

  model = signal<CreateUpdateEnrollmentDto>({
    studentId: '',
    courseId: '',
    teacherId: '',
    enrolledAt: new Date().toISOString(),
  });

  saving = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('studentId');
    if (id) {
      this.studentId.set(id);
      this.model.update(m => ({ ...m, studentId: id } as CreateUpdateEnrollmentDto));
      void this.loadStudent(id);
    }
    this.loadCourses();
  }

  private async loadStudent(id: string) {
    try {
      const s = await lastValueFrom(this.studentSvc.get(id));
      this.student.set(s ?? null);
      if (s) {
        const parts = [s.firstName, s.middleName, s.lastName].filter(Boolean as any);
        const full = parts.length ? parts.join(' ') : null;
        // no separate Arabic fields in DTO; set both to the same value
        this.studentNameAr.set(full);
        this.studentNameEn.set(full);
        this.studentCode.set((s.studentCode ?? s.teacherStudentCode) ?? null);
        this.studentGrade.set(s.currentGrade ?? null);
      }
    } catch (err) {
      console.error('Failed to load student', err);
    }
  }

  async loadCourses(search?: string) {
    try {
      const res: any = await lastValueFrom(this.courseSvc.getSimpleCourses(search ?? ''));
      // getSimpleCourses returns a ListResultDto<CourseSimpleDto>
      this.courses.set(res.items ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  onTeacherQueryChange(q: string) {
    this.teacherQuery.set(q ?? '');
    // debounce
    if (this.teacherSearchTimer) {
      clearTimeout(this.teacherSearchTimer);
    }
    this.teacherSearchTimer = setTimeout(() => this.searchTeachers(), 250);
  }

  async searchTeachers() {
    const q = this.teacherQuery()?.trim();
    if (!q) {
      this.teacherResults.set([]);
      return;
    }
    try {
      const courseId = this.model().courseId || '';
      let items: TeacherAutocompleteDto[] = [];
      if (courseId) {
        // Use optimized API that returns teacher autocomplete entries for a given course
        items = await lastValueFrom(this.teacherSvc.getTeachersByCourse(courseId, q, 10)) as TeacherAutocompleteDto[];
      } else {
        // fallback to general search when no course selected
        items = await lastValueFrom(this.teacherSvc.getTeachersBySearch(q, 10)) as TeacherAutocompleteDto[];
      }
      this.teacherResults.set(items ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  selectTeacher(t: TeacherDto) {
    this.setField('teacherId', t.id as any);
    this.selectedTeacher.set(t);
    this.teacherResults.set([]);
    this.teacherQuery.set('');
  }

  async submit() {
    console.log('[Enroll] submit invoked');
    this.saving.set(true);
    this.error.set(null);
    try {
      const payload = { ...this.model() } as CreateUpdateEnrollmentDto;
      console.log('[Enroll] payload', payload);
      const res = await lastValueFrom(this.enrollmentSvc.create(payload));
      console.log('[Enroll] response', res);
      await this.router.navigate(['/students']);
    } catch (e) {
      console.error('[Enroll] failed', e);
      this.error.set('Failed to enroll student.');
    } finally {
      this.saving.set(false);
    }
  }

  onSubmitClick(ev: Event) {
    ev.preventDefault();
    // ensure model has studentId when route param provided
    if (!this.model().studentId && this.studentId()) {
      this.setField('studentId', this.studentId() as any);
    }
    void this.submit();
  }

  cancel() {
    this.router.navigate(['/students']);
  }

  setField<K extends keyof CreateUpdateEnrollmentDto>(k: K, v: CreateUpdateEnrollmentDto[K]) {
    this.model.update(m => ({ ...(m as any), [k]: v } as CreateUpdateEnrollmentDto));
  }
}
