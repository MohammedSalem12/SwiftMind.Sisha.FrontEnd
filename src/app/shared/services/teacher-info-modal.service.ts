import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeacherInfoModalService {
  readonly isOpen = signal(false);
  readonly teacherId = signal<string | null>(null);

  open(teacherId: string): void {
    this.teacherId.set(teacherId);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.teacherId.set(null);
  }
}
