import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListService, PagedResultDto } from '@abp/ng.core';
import type { TeacherDto } from '@proxy/teachers/models';
import { TeacherService } from '@proxy/teachers';
import { PullToRefreshDirective } from '../shared/directives/pull-to-refresh.directive';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-teachers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PullToRefreshDirective, PageHeaderComponent],
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.scss'],
  providers: [ListService],
})
export class TeachersComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly svc = inject(TeacherService);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  teachers = signal<TeacherDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  filter = signal<string>('');
  page = signal(1);
  pageSize = signal(10);
  selected = signal<TeacherDto | null>(null);

  ngOnInit(): void {
    this.hookList();
  }

  refreshData(e: { complete: () => void }): void {
    this.list.get();
    e.complete();
  }

  hookList(): void {
    this.list.hookToQuery((q) => {
      this.loading.set(true);
      const req = { skipCount: (this.page() - 1) * this.pageSize(), maxResultCount: this.pageSize(), sorting: q.sort ?? 'lastName' } as any;
      return this.svc.getList(req).pipe();
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: PagedResultDto<TeacherDto>) => {
        const items = (res.items ?? []).filter(t => {
          const f = this.filter()?.trim().toLowerCase();
          if (!f) return true;
          return (t.firstName ?? '').toLowerCase().includes(f) || (t.lastName ?? '').toLowerCase().includes(f);
        });
        this.teachers.set(items);
        this.totalCount.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.page.set(1);
    this.list.get();
  }

  onPageChange(p: number) {
    if (p < 1) return;
    this.page.set(p);
    this.list.get();
  }

  onPageSizeChange(s: number) {
    this.pageSize.set(s);
    this.page.set(1);
    this.list.get();
  }

  showDetails(t: TeacherDto) {
    this.router.navigate(['/teachers', t.id]);
  }

  closeDetails() {
    this.selected.set(null);
  }

  trackById = (_: number, it: TeacherDto) => it.id;

  goToAddTeacher() {
    this.router.navigate(['/add-teacher']);
  }
}
