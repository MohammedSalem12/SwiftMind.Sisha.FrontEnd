import {AuthService, ConfigStateService} from '@abp/ng.core';
import { Component, inject, OnInit, signal } from '@angular/core';
import {CommonModule} from "@angular/common";
import { Router, RouterModule } from '@angular/router';
import { UserProfileService } from '@volo/ngx-lepton-x.core';
import { StudentService } from '@proxy/students';
import { TeacherService, TeacherPromotionService } from '@proxy/teachers';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { lastValueFrom, filter, take } from 'rxjs';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { PromoAdsBarComponent } from '../shared/components/promo-ads-bar.component';
import { ActiveSemesterComponent } from '../shared/components/active-semester.component';
import { RegisterModalService } from '../shared/services/register-modal.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule, OfflineBannerComponent, DidYouKnowComponent, PromoAdsBarComponent, ActiveSemesterComponent]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private configStateService = inject(ConfigStateService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private studentSvc = inject(StudentService);
  private teacherSvc = inject(TeacherService);
  private promotionSvc = inject(TeacherPromotionService);
  private enrollmentSvc = inject(StudentEnrollmentService);
  private cache = inject(OfflineCacheService);
  private http = inject(HttpClient);
  private readonly apiBase = (environment as any).apis?.default?.url || '';
  readonly registerModal = inject(RegisterModalService);

  // Observable for current user info
  readonly user$ = this.userProfileService.user$;

  // dashboard stats
  studentsCount = signal<number | null>(null);
  teachersCount = signal<number | null>(null);
  parentsCount = signal<number | null>(null);
  pendingRegistrationCount = signal<number | null>(null);
  pendingPromotionCount = signal<number | null>(null);
  loadingCounts = signal(false);
  offline = signal(false);
  offlineLastUpdated = signal('');

  // Track if we're redirecting (to prevent flash of dashboard)
  redirecting = signal(false);
  guestTeachers = signal<any[]>([]);

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
    // Check both ABP auth state and OAuth token — on page reload after login,
    // ABP config may not be loaded yet but the token is already in storage
    const hasToken = !!localStorage.getItem('access_token') || this.authService.isAuthenticated;
    if (hasToken) {
      this.checkUserRoleAndRedirect();
    } else {
      this.loadGuestTeachers();
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
          const isPartner     = has('partner');
          const knownRoles  = ['student','teacher','parent','admin','secretary','advertiser','partner'];
          const hasKnown    = roles.some(r => knownRoles.includes(r));

          if (isAdmin) {
            void this.loadCounts();
            return;
          }

          // User with no role → check if pending registration or needs profile completion
          if (!hasKnown) {
            this.redirecting.set(true);
            // Check if they have a pending registration request
            this.http.get<any>(`${this.apiBase}/api/app/registration-request/my-request-status`)
              .subscribe({
                next: (req) => {
                  if (req && req.status === 0) {
                    // Pending approval — show waiting page
                    this.router.navigate(['/pending-approval']);
                  } else {
                    // No pending request — needs to complete profile
                    this.router.navigate(['/complete-profile']);
                  }
                },
                error: () => this.router.navigate(['/complete-profile'])
              });
            return;
          }

          if (isStudent || isParent || isTeacher || isSecretary || isAdvertiser || isPartner) {
            this.redirecting.set(true);
          }

          if (isStudent)          this.router.navigate(['/student']);
          else if (isParent)      this.router.navigate(['/parent']);
          else if (isTeacher)     this.router.navigate(['/teacher']);
          else if (isSecretary)   this.router.navigate(['/secretary']);
          else if (isPartner)     this.router.navigate(['/partner/dashboard']);
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

      // Load pending registration requests count
      try {
        const pending = await lastValueFrom(
          this.http.get<any[]>(`${this.apiBase}/api/app/registration-request/pending-requests`)
        );
        this.pendingRegistrationCount.set(pending?.length ?? 0);
      } catch {
        this.pendingRegistrationCount.set(null);
      }

      // Load pending promotion requests count
      try {
        const pendingPromos = await lastValueFrom(this.promotionSvc.getPendingList());
        this.pendingPromotionCount.set(pendingPromos?.length ?? 0);
      } catch {
        this.pendingPromotionCount.set(null);
      }

      this.cache.set(this.CACHE_KEY, {
        studentsCount: this.studentsCount(),
        teachersCount: this.teachersCount(),
        parentsCount: this.parentsCount(),
        pendingRegistrationCount: this.pendingRegistrationCount(),
        pendingPromotionCount: this.pendingPromotionCount(),
      });
      this.offline.set(false);
    } catch (e) {
      console.error('Failed to load dashboard counts', e);
      const cached = this.cache.get<any>(this.CACHE_KEY);
      if (cached) {
        this.studentsCount.set(cached.studentsCount ?? null);
        this.teachersCount.set(cached.teachersCount ?? null);
        this.parentsCount.set(cached.parentsCount ?? null);
        this.pendingRegistrationCount.set(cached.pendingRegistrationCount ?? null);
        this.pendingPromotionCount.set(cached.pendingPromotionCount ?? null);
        this.offline.set(true);
        this.offlineLastUpdated.set(this.cache.getLastUpdatedLabel(this.CACHE_KEY));
      } else {
        this.studentsCount.set(null);
        this.teachersCount.set(null);
        this.parentsCount.set(null);
        this.pendingRegistrationCount.set(null);
        this.pendingPromotionCount.set(null);
      }
    } finally {
      this.loadingCounts.set(false);
    }
  }

  private async loadGuestTeachers(): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/sesha/teachers/search`, {
          params: { searchPrefix: '', maxResults: '6' }
        })
      );
      this.guestTeachers.set(res || []);
    } catch { /* silent — API may require auth */ }
  }

  goRegisterToSeeTeachers(): void {
    this.registerModal.show();
  }

  showRegisterPrompt(): void {
    this.registerModal.show();
  }
}
