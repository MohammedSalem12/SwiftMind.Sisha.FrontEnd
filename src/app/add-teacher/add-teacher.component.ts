import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import type { CreateUpdateTeacherDto } from '@proxy/teachers';
import { TeacherService } from '@proxy/teachers';

@Component({
  selector: 'app-add-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-teacher.component.html',
  styleUrls: ['./add-teacher.component.scss'],
})
export class AddTeacherComponent {
  private readonly teacherSvc = inject(TeacherService);
  private readonly router = inject(Router);

  // expose cancel for template
  cancel() {
    void this.router.navigate(['/teachers']);
  }

  model = signal<CreateUpdateTeacherDto>({
    firstName: '',
    lastName: '',
    address: undefined,
  });

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  setField<K extends keyof CreateUpdateTeacherDto>(k: K, v: CreateUpdateTeacherDto[K]) {
    this.model.update(m => ({ ...(m as any), [k]: v } as CreateUpdateTeacherDto));
  }

  async submit() {
    this.saving.set(true);
    this.errorMsg.set(null);
    try {
  await lastValueFrom(this.teacherSvc.create(this.model()));
  await this.router.navigate(['/teachers']);
    } catch (e) {
      console.error(e);
      this.errorMsg.set('Failed to create teacher');
    } finally {
      this.saving.set(false);
    }
  }
}
