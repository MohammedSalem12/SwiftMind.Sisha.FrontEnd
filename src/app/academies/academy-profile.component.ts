import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { RestService } from '@abp/ng.core';
import { AcademyService } from '@proxy/academies';
import { AcademyDto, AcademyCourseDto, AcademyMemberDto } from '@proxy/academies/models';
import { AcademyTeacherStatus } from '@proxy/academies/academy-teacher-status.enum';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';

@Component({
  selector: 'app-academy-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="blob b1"></div><div class="blob b2"></div>
        <div class="header-top">
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          @if (isSupervisor()) {
            <button class="manage-btn"
                    (click)="router.navigate(['/academies', academyId, 'manage'])">
              <i class="fas fa-cog"></i>
              إدارة
            </button>
          }
        </div>

        @if (!loading() && academy()) {
          <div class="academy-avatar">
            <i class="fas fa-university"></i>
          </div>
          <h1 class="academy-name">{{ academy()!.nameAr }}</h1>
          @if (academy()!.nameEn) {
            <p class="academy-name-en">{{ academy()!.nameEn }}</p>
          }
          @if (academy()!.code) {
            <span class="code-badge">{{ academy()!.code }}</span>
          }
        }
      </div>

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-info"></div>
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading() && academy()) {

        <!-- ── Info stats ── -->
        <div class="info-strip">
          <div class="istat">
            <i class="fas fa-user-tie"></i>
            <div>
              <span class="istat-label">المشرف</span>
              <span class="istat-val">{{ academy()!.supervisorName || 'غير محدد' }}</span>
            </div>
          </div>
          <div class="istat-sep"></div>
          <div class="istat">
            <i class="fas fa-users"></i>
            <div>
              <span class="istat-label">الأعضاء</span>
              <span class="istat-val">{{ academy()!.memberCount }}</span>
            </div>
          </div>
          <div class="istat-sep"></div>
          <div class="istat">
            <i class="fas fa-book-open"></i>
            <div>
              <span class="istat-label">المقررات</span>
              <span class="istat-val">{{ academy()!.courseCount }}</span>
            </div>
          </div>
        </div>

        @if (academy()!.description) {
          <div class="description-card">
            <p>{{ academy()!.description }}</p>
          </div>
        }

        <!-- ═══════════════ STUDENT MEMBERSHIP FLOW ═══════════════ -->
        @if (isStudent()) {

          <!-- NOT a member yet → show join button -->
          @if (memberStatus() === null) {
            <div class="membership-card join-card">
              <div class="mc-icon"><i class="fas fa-door-open"></i></div>
              <div class="mc-text">
                <h3>انضم إلى هذه الأكاديمية</h3>
                <p>أرسل طلب انضمام للمشرف للحصول على الوصول لمقرراتها</p>
                <span>Send a join request to the supervisor to access academy courses</span>
              </div>
              <button class="join-btn" [disabled]="joining()" (click)="requestJoin()">
                @if (joining()) { <span class="spinner"></span> }
                @else { <i class="fas fa-user-plus"></i> }
                {{ joining() ? 'جاري الإرسال…' : 'طلب الانضمام' }}
              </button>
              @if (joinError()) {
                <div class="mc-error">
                  <i class="fas fa-exclamation-circle"></i> {{ joinError() }}
                </div>
              }
            </div>
          }

          <!-- Pending approval -->
          @if (memberStatus() === AcademyTeacherStatus.Pending) {
            <div class="membership-card pending-card">
              <div class="mc-icon pending-icon"><i class="fas fa-hourglass-half"></i></div>
              <div class="mc-text">
                <h3>طلبك قيد المراجعة</h3>
                <p>سيتم إشعارك عند موافقة المشرف على طلبك</p>
                <span>Your join request is awaiting supervisor approval</span>
              </div>
            </div>
          }

          <!-- Rejected -->
          @if (memberStatus() === AcademyTeacherStatus.Rejected) {
            <div class="membership-card rejected-card">
              <div class="mc-icon rejected-icon"><i class="fas fa-times-circle"></i></div>
              <div class="mc-text">
                <h3>تم رفض طلبك</h3>
                <p>لم يتم قبول طلب انضمامك لهذه الأكاديمية</p>
                <span>Your join request was rejected</span>
              </div>
            </div>
          }

          <!-- Approved → show join success + courses below -->
          @if (memberStatus() === AcademyTeacherStatus.Approved) {
            <div class="membership-card approved-card">
              <div class="mc-icon approved-icon"><i class="fas fa-check-circle"></i></div>
              <div class="mc-text">
                <h3>أنت عضو في هذه الأكاديمية</h3>
                <p>يمكنك الآن الاطلاع على جميع المقررات والتسجيل فيها</p>
                <span>You are a member — browse and enroll in courses below</span>
              </div>
            </div>
          }

        }

        <!-- ═══════════════ COURSES SECTION ═══════════════ -->
        <!-- Show courses to: supervisor, non-student members (teachers), approved student members -->
        @if (canSeeCourses()) {
          <div class="section">
            <div class="section-title">
              <i class="fas fa-book-open"></i>
              مقررات الأكاديمية · Academy Courses
              @if (courses().length > 0) {
                <span class="count-pill">{{ courses().length }}</span>
              }
            </div>

            @if (courses().length === 0) {
              <div class="empty-box">
                <i class="fas fa-book"></i>
                <p>لا توجد مقررات مضافة بعد</p>
                <span>No courses added yet</span>
                @if (isSupervisor()) {
                  <button class="add-course-btn"
                          (click)="router.navigate(['/add-course'], { queryParams: { academyId: academyId } })">
                    <i class="fas fa-plus"></i>
                    إضافة مقرر
                  </button>
                }
              </div>
            }

            @if (courses().length > 0) {
              @if (isSupervisor()) {
                <div class="supervisor-actions">
                  <button class="add-course-btn"
                          (click)="router.navigate(['/add-course'], { queryParams: { academyId: academyId } })">
                    <i class="fas fa-plus"></i>
                    إضافة مقرر جديد
                  </button>
                </div>
              }

              <div class="courses-list">
                @for (c of courses(); track c.courseId) {
                  <div class="course-row">
                    <div class="course-icon-wrap">
                      <i class="fas fa-book-open"></i>
                    </div>
                    <div class="course-details">
                      <span class="course-name-ar">{{ c.courseNameAr }}</span>
                      @if (c.courseNameEn) { <span class="course-name-en">{{ c.courseNameEn }}</span> }
                      <div class="course-meta-row">
                        @if (c.courseCode) { <span class="meta-chip chip-code">{{ c.courseCode }}</span> }
                        @if (c.gradeName)  { <span class="meta-chip chip-grade"><i class="fas fa-graduation-cap"></i>{{ c.gradeName }}</span> }
                      </div>
                    </div>
                    @if (isStudent()) {
                      <button class="enroll-btn" (click)="enrollInCourse(c)">
                        <i class="fas fa-plus"></i>
                        سجّل
                      </button>
                    }
                    @if (isSupervisor()) {
                      <button class="remove-btn" (click)="removeCourse(c)"
                              [disabled]="removingCourseId() === c.courseId" title="إزالة من الأكاديمية">
                        @if (removingCourseId() === c.courseId) { <span class="spinner-sm"></span> }
                        @else { <i class="fas fa-trash-alt"></i> }
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Teacher join section (non-supervisor, non-student teachers) -->
        @if (!isStudent() && !isSupervisor() && actorType() === 'Teacher') {

          @if (memberStatus() === null) {
            <div class="membership-card join-card">
              <div class="mc-icon"><i class="fas fa-handshake"></i></div>
              <div class="mc-text">
                <h3>انضم كمعلم</h3>
                <p>انضم إلى هذه الأكاديمية للتعاون مع زملائك</p>
              </div>
              <button class="join-btn" [disabled]="joining()" (click)="requestJoin()">
                @if (joining()) { <span class="spinner"></span> }
                @else { <i class="fas fa-user-plus"></i> }
                طلب الانضمام
              </button>
              @if (joinError()) {
                <div class="mc-error"><i class="fas fa-exclamation-circle"></i> {{ joinError() }}</div>
              }
            </div>
          }

          @if (memberStatus() === AcademyTeacherStatus.Pending) {
            <div class="membership-card pending-card">
              <div class="mc-icon pending-icon"><i class="fas fa-hourglass-half"></i></div>
              <div class="mc-text">
                <h3>طلبك قيد المراجعة</h3>
                <p>سيتم إشعارك عند موافقة المشرف</p>
              </div>
            </div>
          }

        }

      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
      display:flex; flex-direction:column; align-items:center; text-align:center; gap:.4rem;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:130px; height:130px; bottom:-50px; left:-25px; }

    .header-top {
      position:relative; z-index:1; width:100%;
      display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem;
    }
    .back-btn {
      width:40px; height:40px; border-radius:50%;
      background:rgba(255,255,255,.2); border:none; color:#fff;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }
    .manage-btn {
      display:flex; align-items:center; gap:.35rem;
      background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3);
      color:#fff; padding:.4rem .875rem; border-radius:12px;
      font-size:.8rem; font-weight:700; cursor:pointer;
    }

    .academy-avatar {
      position:relative; z-index:1;
      width:72px; height:72px; border-radius:50%;
      background:rgba(255,255,255,.2); border:3px solid rgba(255,255,255,.45);
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; color:#fff;
    }
    .academy-name    { position:relative; z-index:1; margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .academy-name-en { position:relative; z-index:1; margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.65); }
    .code-badge {
      position:relative; z-index:1;
      background:rgba(255,255,255,.18); color:rgba(255,255,255,.9);
      font-size:.72rem; font-weight:700; padding:.2rem .65rem; border-radius:20px;
      border:1px solid rgba(255,255,255,.25);
    }

    /* ── Info strip ── */
    .info-strip {
      display:flex; align-items:center; justify-content:space-around;
      background:#fff; margin:.875rem 1rem 0;
      border-radius:16px; padding:.875rem .5rem;
      box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .istat { display:flex; align-items:center; gap:.6rem; }
    .istat i { font-size:1.1rem; color:#764ba2; }
    .istat-label { display:block; font-size:.62rem; color:#9090aa; font-weight:600; text-transform:uppercase; }
    .istat-val   { display:block; font-size:.95rem; font-weight:800; color:#1a1a2e; }
    .istat-sep   { width:1px; height:32px; background:#f0f0f5; }

    /* ── Description card ── */
    .description-card {
      margin:.625rem 1rem 0;
      background:#fff; border-radius:14px; padding:.875rem 1rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .description-card p { margin:0; font-size:.88rem; color:#555; line-height:1.6; }

    /* ── Membership cards ── */
    .membership-card {
      margin:.875rem 1rem 0;
      border-radius:16px; padding:1rem 1.25rem;
      display:flex; flex-direction:column; align-items:center; gap:.625rem;
      text-align:center; border:1.5px solid transparent;
    }
    .mc-icon {
      width:56px; height:56px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; background:rgba(102,126,234,.1); color:#667eea;
    }
    .pending-icon  { background:rgba(245,158,11,.1);  color:#d97706; }
    .approved-icon { background:rgba(34,197,94,.1);   color:#16a34a; }
    .rejected-icon { background:rgba(239,68,68,.1);   color:#dc2626; }

    .mc-text h3 { margin:0; font-size:1rem; font-weight:800; color:#1a1a2e; }
    .mc-text p   { margin:.2rem 0 0; font-size:.82rem; color:#555; }
    .mc-text span{ font-size:.72rem; color:#9090aa; }
    .mc-error {
      display:flex; align-items:center; gap:.4rem;
      font-size:.78rem; color:#dc2626; font-weight:600;
    }

    .join-card      { background:rgba(102,126,234,.05); border-color:rgba(102,126,234,.2); }
    .pending-card   { background:rgba(245,158,11,.05);  border-color:rgba(245,158,11,.2);  }
    .approved-card  { background:rgba(34,197,94,.05);   border-color:rgba(34,197,94,.2);   }
    .rejected-card  { background:rgba(239,68,68,.05);   border-color:rgba(239,68,68,.15);  }

    .join-btn {
      display:flex; align-items:center; gap:.4rem;
      padding:.75rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.88rem; font-weight:700;
      cursor:pointer; min-height:44px; transition:opacity .15s;
    }
    .join-btn:disabled { opacity:.6; cursor:not-allowed; }

    /* ── Section ── */
    .section { padding:.875rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem;
      font-size:.78rem; font-weight:700; color:#555;
      text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; }
    .count-pill {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.7rem; font-weight:700; padding:.1rem .45rem; border-radius:20px;
    }

    .supervisor-actions { margin-bottom:.625rem; }
    .add-course-btn {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.6rem 1rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.82rem; font-weight:700; cursor:pointer;
    }

    /* ── Courses list ── */
    .courses-list { display:flex; flex-direction:column; gap:.5rem; }
    .course-row {
      display:flex; align-items:center; gap:.875rem;
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 6px rgba(0,0,0,.04);
    }
    .course-icon-wrap {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1rem;
    }
    .course-details { flex:1; min-width:0; }
    .course-name-ar { display:block; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .course-name-en { display:block; font-size:.72rem; color:#9090aa; margin-top:.1rem; }
    .course-meta-row { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.35rem; }
    .meta-chip {
      display:inline-flex; align-items:center; gap:.25rem;
      font-size:.65rem; font-weight:600; padding:.1rem .4rem; border-radius:8px;
    }
    .chip-code  { background:rgba(102,126,234,.1); color:#667eea; }
    .chip-grade { background:rgba(245,158,11,.12); color:#d97706; }

    .enroll-btn {
      display:flex; align-items:center; gap:.3rem;
      padding:.5rem .875rem; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.78rem; font-weight:700;
      cursor:pointer; flex-shrink:0; min-height:40px;
    }
    .remove-btn {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2);
      color:#dc2626; font-size:.85rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .remove-btn:disabled { opacity:.5; cursor:not-allowed; }

    /* ── Empty ── */
    .empty-box {
      text-align:center; padding:2rem 1rem; background:#fff;
      border-radius:14px; border:1.5px solid #f0f0f0;
      display:flex; flex-direction:column; align-items:center; gap:.5rem;
    }
    .empty-box i { font-size:2rem; color:#c4c4d4; }
    .empty-box p { font-size:.9rem; font-weight:600; color:#555; margin:0; }
    .empty-box span { font-size:.75rem; color:#9090aa; }

    /* ── Shimmer ── */
    .shimmer-area { padding:.875rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }
    .shimmer-info {
      height:120px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    .shimmer-card {
      height:72px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .spinner {
      width:16px; height:16px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    .spinner-sm {
      width:13px; height:13px; border:2px solid rgba(220,38,38,.3);
      border-top-color:#dc2626; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class AcademyProfileComponent implements OnInit {
  readonly router  = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly academySvc = inject(AcademyService);
  private readonly restSvc    = inject(RestService);
  private readonly userSvc    = inject(CurrentUserInfoService);

  loading          = signal(true);
  academy          = signal<AcademyDto | null>(null);
  courses          = signal<AcademyCourseDto[]>([]);
  memberStatus     = signal<AcademyTeacherStatus | null>(null);
  joining          = signal(false);
  joinError        = signal<string | null>(null);
  removingCourseId = signal<string | null>(null);

  academyId = '';
  private userInfo: CurrentUserActorDto | null = null;

  // Expose enum to template
  readonly AcademyTeacherStatus = AcademyTeacherStatus;

  actorType  = computed(() => this.userInfo?.actorType || null);
  actorId    = computed(() => this.userInfo?.actorId   || null);

  isStudent   = computed(() => this.userInfo?.actorType === 'Student');
  isSupervisor = computed(() =>
    !!this.academy() && this.academy()!.supervisorTeacherId === this.userInfo?.actorId
  );

  /** Students can see courses only when approved; others always see them */
  canSeeCourses = computed(() => {
    if (!this.isStudent()) return true;                              // teachers/admins always see
    return this.memberStatus() === AcademyTeacherStatus.Approved;   // students: only when approved
  });

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('id') || '';
    try {
      const [user, academyData, coursesData] = await Promise.all([
        lastValueFrom(this.userSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.academySvc.get(this.academyId)),
        lastValueFrom(this.academySvc.getAcademyCourses(this.academyId)).catch(() => []),
      ]);

      this.userInfo = user;
      this.academy.set(academyData);
      this.courses.set(coursesData ?? []);

      // Check membership for this specific academy (student or non-supervisor teacher)
      if (!this.isSupervisor()) {
        try {
          const membership = await lastValueFrom(
            this.restSvc.request<any, AcademyMemberDto>(
              { method: 'GET', url: '/api/app/academy/my-membership', params: { academyId: this.academyId } },
              { apiName: 'Default', skipHandleError: true }
            )
          );
          this.memberStatus.set(membership?.status ?? null);
        } catch { /* not a member — null stays */ }
      }
    } catch (e) {
      console.error('Error loading academy profile', e);
    } finally {
      this.loading.set(false);
    }
  }

  async requestJoin(): Promise<void> {
    this.joining.set(true);
    this.joinError.set(null);
    try {
      await lastValueFrom(this.academySvc.requestToJoin(this.academyId));
      this.memberStatus.set(AcademyTeacherStatus.Pending);
    } catch (err: any) {
      this.joinError.set(err?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      this.joining.set(false);
    }
  }

  enrollInCourse(c: AcademyCourseDto): void {
    this.router.navigate(['/student/enroll', c.courseId], {
      queryParams: { academyId: this.academyId }
    });
  }

  async removeCourse(c: AcademyCourseDto): Promise<void> {
    if (!c.courseId) return;
    this.removingCourseId.set(c.courseId);
    try {
      await lastValueFrom(this.academySvc.removeCourseFromAcademy(c.courseId));
      this.courses.update(list => list.filter(x => x.courseId !== c.courseId));
    } catch (e) {
      console.error('Remove course failed', e);
    } finally {
      this.removingCourseId.set(null);
    }
  }

  goBack(): void {
    try { if (window.history.length > 1) { window.history.back(); return; } } catch {}
    this.router.navigate(['/academies']);
  }
}
