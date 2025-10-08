import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '@proxy/teachers';
import { CourseService } from '@proxy/courses';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import type { CreateUpdateEnrollmentDto } from '@proxy/student-enrollments/dtos';
import { lastValueFrom } from 'rxjs';
import type { CourseDto } from '../proxy/courses/dtos/models';

@Component({
  selector: 'app-enroll-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-body">
        <h5>Enroll Teacher into Course</h5>
        <div *ngIf="teacherId() as tid">
          <p>Teacher ID: <strong>{{ tid }}</strong></p>
          <div *ngIf="loading()" class="mb-2">Loading courses...</div>
          <div *ngIf="!loading()">
            <label for="course">Select Course</label>
            <select id="course" class="form-select mb-2" [(ngModel)]="selectedCourseId">
              <option [ngValue]="null">-- اختر مقرر --</option>
              <option *ngFor="let c of courses()" [ngValue]="c.id">{{ c.nameAr }}</option>
            </select>
            <div class="d-flex gap-2">
              <button class="btn btn-primary" (click)="onEnroll()" [disabled]="!selectedCourseId || saving()">Enroll</button>
              <button class="btn btn-outline-secondary" (click)="onCancel()">Cancel</button>
            </div>
            <div *ngIf="message()" class="mt-2 alert alert-info">{{ message() }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [``],
})
export class EnrollTeacherComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseSvc = inject(CourseService);
  private enrollmentSvc = inject(EnrollmentService);
  private teacherSvc = inject(TeacherService);
  // teacher service kept for future server enroll API (if available)

  teacherId = signal<string | null>(null);
  courses = signal<CourseDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  message = signal<string | null>(null);
  selectedCourseId: string | null = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.teacherId.set(id);
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.courseSvc.getList({ skipCount: 0, maxResultCount: 1000 }).subscribe({
      next: (res) => {
        this.courses.set(res.items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  async onEnroll() {
    if (!this.selectedCourseId || !this.teacherId()) return;
    this.saving.set(true);
    this.message.set(null);
    try {
      // For teacher-course assignment we omit studentId so the backend doesn't try to parse an empty GUID.
      // Use the TeacherAppService endpoint generated as enrollTeacherInCourses
      await lastValueFrom(this.teacherSvc.enrollTeacherInCourses(this.teacherId() as string, [this.selectedCourseId as string]));
      this.message.set('تم تسجيل المعلم في المقرر بنجاح');
      // navigate to teacher courses view
      await this.router.navigate([`/teachers/${this.teacherId()}/courses`]);
    } catch (e) {
      console.error('Failed to enroll teacher', e);
      this.message.set('فشل تسجيل المعلم');
    } finally {
      this.saving.set(false);
    }
  }

  onCancel() {
    this.router.navigate(['/teachers']);
  }
}
