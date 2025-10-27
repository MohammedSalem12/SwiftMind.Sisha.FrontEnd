import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ParentDashboardService } from '../../proxy/parents/parent-dashboard.service';
import { ParentDashboardDto, StudentProgressDto, NotificationDto, UpcomingExamDto, StudentComparisonDto } from '../../proxy/parents/models';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <h1 class="h3 mb-3">Parent Dashboard</h1>
        </div>
      </div>

      <!-- Dashboard Statistics -->
      @if (dashboard(); as data) {
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card bg-primary text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h6 class="card-title">Total Children</h6>
                    <h2 class="mb-0">{{ data.totalChildren }}</h2>
                  </div>
                  <div class="align-self-center">
                    <i class="fas fa-users fa-2x opacity-75"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card bg-success text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h6 class="card-title">Average GPA</h6>
                    <h2 class="mb-0">{{ data.averageGPA | number:'1.2-2' }}</h2>
                  </div>
                  <div class="align-self-center">
                    <i class="fas fa-graduation-cap fa-2x opacity-75"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card bg-warning text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h6 class="card-title">Upcoming Exams</h6>
                    <h2 class="mb-0">{{ upcomingExams().length }}</h2>
                  </div>
                  <div class="align-self-center">
                    <i class="fas fa-calendar-check fa-2x opacity-75"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card bg-info text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <h6 class="card-title">New Notifications</h6>
                    <h2 class="mb-0">{{ recentNotifications().length }}</h2>
                  </div>
                  <div class="align-self-center">
                    <i class="fas fa-bell fa-2x opacity-75"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Children Progress Overview -->
        <div class="row mb-4">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Children Progress Overview</h5>
              </div>
              <div class="card-body">
                @if (studentsComparison().length > 0) {
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Current GPA</th>
                          <th>Attendance Rate</th>
                          <th>Recent Grades</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (student of studentsComparison(); track student.studentId) {
                          <tr>
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center text-white me-2">
                                  {{ student.studentName.charAt(0) }}
                                </div>
                                <div>
                                  <strong>{{ student.studentName }}</strong>
                                  <br>
                                  <small class="text-muted">{{ student.className }}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="badge" [class]="getGpaBadgeClass(student.currentGPA)">
                                {{ student.currentGPA | number:'1.2-2' }}
                              </span>
                            </td>
                            <td>
                              <div class="progress" style="height: 20px;">
                                <div class="progress-bar" [class]="getAttendanceBadgeClass(student.attendanceRate)" 
                                     [style.width.%]="student.attendanceRate">
                                  {{ student.attendanceRate }}%
                                </div>
                              </div>
                            </td>
                            <td>
                              @if (student.recentGrades.length > 0) {
                                <div class="d-flex gap-1">
                                  @for (grade of student.recentGrades.slice(0, 3); track grade.id) {
                                    <span class="badge bg-light text-dark" [title]="grade.courseName">
                                      {{ grade.grade }}
                                    </span>
                                  }
                                </div>
                              } @else {
                                <small class="text-muted">No recent grades</small>
                              }
                            </td>
                            <td>
                              <span class="badge" [class]="getPerformanceStatusClass(student.performanceStatus)">
                                {{ student.performanceStatus }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No children data available</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <!-- Recent Notifications -->
            <div class="card mb-3">
              <div class="card-header">
                <h5 class="card-title mb-0">Recent Notifications</h5>
              </div>
              <div class="card-body">
                @if (recentNotifications().length > 0) {
                  <div class="list-group list-group-flush">
                    @for (notification of recentNotifications().slice(0, 5); track notification.id) {
                      <div class="list-group-item px-0 py-2">
                        <div class="d-flex">
                          <div class="flex-shrink-0">
                            <i class="fas" [class]="getNotificationIcon(notification.type)" 
                               [class]="getNotificationColor(notification.type)"></i>
                          </div>
                          <div class="flex-grow-1 ms-2">
                            <h6 class="mb-1">{{ notification.title }}</h6>
                            <p class="mb-1 small">{{ notification.message }}</p>
                            <small class="text-muted">{{ notification.createdAt | date:'short' }}</small>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="text-center mt-2">
                    <a routerLink="/notifications" class="btn btn-sm btn-outline-primary">View All</a>
                  </div>
                } @else {
                  <div class="text-center py-3">
                    <i class="fas fa-bell fa-2x text-muted mb-2"></i>
                    <p class="text-muted small">No new notifications</p>
                  </div>
                }
              </div>
            </div>

            <!-- Upcoming Exams -->
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Upcoming Exams</h5>
              </div>
              <div class="card-body">
                @if (upcomingExams().length > 0) {
                  <div class="list-group list-group-flush">
                    @for (exam of upcomingExams().slice(0, 5); track exam.id) {
                      <div class="list-group-item px-0 py-2">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 class="mb-1">{{ exam.courseName }}</h6>
                            <p class="mb-1 small">{{ exam.examName }}</p>
                            <small class="text-muted">
                              <i class="fas fa-user me-1"></i>{{ exam.studentName }}
                            </small>
                          </div>
                          <div class="text-end">
                            <span class="badge bg-warning">
                              {{ exam.examDate | date:'MMM d' }}
                            </span>
                            <br>
                            <small class="text-muted">{{ exam.examDate | date:'shortTime' }}</small>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="text-center mt-2">
                    <a routerLink="/exams" class="btn btn-sm btn-outline-primary">View All</a>
                  </div>
                } @else {
                  <div class="text-center py-3">
                    <i class="fas fa-calendar fa-2x text-muted mb-2"></i>
                    <p class="text-muted small">No upcoming exams</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Quick Actions -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 col-6 mb-3">
                  <a routerLink="/students" class="btn btn-outline-primary w-100">
                    <i class="fas fa-users mb-2"></i>
                    <br>
                    View Children
                  </a>
                </div>
                <div class="col-md-3 col-6 mb-3">
                  <a routerLink="/attendance" class="btn btn-outline-success w-100">
                    <i class="fas fa-calendar-check mb-2"></i>
                    <br>
                    Attendance Records
                  </a>
                </div>
                <div class="col-md-3 col-6 mb-3">
                  <a routerLink="/grades" class="btn btn-outline-info w-100">
                    <i class="fas fa-chart-line mb-2"></i>
                    <br>
                    Academic Reports
                  </a>
                </div>
                <div class="col-md-3 col-6 mb-3">
                  <a routerLink="/messages" class="btn btn-outline-warning w-100">
                    <i class="fas fa-envelope mb-2"></i>
                    <br>
                    Messages
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }

    .progress {
      background-color: #e9ecef;
    }

    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border: 1px solid rgba(0, 0, 0, 0.125);
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    }

    .list-group-item {
      border-left: none;
      border-right: none;
    }

    .btn-outline-primary:hover,
    .btn-outline-success:hover,
    .btn-outline-info:hover,
    .btn-outline-warning:hover {
      transform: translateY(-2px);
      transition: all 0.2s ease-in-out;
    }
  `]
})
export class ParentDashboardComponent implements OnInit {
  dashboard = signal<ParentDashboardDto | null>(null);
  studentsComparison = signal<StudentComparisonDto[]>([]);
  recentNotifications = signal<NotificationDto[]>([]);
  upcomingExams = signal<UpcomingExamDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private parentDashboardService: ParentDashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    // Load dashboard overview
    this.parentDashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loadAdditionalData(data);
      },
      error: (error) => {
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
        console.error('Dashboard loading error:', error);
      }
    });
  }

  private loadAdditionalData(dashboard: ParentDashboardDto) {
    const studentIds = dashboard.students?.map(student => student.student?.id) || [];

    // Load students comparison
    this.parentDashboardService.getStudentsComparison().subscribe({
      next: (data) => this.studentsComparison.set(data),
      error: (error) => console.error('Students comparison loading error:', error)
    });

    // Load recent notifications
    if (dashboard.parent?.id) {
      this.parentDashboardService.getRecentNotifications(dashboard.parent.id).subscribe({
        next: (data) => this.recentNotifications.set(data),
        error: (error) => console.error('Notifications loading error:', error)
      });
    }

    // Load upcoming exams
    if (studentIds.length > 0) {
      this.parentDashboardService.getUpcomingExams(studentIds).subscribe({
        next: (data) => this.upcomingExams.set(data),
        error: (error) => console.error('Upcoming exams loading error:', error)
      });
    }

    this.loading.set(false);
  }

  getGpaBadgeClass(gpa: number): string {
    if (gpa >= 3.5) return 'bg-success';
    if (gpa >= 3.0) return 'bg-primary';
    if (gpa >= 2.5) return 'bg-warning';
    return 'bg-danger';
  }

  getAttendanceBadgeClass(rate: number): string {
    if (rate >= 90) return 'bg-success';
    if (rate >= 80) return 'bg-primary';
    if (rate >= 70) return 'bg-warning';
    return 'bg-danger';
  }

  getPerformanceStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'excellent':
        return 'bg-success';
      case 'good':
        return 'bg-primary';
      case 'satisfactory':
        return 'bg-warning';
      case 'needs improvement':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'grade':
        return 'fa-chart-line';
      case 'attendance':
        return 'fa-calendar-check';
      case 'exam':
        return 'fa-clipboard-list';
      case 'announcement':
        return 'fa-bullhorn';
      default:
        return 'fa-info-circle';
    }
  }

  getNotificationColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'grade':
        return 'text-success';
      case 'attendance':
        return 'text-warning';
      case 'exam':
        return 'text-info';
      case 'announcement':
        return 'text-primary';
      default:
        return 'text-secondary';
    }
  }
}