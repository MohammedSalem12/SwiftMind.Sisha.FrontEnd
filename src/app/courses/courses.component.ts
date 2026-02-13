import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListService, PagedResultDto, ConfigStateService, AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import type { CourseDto } from '@proxy/courses/dtos';
import { CourseService } from '@proxy/courses';
import { StudentService } from '@proxy/students';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
  providers: [ListService],
})
export class CoursesComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly svc = inject(CourseService);
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);
  private readonly configStateService = inject(ConfigStateService);
  readonly router = inject(Router);

  courses = signal<CourseDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  filter = signal<string>('');
  selected = signal<CourseDto | null>(null);
  page = signal(1);
  pageSize = signal(10);
  currentStudentGrade = signal<number | null>(null);
  isStudent = signal(false);

  async ngOnInit(): Promise<void> {
    await this.checkIfStudent();
    this.hookList();
  }

  private async checkIfStudent(): Promise<void> {
    if (!this.authService.isAuthenticated) {
      return;
    }

    try {
      const currentUser = this.configStateService.getOne('currentUser') as any;
      const roles = currentUser?.roles || currentUser?.roleNames || currentUser?.userRoles || [];
      
      const isStudentRole = Array.isArray(roles)
        ? roles.some((role: any) => typeof role === 'string' && role.toLowerCase() === 'student')
        : false;

      if (isStudentRole) {
        this.isStudent.set(true);
        // Fetch student's current grade
        const student = await lastValueFrom(this.studentService.getCurrentStudent());
        if (student) {
          this.currentStudentGrade.set(student.currentGrade);
        }
      }
    } catch (error) {
      console.error('Error checking student status:', error);
    }
  }

  hookList(): void {
    this.list.hookToQuery((query) => {
      this.loading.set(true);
      const req = {
        skipCount: (this.page() - 1) * this.pageSize(),
        maxResultCount: this.pageSize(),
        sorting: query.sort ?? 'creationTime desc',
      } as any;

      return this.svc.getList(req).pipe();
    }).subscribe({
      next: (res: PagedResultDto<CourseDto>) => {
        this.totalCount.set(res.totalCount ?? 0);
        let items = (res.items ?? []).filter(c => {
          const f = this.filter()?.trim().toLowerCase();
          if (!f) return true;
          return (c.nameAr ?? '').toLowerCase().includes(f) || (c.nameEn ?? '').toLowerCase().includes(f);
        });

        // Filter by student's current grade if user is a student
        // Note: Comparing student's currentGrade (number) with course's gradeName by parsing
        if (this.isStudent() && this.currentStudentGrade() !== null) {
          const studentGrade = this.currentStudentGrade()!;
          items = items.filter(c => {
            // Try to extract grade number from gradeName (e.g., "Grade 1" -> 1, "1" -> 1)
            const gradeMatch = c.gradeName?.match(/\d+/);
            if (gradeMatch) {
              const courseGradeNumber = parseInt(gradeMatch[0], 10);
              return courseGradeNumber === studentGrade;
            }
            return false;
          });
        }

        this.courses.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(p: number) {
    if (p < 1) return;
    this.page.set(p);
    this.list.get();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.list.get();
  }

  onSearch() {
    this.page.set(1);
    this.list.get();
  }

  trackById = (_: number, it: CourseDto) => it.id;

  goToAddCourse() {
    this.router.navigate(['/add-course']);
  }

  showDetails(c: CourseDto) {
    this.selected.set(c);
  }

  closeDetails() {
    this.selected.set(null);
  }

  gradeName(g?: number | string) {
    if (g === undefined || g === null || g === '') return '-';
    return `Grade ${g}`;
  }
}
