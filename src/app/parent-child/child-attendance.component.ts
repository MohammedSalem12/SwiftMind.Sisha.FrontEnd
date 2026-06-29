import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { AttendanceService } from '@proxy/attendances';
import { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { ParentService } from '@proxy/parents';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-child-attendance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './child-attendance.component.html',
  styleUrls: ['./child-attendance.component.scss'],
})
export class ChildAttendanceComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly attendanceService      = inject(AttendanceService);
  private readonly parentService          = inject(ParentService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  studentId      = signal<string>('');
  childName      = signal<string>('');
  childPhoto     = signal<string>('');
  childCode      = signal<string>('');
  childGrade     = signal<string>('');
  selectedMonth  = signal<string>('');
  records        = signal<StudentAttendanceReportDto[]>([]);
  loading        = signal(false);
  error          = signal<string | null>(null);

  totalDays      = computed(() => this.records().reduce((s, r) => s + r.totalDaysInMonth, 0));
  absentDays     = computed(() => this.records().reduce((s, r) => s + r.absentDays, 0));
  attendedDays   = computed(() => this.totalDays() - this.absentDays());
  attendanceRate = computed(() =>
    this.totalDays() > 0 ? Math.round((this.attendedDays() / this.totalDays()) * 100) : 100
  );

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('studentId');
    if (!id) { this.error.set('معرف الطالب غير صحيح'); return; }
    this.studentId.set(id);

    const now = new Date();
    this.selectedMonth.set(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    await Promise.all([this.loadChildInfo(), this.loadAttendance()]);
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

  async loadAttendance(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [year, month] = this.selectedMonth().split('-').map(Number);
      const date = new Date(year, month - 1, 1).toISOString();
      const result = await lastValueFrom(
        this.attendanceService.getStudentAttendanceReport({
          studentId: this.studentId(),
          date,
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      this.records.set(result?.items || []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل سجل الحضور');
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
