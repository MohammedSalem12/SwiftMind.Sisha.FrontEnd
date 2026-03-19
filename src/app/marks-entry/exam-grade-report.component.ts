import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ExamGradeService } from '@proxy/exam-grades';
import { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { ExamService } from '@proxy/exams';

interface StudentRankEntry {
  studentName: string;
  grade: number;
  maxGrade: number;
  pct: number;
  gradeClass: string;
  gradeLabel: string;
}

@Component({
  selector: 'app-exam-grade-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-grade-report.component.html',
  styleUrls: ['./exam-grade-report.component.scss'],
})
export class ExamGradeReportComponent implements OnInit {
  private readonly route        = inject(ActivatedRoute);
  private readonly location     = inject(Location);
  private readonly examGradeSvc = inject(ExamGradeService);
  private readonly examSvc      = inject(ExamService);

  loading    = signal(false);
  error      = signal<string | null>(null);
  examName   = signal<string>('');
  courseName = signal<string>('');
  groupName  = signal<string>('');
  maxGrade   = signal<number>(100);
  entries    = signal<StudentRankEntry[]>([]);

  gradedCount = computed(() => this.entries().length);
  avgPct      = computed(() => {
    const e = this.entries();
    return e.length ? Math.round(e.reduce((s, x) => s + x.pct, 0) / e.length) : 0;
  });
  highestPct = computed(() => this.entries().length ? Math.max(...this.entries().map(e => e.pct)) : 0);
  lowestPct  = computed(() => this.entries().length ? Math.min(...this.entries().map(e => e.pct)) : 0);
  passCount  = computed(() => this.entries().filter(e => e.pct >= 50).length);
  passRate   = computed(() => this.entries().length ? Math.round((this.passCount() / this.entries().length) * 100) : 0);

  distribution = computed(() => {
    const e = this.entries();
    return {
      excellent:  e.filter(x => x.pct >= 90).length,
      veryGood:   e.filter(x => x.pct >= 75 && x.pct < 90).length,
      good:       e.filter(x => x.pct >= 60 && x.pct < 75).length,
      acceptable: e.filter(x => x.pct >= 50 && x.pct < 60).length,
      failed:     e.filter(x => x.pct < 50).length,
    };
  });

  ranked = computed(() => [...this.entries()].sort((a, b) => b.pct - a.pct));

  async ngOnInit(): Promise<void> {
    const examId = this.route.snapshot.paramMap.get('examId');
    if (!examId) { this.error.set('معرف الاختبار غير صحيح'); return; }
    await this.loadReport(examId);
  }

  private async loadReport(examId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Load exam details and grades in parallel
      const [examInfo, grades] = await Promise.all([
        lastValueFrom(this.examSvc.get(examId)).catch(() => null),
        lastValueFrom(this.examGradeSvc.getGradesByExam(examId)) as Promise<ExamGradeDto[]>,
      ]);

      if (examInfo) {
        this.examName.set(examInfo.examName || '');
        this.courseName.set(examInfo.courseName || '');
        this.groupName.set(examInfo.groupName || '');
      } else if (grades?.length) {
        this.examName.set(grades[0].examName || '');
        this.courseName.set(grades[0].courseName || '');
      }
      if (grades?.length) {
        this.maxGrade.set(grades[0].maxGrade || 100);
      }
      const mapped: StudentRankEntry[] = (grades || []).map(g => {
        const pct = g.maxGrade ? Math.round((g.grade / g.maxGrade) * 100) : 0;
        return {
          studentName: g.studentName || 'طالب',
          grade: g.grade,
          maxGrade: g.maxGrade,
          pct,
          gradeClass: this.getGradeClass(pct),
          gradeLabel: this.getGradeLabel(pct),
        };
      });
      this.entries.set(mapped);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل التقرير');
    } finally {
      this.loading.set(false);
    }
  }

  getGradeClass(pct: number): string {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'very-good';
    if (pct >= 60) return 'good';
    if (pct >= 50) return 'acceptable';
    return 'failed';
  }

  getGradeLabel(pct: number): string {
    if (pct >= 90) return 'ممتاز';
    if (pct >= 75) return 'جيد جداً';
    if (pct >= 60) return 'جيد';
    if (pct >= 50) return 'مقبول';
    return 'راسب';
  }

  rateClass(pct: number): string {
    if (pct >= 75) return 'excellent';
    if (pct >= 50) return 'good';
    return 'poor';
  }

  barWidth(count: number): number {
    return this.entries().length ? Math.round((count / this.entries().length) * 100) : 0;
  }

  goBack(): void { this.location.back(); }
}
