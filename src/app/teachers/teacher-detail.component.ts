import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '@proxy/teachers';
import type { TeacherDto } from '@proxy/teachers/models';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-body">
        <div *ngIf="loading()">Loading...</div>
        <div *ngIf="!loading() && teacher()">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-lg">{{ initials }}</div>
            <div>
              <h4 class="mb-0">{{ teacher()?.firstName }} {{ teacher()?.lastName }}</h4>
              <div class="muted">{{ teacher()?.email || '' }}</div>
            </div>
            <div class="ms-auto">
              <button class="btn btn-outline-secondary" (click)="goBack()">Back</button>
            </div>
          </div>
          <hr />
          <div><strong>Address:</strong> {{ teacher()?.address || '-' }}</div>
          <div><strong>Created:</strong> {{ teacher()?.creationTime }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`.avatar-lg{width:56px;height:56px;border-radius:8px;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-weight:700}`]
})
export class TeacherDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(TeacherService);

  teacher = signal<TeacherDto | null>(null);
  loading = signal(true);

  get initials() {
    const t = this.teacher();
    return (t?.firstName?.[0] || '') + (t?.lastName?.[0] || '');
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string) {
    this.loading.set(true);
    this.svc.get(id).subscribe({ next: (t) => { this.teacher.set(t); this.loading.set(false); }, error: (e) => { console.error(e); this.loading.set(false); } });
  }

  goBack() { this.router.navigate(['/teachers']); }
}
