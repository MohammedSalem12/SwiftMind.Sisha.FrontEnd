import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import type { CreateUpdateCourseDto } from '@proxy/courses/dtos';
import { CourseService } from '@proxy/courses';
import { GradeService } from '@proxy/grades';
import type { GradeDto } from '@proxy/grades/dtos/models';

@Component({
  selector: 'app-add-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.scss'],
})
export class AddCourseComponent {
  private readonly svc = inject(CourseService);
  private readonly router = inject(Router);

  // expose a public cancel method used by the template
  cancel() {
    void this.router.navigate(['/courses']);
  }

  // omit 'code' on the client; backend will generate if needed
  // CreateUpdateCourseDto.grade is a string (gradeId)
  model = signal<Omit<CreateUpdateCourseDto, 'code'>>({ nameAr: '', nameEn: '', grade: '1' } as any);
  private readonly gradeSvc = inject(GradeService);
  grades = signal<GradeDto[]>([]);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  setField<K extends keyof Omit<CreateUpdateCourseDto, 'code'>>(k: K, v: Omit<CreateUpdateCourseDto, 'code'>[K]) {
    this.model.update(m => ({ ...(m as any), [k]: v } as any));
  }

  async ngOnInit(): Promise<void> {
    try {
      const res = await lastValueFrom(this.gradeSvc.getList());
      this.grades.set(res.items ?? []);
    } catch (e) {
      console.error('Failed to load grades', e);
    }
  }

  async submit(form?: NgForm) {
    this.saving.set(true);
    this.errorMsg.set(null);
    try {
      if (form && form.invalid) {
        this.errorMsg.set('Please fix validation errors');
        return;
      }
  // cast to any because CreateUpdateCourseDto originally included 'code'
  await lastValueFrom(this.svc.create(this.model() as any));
  await this.router.navigate(['/courses']);
    } catch (e) {
      console.error(e);
      this.errorMsg.set('Failed to create course');
    } finally {
      this.saving.set(false);
    }
  }
}
