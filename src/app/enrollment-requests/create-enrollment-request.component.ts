import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestCreateDto } from '@proxy/student-enrollments/models';
import type { CourseSimpleDto } from '@proxy/courses/models';
import { CourseService } from '@proxy/courses';
import { TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { RoleBasedUIService } from '../shared/role-based-ui.service';

@Component({
  selector: 'app-create-enrollment-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-enrollment-request.component.html',
  styleUrls: ['./create-enrollment-request.component.scss'],
})
export class CreateEnrollmentRequestComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly enrollmentReqSvc = inject(EnrollmentRequestService);
  private readonly courseSvc = inject(CourseService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly roleService = inject(RoleBasedUIService);

  courses = signal<CourseSimpleDto[]>([]);
  teacherQuery = signal('');
  teacherResults = signal<TeacherAutocompleteDto[]>([]);
  private teacherSearchTimer: any = null;

  model = signal<EnrollmentRequestCreateDto>({
    studentId: '',
    courseId: '',
    teacherId: '',
    initiator: EnrollmentRequestInitiator.Student,
  });

  saving = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCourses();
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    const currentActorId = this.roleService.getCurrentActorId();
    if (this.roleService.isStudent() && currentActorId) {
      this.model.update(m => ({ ...m, studentId: currentActorId, initiator: EnrollmentRequestInitiator.Student }));
    } else if (this.roleService.isParent() && currentActorId) {
      this.model.update(m => ({ ...m, parentId: currentActorId, initiator: EnrollmentRequestInitiator.Parent }));
    } else if (this.roleService.isTeacher() && currentActorId) {
      this.model.update(m => ({ ...m, teacherId: currentActorId, initiator: EnrollmentRequestInitiator.Teacher }));
    }
  }

  async loadCourses() {
    try {
      const res: any = await lastValueFrom(this.courseSvc.getSimpleCourses(''));
      this.courses.set(res.items ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  onTeacherQueryChange(q: string) {
    this.teacherQuery.set(q ?? '');
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
        items = await lastValueFrom(this.teacherSvc.getTeachersByCourse(courseId, q, 10)) as TeacherAutocompleteDto[];
      } else {
        items = await lastValueFrom(this.teacherSvc.getTeachersBySearch(q, 10)) as TeacherAutocompleteDto[];
      }
      this.teacherResults.set(items ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  selectTeacher(t: TeacherAutocompleteDto) {
    this.model.update(m => ({ ...m, teacherId: t.id }));
    this.teacherResults.set([]);
    this.teacherQuery.set('');
  }

  async submit() {
    this.saving.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(this.enrollmentReqSvc.create(this.model()));
      await this.router.navigate(['/enrollment-requests/list']);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to create enrollment request.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/enrollment-requests/list']);
  }
}
