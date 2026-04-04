import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import { AcademyService } from '@proxy/academies';
import { SessionService } from '@proxy/groups';
import type { CourseDto } from '@proxy/courses/dtos/models';
import type { AcademyDto } from '@proxy/academies/models';
import type { NextSessionDto } from '@proxy/groups/dtos/models';
import { SessionTimerComponent } from '../shared/components/session-timer.component';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { PromoAdsBarComponent } from '../shared/components/promo-ads-bar.component';
import { ActiveSemesterComponent } from '../shared/components/active-semester.component';

interface AcademyCourseGroup {
  academy: AcademyDto;
  courses: any[];
}

@Component({
  selector: 'app-teacher-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SessionTimerComponent, OfflineBannerComponent, DidYouKnowComponent, PromoAdsBarComponent, ActiveSemesterComponent],
  templateUrl: './teacher-home.component.html',
  styleUrls: ['./teacher-home.component.scss'],
})
export class TeacherHomeComponent implements OnInit {
  private readonly router             = inject(Router);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly teacherService     = inject(TeacherService);
  private readonly academyService     = inject(AcademyService);
  private readonly sessionService     = inject(SessionService);
  private readonly cache              = inject(OfflineCacheService);

  loading          = signal(false);
  teacherName      = signal<string>('');
  teacherId        = signal<string | null>(null);
  referralCode     = signal<string>('');
  copied           = signal(false);
  courses          = signal<CourseDto[]>([]);
  academyGroups    = signal<AcademyCourseGroup[]>([]);
  myAcademy        = signal<AcademyDto | null>(null);
  loadingAcademies = signal(false);
  nextSession      = signal<NextSessionDto | null>(null);
  offline            = signal(false);
  offlineLastUpdated = signal('');
  // Set of courseIds this teacher is assigned to within academies
  assignedAcademyCourseIds = signal<Set<string>>(new Set());

  // Courses that are NOT in any academy group (personal/direct courses)
  personalCourses = computed(() => {
    const academyCourseIds = new Set<string>();
    this.academyGroups().forEach(g =>
      g.courses.forEach(c => academyCourseIds.add(c.courseId ?? c.id))
    );
    return this.courses().filter(c => !academyCourseIds.has(c.id!));
  });

  // Collapse/expand state
  coursesExpanded    = signal(true);
  academyExpanded    = signal<Record<string, boolean>>({});

  private readonly CACHE_KEY = 'teacher_home';

  async ngOnInit(): Promise<void> {
    // Load courses first — academy section filters by teacher's courses
    await this.loadCourses();
    if (this.offline()) return; // loadCourses failed and restored cache
    await Promise.all([this.loadAcademies(), this.loadNextSession(), this.loadReferralCode()]);
    // Cache successful data
    this.cache.set(this.CACHE_KEY, {
      teacherName: this.teacherName(),
      teacherId: this.teacherId(),
      courses: this.courses(),
      academyGroups: this.academyGroups(),
      myAcademy: this.myAcademy(),
    });
  }

  private async loadNextSession(): Promise<void> {
    try {
      const session = await lastValueFrom(this.sessionService.getNextSession({ skipHandleError: true }));
      this.nextSession.set(session ?? null);
    } catch { /* no sessions */ }
  }

