import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// ── DTOs matching GET /api/app/parent/dashboard ──

interface ParentDashboardDto {
  parentName: string;
  totalChildren: number;
  children: ChildDashboardDto[];
}

interface ChildDashboardDto {
  studentName: string;
  studentCode: string;
  currentGrade: number;
  gradeName: string;
  attendedDays: number;
  absentDays: number;
  totalSchoolDays: number;
  attendancePercentage: number;
  totalCourses: number;
  courses: ChildCourseDto[];
  recentActivities: ChildActivityDto[];
}

interface ChildCourseDto {
  courseNameAr: string;
  teacherName: string;
  latestGradePercentage: number;
  absentDaysInCourse: number;
}

interface ChildActivityDto {
  type: string;
  messageAr: string;
  date: string;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss'],
})
export class ParentDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiBase = (environment as any).apis?.default?.url || '';

  loading = signal(true);
  error = signal<string | null>(null);
  dashboard = signal<ParentDashboardDto | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.http.get<ParentDashboardDto>(`${this.apiBase}/api/app/parent/dashboard`)
      );
      this.dashboard.set(result ?? null);
    } catch (err: any) {
      console.error('Error loading parent dashboard:', err);
      this.error.set(err?.error?.error?.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  // Attendance ring color
  attendanceColor(pct: number): string {
    if (pct >= 90) return '#38a169';
    if (pct >= 70) return '#d69e2e';
    return '#e53e3e';
  }

  attendanceLabel(pct: number): string {
    if (pct >= 90) return 'ممتاز';
    if (pct >= 70) return 'جيد';
    return 'ضعيف';
  }

  // Grade color
  gradeColor(pct: number): string {
    if (pct >= 80) return '#38a169';
    if (pct >= 60) return '#d69e2e';
    return '#e53e3e';
  }

  // Activity icon
  activityIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'attendance': return 'fa-calendar-check';
      case 'grade': return 'fa-star';
      case 'enrollment': return 'fa-book';
      case 'absence': return 'fa-exclamation-triangle';
      default: return 'fa-bell';
    }
  }

  activityColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'attendance': return '#38a169';
      case 'grade': return '#667eea';
      case 'enrollment': return '#4facfe';
      case 'absence': return '#e53e3e';
      default: return '#718096';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return d.toLocaleDateString('ar-SA');
  }

  // Conic gradient for attendance ring
  attendanceGradient(pct: number): string {
    const color = this.attendanceColor(pct);
    return `conic-gradient(${color} ${pct * 3.6}deg, #e2e8f0 ${pct * 3.6}deg)`;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
  }

  getTotalCourses(): number {
    const d = this.dashboard();
    if (!d) return 0;
    return d.children.reduce((sum, c) => sum + (c.totalCourses || 0), 0);
  }

  getOverallAttendance(): number {
    const d = this.dashboard();
    if (!d || !d.children.length) return 0;
    const total = d.children.reduce((sum, c) => sum + (c.attendancePercentage || 0), 0);
    return Math.round(total / d.children.length);
  }

  goToLinkChild(): void {
    this.router.navigate(['/parent/link-child']);
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }

  trackByIndex = (i: number) => i;
}
