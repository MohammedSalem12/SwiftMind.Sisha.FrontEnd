import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import type { CourseDto } from '@proxy/courses/dtos';
import { CourseService } from '@proxy/courses';

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
  readonly router = inject(Router);

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
    }).subscribe({
      next: (res: PagedResultDto<CourseDto>) => {
        this.totalCount.set(res.totalCount ?? 0);
        const items = (res.items ?? []).filter(c => {
          const f = this.filter()?.trim().toLowerCase();
          if (!f) return true;
          return (c.nameAr ?? '').toLowerCase().includes(f) || (c.nameEn ?? '').toLowerCase().includes(f);
        });
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
