import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { StudentDashboardDto } from '../../proxy/students/models';
import { StudentDashboardService } from '../../proxy/students/student-dashboard.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss'],
})
export class StudentDashboardComponent implements OnInit {
  private readonly studentDashboardService = inject(StudentDashboardService);
  private readonly router = inject(Router);

  dashboard = signal<StudentDashboardDto | null>(null);
  loading = signal(false);

  async ngOnInit() {
    await this.loadDashboard();
  }

  private async loadDashboard() {
    this.loading.set(true);
    try {
      const dashboard = await this.studentDashboardService.getDashboard().toPromise();
      this.dashboard.set(dashboard!);
    } catch (error) {
      console.error('Error loading student dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }

  goToGrades() {
    this.router.navigate(['/students-grades']);
  }

  goToAttendance() {
    this.router.navigate(['/attendance']);
  }

  goToSchedule() {
    this.router.navigate(['/students/schedule']);
  }

  getGradeColor(percentage: number): string {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-info';
    if (percentage >= 70) return 'text-warning';
    return 'text-danger';
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }
}