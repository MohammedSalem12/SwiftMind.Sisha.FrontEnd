import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

// ملاحظة: ABP يوفّر alias @proxy => src/app/proxy/*
import type { StudentDto } from '@proxy/students';
import { StudentService } from '@proxy/students';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos';
import { ExamGradeService } from '@proxy/exam-grades';

type StudentWithGrades = StudentDto & { lastTwoGrades?: ExamGradeDto[] };

@Component({
  selector: 'app-students-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students-grades.component.html',
  styleUrls: ['./students-grades.component.scss'],
  providers: [ListService],
})
export class StudentsGradesComponent implements OnInit {
  private readonly list = inject(ListService);
  private readonly studentsSvc = inject(StudentService);
  private readonly examSvc = inject(ExamGradeService);
  private readonly router = inject(Router);

  // State
  students = signal<StudentWithGrades[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  // بحث اختياري بالاسم
  filter = signal<string>('');

  // pagination
  page = signal(1);
  pageSize = signal(10);

  ngOnInit(): void {
    this.hookList();
  }

  hookList(): void {
    this.list.hookToQuery((query) => {
      this.loading.set(true);
      this.errorMsg.set(null);

      // map ListService query -> ABP Paged request
      const req = {
        skipCount: (this.page() - 1) * this.pageSize(),
        maxResultCount: this.pageSize(),
        sorting: query.sort ?? 'creationTime desc',
      } as any;

      // مفيش فلتر جاهز في الـDTO الافتراضي — هنعمل فلترة بالفرونت كـ مثال بسيط
      return this.studentsSvc.getList(req).pipe();
    }).subscribe({
      next: async (res: PagedResultDto<StudentDto>) => {
        this.totalCount.set(res.totalCount ?? 0);

        // فلترة خفيفة بالفرونت لو فيه نص للبحث
        const plain = (res.items ?? []).filter(s => {
          const f = this.filter()?.trim().toLowerCase();
          if (!f) return true;
          const fullName = `${s.firstName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
          return fullName.includes(f) || (s.studentCode ?? '').toLowerCase().includes(f);
        });

        // جهّز العناصر مبدئيًا
        const enriched: StudentWithGrades[] = plain.map(s => ({ ...s, lastTwoGrades: undefined }));
        this.students.set(enriched);

        // حمّل آخر درجتين لكل طالب بالتوازي (خفيفة للصفحة الحالية فقط)
        await Promise.all(
          enriched.map(async (stu) => {
            try {
              const grades = await lastValueFrom(this.examSvc.getLastTwoByStudent(stu.id!));
              stu.lastTwoGrades = (grades ?? []).sort((a, b) => {
                // ترتيب تنازلي بالتاريخ
                return new Date(b.date as any).getTime() - new Date(a.date as any).getTime();
              });
              // دفعة تحديث بسيطة
              this.students.update(s => [...s]);
            } catch {
              // تجاهل الخطأ per-student
            }
          })
        );

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set('حدث خطأ أثناء جلب البيانات. حاول تاني.');
        console.error(err);
      },
    });
  }

  goToAddStudent() {
    this.router.navigate(['/add-student']);
  }

  // تغيير الصفحة
  onPageChange(p: number) {
    if (p < 1) return;
    this.page.set(p);
    this.list.get();
  }

  // تغيير حجم الصفحة
  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.list.get();
  }

  // بحث
  onSearch() {
    this.page.set(1);
    this.list.get();
  }

  trackById = (_: number, item: StudentWithGrades) => item.id;

  // palette taken from the logo/theme: ancient gold, lapis, sand, teal, deep maroon
  private readonly palette = ['#b58c00', '#2b6fb6', '#e6caa3', '#6bb1a8', '#8c3b3b'];

  getColor(index: number) {
    return this.palette[index % this.palette.length];
  }
}
