import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import type { CreateUpdateStudentDto } from '@proxy/students';
import { StudentService } from '@proxy/students';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.scss'],
})
export class AddStudentComponent {
  private readonly studentsSvc = inject(StudentService);
  private readonly router = inject(Router);

  // omit studentCode on client side
  model = signal<Omit<CreateUpdateStudentDto, 'studentCode'>>({
    firstName: '',
    middleName: undefined,
    lastName: '',
    address: undefined,
    currentGrade: 1,
    schoolName: undefined,
    teacherStudentCode: undefined,
  } as any);

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  async submit() {
    this.saving.set(true);
    this.errorMsg.set(null);
    try {
  // cast to any: server may accept creation without studentCode
  await lastValueFrom(this.studentsSvc.create(this.model() as any));
  // navigate to students list after create
  await this.router.navigate(['/students-grades']);
    } catch (e) {
      console.error(e);
      this.errorMsg.set('Failed to create student.');
    } finally {
      this.saving.set(false);
    }
  }

  returnToStudents() {
    this.router.navigate(['/students']);
  }

  setField<K extends keyof CreateUpdateStudentDto>(key: K, value: CreateUpdateStudentDto[K]) {
    this.model.update(m => ({ ...(m as any), [key]: value } as CreateUpdateStudentDto));
  }
}
