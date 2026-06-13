import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { StudentService } from '@proxy/students';
import type { StudentDto, CreateUpdateStudentDto } from '@proxy/students/models';

@Component({
  selector: 'app-student-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-edit.component.html',
  styleUrls: ['./student-edit.component.scss']
})
export class StudentEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentSvc = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  studentId = signal<string | null>(null);
  student = signal<StudentDto | null>(null);

  // Form model
  form = signal<CreateUpdateStudentDto>({
    firstName: '',
    middleName: '',
    lastName: '',
    address: '',
    currentGrade: 1,
    schoolName: '',
    teacherStudentCode: ''
  });

  // Grade options (1-12)
  gradeOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pm => {
      const id = pm.get('id');
      this.studentId.set(id);
      if (id) void this.loadStudent(id);
    });
  }

  async loadStudent(id: string) {
    this.loading.set(true);
    try {
      const student = await lastValueFrom(this.studentSvc.get(id));
      this.student.set(student);
      
      // Populate form with existing data
      this.form.set({
        firstName: student.firstName || '',
        middleName: student.middleName || '',
        lastName: student.lastName || '',
        address: student.address || '',
        currentGrade: student.currentGrade || 1,
        schoolName: student.schoolName || '',
        teacherStudentCode: student.teacherStudentCode || ''
      });
    } catch (err) {
      console.error('Failed to load student', err);
      this.error.set('Failed to load student information');
    } finally {
      this.loading.set(false);
    }
  }

  updateField<K extends keyof CreateUpdateStudentDto>(field: K, value: CreateUpdateStudentDto[K]) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  async onSubmit() {
    const id = this.studentId();
    if (!id) {
      this.error.set('No student ID provided');
      return;
    }

    // Validation
    if (!this.form().firstName?.trim()) {
      this.error.set('First name is required');
      return;
    }

    if (!this.form().lastName?.trim()) {
      this.error.set('Last name is required');
      return;
    }

    if (!this.form().currentGrade || this.form().currentGrade < 1 || this.form().currentGrade > 12) {
      this.error.set('Please select a valid grade (1-12)');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await lastValueFrom(this.studentSvc.update(id, this.form()));
      // Navigate back to detail page
      await this.router.navigate(['/students', id]);
    } catch (err: any) {
      console.error('Failed to update student', err);
      this.error.set(err.error?.message || 'Failed to update student profile');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    const id = this.studentId();
    if (id) {
      this.router.navigate(['/students', id]);
    } else {
      this.router.navigate(['/students']);
    }
  }

  getFullName() {
    const s = this.student();
    if (!s) return 'Edit Student Profile';
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
  }
}
