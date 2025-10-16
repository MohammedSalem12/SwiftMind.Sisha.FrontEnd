import {AuthService} from '@abp/ng.core';
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
    void this.loadCounts();
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
