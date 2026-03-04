import { AuthService, RestService } from '@abp/ng.core';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeedService } from '@proxy/feeds';
import { ParentService } from '@proxy/parents';
import { UserProfileService } from '@volo/ngx-lepton-x.core';
import { lastValueFrom } from 'rxjs';

interface StudentProgressDto {
  student: any;
  averageGrade: number;
  attendanceRate: number;
  recentGrades: any[];
  upcomingExams: any[];
  totalCourses: number;
  completedExams: number;
  totalAttendanceDays: number;
  presentDays: number;
}

interface NotificationDto {
  id: string;
  title: string;
  content: string;
  createdDate: string;
  isRead: boolean;
}

interface ParentDashboardDto {
  parent: any;
  students: StudentProgressDto[];
  totalChildren: number;
  overallAttendanceRate: number;
  recentNotifications: NotificationDto[];
  upcomingExams: any[];
}

@Component({
  standalone: true,
  selector: 'app-parent-dashboard',
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss'],
  imports: [CommonModule, RouterModule]
})
export class ParentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private feedService = inject(FeedService);
  private parentService = inject(ParentService);
  private restService = inject(RestService);

  readonly user$ = this.userProfileService.user$;
  
  dashboard = signal<ParentDashboardDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Filters for absence notifications
  showOnlyAbsences = signal(false);
  absenceNotifications = signal<NotificationDto[]>([]);
  unreadAbsenceCount = signal(0);

  ngOnInit(): void {
    void this.loadDashboard();
  }

  async loadDashboard() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // Get current user ID
      const user: any = await lastValueFrom(this.user$);
      
      if (!user  || !user.id) {
        this.error.set('User not authenticated');
        return;
      }

      // Get parent by user ID
      const parent = await lastValueFrom(this.parentService.getByUserId(user.id));
      
      if (!parent) {
        this.error.set('Parent profile not found');
        return;
      }

      // Load parent dashboard data from API
      const dashboardData = await lastValueFrom(
        this.restService.request<any, ParentDashboardDto>({
          method: 'GET',
          url: '/api/app/parent-dashboard',
        })
      );

      this.dashboard.set(dashboardData);

      // Load feeds and filter absence notifications
      await this.loadAbsenceNotifications(parent.id);
      
    } catch (err: any) {
      console.error('Error loading parent dashboard:', err);
      this.error.set(err?.error?.error?.message || 'Failed to load dashboard data');
    } finally {
      this.loading.set(false);
    }
  }

  async loadAbsenceNotifications(parentId: string) {
    try {
      // Load all feeds
      const feeds: any = await lastValueFrom(
        this.feedService.getList({ skipCount: 0, maxResultCount: 100 })
      );

      // Filter for absence alerts (announcements with "Absence Alert" in title)
      const absenceAlerts = (feeds.items || []).filter((feed: any) =>
        feed.title?.includes('Absence Alert') || 
        feed.title?.includes('🚨')
      );

      this.absenceNotifications.set(absenceAlerts.map((feed: any) => ({
        id: feed.id,
        title: feed.title,
        content: feed.content,
        createdDate: feed.creationTime,
        isRead: false // We'll implement read tracking later
      })));

      // Count unread
      this.unreadAbsenceCount.set(absenceAlerts.length);
      
    } catch (err) {
      console.error('Error loading absence notifications:', err);
    }
  }

  toggleAbsenceFilter() {
    this.showOnlyAbsences.set(!this.showOnlyAbsences());
  }

  getDisplayedNotifications(): NotificationDto[] {
    const dashboard = this.dashboard();
    if (!dashboard) return [];

    if (this.showOnlyAbsences()) {
      return this.absenceNotifications();
    }

    return dashboard.recentNotifications || [];
  }

  getStudentName(student: any): string {
    if (!student) return 'Unknown';
    return `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
  }

  getAttendanceClass(rate: number): string {
    if (rate >= 90) return 'text-success';
    if (rate >= 75) return 'text-warning';
    return 'text-danger';
  }

  getGradeClass(grade: number): string {
    if (grade >= 90) return 'text-success';
    if (grade >= 75) return 'text-info';
    if (grade >= 60) return 'text-warning';
    return 'text-danger';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  viewStudentDetails(studentId: string) {
    this.router.navigate(['/parent/child', studentId]);
  }

  viewAllNotifications() {
    this.router.navigate(['/feeds']);
  }

  markAsRead(notificationId: string) {
    // TODO: Implement mark as read functionality
    console.log('Mark as read:', notificationId);
  }
}
