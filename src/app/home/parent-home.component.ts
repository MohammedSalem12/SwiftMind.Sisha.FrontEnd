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
import { ParentStudentLinkStatus } from '@proxy/enums/parent-student-link-status.enum';
import { StudentService } from '@proxy/students';
import type { PromotionRequestDto } from '@proxy/students/models';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { PromoAdsBarComponent } from '../shared/components/promo-ads-bar.component';

@Component({
  selector: 'app-parent-home',
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent, DidYouKnowComponent, PromoAdsBarComponent],
  templateUrl: './parent-home.component.html',
  styleUrls: ['./parent-home.component.scss'],
})
export class ParentHomeComponent implements OnInit {
  private readonly configStateService = inject(ConfigStateService);
  private readonly router = inject(Router);
  private readonly parentService = inject(ParentService);
  private readonly notificationService = inject(NotificationService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly studentService = inject(StudentService);
  private readonly cache = inject(OfflineCacheService);

  parentName = signal('');
  children = signal<ParentStudentDto[]>([]);
  childCoursesMap = signal<Record<string, EnrollmentRequestDto[]>>({});
  recentNotifications = signal<NotificationDto[]>([]);
  pendingRequestsCount = signal(0);
  loading = signal(false);
  currentParent = signal<ParentDto | null>(null);
  offline = signal(false);
  offlineLastUpdated = signal('');
  pendingPromotions = signal<PromotionRequestDto[]>([]);
  promotionActionLoading = signal(false);

  // Collapse/expand state
  childrenExpanded = signal(true);
  notificationsExpanded = signal(true);

  private readonly CACHE_KEY = 'parent_home';

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadParentChildren(),
      this.loadRecentNotifications(),
      this.loadPendingRequestsCount(),
      this.loadPendingPromotions(),
    ]);
    if (!this.offline()) {
      this.cache.set(this.CACHE_KEY, {
        parentName: this.parentName(),
        children: this.children(),
        childCoursesMap: this.childCoursesMap(),
        recentNotifications: this.recentNotifications(),
        pendingRequestsCount: this.pendingRequestsCount(),
      });
    }
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
        const confirmed = (students as ParentStudentDto[]).filter(
          s => s.linkStatus === ParentStudentLinkStatus.Confirmed
        );
        this.children.set(confirmed);

        await this.loadChildrenCourses(confirmed);
      }
    } catch (error) {
      console.error('Error loading parent children:', error);
      this.restoreFromCache();
    } finally {
      this.loading.set(false);
    }
  }

  private restoreFromCache(): void {
    const cached = this.cache.get<any>(this.CACHE_KEY);
    if (cached) {
      this.parentName.set(cached.parentName || '');
      this.children.set(cached.children || []);
      this.childCoursesMap.set(cached.childCoursesMap || {});
      this.recentNotifications.set(cached.recentNotifications || []);
      this.pendingRequestsCount.set(cached.pendingRequestsCount || 0);
      this.offline.set(true);
      this.offlineLastUpdated.set(this.cache.getLastUpdatedLabel(this.CACHE_KEY));
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

  private async loadPendingPromotions(): Promise<void> {
    try {
      const promotions = await lastValueFrom(
        this.studentService.getPendingPromotionRequests({ skipHandleError: true })
      );
      this.pendingPromotions.set(promotions || []);
    } catch { /* silent */ }
  }

  async approvePromotion(req: PromotionRequestDto): Promise<void> {
    this.promotionActionLoading.set(true);
    try {
      await lastValueFrom(this.studentService.approvePromotionRequest(req.id!));
      this.pendingPromotions.update(list => list.filter(r => r.id !== req.id));
    } catch (e: any) {
      console.error('Approve promotion error:', e);
    } finally {
      this.promotionActionLoading.set(false);
    }
  }

  async rejectPromotion(req: PromotionRequestDto): Promise<void> {
    this.promotionActionLoading.set(true);
    try {
      await lastValueFrom(this.studentService.rejectPromotionRequest(req.id!));
      this.pendingPromotions.update(list => list.filter(r => r.id !== req.id));
    } catch (e: any) {
      console.error('Reject promotion error:', e);
    } finally {
      this.promotionActionLoading.set(false);
    }
  }

  trackById = (_: number, item: ParentStudentDto) => item.studentId;
}
