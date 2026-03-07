import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-teacher-course-action',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-course-action.component.html',
  styleUrls: ['./teacher-course-action.component.scss'],
})
export class TeacherCourseActionComponent implements OnInit {
  private readonly router   = inject(Router);
  private readonly route    = inject(ActivatedRoute);
  private readonly courseSvc = inject(CourseService);

  loading  = signal(false);
  course   = signal<CourseDto | null>(null);
  courseId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('courseId');
    this.courseId.set(id);
    if (!id) return;
    this.loading.set(true);
    try {
      const c = await lastValueFrom(this.courseSvc.get(id));
      this.course.set(c);
    } catch (e) {
      console.error('Failed to load course', e);
    } finally {
      this.loading.set(false);
    }
  }

  goToAttendance(): void {
    this.router.navigate(['/attendance'], { queryParams: { courseId: this.courseId() } });
  }

  goToMarks(): void {
    this.router.navigate(['/marks-entry'], { queryParams: { courseId: this.courseId() } });
  }

  goBack(): void {
    this.router.navigate(['/home/teacher']);
  }
}
