import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ChildSummaryDto } from '@proxy/parents/models';
import { TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { PageHeaderComponent } from '../shared/components/page-header.component';

/**
 * Parent enrollment wizard.
 *
 * A parent searches for a teacher, picks one of that teacher's courses, selects
 * which of their linked children to enroll, then submits an enrollment request.
 * The backend verifies the parent-child link server-side (studentId is passed on
 * the create DTO).
 */
@Component({
  selector: 'app-parent-enroll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'تسجيل ابنك في مقرر'" [titleEn]="'Enroll your child'" [backTo]="'/parent'"></app-page-header>

      <!-- ── Step indicator ── -->
      @if (!submitted()) {
        <div class="steps">
          @for (s of stepMeta; track s.n; let i = $index) {
            <div class="step" [class.step--active]="step() === s.n" [class.step--done]="step() > s.n">
              <div class="step-dot">
                @if (step() > s.n) { <i class="fas fa-check"></i> } @else { {{ s.n }} }
              </div>
              <span class="step-label">{{ s.label }}</span>
            </div>
            @if (i < stepMeta.length - 1) { <div class="step-line" [class.step-line--done]="step() > s.n"></div> }
          }
        </div>
      }

      <!-- ── No children guard ── -->
      @if (!loadingChildren() && children().length === 0) {
        <div class="empty-state">
          <div class="empty-ring"><i class="fas fa-child"></i></div>
          <h3>لا يوجد أبناء مرتبطون</h3>
          <p>يجب ربط ابنك بحسابك أولاً قبل تسجيله في مقرر.<br />You need to link a child before enrolling.</p>
          <button class="empty-btn" (click)="goToLinkChild()">
            <i class="fas fa-user-plus"></i> ربط طالب · Link a child
          </button>
        </div>
      }

      @if (loadingChildren()) {
        <div class="content-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loadingChildren() && children().length > 0 && !submitted()) {

        <!-- ══════════ STEP 1 — search & pick a teacher ══════════ -->
        @if (step() === 1) {
          <div class="search-strip">
            <div class="header-search">
              <i class="fas fa-search"></i>
              <input type="text" inputmode="search"
                     placeholder="ابحث عن معلم بالاسم أو الكود · Search teacher"
                     [ngModel]="teacherQuery()"
                     (ngModelChange)="onTeacherQueryChange($event)" />
              @if (searchingTeachers()) { <span class="spinner-in"></span> }
            </div>
          </div>

          @if (!searchingTeachers() && teacherQuery().trim().length > 0 && teachers().length === 0) {
            <div class="empty-state">
              <div class="empty-ring"><i class="fas fa-chalkboard-teacher"></i></div>
              <h3>لا توجد نتائج</h3>
              <p>No teachers found for "{{ teacherQuery() }}"</p>
            </div>
          }

          @if (teacherQuery().trim().length === 0 && teachers().length === 0) {
            <div class="hint-box">
              <i class="fas fa-info-circle"></i>
              <span>اكتب اسم المعلم أو كوده للبحث<br />Type a teacher name or code to search</span>
            </div>
          }

          <div class="content-area">
            @for (t of teachers(); track t.id) {
              <div class="t-card" (click)="selectTeacher(t)">
                <div class="t-avatar">
                  @if (t.photoUrl) { <img [src]="t.photoUrl" alt="" /> } @else { <i class="fas fa-chalkboard-teacher"></i> }
                </div>
                <div class="t-info">
                  <h3>{{ t.displayName || t.nameArabic || t.nameEnglish }}</h3>
                  <div class="t-meta">
                    @if (t.code) { <span class="t-chip"><i class="fas fa-hashtag"></i>{{ t.code }}</span> }
                    @if (t.government) { <span class="t-chip t-chip--soft"><i class="fas fa-map-marker-alt"></i>{{ t.government }}</span> }
                  </div>
                </div>
                @if (t.isPromoted) { <span class="t-badge"><i class="fas fa-crown"></i></span> }
                <i class="fas fa-chevron-left t-arrow"></i>
              </div>
            }
          </div>
        }

        <!-- ══════════ STEP 2 — pick a course ══════════ -->
        @if (step() === 2) {
          <div class="picked-bar">
            <div class="picked-avatar">
              @if (selectedTeacher()?.photoUrl) { <img [src]="selectedTeacher()!.photoUrl" alt="" /> } @else { <i class="fas fa-chalkboard-teacher"></i> }
            </div>
            <div class="picked-info">
              <span class="picked-label">المعلم · Teacher</span>
              <span class="picked-name">{{ selectedTeacher()?.displayName || selectedTeacher()?.nameArabic }}</span>
            </div>
            <button class="picked-change" (click)="backToStep(1)"><i class="fas fa-pen"></i> تغيير</button>
          </div>

          @if (loadingCourses()) {
            <div class="content-area">
              @for (i of [1,2,3]; track i) { <div class="shimmer-card shimmer-card--sm"></div> }
            </div>
          }

          @if (!loadingCourses() && courses().length === 0) {
            <div class="empty-state">
              <div class="empty-ring"><i class="fas fa-book"></i></div>
              <h3>لا توجد مقررات</h3>
              <p>هذا المعلم ليس لديه مقررات متاحة حالياً<br />This teacher has no available courses</p>
            </div>
          }

          @if (coursesError()) {
            <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ coursesError() }}</div>
          }

          <div class="content-area">
            @for (c of courses(); track c.id) {
              <div class="c-card" (click)="selectCourse(c)">
                <div class="c-icon"><i class="fas fa-book"></i></div>
                <div class="c-info">
                  <h3>{{ c.nameAr }}</h3>
                  @if (c.nameEn) { <span class="c-en">{{ c.nameEn }}</span> }
                  <div class="c-meta">
                    @if (c.code) { <span class="c-chip"><i class="fas fa-hashtag"></i>{{ c.code }}</span> }
                    @if (c.gradeName) { <span class="c-chip c-chip--soft"><i class="fas fa-graduation-cap"></i>{{ c.gradeName }}</span> }
                  </div>
                </div>
                <i class="fas fa-chevron-left t-arrow"></i>
              </div>
            }
          </div>
        }

        <!-- ══════════ STEP 3 — pick a child + confirm ══════════ -->
        @if (step() === 3) {
          <div class="picked-bar picked-bar--stacked">
            <div class="picked-row">
              <div class="picked-avatar picked-avatar--sm">
                @if (selectedTeacher()?.photoUrl) { <img [src]="selectedTeacher()!.photoUrl" alt="" /> } @else { <i class="fas fa-chalkboard-teacher"></i> }
              </div>
              <div class="picked-info">
                <span class="picked-label">المعلم · Teacher</span>
                <span class="picked-name">{{ selectedTeacher()?.displayName || selectedTeacher()?.nameArabic }}</span>
              </div>
            </div>
            <div class="picked-row">
              <div class="picked-icon"><i class="fas fa-book"></i></div>
              <div class="picked-info">
                <span class="picked-label">المقرر · Course</span>
                <span class="picked-name">{{ selectedCourse()?.nameAr }}</span>
              </div>
              <button class="picked-change" (click)="backToStep(2)"><i class="fas fa-pen"></i> تغيير</button>
            </div>
          </div>

          <div class="section-title"><i class="fas fa-child"></i> اختر الابن · Choose child</div>

          <div class="content-area">
            @for (child of children(); track child.studentId) {
              <div class="child-card" [class.child-card--picked]="selectedChildId() === child.studentId"
                   (click)="selectedChildId.set(child.studentId!)">
                <div class="child-avatar">
                  @if (child.studentPhotoUrl) { <img [src]="child.studentPhotoUrl" alt="" /> } @else { {{ initials(child.studentName) }} }
                </div>
                <div class="child-info">
                  <h3>{{ child.studentName }}</h3>
                  <div class="child-meta">
                    @if (child.studentCode) { <span class="c-chip"><i class="fas fa-id-card"></i>{{ child.studentCode }}</span> }
                    @if (child.gradeName) { <span class="c-chip c-chip--soft"><i class="fas fa-graduation-cap"></i>{{ child.gradeName }}</span> }
                  </div>
                </div>
                <div class="child-radio" [class.child-radio--on]="selectedChildId() === child.studentId">
                  @if (selectedChildId() === child.studentId) { <i class="fas fa-check"></i> }
                </div>
              </div>
            }
          </div>

          @if (submitError()) {
            <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ submitError() }}</div>
          }

          <div class="submit-bar">
            <button class="submit-btn" [disabled]="!selectedChildId() || submitting()" (click)="submit()">
              @if (submitting()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-paper-plane"></i> }
              إرسال طلب التسجيل · Submit request
            </button>
          </div>
          <div style="height:calc(90px + env(safe-area-inset-bottom,0px))"></div>
        }
      }

      <!-- ══════════ SUCCESS ══════════ -->
      @if (submitted()) {
        <div class="success-screen">
          <div class="success-ring"><i class="fas fa-check"></i></div>
          <h2>تم إرسال طلب التسجيل!</h2>
          <p class="success-en">Enrollment request submitted</p>
          <div class="success-card">
            <div class="success-line"><span>الابن · Child</span><b>{{ submittedChildName() }}</b></div>
            <div class="success-line"><span>المقرر · Course</span><b>{{ selectedCourse()?.nameAr }}</b></div>
            <div class="success-line"><span>المعلم · Teacher</span><b>{{ selectedTeacher()?.displayName || selectedTeacher()?.nameArabic }}</b></div>
          </div>
          <p class="success-hint">سيتم مراجعة الطلب واعتماده من المعلم قريباً.<br />The teacher will review and approve the request soon.</p>
          <div class="success-actions">
            <button class="empty-btn" (click)="goToRequests()"><i class="fas fa-clipboard-list"></i> طلباتي · My requests</button>
            <button class="ghost-btn" (click)="reset()"><i class="fas fa-plus"></i> تسجيل آخر · Enroll another</button>
            <button class="ghost-btn" (click)="goHome()"><i class="fas fa-home"></i> الرئيسية · Home</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    /* ── Steps ── */
    .steps { display:flex; align-items:center; padding:1rem 1.25rem .25rem; }
    .step { display:flex; flex-direction:column; align-items:center; gap:.3rem; }
    .step-dot {
      width:32px; height:32px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:.85rem; font-weight:800; background:#e6e6f0; color:#9090aa;
      transition:all .2s;
    }
    .step--active .step-dot { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; box-shadow:0 3px 10px rgba(102,126,234,.4); }
    .step--done .step-dot { background:#10b981; color:#fff; }
    .step-label { font-size:.62rem; font-weight:700; color:#9090aa; }
    .step--active .step-label { color:#667eea; }
    .step--done .step-label { color:#10b981; }
    .step-line { flex:1; height:2px; background:#e6e6f0; margin:0 .25rem; margin-bottom:1.1rem; border-radius:2px; }
    .step-line--done { background:#10b981; }

    /* ── Search ── */
    .search-strip { padding:.75rem 1rem 0; }
    .header-search {
      display:flex; align-items:center; background:#fff; border:1.5px solid #ececf2;
      border-radius:14px; padding:0 .875rem; min-height:48px; gap:.5rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .header-search i { color:#9090aa; font-size:.85rem; flex-shrink:0; }
    .header-search input { flex:1; border:none; background:transparent; outline:none; font-size:16px; color:#1a1a2e; min-height:48px; }
    .header-search input::placeholder { color:#9090aa; }

    .hint-box {
      display:flex; align-items:center; gap:.6rem; margin:1rem; padding:.9rem 1rem;
      background:rgba(102,126,234,.06); border:1px solid rgba(102,126,234,.14);
      border-radius:14px; color:#5b5b7a; font-size:.8rem; line-height:1.5;
    }
    .hint-box i { color:#667eea; font-size:1.1rem; flex-shrink:0; }

    /* ── Content ── */
    .content-area { padding:.75rem 1rem 0; display:flex; flex-direction:column; gap:.6rem; }

    /* ── Teacher card ── */
    .t-card {
      display:flex; align-items:center; gap:.75rem; padding:.875rem 1rem;
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      box-shadow:0 2px 10px rgba(0,0,0,.04); cursor:pointer;
      -webkit-tap-highlight-color:transparent; transition:transform .12s; min-height:64px;
    }
    .t-card:active { transform:scale(.985); }
    .t-avatar {
      width:48px; height:48px; border-radius:14px; flex-shrink:0; overflow:hidden;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.15rem;
      box-shadow:0 3px 10px rgba(102,126,234,.3);
    }
    .t-avatar img { width:100%; height:100%; object-fit:cover; }
    .t-info { flex:1; min-width:0; }
    .t-info h3 { margin:0 0 .25rem; font-size:.95rem; font-weight:700; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .t-meta { display:flex; gap:.4rem; flex-wrap:wrap; }
    .t-chip { font-size:.68rem; font-weight:700; color:#667eea; background:rgba(102,126,234,.08); padding:.15rem .5rem; border-radius:8px; display:inline-flex; align-items:center; gap:.25rem; }
    .t-chip i { font-size:.6rem; }
    .t-chip--soft { color:#9090aa; background:#f2f2f7; }
    .t-badge { color:#f59e0b; font-size:.9rem; flex-shrink:0; }
    .t-arrow { color:#d1d5db; font-size:.75rem; flex-shrink:0; }

    /* ── Picked bars ── */
    .picked-bar {
      display:flex; align-items:center; gap:.7rem; margin:.85rem 1rem 0; padding:.75rem .9rem;
      background:#fff; border-radius:14px; border:1.5px solid #ececf2; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .picked-bar--stacked { flex-direction:column; align-items:stretch; gap:.6rem; }
    .picked-row { display:flex; align-items:center; gap:.7rem; }
    .picked-avatar {
      width:42px; height:42px; border-radius:12px; flex-shrink:0; overflow:hidden;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem;
    }
    .picked-avatar--sm { width:36px; height:36px; border-radius:10px; font-size:.85rem; }
    .picked-avatar img { width:100%; height:100%; object-fit:cover; }
    .picked-icon {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:rgba(102,126,234,.1); color:#667eea;
      display:flex; align-items:center; justify-content:center; font-size:.9rem;
    }
    .picked-info { flex:1; min-width:0; display:flex; flex-direction:column; }
    .picked-label { font-size:.62rem; font-weight:700; color:#9090aa; }
    .picked-name { font-size:.9rem; font-weight:700; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .picked-change {
      display:inline-flex; align-items:center; gap:.3rem; flex-shrink:0;
      background:rgba(102,126,234,.1); color:#667eea; border:none;
      font-size:.72rem; font-weight:700; padding:.45rem .7rem; border-radius:10px;
      cursor:pointer; min-height:36px; -webkit-tap-highlight-color:transparent;
    }
    .picked-change i { font-size:.65rem; }

    /* ── Section title ── */
    .section-title { display:flex; align-items:center; gap:.5rem; padding:1rem 1.25rem .25rem; font-size:.85rem; font-weight:800; color:#1a1a2e; }
    .section-title i { color:#667eea; }

    /* ── Course card ── */
    .c-card {
      display:flex; align-items:center; gap:.75rem; padding:.875rem 1rem;
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      box-shadow:0 2px 10px rgba(0,0,0,.04); cursor:pointer;
      -webkit-tap-highlight-color:transparent; transition:transform .12s; min-height:64px;
    }
    .c-card:active { transform:scale(.985); }
    .c-icon {
      width:46px; height:46px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#f093fb22,#764ba222); color:#764ba2;
      display:flex; align-items:center; justify-content:center; font-size:1.1rem;
    }
    .c-info { flex:1; min-width:0; }
    .c-info h3 { margin:0; font-size:.95rem; font-weight:700; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .c-en { font-size:.72rem; color:#9090aa; display:block; margin:.1rem 0 .3rem; }
    .c-meta { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.25rem; }
    .c-chip { font-size:.68rem; font-weight:700; color:#667eea; background:rgba(102,126,234,.08); padding:.15rem .5rem; border-radius:8px; display:inline-flex; align-items:center; gap:.25rem; }
    .c-chip i { font-size:.6rem; }
    .c-chip--soft { color:#9090aa; background:#f2f2f7; }

    /* ── Child card ── */
    .child-card {
      display:flex; align-items:center; gap:.75rem; padding:.875rem 1rem;
      background:#fff; border-radius:16px; border:2px solid #f0f0f0;
      box-shadow:0 2px 10px rgba(0,0,0,.04); cursor:pointer;
      -webkit-tap-highlight-color:transparent; transition:all .15s; min-height:64px;
    }
    .child-card--picked { border-color:#667eea; background:rgba(102,126,234,.04); box-shadow:0 4px 14px rgba(102,126,234,.15); }
    .child-avatar {
      width:48px; height:48px; border-radius:50%; flex-shrink:0; overflow:hidden;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:.95rem; font-weight:800;
    }
    .child-avatar img { width:100%; height:100%; object-fit:cover; }
    .child-info { flex:1; min-width:0; }
    .child-info h3 { margin:0 0 .25rem; font-size:.95rem; font-weight:700; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .child-meta { display:flex; gap:.4rem; flex-wrap:wrap; }
    .child-radio {
      width:26px; height:26px; border-radius:50%; flex-shrink:0; border:2px solid #d1d5db;
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:.7rem; transition:all .15s;
    }
    .child-radio--on { background:#667eea; border-color:#667eea; }

    /* ── Submit ── */
    .submit-bar { padding:1rem; }
    .submit-btn {
      width:100%; padding:.95rem; border:none; border-radius:16px; min-height:52px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-size:1rem; font-weight:800;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
      box-shadow:0 6px 18px rgba(102,126,234,.3); -webkit-tap-highlight-color:transparent; transition:transform .15s;
    }
    .submit-btn:active { transform:scale(.98); }
    .submit-btn:disabled { opacity:.5; }

    /* ── Messages ── */
    .error-msg { margin:.75rem 1rem 0; background:rgba(239,68,68,.08); color:#dc2626; padding:.7rem .9rem; border-radius:12px; font-size:.8rem; font-weight:600; display:flex; align-items:center; gap:.4rem; }

    /* ── Shimmer / empty ── */
    .shimmer-card { height:64px; border-radius:16px; background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    .shimmer-card--sm { height:64px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state { display:flex; flex-direction:column; align-items:center; padding:2.5rem 1.5rem; text-align:center; }
    .empty-ring {
      width:96px; height:96px; border-radius:50%;
      background:linear-gradient(135deg,rgba(102,126,234,.16),rgba(118,75,162,.16));
      border:1px solid rgba(102,126,234,.18);
      display:flex; align-items:center; justify-content:center;
      font-size:2.4rem; color:#667eea; margin-bottom:1.25rem; box-shadow:0 10px 28px rgba(102,126,234,.18);
    }
    .empty-state h3 { font-size:1.1rem; font-weight:800; color:#1a1a2e; margin:0 0 .4rem; }
    .empty-state p { font-size:.85rem; color:#9090aa; line-height:1.6; max-width:300px; margin:0 auto 1.25rem; }

    .empty-btn {
      display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
      padding:.8rem 1.5rem; border-radius:14px; min-height:48px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none;
      font-size:.9rem; font-weight:700; cursor:pointer;
      box-shadow:0 6px 18px rgba(102,126,234,.3); -webkit-tap-highlight-color:transparent; transition:transform .15s;
    }
    .empty-btn:active { transform:scale(.97); }
    .ghost-btn {
      display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
      padding:.8rem 1.5rem; border-radius:14px; min-height:48px;
      background:#fff; color:#667eea; border:1.5px solid rgba(102,126,234,.3);
      font-size:.9rem; font-weight:700; cursor:pointer; -webkit-tap-highlight-color:transparent;
    }

    /* ── Success ── */
    .success-screen { display:flex; flex-direction:column; align-items:center; padding:2rem 1.5rem; text-align:center; }
    .success-ring {
      width:100px; height:100px; border-radius:50%;
      background:linear-gradient(135deg,#10b981,#059669); color:#fff;
      display:flex; align-items:center; justify-content:center; font-size:2.8rem;
      margin-bottom:1.25rem; box-shadow:0 12px 30px rgba(16,185,129,.35); animation:pop .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes pop { from { transform:scale(.5); opacity:0; } to { transform:scale(1); opacity:1; } }
    .success-screen h2 { font-size:1.3rem; font-weight:800; color:#1a1a2e; margin:0 0 .25rem; }
    .success-en { font-size:.85rem; color:#9090aa; margin:0 0 1.25rem; }
    .success-card { width:100%; max-width:360px; background:#fff; border-radius:16px; border:1.5px solid #f0f0f0; box-shadow:0 2px 10px rgba(0,0,0,.04); padding:.5rem 1rem; margin-bottom:1rem; }
    .success-line { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.65rem 0; border-bottom:1px solid #f3f3f8; }
    .success-line:last-child { border-bottom:none; }
    .success-line span { font-size:.75rem; color:#9090aa; font-weight:600; }
    .success-line b { font-size:.85rem; color:#1a1a2e; font-weight:700; text-align:left; }
    .success-hint { font-size:.8rem; color:#9090aa; line-height:1.6; max-width:320px; margin:0 auto 1.5rem; }
    .success-actions { display:flex; flex-direction:column; gap:.6rem; width:100%; max-width:360px; }

    /* ── Spinners ── */
    .spinner-in { width:16px; height:16px; border:2px solid rgba(102,126,234,.3); border-top-color:#667eea; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
    .spinner-sm { width:18px; height:18px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ParentEnrollComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly parentService = inject(ParentService);
  private readonly teacherService = inject(TeacherService);
  private readonly enrollmentService = inject(EnrollmentRequestService);

  readonly stepMeta = [
    { n: 1, label: 'المعلم' },
    { n: 2, label: 'المقرر' },
    { n: 3, label: 'الابن' },
  ];

  // Wizard state
  step = signal(1);
  submitted = signal(false);

  // Children
  loadingChildren = signal(true);
  children = signal<ChildSummaryDto[]>([]);

  // Teacher search
  teacherQuery = signal('');
  searchingTeachers = signal(false);
  teachers = signal<TeacherAutocompleteDto[]>([]);
  selectedTeacher = signal<TeacherAutocompleteDto | null>(null);
  private searchTimer: any;

  // Courses
  loadingCourses = signal(false);
  courses = signal<CourseDto[]>([]);
  coursesError = signal<string | null>(null);
  selectedCourse = signal<CourseDto | null>(null);

  // Child pick + submit
  selectedChildId = signal<string | null>(null);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  submittedChildName = computed(() =>
    this.children().find(c => c.studentId === this.selectedChildId())?.studentName || ''
  );

  async ngOnInit(): Promise<void> {
    this.loadingChildren.set(true);
    try {
      const dashboard = await lastValueFrom(this.parentService.getDashboard());
      this.children.set(dashboard?.children ?? []);
    } catch (e) {
      console.error('Error loading children:', e);
      this.children.set([]);
    } finally {
      this.loadingChildren.set(false);
    }
  }

  // ── Step 1: teacher search (debounced) ──
  onTeacherQueryChange(value: string): void {
    this.teacherQuery.set(value);
    clearTimeout(this.searchTimer);
    const q = value.trim();
    if (q.length === 0) {
      this.teachers.set([]);
      this.searchingTeachers.set(false);
      return;
    }
    this.searchingTeachers.set(true);
    this.searchTimer = setTimeout(() => this.searchTeachers(q), 350);
  }

  private async searchTeachers(q: string): Promise<void> {
    try {
      const results = await lastValueFrom(this.teacherService.getTeachersBySearch(q, 15));
      // Ignore stale results if the query changed while the request was in flight.
      if (this.teacherQuery().trim() !== q) return;
      this.teachers.set(results ?? []);
    } catch (e) {
      console.error('Teacher search error:', e);
      this.teachers.set([]);
    } finally {
      if (this.teacherQuery().trim() === q) this.searchingTeachers.set(false);
    }
  }

  async selectTeacher(t: TeacherAutocompleteDto): Promise<void> {
    this.selectedTeacher.set(t);
    this.selectedCourse.set(null);
    this.courses.set([]);
    this.step.set(2);
    await this.loadCourses(t.id!);
  }

  // ── Step 2: teacher's public-profile courses ──
  private async loadCourses(teacherId: string): Promise<void> {
    this.loadingCourses.set(true);
    this.coursesError.set(null);
    try {
      const profile = await lastValueFrom(this.teacherService.getPublicProfile(teacherId));
      this.courses.set(profile?.courses ?? []);
    } catch (e) {
      console.error('Error loading teacher courses:', e);
      this.coursesError.set('حدث خطأ أثناء تحميل المقررات · Failed to load courses');
      this.courses.set([]);
    } finally {
      this.loadingCourses.set(false);
    }
  }

  selectCourse(c: CourseDto): void {
    this.selectedCourse.set(c);
    this.step.set(3);
  }

  backToStep(n: number): void {
    this.step.set(n);
  }

  // ── Step 3: submit ──
  async submit(): Promise<void> {
    const studentId = this.selectedChildId();
    const course = this.selectedCourse();
    const teacher = this.selectedTeacher();
    if (!studentId || !course || !teacher) return;

    this.submitting.set(true);
    this.submitError.set(null);
    try {
      await lastValueFrom(this.enrollmentService.create({
        studentId,
        courseId: course.id,
        teacherId: teacher.id,
        initiator: EnrollmentRequestInitiator.Parent,
      }));
      this.submitted.set(true);
    } catch (e: any) {
      console.error('Enrollment submit error:', e);
      this.submitError.set(
        e?.error?.error?.message || 'تعذّر إرسال الطلب · Could not submit the request'
      );
    } finally {
      this.submitting.set(false);
    }
  }

  reset(): void {
    this.step.set(1);
    this.submitted.set(false);
    this.teacherQuery.set('');
    this.teachers.set([]);
    this.selectedTeacher.set(null);
    this.courses.set([]);
    this.selectedCourse.set(null);
    this.selectedChildId.set(null);
    this.submitError.set(null);
  }

  initials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || '?';
  }

  goToLinkChild(): void { this.router.navigate(['/parent/link-child']); }
  goToRequests(): void { this.router.navigate(['/parent/requests']); }
  goHome(): void { this.router.navigate(['/parent']); }
}
