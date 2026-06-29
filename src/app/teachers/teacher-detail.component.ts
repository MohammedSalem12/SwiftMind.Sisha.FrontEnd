import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from '@proxy/teachers';
import type { TeacherDto } from '@proxy/teachers/models';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div dir="rtl">
      <app-page-header [title]="'تفاصيل المعلم'" [titleEn]="'Teacher Details'" [backTo]="'/teachers'"></app-page-header>
      <div class="card">
        <div class="card-body">
          <div *ngIf="loading()">Loading...</div>
          <div *ngIf="!loading() && teacher()">
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-lg">
                <ng-container *ngIf="teacher()?.photoUrl; else initialsTpl">
                  <img [src]="teacher()?.photoUrl" alt="" />
                </ng-container>
                <ng-template #initialsTpl>{{ initials }}</ng-template>
              </div>
              <div>
                <h4 class="mb-0">{{ teacher()?.firstName }} {{ teacher()?.lastName }}</h4>
                <div class="muted">{{ teacher()?.email || '' }}</div>
              </div>
            </div>
            <hr />
            <div><strong>Address:</strong> {{ teacher()?.address || '-' }}</div>
            <div><strong>Created:</strong> {{ teacher()?.creationTime }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.avatar-lg{width:56px;height:56px;border-radius:8px;background:#f1f3f5;display:flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden}.avatar-lg img{width:100%;height:100%;border-radius:50%;object-fit:cover}`]
})
export class TeacherDetailComponent {
  private route = inject(ActivatedRoute);
  private svc = inject(TeacherService);
  private readonly destroyRef = inject(DestroyRef);

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
    this.svc.get(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (t) => { this.teacher.set(t); this.loading.set(false); }, error: (e) => { console.error(e); this.loading.set(false); } });
  }
}
