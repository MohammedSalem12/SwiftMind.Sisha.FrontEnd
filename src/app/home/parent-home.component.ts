import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ParentDto, ParentStudentDto } from '@proxy/parents/models';
import { NotificationService, NotificationDto } from '@proxy/notifications';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';

@Component({
  selector: 'app-parent-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-home.component.html',
  styleUrls: ['./parent-home.component.scss'],
})
export class ParentHomeComponent implements OnInit {
  private readonly configStateService = inject(ConfigStateService);
  private readonly router = inject(Router);
  private readonly parentService = inject(ParentService);
  private readonly notificationService = inject(NotificationService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);

  parentName = signal('');
  children = signal<ParentStudentDto[]>([]);
  childCoursesMap = signal<Record<string, EnrollmentRequestDto[]>>({});
  recentNotifications = signal<NotificationDto[]>([]);
  pendingRequestsCount = signal(0);
  loading = signal(false);
  currentParent = signal<ParentDto | null>(null);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadParentChildren(),
      this.loadRecentNotifications(),
      this.loadPendingRequestsCount()
    ]);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
  }

  private async loadPendingRequestsCount(): Promise<void> {
    try {
      const pending = await lastValueFrom(this.enrollmentRequestService.getPendingRequestsForCurrentParent());
      this.pendingRequestsCount.set(pending?.length || 0);
    } catch {
      // silent
    }
  }

  private async loadRecentNotifications(): Promise<void> {
    try {
      const notifications = await lastValueFrom(this.notificationService.getMyNotifications());
      this.recentNotifications.set(notifications?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private async loadParentChildren(): Promise<void> {
    this.loading.set(true);
    try {
      const currentUserId = this.configStateService.getOne('currentUser')?.id;
      if (!currentUserId) {
        console.error('No user ID found');
        return;
      }

      const parent = await lastValueFrom(this.parentService.getByUserId(currentUserId));
      if (parent) {
        this.currentParent.set(parent);
        this.parentName.set(`${parent.firstName || ''} ${parent.lastName || ''}`.trim());

        const students = await lastValueFrom(this.parentService.getLinkedStudentsByParentId(parent.id!));
        this.children.set(students as ParentStudentDto[]);

        await this.loadChildrenCourses(students as ParentStudentDto[]);
      }
    } catch (error) {
      console.error('Error loading parent children:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadChildrenCourses(children: ParentStudentDto[]): Promise<void> {
    try {
      const allRequests = await lastValueFrom(this.enrollmentRequestService.getList());
      if (!allRequests) return;

      const studentIds = new Set(children.map(c => c.studentId));
      const map: Record<string, EnrollmentRequestDto[]> = {};

      for (const req of allRequests) {
        if (!req.studentId || !studentIds.has(req.studentId)) continue;
        if (req.status !== EnrollmentRequestStatus.Approved) continue;

        if (!map[req.studentId]) map[req.studentId] = [];
        if (!map[req.studentId].some(r => r.courseId === req.courseId)) {
          map[req.studentId].push(req);
        }
      }

      this.childCoursesMap.set(map);
    } catch (error) {
      console.error('Error loading children courses:', error);
    }
  }

  getChildCourses(studentId: string): EnrollmentRequestDto[] {
    return this.childCoursesMap()[studentId] || [];
  }

  viewChildDetails(child: ParentStudentDto): void {
    this.router.navigate(['/parent/child', child.studentId]);
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goToRequests(): void {
    this.router.navigate(['/parent/requests']);
  }

  goToLinkChild(): void {
    this.router.navigate(['/parent/link-child']);
  }

  goToFeeds(): void {
    this.router.navigate(['/feeds']);
  }

  goToProfile(): void {
    this.router.navigate(['/account/manage']);
  }

  trackById = (_: number, item: ParentStudentDto) => item.studentId;
}
