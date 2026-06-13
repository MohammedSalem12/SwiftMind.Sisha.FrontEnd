import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos';
import { TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';

@Component({
  selector: 'app-course-teachers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './course-teachers.component.html',
  styleUrls: ['./course-teachers.component.scss'],
})
export class CourseTeachersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly teacherService = inject(TeacherService);

  courseId = signal<string>('');
  course = signal<CourseDto | null>(null);
  teachers = signal<TeacherAutocompleteDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Course ID is missing');
      return;
    }

    this.courseId.set(id);
    await this.loadCourseAndTeachers();
  }

  private async loadCourseAndTeachers(): Promise<void> {
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
        this.teacherService.getTeachersByCourse(this.courseId(), '', 100)
      );
      this.teachers.set(teachersData || []);
    } catch (err) {
      console.error('Error loading course and teachers:', err);
      this.error.set('Failed to load course information. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }

  goToEnroll(): void {
    this.router.navigate(['/courses', this.courseId(), 'enroll']);
  }

  trackById = (_: number, item: TeacherAutocompleteDto) => item.id;
}
