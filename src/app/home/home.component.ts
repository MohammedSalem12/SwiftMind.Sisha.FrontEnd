import {AuthService, ConfigStateService} from '@abp/ng.core';
import { Component, inject, OnInit, signal } from '@angular/core';
import {CommonModule} from "@angular/common";
import { Router, RouterModule } from '@angular/router';
import { UserProfileService } from '@volo/ngx-lepton-x.core';
import { StudentService } from '@proxy/students';
import { TeacherService } from '@proxy/teachers';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private configStateService = inject(ConfigStateService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private studentSvc = inject(StudentService);
  private teacherSvc = inject(TeacherService);
  private enrollmentSvc = inject(StudentEnrollmentService);

  // Observable for current user info
  readonly user$ = this.userProfileService.user$;

  // dashboard stats
  studentsCount = signal<number | null>(null);
  teachersCount = signal<number | null>(null);
  parentsCount = signal<number | null>(null);
  loadingCounts = signal(false);
  
  // Track if we're redirecting (to prevent flash of dashboard)
  redirecting = signal(false);

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
    }
    // Only load counts for ADMIN/SECRETARY — other roles are redirected immediately
    // and may not have permission to call these endpoints (causes error toasts)
    const currentUser = this.configStateService.getOne('currentUser') as any;
    const roles: string[] = currentUser?.roles || currentUser?.roleNames || currentUser?.userRoles || [];
    const isAdmin = Array.isArray(roles) && roles.some(
      (r: any) => typeof r === 'string' && r.toUpperCase() === 'ADMIN'
    );
    if (!this.authService.isAuthenticated || isAdmin) {
      void this.loadCounts();
    }
  }

  private checkUserRoleAndRedirect(): void {
    try {
      const currentUser = this.configStateService.getOne('currentUser') as any;
      const roles: string[] = currentUser?.roles || currentUser?.roleNames || currentUser?.userRoles || [];

      const has = (r: string) => Array.isArray(roles) && roles.some(
        (role: any) => typeof role === 'string' && role.toLowerCase() === r);

      const isStudent   = has('student');
      const isParent    = has('parent');
      const isTeacher   = has('teacher');
      const isSecretary = has('secretary');
      const isAdmin     = has('admin');
      const knownRoles  = ['student','teacher','parent','admin','secretary'];
      const hasKnown    = Array.isArray(roles) && roles.some(
        (r: any) => typeof r === 'string' && knownRoles.includes(r.toLowerCase()));

      // Social-login user with no role yet → complete their profile
      if (!hasKnown) {
        this.redirecting.set(true);
        this.router.navigate(['/complete-profile']);
        return;
      }

      if (isStudent || isParent || isTeacher || isSecretary) {
        this.redirecting.set(true);
      }

      if (isStudent)        this.router.navigate(['/student']);
      else if (isParent)    this.router.navigate(['/parent']);
      else if (isTeacher)   this.router.navigate(['/teacher']);
      else if (isSecretary) this.router.navigate(['/secretary']);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
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
    } catch (e) {
      console.error('Failed to load dashboard counts', e);
      this.studentsCount.set(null);
      this.teachersCount.set(null);
      this.parentsCount.set(null);
    } finally {
      this.loadingCounts.set(false);
    }
  }
}
