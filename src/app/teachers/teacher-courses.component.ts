import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '@proxy/courses';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '../proxy/courses/dtos/models';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="teacher-courses">
      <div class="header d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 class="m-0">Courses</h4>
          <div class="muted small">Courses assigned to the selected teacher</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="router.navigate(['/teachers', teacherId()])">Details</button>
          <button class="btn btn-primary" (click)="onEnroll()">Enroll in course</button>
        </div>
      </div>

      <div *ngIf="loading()" class="text-center py-3">Loading courses...</div>

      <div *ngIf="!loading() && courses().length === 0" class="empty-state text-center py-4">
        <div class="empty-illustration">🎓</div>
        <h5>No courses found</h5>
        <p class="muted">This teacher is not enrolled in any courses yet.</p>
        <button class="btn btn-outline-primary" (click)="onEnroll()">Enroll teacher in a course</button>
      </div>

      <div class="courses-grid" *ngIf="!loading() && courses().length > 0">
        <div *ngFor="let c of courses()" class="course-card">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">{{ c.name || c.nameEn || c.nameAr }}</h5>
                <span class="badge bg-secondary">{{ c.gradeName || ('Grade ' + (c.grade || '')) }}</span>
              </div>
              <p class="card-text text-muted mb-3">{{ c.code || '' }}</p>
              <div class="mt-auto d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-secondary" (click)="viewCourse(c.id)">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teacher-courses .empty-state { border: 1px dashed #e9ecef; border-radius: 8px; }
    .teacher-courses .empty-illustration { font-size: 48px }
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem }
    .course-card .card { min-height: 160px; display: flex; flex-direction: column }
  `],
})
export class TeacherCoursesComponent {
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private courseSvc = inject(CourseService);
  private enrollmentSvc = inject(EnrollmentService);
  private teacherSvc = inject(TeacherService);

  teacherId = signal<string | null>(null);
  courses = signal<CourseDto[]>([]);
  loading = signal(false);
  teacherName = signal<string | null>(null);

  constructor() {
    // react to param changes so navigating from the teachers list always reloads data
    this.route.paramMap.subscribe((pm) => {
      const id = pm.get('id');
      this.teacherId.set(id);
      this.teacherName.set(null);
      if (id) {
        // load teacher display name
        this.teacherSvc.get(id).subscribe({ next: (t) => this.teacherName.set((t.firstName || '') + ' ' + (t.lastName || '')), error: () => this.teacherName.set(null) });
      }
      this.loadTeacherCourses();
    });
  }

  loadTeacherCourses() {
    const t = this.teacherId();
    if (!t) return;
    this.loading.set(true);
    // Use the teacher API to get the courses assigned to this teacher
    this.teacherSvc.getTeacherCourses(t).subscribe({
      next: (items) => { this.courses.set(items ?? []); this.loading.set(false); },
      error: (err) => { console.error('Failed to load teacher courses', err); this.courses.set([]); this.loading.set(false); }
    });
  }

  onEnroll() {
    this.router.navigate([`/teachers/${this.teacherId()}/enroll`]);
  }

  viewCourse(id: string) {
    this.router.navigate(['/courses', id]);
  }
}
