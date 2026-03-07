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
  teacherCodeFilter = signal<string>('');
  teacherCodeResult = signal<StudentDto | null | 'not-found'>('not-found');
  teacherCodeSearchDone = signal(false);
  teacherCodeLoading = signal(false);
  readonly Math = Math;

  students = signal<StudentDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);

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

  async searchByTeacherCode() {
    const code = this.teacherCodeFilter().trim();
    if (!code) return;

    this.teacherCodeLoading.set(true);
    this.teacherCodeSearchDone.set(false);
    this.teacherCodeResult.set('not-found');

    try {
      const result = await this.studentsSvc.getByTeacherStudentCode(code).toPromise();
      this.teacherCodeResult.set(result ?? 'not-found');
      this.teacherCodeSearchDone.set(true);
    } catch {
      this.teacherCodeResult.set('not-found');
      this.teacherCodeSearchDone.set(true);
    } finally {
      this.teacherCodeLoading.set(false);
    }
  }

  clearTeacherCodeSearch() {
    this.teacherCodeFilter.set('');
    this.teacherCodeResult.set('not-found');
    this.teacherCodeSearchDone.set(false);
  }

  isStudentDto(val: any): val is StudentDto {
    return val && typeof val === 'object' && 'id' in val;
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
