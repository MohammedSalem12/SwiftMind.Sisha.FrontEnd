import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListService, PagedResultDto } from '@abp/ng.core';

import type { CourseDto } from '@proxy/courses/dtos';
import { CourseService } from '@proxy/courses';

@Component({
  selector: 'app-courses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
  providers: [ListService],
})
export class CoursesComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly svc = inject(CourseService);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  courses = signal<CourseDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  filter = signal<string>('');
  selected = signal<CourseDto | null>(null);
  page = signal(1);
  pageSize = signal(10);

  ngOnInit(): void {
    this.hookList();
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
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: PagedResultDto<CourseDto>) => {
        this.totalCount.set(res.totalCount ?? 0);
        const f = this.filter()?.trim().toLowerCase();
        const items = (res.items ?? []).filter(c =>
          !f || (c.nameAr ?? '').toLowerCase().includes(f) || (c.nameEn ?? '').toLowerCase().includes(f)
        );
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
}
