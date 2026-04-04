import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import { AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { ParentService } from '@proxy/parents';
import { AuthService } from '@abp/ng.core';
import { RegisterPromptComponent } from '../shared/components/register-prompt.component';

@Component({
  selector: 'app-academies-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RegisterPromptComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
        <div class="header-top-row">
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          @if (canCreate()) {
            <button class="create-btn" (click)="router.navigate(['/academies/create'])">
              <i class="fas fa-plus"></i>
            </button>
          }
        </div>
        <div class="header-content">
          <div class="header-icon-ring">
            <i class="fas fa-university"></i>
          </div>
          <h1>الأكاديميات</h1>
          <p>اكتشف وانضم · Discover & Join</p>
        </div>

        <!-- Inline search -->
        <div class="header-search">
          <i class="fas fa-search"></i>
          <input type="text"
                 placeholder="ابحث بالاسم أو الكود · Search..."
                 [ngModel]="searchQuery()"
                 (ngModelChange)="searchQuery.set($event)" />
        </div>
      </div>

      <!-- ── Guest register prompt ── -->
      @if (isGuest()) {
        <app-register-prompt
          [titleAr]="'سجّل الآن للانضمام للأكاديميات والتسجيل في المقررات'"
          [titleEn]="'Register to join academies and enroll in courses'" />
      }

      <!-- ── Join by code (student/parent) ── -->
      @if (isStudent() || isParent()) {
        <div class="code-section">
          <div class="code-card">
            <div class="code-card-header">
              <div class="code-icon"><i class="fas fa-key"></i></div>
              <div>
                <span class="code-title">انضم بالكود</span>
                <span class="code-sub">Join by Code</span>
              </div>
            </div>
            <div class="code-row">
              <input class="code-input" type="text" dir="ltr"
                     placeholder="A-XXXXX"
                     [(ngModel)]="joinCode"
                     (keyup.enter)="joinByCode()" />
              <button class="code-go" [disabled]="!joinCode.trim() || joiningByCode()"
                      (click)="joinByCode()">
                @if (joiningByCode()) { <span class="spinner"></span> }
                @else { <i class="fas fa-search"></i> }
              </button>
            </div>
            @if (codeError()) {
              <div class="code-msg code-error"><i class="fas fa-times-circle"></i> {{ codeError() }}</div>
            }
            @if (codeSuccess()) {
              <div class="code-msg code-success"><i class="fas fa-check-circle"></i> {{ codeSuccess() }}</div>
            }
          </div>
        </div>
      }

      <!-- ── Student/Parent Tabs ── -->
      @if ((isStudent() || isParent()) && !loading()) {
        <div class="tabs-bar">
          <button class="tab-btn" [class.tab-btn--active]="activeTab() === 'my'" (click)="activeTab.set('my')">
            <i class="fas fa-star"></i>
            <span>أكاديمياتي · Mine</span>
            @if (myAcademies().length > 0) { <span class="tab-count">{{ myAcademies().length }}</span> }
          </button>
          <button class="tab-btn" [class.tab-btn--active]="activeTab() === 'browse'" (click)="activeTab.set('browse')">
            <i class="fas fa-globe"></i>
            <span>استعراض · Browse</span>
            @if (browseAcademies().length > 0) { <span class="tab-count">{{ browseAcademies().length }}</span> }
          </button>
        </div>
      }

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="content-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- ── Student/Parent: My Academies Tab ── -->
      @if (!loading() && (isStudent() || isParent()) && activeTab() === 'my') {
        @if (myAcademies().length === 0) {
          <div class="empty-state">
            <div class="empty-ring"><i class="fas fa-university"></i></div>
            <h3>{{ searchQuery() ? 'لا توجد نتائج' : 'لم تنضم لأي أكاديمية بعد' }}</h3>
            <p>{{ searchQuery() ? 'No results' : 'Browse academies and enroll in their courses' }}</p>
          </div>
        }
        @if (myAcademies().length > 0) {
          <div class="content-area">
            @for (academy of myAcademies(); track academy.id) {
              <ng-container *ngTemplateOutlet="academyCard; context: { $implicit: academy, enrolled: true }"></ng-container>
            }
          </div>
        }
      }

      <!-- ── Student/Parent: Browse Tab ── -->
      @if (!loading() && (isStudent() || isParent()) && activeTab() === 'browse') {
        @if (browseAcademies().length === 0) {
          <div class="empty-state">
            <div class="empty-ring"><i class="fas fa-globe"></i></div>
            <h3>{{ searchQuery() ? 'لا توجد نتائج' : 'لا توجد أكاديميات أخرى' }}</h3>
            <p>{{ searchQuery() ? 'No results' : 'No other academies available' }}</p>
          </div>
        }
        @if (browseAcademies().length > 0) {
          <div class="content-area">
            @for (academy of browseAcademies(); track academy.id) {
              <ng-container *ngTemplateOutlet="academyCard; context: { $implicit: academy, enrolled: false }"></ng-container>
            }
          </div>
        }
      }

      <!-- ── Non-student/parent: flat list ── -->
      @if (!loading() && !isStudent() && !isParent()) {
        @if (filteredAcademies().length === 0) {
          <div class="empty-state">
            <div class="empty-ring"><i class="fas fa-university"></i></div>
            <h3>{{ searchQuery() ? 'لا توجد نتائج' : 'لا توجد أكاديميات' }}</h3>
            <p>{{ searchQuery() ? 'No results' : 'No academies yet' }}</p>
            @if (canCreate() && !searchQuery()) {
              <button class="empty-btn" (click)="router.navigate(['/academies/create'])">
                <i class="fas fa-plus"></i> إنشاء أكاديمية
              </button>
            }
          </div>
        }
        @if (filteredAcademies().length > 0) {
          <div class="content-area">
            @for (academy of filteredAcademies(); track academy.id) {
              <ng-container *ngTemplateOutlet="academyCard; context: { $implicit: academy, enrolled: false }"></ng-container>
            }
          </div>
        }
      }

      <!-- ── Shared academy card template ── -->
      <ng-template #academyCard let-academy let-enrolled="enrolled">
        <div class="a-card" (click)="goToProfile(academy)">
          <div class="a-card-row">
            <div class="a-avatar">
              <i class="fas fa-university"></i>
            </div>
            <div class="a-info">
              <h3>{{ academy.nameAr }}</h3>
              @if (academy.nameEn) { <span class="a-en">{{ academy.nameEn }}</span> }
            </div>
            @if (enrolled) { <span class="a-enrolled-badge"><i class="fas fa-check-circle"></i> منضم</span> }
            @if (academy.isActive) { <span class="a-active"></span> }
            <i class="fas fa-chevron-left a-arrow"></i>
          </div>

          @if (academy.code) {
            <div class="a-code-bar">
              <span class="a-code"><i class="fas fa-hashtag"></i> {{ academy.code }}</span>
              @if (academy.supervisorName) {
                <span class="a-supervisor"><i class="fas fa-user-tie"></i> {{ academy.supervisorName }}</span>
              }
            </div>
          }

          <div class="a-stats-row">
            <div class="a-stat">
              <span class="a-stat-val">{{ academy.memberCount || 0 }}</span>
              <span class="a-stat-lbl">عضو · Members</span>
            </div>
            <div class="a-stat-divider"></div>
            <div class="a-stat">
              <span class="a-stat-val">{{ academy.courseCount || 0 }}</span>
              <span class="a-stat-lbl">مقرر · Courses</span>
            </div>
          </div>
        </div>
      </ng-template>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + .75rem) 1.25rem 1.25rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.06); pointer-events:none; }
    .b1 { width:220px; height:220px; top:-80px; right:-70px; }
    .b2 { width:140px; height:140px; bottom:-60px; left:-40px; }
    .b3 { width:80px; height:80px; top:40%; left:50%; background:rgba(255,255,255,.04); }

    .header-top-row {
      position:relative; z-index:1; display:flex; justify-content:space-between; align-items:center;
      margin-bottom:.75rem;
    }
    .back-btn, .create-btn {
      width:44px; height:44px; border-radius:14px; flex-shrink:0;
      background:rgba(255,255,255,.12); border:1.5px solid rgba(255,255,255,.2);
      color:#fff; font-size:1rem; display:flex; align-items:center; justify-content:center;
      cursor:pointer; -webkit-tap-highlight-color:transparent;
    }
    .back-btn:active, .create-btn:active { background:rgba(255,255,255,.25); }

    .header-content {
      position:relative; z-index:1; text-align:center; margin-bottom:1rem;
    }
    .header-icon-ring {
      width:56px; height:56px; border-radius:50%;
      background:rgba(255,255,255,.15); border:2px solid rgba(255,255,255,.25);
      display:flex; align-items:center; justify-content:center;
      margin:0 auto .6rem; font-size:1.4rem; color:#fff;
    }
    .header-content h1 { margin:0; font-size:1.35rem; font-weight:800; color:#fff; }
    .header-content p { margin:.2rem 0 0; font-size:.75rem; color:rgba(255,255,255,.65); }

    .header-search {
      position:relative; z-index:1; display:flex; align-items:center;
      background:rgba(255,255,255,.15); border:1.5px solid rgba(255,255,255,.2);
      border-radius:14px; padding:0 .875rem; min-height:44px; gap:.5rem;
    }
    .header-search i { color:rgba(255,255,255,.6); font-size:.85rem; flex-shrink:0; }
    .header-search input {
      flex:1; border:none; background:transparent; outline:none;
      font-size:.88rem; color:#fff; min-height:44px;
    }
    .header-search input::placeholder { color:rgba(255,255,255,.45); }

    /* ── Tabs ── */
    .tabs-bar {
      display:flex; gap:.25rem; padding:.75rem 1rem 0;
      background:white; border-radius:0 0 14px 14px;
      box-shadow:0 2px 6px rgba(0,0,0,.04);
      margin:0 .75rem; border-radius:14px; padding:.3rem;
    }
    .tab-btn {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.35rem;
      padding:.6rem .5rem; border:none; background:transparent;
      border-radius:10px; font-size:.78rem; font-weight:600;
      color:#6c757d; cursor:pointer; min-height:44px;
      -webkit-tap-highlight-color:transparent; transition:all .15s;
    }
    .tab-btn i { font-size:.75rem; }
    .tab-btn--active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; box-shadow:0 2px 8px rgba(102,126,234,.3);
    }
    .tab-count {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.65rem; font-weight:700;
      padding:.05rem .35rem; border-radius:8px; min-width:16px; text-align:center;
    }
    .tab-btn--active .tab-count {
      background:rgba(255,255,255,.25); color:white;
    }

    /* Enrolled badge */
    .a-enrolled-badge {
      display:inline-flex; align-items:center; gap:.2rem;
      background:rgba(16,185,129,.12); color:#059669;
      font-size:.6rem; font-weight:700;
      padding:.1rem .4rem; border-radius:20px; flex-shrink:0;
    }
    .a-enrolled-badge i { font-size:.55rem; }

    /* ── Code section ── */
    .code-section { padding:.75rem 1rem 0; }
    .code-card {
      background:#fff; border-radius:16px; padding:.875rem;
      box-shadow:0 2px 10px rgba(0,0,0,.04); border:1.5px solid #f0f0f0;
    }
    .code-card-header { display:flex; align-items:center; gap:.6rem; margin-bottom:.6rem; }
    .code-icon {
      width:36px; height:36px; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:.85rem; flex-shrink:0;
    }
    .code-title { font-size:.85rem; font-weight:700; color:#1a1a2e; display:block; }
    .code-sub { font-size:.68rem; color:#9090aa; display:block; }
    .code-row { display:flex; gap:.5rem; }
    .code-input {
      flex:1; padding:.6rem .875rem; border:1.5px solid #e9ecef; border-radius:12px;
      font-size:.9rem; background:#fafafe; outline:none; min-height:44px;
      letter-spacing:.05em; font-weight:600; box-sizing:border-box;
    }
    .code-input:focus { border-color:#667eea; background:#fff; }
    .code-go {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.95rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .code-go:disabled { opacity:.5; cursor:not-allowed; }
    .code-msg {
      display:flex; align-items:center; gap:.35rem; margin-top:.4rem;
      font-size:.75rem; font-weight:600; padding:.35rem .5rem; border-radius:8px;
    }
    .code-error   { background:rgba(239,68,68,.08);  color:#dc2626; }
    .code-success { background:rgba(34,197,94,.08);  color:#16a34a; }

    /* ── Content area ── */
    .content-area { padding:.75rem 1rem 0; display:flex; flex-direction:column; gap:.6rem; }

    /* ── Shimmer ── */
    .shimmer-card {
      height:110px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Empty ── */
    .empty-state {
      display:flex; flex-direction:column; align-items:center;
      padding:3.5rem 1.5rem; text-align:center;
    }
    .empty-ring {
      width:72px; height:72px; border-radius:50%;
      background:linear-gradient(135deg,rgba(102,126,234,.12),rgba(118,75,162,.12));
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; color:#667eea; margin-bottom:1rem;
    }
    .empty-state h3 { font-size:1rem; font-weight:700; color:#1a1a2e; margin:0 0 .25rem; }
    .empty-state p  { font-size:.82rem; color:#9090aa; margin:0 0 1rem; }
    .empty-btn {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.7rem 1.25rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.85rem; font-weight:700; cursor:pointer;
    }

    /* ── Academy card ── */
    .a-card {
      background:#fff; border-radius:16px; overflow:hidden;
      box-shadow:0 2px 10px rgba(0,0,0,.04); border:1.5px solid #f0f0f0;
      cursor:pointer; -webkit-tap-highlight-color:transparent;
      transition:transform .12s;
    }
    .a-card:active { transform:scale(.985); }

    .a-card-row {
      display:flex; align-items:center; gap:.75rem; padding:.875rem 1rem;
    }
    .a-avatar {
      width:46px; height:46px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.15rem;
      box-shadow:0 3px 10px rgba(102,126,234,.3);
    }
    .a-info { flex:1; min-width:0; }
    .a-info h3 {
      margin:0; font-size:.92rem; font-weight:700; color:#1a1a2e;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .a-en { font-size:.72rem; color:#9090aa; display:block; margin-top:.1rem; }
    .a-active {
      width:8px; height:8px; border-radius:50%; background:#4ade80;
      box-shadow:0 0 0 3px rgba(74,222,128,.2); flex-shrink:0;
    }
    .a-arrow { color:#d1d5db; font-size:.7rem; margin-right:-.25rem; }

    .a-code-bar {
      display:flex; align-items:center; gap:.75rem;
      padding:0 1rem .6rem; flex-wrap:wrap;
    }
    .a-code {
      font-size:.72rem; font-weight:700; color:#667eea;
      background:rgba(102,126,234,.08); padding:.2rem .55rem; border-radius:8px;
      letter-spacing:.03em;
    }
    .a-code i { font-size:.6rem; margin-left:.15rem; }
    .a-supervisor {
      font-size:.72rem; color:#9090aa; display:flex; align-items:center; gap:.3rem;
    }
    .a-supervisor i { font-size:.65rem; }

    .a-stats-row {
      display:flex; align-items:center; border-top:1px solid #f5f5f5;
    }
    .a-stat {
      flex:1; display:flex; flex-direction:column; align-items:center;
      padding:.6rem 0; gap:.15rem;
    }
    .a-stat-val { font-size:1.05rem; font-weight:800; color:#1a1a2e; }
    .a-stat-lbl { font-size:.62rem; color:#9090aa; }
    .a-stat-divider { width:1px; height:28px; background:#f0f0f0; }

    .spinner {
      width:14px; height:14px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class AcademiesListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly academySvc  = inject(AcademyService);
  private readonly userSvc     = inject(CurrentUserInfoService);
  private readonly courseSvc   = inject(CourseService);
  private readonly authService = inject(AuthService);
  private readonly parentSvc   = inject(ParentService);

  isGuest = signal(false);

  loading     = signal(true);
  academies   = signal<AcademyDto[]>([]);
  searchQuery = signal('');
  activeTab   = signal<'my' | 'browse'>('my');

  isStudent        = signal(false);
  isParent         = signal(false);
  isTeacherOrAdmin = signal(false);
  enrolledAcademyIds = signal<Set<string>>(new Set());

  // Join by code
  joinCode      = '';
  joiningByCode = signal(false);
  codeError     = signal<string | null>(null);
  codeSuccess   = signal<string | null>(null);

  private applySearch(list: AcademyDto[]): AcademyDto[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(a =>
      (a.nameAr || '').toLowerCase().includes(q) ||
      (a.nameEn || '').toLowerCase().includes(q) ||
      (a.code   || '').toLowerCase().includes(q) ||
      (a.supervisorName || '').toLowerCase().includes(q)
    );
  }

  myAcademies = computed(() => {
    const ids = this.enrolledAcademyIds();
    return this.applySearch(this.academies().filter(a => ids.has(a.id!)));
  });

  browseAcademies = computed(() => {
    const ids = this.enrolledAcademyIds();
    return this.applySearch(this.academies().filter(a => !ids.has(a.id!)));
  });

  // Fallback for non-student roles (teacher/admin see flat list)
  filteredAcademies = computed(() => this.applySearch(this.academies()));

  async ngOnInit(): Promise<void> {
    try {
      const isAuth = this.authService.isAuthenticated;
      this.isGuest.set(!isAuth);

      let userInfo: any = null;
      const list = await lastValueFrom(this.academySvc.getList()).catch(() => []);

      if (isAuth) {
        userInfo = await lastValueFrom(this.userSvc.getCurrentUserActorInfo()).catch(() => null);
      }

      const rawRoles = userInfo?.userRoles || [];
      const roles = rawRoles.map((r: string) => (r || '').toUpperCase());
      this.isStudent.set(roles.includes('STUDENT'));
      this.isParent.set(roles.includes('PARENT'));
      this.isTeacherOrAdmin.set(roles.includes('TEACHER') || roles.includes('ADMIN'));
      // Students/Parents only see active academies
      const filtered = (this.isStudent() || this.isParent())
        ? (list || []).filter((a: any) => a.isActive !== false)
        : (list || []);
      this.academies.set(filtered);

      // For students: determine which academies they're enrolled in
      if (this.isStudent()) {
        await this.loadStudentEnrolledAcademies(list || []);
        if (this.myAcademies().length === 0 && this.browseAcademies().length > 0) {
          this.activeTab.set('browse');
        }
      }

      // For parents: determine which academies their children are enrolled in
      if (this.isParent()) {
        await this.loadParentEnrolledAcademies(list || []);
        if (this.myAcademies().length === 0 && this.browseAcademies().length > 0) {
          this.activeTab.set('browse');
        }
      }
    } catch (e) {
      console.error('Error loading academies', e);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadStudentEnrolledAcademies(academies: AcademyDto[]): Promise<void> {
    try {
      // Get student's enrolled courses
      const studentCourses = await lastValueFrom(
        this.courseSvc.getCoursesForCurrentStudent()
      ).catch(() => []);
      const enrolledCourseIds = new Set<string>();
      for (const c of (studentCourses || [])) {
        if ((c as any).isEnrolled && (c as any).id) {
          enrolledCourseIds.add((c as any).id);
        }
      }

      if (enrolledCourseIds.size === 0) return;

      // For each academy, check if any of its courses match student's enrolled courses
      const ids = new Set<string>();
      for (const a of academies) {
        try {
          const courses = await lastValueFrom(
            this.academySvc.getAcademyCourses(a.id!, { skipHandleError: true } as any)
          ).catch(() => []);
          for (const ac of (courses || [])) {
            if (ac.courseId && enrolledCourseIds.has(ac.courseId)) {
              ids.add(a.id!);
              break;
            }
          }
        } catch { /* silent */ }
      }
      this.enrolledAcademyIds.set(ids);
    } catch (e) {
      console.error('Error loading student enrolled academies:', e);
    }
  }

  private async loadParentEnrolledAcademies(academies: AcademyDto[]): Promise<void> {
    try {
      const dashboard = await lastValueFrom(this.parentSvc.getDashboard()).catch(() => null) as any;
      if (!dashboard?.children?.length) return;

      // Collect all courseIds from all children
      const childCourseIds = new Set<string>();
      for (const child of dashboard.children) {
        for (const c of (child.courses || [])) {
          if (c.courseId) childCourseIds.add(c.courseId);
        }
      }
      if (childCourseIds.size === 0) return;

      // Match academy courses against children's enrolled courses
      const ids = new Set<string>();
      for (const a of academies) {
        try {
          const courses = await lastValueFrom(
            this.academySvc.getAcademyCourses(a.id!, { skipHandleError: true })
          );
          if (courses?.some(c => childCourseIds.has(c.courseId))) {
            ids.add(a.id!);
          }
        } catch { /* silent */ }
      }
      this.enrolledAcademyIds.set(ids);
    } catch { /* silent */ }
  }

  canCreate(): boolean { return this.isTeacherOrAdmin(); }

  goToProfile(academy: AcademyDto): void {
    this.router.navigate(['/academies', academy.id, 'profile']);
  }

  async joinByCode(): Promise<void> {
    const code = this.joinCode.trim().toUpperCase();
    if (!code) return;

    this.codeError.set(null);
    this.codeSuccess.set(null);
    this.joiningByCode.set(true);

    // Find the academy by code in the loaded list
    const match = this.academies().find(a =>
      (a.code || '').toUpperCase() === code
    );

    if (!match) {
      this.codeError.set('لا توجد أكاديمية بهذا الكود · No academy found with this code');
      this.joiningByCode.set(false);
      return;
    }

    // Navigate to its profile — student can send join request there
    this.joiningByCode.set(false);
    this.router.navigate(['/academies', match.id, 'profile']);
  }

  trackById = (_: number, item: AcademyDto) => item.id;

  goBack(): void { this.router.navigate(['/student']); }
}
