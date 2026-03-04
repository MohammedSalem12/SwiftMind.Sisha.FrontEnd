import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import type { StudentDto } from '@proxy/students';
import { StudentService } from '@proxy/students';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
  providers: [ListService],
})
export class StudentsComponent implements OnInit {
  readonly list = inject(ListService);
  private readonly studentsSvc = inject(StudentService);
  private readonly router = inject(Router);

  filter = signal<string>('');
  // expose Math for template
  readonly Math = Math;

  students = signal<StudentDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);

  // pagination
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

      return this.studentsSvc.getList(req);
    }).subscribe({
      next: (res: PagedResultDto<StudentDto>) => {
        this.students.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
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

  onFilter(value: string) {
    this.filter.set(value);
    this.page.set(1);
    this.list.get();
  }

  goToAddStudent() {
    this.router.navigate(['/add-student']);
  }

  goToEnroll(id: any) {
    this.router.navigate(['/enroll', id]);
  }

  showDetails(s: StudentDto) {
    this.router.navigate(['/students', s.id]);
  }

  // helper to get avatar URL from extra properties (if available) or return null
  getAvatarUrl(s: StudentDto | null) {
    try {
      const anys = s as any;
      return anys?.extraProperties?.imageUrl || anys?.imageUrl || null;
    } catch {
      return null;
    }
  }

  trackById = (_: number, item: StudentDto) => item.id;
}