  private async loadCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.teacherName.set(userInfo?.actorName ?? '');
      this.teacherId.set(userInfo?.actorId ?? null);
      const id = userInfo?.actorId;
      if (!id) return;
      const courses = await lastValueFrom(this.teacherService.getTeacherCourses(id, { skipHandleError: true }));
      this.courses.set(courses || []);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
      this.restoreFromCache();
    } finally {
      this.loading.set(false);
    }
  }

  private restoreFromCache(): void {
    const cached = this.cache.get<any>(this.CACHE_KEY);
    if (cached) {
      this.teacherName.set(cached.teacherName || '');
      this.teacherId.set(cached.teacherId || null);
      this.courses.set(cached.courses || []);
      this.academyGroups.set(cached.academyGroups || []);
      this.myAcademy.set(cached.myAcademy || null);
      this.offline.set(true);
      this.offlineLastUpdated.set(this.cache.getLastUpdatedLabel(this.CACHE_KEY));
    }
  }

  private async loadAcademies(): Promise<void> {
    this.loadingAcademies.set(true);
    try {
      const tId = this.teacherId();
      if (!tId) return;

      // Load all academies visible to this teacher
      const allAcademies = await lastValueFrom(
        this.academyService.getList({ skipHandleError: true })
      ).catch(() => [] as AcademyDto[]);

      if (!allAcademies?.length) return;

      // Filter: only academies the teacher owns (supervisor) or has joined (approved member)
      const myAcademies: AcademyDto[] = [];
      for (const a of allAcademies) {
        if (a.supervisorTeacherId === tId) {
          this.myAcademy.set(a);
          myAcademies.push(a);
          continue;
        }
        // Check membership for non-supervised academies
        try {
          const m = await lastValueFrom(
            this.academyService.getMyMembership(a.id, { skipHandleError: true })
          );
          if (m?.teacherId && m.status === 1) { // Approved
            myAcademies.push(a);
          }
        } catch { /* not a member */ }
      }

      if (myAcademies.length === 0) return;

      // Get teacher's own course IDs to filter academy courses
      const teacherCourseIds = new Set(this.courses().map(c => c.id));

      const groups: AcademyCourseGroup[] = [];
      for (const academy of myAcademies) {
        try {
          const allCourses = await lastValueFrom(
            this.academyService.getAcademyCourses(academy.id!, { skipHandleError: true })
          );
          // Only keep courses assigned to this teacher
          const teacherCourses = (allCourses || []).filter(c => {
            return c.courseId && teacherCourseIds.has(c.courseId);
          });
          if (teacherCourses.length > 0) {
            groups.push({ academy, courses: teacherCourses });
          }
        } catch { /* silent */ }
      }
      this.academyGroups.set(groups);

      // Load course-teacher assignments to know which courses this teacher can act on
      const assignedIds = new Set<string>();
      for (const academy of myAcademies) {
        try {
          const assignments = await lastValueFrom(
            this.academyService.getMyAcademyCourseAssignments(academy.id!, { skipHandleError: true })
          );
          (assignments || []).forEach((a: any) => assignedIds.add(a.courseId));
        } catch { /* silent */ }
      }
      this.assignedAcademyCourseIds.set(assignedIds);
    } catch { /* silent — teacher may not be in any academy */ } finally {
      this.loadingAcademies.set(false);
    }
  }

  selectCourse(course: CourseDto): void {
    this.router.navigate(['/teacher/course', course.id]);
  }

  openQrCodes(event: Event, course: CourseDto): void {
    event.stopPropagation();
    this.router.navigate(['/teacher/qr-codes'], { queryParams: { courseId: course.id } });
  }

  goToProfile(): void {
    this.router.navigate(['/teacher/profile']);
  }

  goTodaySessions(): void {
    this.router.navigate(['/teacher/today-sessions']);
  }

  goToEnroll(): void {
    this.router.navigate(['/teacher/enroll']);
  }

  goToAcademies(): void {
    this.router.navigate(['/teacher/academies']);
  }

  goToReports(): void {
    this.router.navigate(['/reports/absence']);
  }

  isAcademyCourseAssigned(course: any): boolean {
    const id = course.courseId ?? course.id;
    return this.assignedAcademyCourseIds().has(id);
  }

  selectAcademyCourse(course: any): void {
    const id = course.courseId ?? course.id;
    const academyId = course.academyId;
    if (id) this.router.navigate(['/teacher/course', id], {
      queryParams: academyId ? { academyId } : {}
    });
  }

  goAcademyAttendance(event: Event, course: any): void {
    event.stopPropagation();
    const id = course.courseId ?? course.id;
    const academyId = course.academyId;
    if (id) this.router.navigate(['/attendance'], {
      queryParams: { courseId: id, ...(academyId ? { academyId } : {}) }
    });
  }

  goAcademyMarks(event: Event, course: any): void {
    event.stopPropagation();
    const id = course.courseId ?? course.id;
    const academyId = course.academyId;
    if (id) this.router.navigate(['/marks-entry'], {
      queryParams: { courseId: id, ...(academyId ? { academyId } : {}) }
    });
  }

  toggleCourses(): void {
    this.coursesExpanded.update(v => !v);
  }

  toggleAcademy(id: string): void {
    this.academyExpanded.update(map => ({ ...map, [id]: !(map[id] ?? true) }));
  }

  isAcademyExpanded(id: string): boolean {
    return this.academyExpanded()[id] ?? true;
  }

  trackById = (_: number, item: any) => item.id;
  trackByAcademy = (_: number, item: AcademyCourseGroup) => item.academy.id;

  private async loadReferralCode(): Promise<void> {
    try {
      const info = await lastValueFrom(this.teacherService.getMyReferralInfo({ skipHandleError: true }));
      this.referralCode.set(info?.referralCode ?? '');
    } catch { /* ignore */ }
  }

  async shareReferral(): Promise<void> {
    const code = this.referralCode();
    if (!code) return;
    const link = `https://sesha-9999.web.app/register?ref=${code}`;
    const text = `انضم لتطبيق KAI التعليمي! سجّل باستخدام كود الدعوة: ${code}\nJoin KAI educational app! Register with referral code: ${code}\n${link}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'KAI - دعوة', text, url: link });
      } else {
        await navigator.clipboard?.writeText(text);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch { /* user cancelled */ }
  }

  copyReferral(): void {
    const code = this.referralCode();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
