import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { PullToRefreshDirective } from '../shared/directives/pull-to-refresh.directive';
import { FixedToBodyDirective } from '../shared/directives/fixed-to-body.directive';

import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { SessionService } from '@proxy/groups';
import type { StudentCourseDto } from '@proxy/courses/dtos/models';
import type { NextSessionDto } from '@proxy/groups/dtos/models';
import { environment } from '../../environments/environment';
import { SessionTimerComponent } from '../shared/components/session-timer.component';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { PromoAdsBarComponent } from '../shared/components/promo-ads-bar.component';
import { ActiveSemesterComponent } from '../shared/components/active-semester.component';

const GRADE_NAMES: Record<number, string> = {
  [-1]: 'رياض أطفال 1',
  0: 'رياض أطفال 2',
  1: 'الصف الأول الابتدائي',
  2: 'الصف الثاني الابتدائي',
  3: 'الصف الثالث الابتدائي',
  4: 'الصف الرابع الابتدائي',
  5: 'الصف الخامس الابتدائي',
  6: 'الصف السادس الابتدائي',
  7: 'الصف الأول الإعدادي',
  8: 'الصف الثاني الإعدادي',
  9: 'الصف الثالث الإعدادي',
  10: 'الصف الأول الثانوي',
  11: 'الصف الثاني الثانوي',
  12: 'الصف الثالث الثانوي',
};

@Component({
  selector: 'app-student-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonicModule, PullToRefreshDirective, FixedToBodyDirective, SessionTimerComponent, OfflineBannerComponent, DidYouKnowComponent, PromoAdsBarComponent, ActiveSemesterComponent],
  templateUrl: './student-home.component.html',
  styleUrls: ['./student-home.component.scss'],
})
export class StudentHomeComponent implements OnInit {
  private readonly router         = inject(Router);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly courseService  = inject(CourseService);
  private readonly http           = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly cache          = inject(OfflineCacheService);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly apiBase        = environment.apis?.default?.url || '';

  studentName        = signal('');
  gradeName          = signal('');
  courses            = signal<StudentCourseDto[]>([]);
  promoAds           = signal<any[]>([]);
  loading            = signal(true);
  nextSession        = signal<NextSessionDto | null>(null);
  offline            = signal(false);
  offlineLastUpdated = signal('');

  // Collapse/expand state
  coursesExpanded    = signal(true);
  availableExpanded  = signal(true);

  private readonly CACHE_KEY = 'student_home';

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.studentName.set(userInfo?.actorName || '');
      if (userInfo?.currentGrade) {
        this.gradeName.set(GRADE_NAMES[userInfo.currentGrade] || `الصف ${userInfo.currentGrade}`);
      }
      await Promise.all([
        this.loadCourses(),
        this.loadPromoAds(),
        this.loadNextSession(),
      ]);
      // Cache successful data
      this.cache.set(this.CACHE_KEY, {
        studentName: this.studentName(),
        gradeName: this.gradeName(),
        courses: this.courses(),
        promoAds: this.promoAds(),
      });
      this.offline.set(false);
    } catch (err) {
      console.error('Error loading student home:', err);
      this.restoreFromCache();
    } finally {
      this.loading.set(false);
    }
  }

  private restoreFromCache(): void {
    const cached = this.cache.get<any>(this.CACHE_KEY);
    if (cached) {
      this.studentName.set(cached.studentName || '');
      this.gradeName.set(cached.gradeName || '');
      this.courses.set(cached.courses || []);
      this.promoAds.set(cached.promoAds || []);
      this.offline.set(true);
      this.offlineLastUpdated.set(this.cache.getLastUpdatedLabel(this.CACHE_KEY));
    }
  }

  async refreshData(e: { complete: () => void }): Promise<void> {
    try {
      await Promise.all([this.loadCourses(), this.loadNextSession(), this.loadPromoAds()]);
    } finally {
      e.complete();
    }
  }

  private async loadCourses(): Promise<void> {
    try {
      const result = await lastValueFrom(this.courseService.getCoursesForCurrentStudent());
      this.courses.set(result || []);
    } catch { /* silent */ }
  }

  enrolledCourses(): StudentCourseDto[] {
    return this.courses().filter(c => c.isEnrolled || c.hasPendingRequest);
  }

  availableCourses(): StudentCourseDto[] {
    return this.courses().filter(c => !c.isEnrolled && !c.hasPendingRequest);
  }

  private async loadNextSession(): Promise<void> {
    try {
      const session = await lastValueFrom(this.sessionService.getNextSession({ skipHandleError: true }));
      this.nextSession.set(session ?? null);
    } catch { /* no sessions */ }
  }

  private async loadPromoAds(): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/app/advertisement/active-ads`, {
          params: { audience: '1', maxResultCount: '10' }, // 1 = Students
        })
      );
      this.promoAds.set(res?.items ?? []);
    } catch { /* silent */ }
  }

  trackAdClick(ad: any): void {
    if (ad?.id) {
      this.http.post(`${this.apiBase}/api/app/advertisement/${ad.id}/click`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      this.router.navigate(['/ads', 'detail', ad.id]);
    }
  }

  goToAllAds(): void {
    this.router.navigate(['/ads']);
  }

  goProfile(): void {
    this.router.navigate(['/student/profile']);
  }

  goTodaySessions(): void {
    this.router.navigate(['/student/today-sessions']);
  }

  formatCountdown(seconds: number): string {
    if (!seconds || seconds <= 0) return 'الآن';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}س ${m}د`;
    return `${m} دقيقة`;
  }

  goRegister(): void {
    this.router.navigate(['/student/courses']);
  }

  viewCourse(course: StudentCourseDto): void {
    if (course.isEnrolled) {
      this.router.navigate(['/student/course', course.id]);
    }
  }

  goToRequests(): void {
    this.router.navigate(['/student/requests']);
  }

  goEnroll(course: StudentCourseDto): void {
    this.router.navigate(['/student/enroll', course.id]);
  }
}
