import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { ExamGradeService } from '@proxy/exam-grades';
import { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { ParentService } from '@proxy/parents';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-child-grades',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './child-grades.component.html',
  styleUrls: ['./child-grades.component.scss'],
})
export class ChildGradesComponent implements OnInit {
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly location = inject(Location);
  private readonly examGradeService      = inject(ExamGradeService);
  private readonly parentService         = inject(ParentService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  studentId  = signal<string>('');
  childName  = signal<string>('');
  childCode  = signal<string>('');
  childGrade = signal<string>('');
  grades     = signal<ExamGradeDto[]>([]);
  loading    = signal(false);
  error      = signal<string | null>(null);

  totalExams   = computed(() => this.grades().length);
  averageGrade = computed(() => {
    const pcts = this.grades().map(g => this.getPct(g));
    return pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
  });
  highestGrade = computed(() => {
    const pcts = this.grades().map(g => this.getPct(g));
    return pcts.length ? Math.max(...pcts) : 0;
  });
  passCount = computed(() => this.grades().filter(g => this.getPct(g) >= 50).length);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('studentId');
    if (!id) { this.error.set('معرف الطالب غير صحيح'); return; }
    this.studentId.set(id);
    await Promise.all([this.loadChildInfo(), this.loadGrades()]);
  }

  private async loadChildInfo(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      const parentId = userInfo?.actorId;
      if (!parentId) return;
      const children = await lastValueFrom(this.parentService.getLinkedStudentsByParentId(parentId));
      const child = (children as any[]).find(c => c.studentId === this.studentId());
      if (child) {
        this.childName.set(child.studentName || '');
        this.childCode.set(child.studentCode || '');
        this.childGrade.set(child.gradeName || '');
      }
    } catch { /* non-critical */ }
  }

  private async loadGrades(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.examGradeService.getGradesByStudent(this.studentId(), { skipCount: 0, maxResultCount: 200 })
      );
      this.grades.set(result?.items || []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل الدرجات');
    } finally {
      this.loading.set(false);
    }
  }

  getPct(g: ExamGradeDto): number {
    return g.maxGrade ? Math.round((g.grade / g.maxGrade) * 100) : 0;
  }

  gradeClass(pct: number): string {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'very-good';
    if (pct >= 60) return 'good';
    if (pct >= 50) return 'acceptable';
    return 'failed';
  }

  gradeLabel(pct: number): string {
    if (pct >= 90) return 'ممتاز';
    if (pct >= 75) return 'جيد جداً';
    if (pct >= 60) return 'جيد';
    if (pct >= 50) return 'مقبول';
    return 'راسب';
  }

  navigateTo(tab: string): void {
    this.router.navigate(['..', tab], { relativeTo: this.route });
  }

  goBack(): void { this.location.back(); }
}
