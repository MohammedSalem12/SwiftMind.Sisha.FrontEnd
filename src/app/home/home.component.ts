import {AuthService, ConfigStateService} from '@abp/ng.core';
import { Component, inject, OnInit, signal } from '@angular/core';
import {CommonModule} from "@angular/common";
import { Router, RouterModule } from '@angular/router';
import { UserProfileService } from '@volo/ngx-lepton-x.core';
import { StudentService } from '@proxy/students';
import { TeacherService } from '@proxy/teachers';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { lastValueFrom, filter, take } from 'rxjs';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { PromoAdsBarComponent } from '../shared/components/promo-ads-bar.component';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule, OfflineBannerComponent, DidYouKnowComponent, PromoAdsBarComponent]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private configStateService = inject(ConfigStateService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private studentSvc = inject(StudentService);
  private teacherSvc = inject(TeacherService);
  private enrollmentSvc = inject(StudentEnrollmentService);
  private cache = inject(OfflineCacheService);

  // Observable for current user info
  readonly user$ = this.userProfileService.user$;

  // dashboard stats
  studentsCount = signal<number | null>(null);
  teachersCount = signal<number | null>(null);
  parentsCount = signal<number | null>(null);
  loadingCounts = signal(false);
  offline = signal(false);
  offlineLastUpdated = signal('');

  // Track if we're redirecting (to prevent flash of dashboard)
  redirecting = signal(false);

  private readonly CACHE_KEY = 'admin_home';

  // Mock ads and suggestions (UI-only, not real ads)
  ads = signal<any[]>([
    { id: 'a1', title: 'Back-to-School Promo', text: 'Get 20% off on course materials for this semester.', action: '/courses' }
  ]);

  suggestedForTeachers = signal<any[]>([
    { id: 's1', title: 'Classroom Management Workshop', text: 'Free 2-hour online workshop for teachers.', action: '/teachers' },
    { id: 's2', title: 'Grading Tools Trial', text: 'Try our grading tools for 30 days.', action: '/exam-grade' },
    { id: 's3', title: 'Parent Communication Tips', text: 'Improve parent engagement with simple steps.', action: '/feeds' },
  ]);

  get hasLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  login() {
    this.authService.navigateToLogin();
  }

  goToAddTeacher() {
    this.router.navigate(['/add-teacher']);
  }

  manageProfile() {
    this.router.navigate(['/account/manage-profile']);
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.checkUserRoleAndRedirect();
    } else {
      void this.loadCounts();
    }
  }

  private checkUserRoleAndRedirect(): void {
    // Use observable instead of synchronous getOne() — on Android WebView the
    // config state may not be populated yet at init time, causing empty roles
    // and a false redirect to /complete-profile which crashes the app.
    this.configStateService
      .getOne$('currentUser')
      .pipe(
        filter((u: any) => !!u && u.isAuthenticated === true),
        take(1)
      )
      .subscribe((currentUser: any) => {
        try {
          const roles: string[] = (currentUser?.roles || currentUser?.roleNames || currentUser?.userRoles || [])
            .map((r: any) => (typeof r === 'string' ? r.toLowerCase() : ''))
            .filter(Boolean);

          const has = (r: string) => roles.includes(r);
          const isStudent     = has('student');
          const isParent      = has('parent');
          const isTeacher     = has('teacher');
          const isSecretary   = has('secretary');
          const isAdmin       = has('admin');
          const isAdvertiser  = has('advertiser');
          const knownRoles  = ['student','teacher','parent','admin','secretary','advertiser'];
          const hasKnown    = roles.some(r => knownRoles.includes(r));

          if (isAdmin) {
            void this.loadCounts();
            return;
          }

          // Social-login user with no role yet → complete their profile
          if (!hasKnown) {
            this.redirecting.set(true);
            this.router.navigate(['/complete-profile']);
            return;
          }

          if (isStudent || isParent || isTeacher || isSecretary || isAdvertiser) {
            this.redirecting.set(true);
          }

          if (isStudent)          this.router.navigate(['/student']);
          else if (isParent)      this.router.navigate(['/parent']);
          else if (isTeacher)     this.router.navigate(['/teacher']);
          else if (isSecretary)   this.router.navigate(['/secretary']);
          else if (isAdvertiser)  this.router.navigate(['/ads/my']);
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      });
  }

  async loadCounts() {
    this.loadingCounts.set(true);
    try {
      const stuResp: any = await lastValueFrom(this.studentSvc.getList({ skipCount: 0, maxResultCount: 1 } as any));
      this.studentsCount.set(stuResp?.totalCount ?? null);

      const teaResp: any = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 1 } as any));
      this.teachersCount.set(teaResp?.totalCount ?? null);

      // parents: derive from enrollments parentId fields (unique)
      const enrollResp: any = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: 0, maxResultCount: 100 } as any));
      const enrolls = enrollResp?.items ?? [];
      const parentIds = new Set(enrolls.filter((e: any) => e.parentId).map((e: any) => e.parentId));
      this.parentsCount.set(parentIds.size);
      this.cache.set(this.CACHE_KEY, {
        studentsCount: this.studentsCount(),
        teachersCount: this.teachersCount(),
        parentsCount: this.parentsCount(),
      });
      this.offline.set(false);
    } catch (e) {
      console.error('Failed to load dashboard counts', e);
      const cached = this.cache.get<any>(this.CACHE_KEY);
      if (cached) {
        this.studentsCount.set(cached.studentsCount ?? null);
        this.teachersCount.set(cached.teachersCount ?? null);
        this.parentsCount.set(cached.parentsCount ?? null);
        this.offline.set(true);
        this.offlineLastUpdated.set(this.cache.getLastUpdatedLabel(this.CACHE_KEY));
      } else {
        this.studentsCount.set(null);
        this.teachersCount.set(null);
        this.parentsCount.set(null);
      }
    } finally {
      this.loadingCounts.set(false);
    }
  }
}
