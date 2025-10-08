import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import type { CreateUpdateEnrollmentDto } from '@proxy/student-enrollments/dtos';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import type { CourseDto } from '@proxy/courses/dtos';
import { CourseService } from '@proxy/courses';
import type { TeacherDto } from '@proxy/teachers/models';
import { TeacherService } from '@proxy/teachers';
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

  studentId = signal<string | null>(null);
  courses = signal<CourseDto[]>([]);
  // teacher search
  teacherQuery = signal('');
  teacherResults = signal<TeacherDto[]>([]);
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
    }
    this.loadCourses();
  }

  async loadCourses() {
    try {
      const res = await lastValueFrom(this.courseSvc.getList({ skipCount: 0, maxResultCount: 999, sorting: 'name' } as any));
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
  const res = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 10, sorting: 'lastName' } as any)) as PagedResultDto<TeacherDto>;
  // naive client-side filter on name if server doesn't support filter param
  const items = (res.items ?? []).filter(t => ((t.firstName ?? '') + ' ' + (t.lastName ?? '')).toLowerCase().includes(q.toLowerCase()));
  this.teacherResults.set(items);
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
