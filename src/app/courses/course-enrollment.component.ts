import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { CurrentUserInfoService } from '@proxy/common';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { TeacherService } from '@proxy/teachers';
import { TeacherInfoModalService } from '../shared/services/teacher-info-modal.service';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import { AcademyService } from '@proxy/academies';
import { lastValueFrom } from 'rxjs';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';

@Component({
  selector: 'app-course-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="enroll-page" dir="rtl">

      <!-- Header -->
      <div class="enroll-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-text">
          <span class="header-title">التسجيل في مقرر</span>
          <span class="header-sub">{{ academyId() ? 'معلمو الأكاديمية فقط · Academy teachers only' : 'اختر المعلم ثم المجموعة' }}</span>
        </div>
      </div>

      <!-- Step Indicator -->
      @if (!enrollmentSuccess()) {
        <div class="steps-bar">
          <div class="step" [class.step--active]="!selectedTeacher()" [class.step--done]="!!selectedTeacher()">
            <div class="step-dot">
              @if (selectedTeacher()) { <i class="fas fa-check"></i> } @else { 1 }
            </div>
            <span class="step-label">المعلم</span>
          </div>
          <div class="step-line" [class.step-line--done]="!!selectedTeacher()"></div>
          <div class="step" [class.step--active]="!!selectedTeacher()">
            <div class="step-dot">2</div>
            <span class="step-label">المجموعة</span>
          </div>
        </div>
      }

      <!-- Error Banner -->
      @if (errorMessage()) {
        <div class="error-banner">
          <i class="fas fa-exclamation-triangle"></i> {{ errorMessage() }}
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="sk-card"></div>
          <div class="sk-card"></div>
          <div class="sk-card"></div>
        </div>
      }

      <!-- Step 1: Teachers -->
      @if (!loading() && !selectedTeacher() && !enrollmentSuccess()) {
        <div class="step-content">
          <!-- Filter panel -->
          <div class="filter-panel">
            <div class="filter-row">
              <div class="filter-field">
                <label class="filter-lbl"><i class="fas fa-map-marker-alt"></i> المحافظة</label>
                <select class="filter-select"
                        [ngModel]="filterGovernment()"
                        (ngModelChange)="filterGovernment.set($event); filterTown.set(''); onLocationFilterChange()">
                  <option value="">كل المحافظات</option>
                  @for (g of governorates; track g) {
                    <option [value]="g">{{ g }}</option>
                  }
                </select>
              </div>
              <div class="filter-field">
                <label class="filter-lbl"><i class="fas fa-city"></i> المركز / الحي</label>
                <select class="filter-select"
                        [ngModel]="filterTown()"
                        (ngModelChange)="filterTown.set($event); onLocationFilterChange()"
                        [disabled]="!filterGovernment()">
                  <option value="">{{ filterGovernment() ? 'كل المراكز' : '-- اختر المحافظة أولاً --' }}</option>
                  @for (d of districts(); track d) {
                    <option [value]="d">{{ d }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="filter-field">
              <label class="filter-lbl"><i class="fas fa-search"></i> بحث بالاسم أو الكود</label>
              <input class="filter-input" type="text"
                     [ngModel]="filterNameCode()"
                     (ngModelChange)="filterNameCode.set($event)"
                     placeholder="اسم المعلم أو كوده" />
            </div>
            @if (locationFilterLoading()) {
              <div class="filter-loading">
                <span class="spinner-xs"></span> جاري البحث...
              </div>
            }
          </div>

          <div class="section-lbl">
            <i class="fas fa-chalkboard-teacher"></i>
            <span>اختر المعلم</span>
            <span class="lbl-count">{{ filteredTeachers().length }}</span>
          </div>

          @if (filteredTeachers().length === 0 && !locationFilterLoading()) {
            <div class="empty-state">
              <i class="fas fa-user-slash"></i>
              <p>{{ teachers().length === 0 ? 'لا يوجد معلمون متاحون لهذا المقرر حالياً' : 'لا يوجد معلمون بهذه المعايير' }}</p>
            </div>
          }

          <div class="teachers-grid">
            @for (t of filteredTeachers(); track t.id) {
              <div class="teacher-card" [class.teacher-promoted]="t.isPromoted" (click)="selectTeacher(t)">
                @if (t.isPromoted) {
                  <div class="promoted-badge"><i class="fas fa-crown"></i> مميز</div>
                }
                <button class="info-btn" (click)="openTeacherInfo(t.id!); $event.stopPropagation()" title="معلومات المعلم">
                  <i class="fas fa-info-circle"></i>
                </button>
                <div class="teacher-avatar">{{ getInitials(t.displayName) }}</div>
                <div class="teacher-name">{{ t.displayName }}</div>
                @if (t.government || t.town) {
                  <div class="teacher-location">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ [t.government, t.town].filter(Boolean).join(' — ') }}
                  </div>
                }
                <button class="select-btn">
                  اختيار <i class="fas fa-chevron-left"></i>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Step 2: Groups -->
      @if (!loading() && selectedTeacher() && !enrollmentSuccess()) {
        <div class="step-content">

          <!-- Selected teacher bar -->
          <div class="selected-teacher-bar">
            <div class="st-avatar">{{ getInitials(selectedTeacher()?.displayName) }}</div>
            <div class="st-info">
              <span class="st-lbl">المعلم المختار</span>
              <span class="st-name">{{ selectedTeacher()?.displayName }}</span>
            </div>
            <button class="change-btn" (click)="backToTeachers()">تغيير</button>
          </div>

          <!-- Teacher code input — only shown when groups are available -->
          @if (groups().length > 0) {
            <div class="code-card">
              <label class="code-label">
                <i class="fas fa-key"></i> رمز الطالب الداخلي
                <span class="optional-tag">اختياري</span>
              </label>
              <input
                class="code-input"
                type="text"
                [(ngModel)]="teacherStudentCodeInput"
                placeholder="أدخل الرمز إن زودك به المعلم"
                maxlength="32" />
            </div>
          }

          <div class="section-lbl">
            <i class="fas fa-users"></i>
            <span>اختر المجموعة</span>
            <span class="lbl-count">{{ groups().length }}</span>
          </div>

          @if (groups().length === 0) {
            <div class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>لا توجد مجموعات متاحة لهذا المعلم حالياً</p>
            </div>
          }

          <div class="groups-list">
            @for (g of groups(); track g.groupId) {
              <div class="group-card">
                <div class="group-top">
                  <div>
                    <div class="group-name">{{ g.name }}</div>
                    <div class="group-code"><i class="fas fa-hashtag"></i> {{ g.groupCode }}</div>
                  </div>
                </div>

                @if (g.schedules && g.schedules.length > 0) {
                  <div class="schedules">
                    @for (s of g.schedules; track s.dayOfWeek) {
                      <div class="schedule-row">
                        <i class="fas fa-calendar-day"></i>
                        <span class="sch-day">{{ getDayName(s.dayOfWeek) }}</span>
                        <i class="fas fa-clock"></i>
                        <span>{{ formatTime(s.startTime) }} - {{ formatTime(s.endTime) }}</span>
                        @if (s.location) {
                          <span class="sch-loc"><i class="fas fa-map-marker-alt"></i> {{ s.location }}</span>
                        }
                      </div>
                    }
                  </div>
                }

                <button class="join-btn" (click)="selectGroup(g)" [disabled]="submitting()">
                  @if (submitting()) {
                    <i class="fas fa-spinner fa-spin"></i> جاري الإرسال...
                  } @else {
                    <i class="fas fa-user-plus"></i> انضم للمجموعة
                  }
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Success Screen -->
      @if (enrollmentSuccess()) {
        <div class="success-screen">
          <div class="success-icon"><i class="fas fa-check-circle"></i></div>
          <h2>تم إرسال الطلب!</h2>
          <p>سيتم مراجعة طلب التسجيل من قبل المعلم والموافقة عليه قريباً</p>
          <p class="success-en">Your enrollment request has been sent successfully</p>
          <div class="success-actions">
            <button class="sa-btn sa-btn--outline" (click)="goBack()">
              <i class="fas fa-home"></i> الرئيسية
            </button>
            <button class="sa-btn sa-btn--primary" (click)="goToRequests()">
              <i class="fas fa-clipboard-list"></i> طلباتي
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    $pg: linear-gradient(135deg, #667eea, #764ba2);
    $ps: #667eea;
    $pe: #764ba2;

    .enroll-page {
      min-height: 100vh;
      background: #f4f3ff;
      direction: rtl;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* Header */
    .enroll-header {
      background: $pg;
      padding: 1rem 1rem calc(1rem + env(safe-area-inset-top));
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .back-btn {
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.2);
      border: none; border-radius: 50%;
      color: #fff; font-size: 1rem;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .header-text { display: flex; flex-direction: column; }
    .header-title { color: #fff; font-size: 1.1rem; font-weight: 700; }
    .header-sub { color: rgba(255,255,255,0.75); font-size: 0.78rem; }

    /* Steps */
    .steps-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 1rem 2rem;
      background: #fff;
      border-bottom: 1px solid #e9e6ff;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
    }
    .step-dot {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: #e9e6ff;
      color: #9ca3af;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s ease;
    }
    .step--active .step-dot { background: $pg; color: #fff; }
    .step--done .step-dot { background: #22c55e; color: #fff; }
    .step-label { font-size: 0.72rem; color: #6b7280; font-weight: 500; }
    .step--active .step-label { color: $pe; font-weight: 700; }
    .step-line {
      flex: 1;
      height: 2px;
      background: #e9e6ff;
      margin: 0 0.5rem;
      margin-bottom: 0.9rem;
      min-width: 40px;
      transition: background 0.3s ease;
    }
    .step-line--done { background: #22c55e; }

    /* Error */
    .error-banner {
      margin: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Loading */
    .loading-area { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .sk-card {
      height: 80px; border-radius: 14px;
      background: linear-gradient(90deg, #e9e6ff 25%, #f4f3ff 50%, #e9e6ff 75%);
      background-size: 600px 100%;
      animation: shimmer 1.5s infinite;
    }

    /* Section label */
    .section-lbl {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0 1rem;
      margin: 1rem 0 0.5rem;
      font-size: 0.85rem; font-weight: 600; color: #374151;
      i { color: $ps; }
    }
    .lbl-count {
      background: $pg; color: #fff;
      border-radius: 20px; padding: 0.1rem 0.5rem;
      font-size: 0.7rem; font-weight: 700;
    }

    /* Empty */
    .empty-state {
      text-align: center; padding: 2.5rem 1rem; color: #9ca3af;
      i { font-size: 2.5rem; color: #c4b5fd; display: block; margin-bottom: 0.75rem; }
      p { font-size: 0.9rem; color: #6b7280; margin: 0; }
    }

    /* Filter panel */
    .filter-panel {
      margin: 0.75rem 1rem 0;
      background: #fff; border-radius: 14px;
      padding: 0.85rem; border: 1.5px solid #e9e6ff;
      display: flex; flex-direction: column; gap: 0.6rem;
    }
    .filter-row { display: flex; gap: 0.5rem; }
    .filter-field { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
    .filter-lbl {
      font-size: 0.72rem; font-weight: 600; color: #6b7280;
      display: flex; align-items: center; gap: 0.3rem;
      i { color: $ps; }
    }
    .filter-select, .filter-input {
      border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 0.5rem 0.6rem; font-size: 0.82rem;
      width: 100%; box-sizing: border-box; background: #fff;
      &:focus { outline: none; border-color: $ps; box-shadow: 0 0 0 2px rgba(102,126,234,0.15); }
    }
    .filter-loading {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.78rem; color: #667eea;
    }
    .spinner-xs {
      width: 12px; height: 12px;
      border: 2px solid #667eea; border-top-color: transparent;
      border-radius: 50%; animation: spin .7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Teachers */
    .teachers-grid {
      padding: 0 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .teacher-card {
      background: #fff;
      border-radius: 14px;
      padding: 1.1rem 0.75rem;
      display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1.5px solid #e9e6ff;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      position: relative;
      text-align: center;
      &:active { transform: scale(0.97); }
    }
    .teacher-avatar {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: $pg;
      color: #fff;
      font-size: 1.1rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .teacher-name {
      font-size: 0.85rem; font-weight: 600; color: #1a202c;
      line-height: 1.3;
    }
    .teacher-location {
      font-size: 0.68rem; color: #9ca3af; display: flex; align-items: center; gap: 0.2rem;
      i { font-size: 0.58rem; color: #667eea; }
    }
    .teacher-promoted {
      border-color: #f59e0b;
      box-shadow: 0 2px 12px rgba(245,158,11,.2);
    }
    .promoted-badge {
      position: absolute; top: -1px; right: -1px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff; font-size: .6rem; font-weight: 700;
      padding: .15rem .45rem; border-radius: 0 13px 0 10px;
      display: flex; align-items: center; gap: .2rem;
    }
    .promoted-badge i { font-size: .55rem; }
    .info-btn {
      position: absolute; top: .4rem; left: .4rem;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(102,126,234,.08); border: none; color: #667eea;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: .75rem; z-index: 1;
    }
    .info-btn:active { background: rgba(102,126,234,.18); }
    .select-btn {
      background: $pg; color: #fff;
      border: none; border-radius: 8px;
      padding: 0.35rem 0.9rem; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 0.3rem;
      min-height: 36px;
    }

    /* Selected teacher bar */
    .selected-teacher-bar {
      margin: 0.75rem 1rem;
      background: #fff;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      display: flex; align-items: center; gap: 0.75rem;
      border: 1.5px solid #e9e6ff;
      box-shadow: 0 2px 6px rgba(102,126,234,0.1);
    }
    .st-avatar {
      width: 40px; height: 40px;
      border-radius: 50%; background: $pg; color: #fff;
      font-size: 0.9rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .st-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
    .st-lbl { font-size: 0.68rem; color: #9ca3af; }
    .st-name { font-size: 0.88rem; font-weight: 600; color: #1a202c; }
    .change-btn {
      background: none; border: 1.5px solid $ps; color: $ps;
      border-radius: 8px; padding: 0.3rem 0.75rem;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      min-height: 36px;
    }

    /* Code input */
    .code-card {
      margin: 0 1rem 0.5rem;
      background: #fff; border-radius: 12px;
      padding: 0.85rem 1rem;
      border: 1.5px solid #e9e6ff;
    }
    .code-label {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.82rem; font-weight: 600; color: #374151;
      margin-bottom: 0.5rem;
      i { color: $ps; }
    }
    .optional-tag {
      background: #ede9fe; color: $pe;
      border-radius: 6px; padding: 0.1rem 0.4rem;
      font-size: 0.68rem; font-weight: 500; margin-right: auto;
    }
    .code-input {
      width: 100%; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 0.55rem 0.85rem; font-size: 0.88rem;
      direction: rtl; box-sizing: border-box;
      &:focus { outline: none; border-color: $ps; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
    }

    /* Groups */
    .groups-list { padding: 0 1rem; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .group-card {
      background: #fff; border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1.5px solid #e9e6ff;
    }
    .group-top { margin-bottom: 0.75rem; }
    .group-name { font-size: 0.95rem; font-weight: 700; color: #1a202c; }
    .group-code { font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; i { font-size: 0.65rem; } }
    .schedules { margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .schedule-row {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem;
      background: #f4f3ff; border-radius: 8px; padding: 0.45rem 0.75rem;
      font-size: 0.78rem; color: #374151;
      i { color: $pe; font-size: 0.72rem; }
    }
    .sch-day { font-weight: 600; }
    .sch-loc { color: #9ca3af; margin-right: auto; }
    .join-btn {
      width: 100%; background: $pg; color: #fff;
      border: none; border-radius: 10px; padding: 0.75rem;
      font-size: 0.9rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      min-height: 48px;
      &:disabled { opacity: 0.7; cursor: not-allowed; }
      &:active:not(:disabled) { opacity: 0.88; }
    }

    /* Success */
    .success-screen {
      display: flex; flex-direction: column; align-items: center;
      padding: 3rem 2rem; text-align: center;
    }
    .success-icon {
      font-size: 4.5rem; color: #22c55e;
      margin-bottom: 1rem;
      animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .success-screen h2 { font-size: 1.4rem; font-weight: 800; color: #1a202c; margin: 0 0 0.5rem; }
    .success-screen p { font-size: 0.88rem; color: #6b7280; margin: 0; }
    .success-en { font-size: 0.78rem; color: #9ca3af; margin-top: 0.25rem !important; }
    .success-actions { display: flex; gap: 0.75rem; margin-top: 2rem; width: 100%; max-width: 320px; }
    .sa-btn {
      flex: 1; border-radius: 12px; padding: 0.75rem 1rem;
      font-size: 0.88rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      min-height: 48px; border: none;
    }
    .sa-btn--primary { background: $pg; color: #fff; }
    .sa-btn--outline { background: #fff; color: $pe; border: 1.5px solid $pe; }
  `]
})
export class CourseEnrollmentComponent implements OnInit {
  private readonly route                  = inject(ActivatedRoute);
  private readonly router                 = inject(Router);
  private readonly groupService           = inject(GroupService);
  private readonly enrollmentRequestSvc   = inject(EnrollmentRequestService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);
  private readonly teacherService         = inject(TeacherService);
  private readonly academyService         = inject(AcademyService);
  private readonly restSvc                = inject(RestService);
  private readonly teacherInfoModal       = inject(TeacherInfoModalService);

  readonly governorates = EGYPT_GOVERNORATES_LIST;
  readonly districts    = computed(() => getDistricts(this.filterGovernment()));

  courseId          = signal<string>('');
  academyId         = signal<string | null>(null);
  academyMemberIds  = signal<Set<string>>(new Set());
  teachers          = signal<TeacherAutocompleteDto[]>([]);
  groups            = signal<GroupWithSchedulesDto[]>([]);
  selectedTeacher   = signal<TeacherAutocompleteDto | null>(null);
  loading           = signal(false);
  submitting        = signal(false);
  enrollmentSuccess = signal(false);
  errorMessage      = signal('');
  teacherStudentCodeInput = '';

  // Location filter
  filterGovernment      = signal('');
  filterTown            = signal('');
  filterNameCode        = signal('');
  govTownTeacherIds     = signal<string[] | null>(null);
  locationFilterLoading = signal(false);

  filteredTeachers = computed(() => {
    const all  = this.teachers();
    const ids  = this.govTownTeacherIds();
    const nc   = this.filterNameCode().toLowerCase().trim();
    let result = ids !== null ? all.filter(t => ids.includes(t.id!)) : all;
    if (nc) result = result.filter(t =>
      (t.displayName?.toLowerCase() ?? '').includes(nc) ||
      ((t as any).teacherCode?.toLowerCase() ?? '').includes(nc)
    );
    return result;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const aId = this.route.snapshot.queryParamMap.get('academyId');
    if (id) {
      this.courseId.set(id);
      if (aId) this.academyId.set(aId);
      this.loadTeachers();
    }
  }

  async loadTeachers(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      // Get student location for promoted teacher sorting
      let studentGov: string | undefined;
      let studentTown: string | undefined;
      try {
        const userInfo: any = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
        if (userInfo?.actorType === 'Student' && userInfo.actorId) {
          const student = await lastValueFrom(
            this.restSvc.request<void, any>({ method: 'GET', url: `/api/app/student/current-student` })
          );
          studentGov = student?.government || undefined;
          studentTown = student?.town || undefined;
        }
      } catch { /* ignore - location is optional */ }

      const teachers = await lastValueFrom(
        this.restSvc.request<void, TeacherAutocompleteDto[]>({
          method: 'GET',
          url: `/api/app/teacher/teachers-by-course/${this.courseId()}`,
          params: { maxResults: 100, studentGovernment: studentGov, studentTown: studentTown },
        })
      );

      // If academy context, filter to only academy members
      if (this.academyId()) {
        try {
          const members = await lastValueFrom(
            this.academyService.getMembers(this.academyId()!, { skipHandleError: true })
          );
          const memberIds = new Set((members || []).map(m => m.teacherId));
          this.academyMemberIds.set(memberIds);
          this.teachers.set((teachers || []).filter(t => memberIds.has(t.id!)));
        } catch {
          // Fallback: show all teachers if member lookup fails
          this.teachers.set(teachers || []);
        }
      } else {
        this.teachers.set(teachers || []);
      }
    } catch {
      this.errorMessage.set('حدث خطأ أثناء تحميل المعلمين');
    } finally {
      this.loading.set(false);
    }
  }

  async onLocationFilterChange(): Promise<void> {
    const gov  = this.filterGovernment().trim();
    const town = this.filterTown().trim();
    if (!gov && !town) { this.govTownTeacherIds.set(null); return; }
    this.locationFilterLoading.set(true);
    try {
      const params: any = { maxResultCount: 1000 };
      if (gov)  params.government = gov;
      if (town) params.town = town;
      const result = await lastValueFrom(
        this.restSvc.request<any, { items: any[] }>(
          { method: 'GET', url: '/api/sesha/teachers', params },
          { apiName: 'Default' }
        )
      );
      this.govTownTeacherIds.set((result?.items ?? []).map((t: any) => t.id as string));
    } catch { this.govTownTeacherIds.set([]); }
    finally { this.locationFilterLoading.set(false); }
  }

  selectTeacher(teacher: TeacherAutocompleteDto): void {
    this.selectedTeacher.set(teacher);
    this.teacherStudentCodeInput = '';
    this.loading.set(true);
    this.errorMessage.set('');
    this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId()).subscribe({
      next: groups => { this.groups.set(groups); this.loading.set(false); },
      error: () => { this.errorMessage.set('حدث خطأ أثناء تحميل المجموعات'); this.loading.set(false); }
    });
  }

  selectGroup(group: GroupWithSchedulesDto): void {
    this.submitEnrollmentRequest(group);
  }

  async submitEnrollmentRequest(group: GroupWithSchedulesDto): Promise<void> {
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      if (!userInfo?.actorId) {
        this.errorMessage.set('تعذّر تحديد بيانات الطالب، يرجى تسجيل الدخول مجدداً.');
        this.submitting.set(false);
        return;
      }
      const request: any = {
        studentId: userInfo.actorId,
        courseId: this.courseId(),
        teacherId: this.selectedTeacher()!.id!,
        groupId: group.groupId!,
        initiator: EnrollmentRequestInitiator.Student,
      };
      if (this.teacherStudentCodeInput?.trim()) {
        request.teacherStudentCode = this.teacherStudentCodeInput.trim();
      }
      await lastValueFrom(this.enrollmentRequestSvc.create(request));
      this.enrollmentSuccess.set(true);
    } catch (error: any) {
      this.errorMessage.set(error?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      this.submitting.set(false);
    }
  }

  backToTeachers(): void {
    this.selectedTeacher.set(null);
    this.groups.set([]);
    this.teacherStudentCodeInput = '';
  }

  goBack(): void { this.router.navigate(['/student']); }
  goToRequests(): void { this.router.navigate(['/student/requests']); }

  openTeacherInfo(teacherId: string): void {
    this.teacherInfoModal.open(teacherId);
  }

  getInitials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getDayName(dayOfWeek: number): string {
    return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek] || '';
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${parts[1]} ${h >= 12 ? 'م' : 'ص'}`;
    }
    return time;
  }
}
