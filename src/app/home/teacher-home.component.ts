import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-teacher-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-home.component.html',
  styleUrls: ['./teacher-home.component.scss'],
})
export class TeacherHomeComponent implements OnInit {
  private readonly router             = inject(Router);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly teacherService     = inject(TeacherService);

  loading     = signal(false);
  teacherName = signal<string>('');
  courses     = signal<CourseDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
  }

  private async loadCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.teacherName.set(userInfo?.actorName ?? '');
      const teacherId = userInfo?.actorId;
      if (!teacherId) return;
      const courses = await lastValueFrom(this.teacherService.getTeacherCourses(teacherId));
      this.courses.set(courses || []);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  selectCourse(course: CourseDto): void {
    this.router.navigate(['/home/teacher/course', course.id]);
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
