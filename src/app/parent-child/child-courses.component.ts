import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ExamGradeService } from '@proxy/exam-grades';
import { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { ParentService } from '@proxy/parents';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface CourseEntry {
  courseId: string;
  courseName: string;
  courseCode: string;
  examCount: number;
  averagePct: number;
}

@Component({
  selector: 'app-child-courses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './child-courses.component.html',
  styleUrls: ['./child-courses.component.scss'],
})
export class ChildCoursesComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly examGradeService       = inject(ExamGradeService);
  private readonly parentService          = inject(ParentService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  studentId  = signal<string>('');
  childName  = signal<string>('');
  childPhoto = signal<string>('');
  childCode  = signal<string>('');
  childGrade = signal<string>('');
  grades     = signal<ExamGradeDto[]>([]);
  loading    = signal(false);
  error      = signal<string | null>(null);

  courses = computed<CourseEntry[]>(() => {
    const map = new Map<string, { name: string; code: string; pcts: number[] }>();
    for (const g of this.grades()) {
      const key = g.courseName || 'غير محدد';
      if (!map.has(key)) map.set(key, { name: g.courseName || '', code: (g as any).courseCode || '', pcts: [] });
      if (g.maxGrade) map.get(key)!.pcts.push(Math.round((g.grade / g.maxGrade) * 100));
    }
    return Array.from(map.entries()).map(([, v]) => ({
      courseId: '',
      courseName: v.name,
      courseCode: v.code,
      examCount: v.pcts.length,
      averagePct: v.pcts.length ? Math.round(v.pcts.reduce((a, b) => a + b, 0) / v.pcts.length) : 0,
    }));
  });

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
        this.childPhoto.set(child.studentPhotoUrl || '');
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
        this.examGradeService.getGradesByStudent(this.studentId(), { skipCount: 0, maxResultCount: 500 })
      );
      this.grades.set(result?.items || []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.loading.set(false);
    }
  }

  rateClass(pct: number): string {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'good';
    return 'poor';
  }

  navigateTo(tab: string): void {
    this.router.navigate(['..', tab], { relativeTo: this.route });
  }
}
