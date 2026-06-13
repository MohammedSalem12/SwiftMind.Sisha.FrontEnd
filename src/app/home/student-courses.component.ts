import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { StudentCourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <div class="header-icon">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="header-text">
            <h1>المقررات الدراسية</h1>
            <p>Courses · {{ courses().length }} مقرر</p>
          </div>
        </div>

        <!-- Search -->
        <div class="header-search">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="بحث بالاسم أو الكود · Search..."
                 [ngModel]="searchText()"
                 (ngModelChange)="searchText.set($event)" />
          @if (searchText()) {
            <button class="search-clear" (click)="searchText.set('')">
              <i class="fas fa-times"></i>
            </button>
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.tab--active]="activeTab() === 'enrolled'" (click)="activeTab.set('enrolled')">
          <i class="fas fa-check-circle"></i>
          <span>مسجّل · Enrolled</span>
          @if (enrolledCourses().length > 0) {
            <span class="tab-count">{{ enrolledCourses().length }}</span>
          }
        </button>
        <button class="tab" [class.tab--active]="activeTab() === 'available'" (click)="activeTab.set('available')">
          <i class="fas fa-plus-circle"></i>
          <span>متاح · Available</span>
          @if (availableCourses().length > 0) {
            <span class="tab-count">{{ availableCourses().length }}</span>
          }
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="error-banner">
          <i class="fas fa-exclamation-triangle"></i> {{ error() }}
        </div>
      }

      <!-- Enrolled Tab -->
      @if (!loading() && activeTab() === 'enrolled') {
        @if (filteredEnrolled().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="fas" [class]="searchText() ? 'fas fa-search' : 'fas fa-book-open'"></i></div>
            <h3>{{ searchText() ? 'لا توجد نتائج' : 'لم تسجّل في أي مقرر بعد' }}</h3>
            <p>{{ searchText() ? 'No results' : 'Browse available courses and enroll' }}</p>
            @if (!searchText()) {
              <button class="empty-btn" (click)="activeTab.set('available')">
                <i class="fas fa-plus"></i> استعراض المقررات المتاحة
              </button>
            }
          </div>
        }
        @if (filteredEnrolled().length > 0) {
          <div class="courses-list">
            @for (c of filteredEnrolled(); track c.id) {
              <div class="course-card course-card--enrolled" (click)="openProfile(c)">
                <div class="card-icon card-icon--enrolled">
                  <i class="fas fa-book"></i>
                </div>
                <div class="card-body">
                  <span class="card-name">{{ c.nameAr || c.nameEn }}</span>
                  @if (c.nameEn && c.nameAr) { <span class="card-name-en">{{ c.nameEn }}</span> }
                  <div class="card-meta">
                    @if (c.code) { <span class="chip chip-code">{{ c.code }}</span> }
                    @if (c.gradeName) { <span class="chip chip-grade">{{ c.gradeName }}</span> }
                    <span class="chip chip-enrolled"><i class="fas fa-check"></i> مسجّل</span>
                  </div>
                </div>
                <i class="fas fa-chevron-left card-arrow"></i>
              </div>
            }
          </div>
        }
      }

      <!-- Available Tab -->
      @if (!loading() && activeTab() === 'available') {
        @if (filteredAvailable().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="fas" [class]="searchText() ? 'fas fa-search' : 'fas fa-graduation-cap'"></i></div>
            <h3>{{ searchText() ? 'لا توجد نتائج' : 'لا توجد مقررات متاحة حالياً' }}</h3>
            <p>{{ searchText() ? 'No results' : 'No available courses at this time' }}</p>
          </div>
        }
        @if (filteredAvailable().length > 0) {
          <div class="courses-list">
            @for (c of filteredAvailable(); track c.id) {
              <div class="course-card" [class.course-card--pending]="c.hasPendingRequest">
                <div class="card-icon" [class.card-icon--pending]="c.hasPendingRequest">
                  <i class="fas" [class]="c.hasPendingRequest ? 'fas fa-hourglass-half' : 'fas fa-book-open'"></i>
                </div>
                <div class="card-body">
                  <span class="card-name">{{ c.nameAr || c.nameEn }}</span>
                  @if (c.nameEn && c.nameAr) { <span class="card-name-en">{{ c.nameEn }}</span> }
                  <div class="card-meta">
                    @if (c.code) { <span class="chip chip-code">{{ c.code }}</span> }
                    @if (c.gradeName) { <span class="chip chip-grade">{{ c.gradeName }}</span> }
                    @if (c.hasPendingRequest) {
                      <span class="chip chip-pending"><i class="fas fa-clock"></i> قيد المراجعة</span>
                    }
                  </div>
                </div>
                @if (c.hasPendingRequest) {
                  <div class="card-status">
                    <span class="pending-text">بانتظار الموافقة</span>
                  </div>
                } @else {
                  <button class="enroll-btn" (click)="enrollInCourse(c); $event.stopPropagation()">
                    <i class="fas fa-plus"></i>
                    <span>سجّل</span>
                  </button>
                }
              </div>
            }
          </div>
        }
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* Header */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + .75rem) 1.25rem 1rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:130px; height:130px; bottom:-50px; left:-30px; }

    .header-row {
      position:relative; z-index:1;
      display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem;
    }
    .header-icon {
      width:44px; height:44px; border-radius:50%;
      background:rgba(255,255,255,.15); border:1.5px solid rgba(255,255,255,.25);
      display:flex; align-items:center; justify-content:center;
      font-size:1.1rem; color:white; flex-shrink:0;
    }
    .header-text h1 { margin:0; font-size:1.15rem; font-weight:800; color:white; }
    .header-text p { margin:.1rem 0 0; font-size:.72rem; color:rgba(255,255,255,.65); }

    .header-search {
      position:relative; z-index:1;
      display:flex; align-items:center; gap:.5rem;
      background:rgba(255,255,255,.15); border:1.5px solid rgba(255,255,255,.2);
      border-radius:14px; padding:0 .85rem; min-height:44px;
    }
    .header-search i { color:rgba(255,255,255,.6); font-size:.8rem; flex-shrink:0; }
    .header-search input {
      flex:1; border:none; background:transparent; outline:none;
      font-size:16px; color:white; min-height:44px; font-family:inherit;
      &::placeholder { color:rgba(255,255,255,.4); font-size:.82rem; }
    }
    .search-clear {
      border:none; background:none; color:rgba(255,255,255,.5); cursor:pointer;
      padding:4px; min-width:44px; min-height:44px;
      display:flex; align-items:center; justify-content:center;
    }

    /* Tabs */
    .tabs {
      display:flex; gap:.25rem; padding:.75rem 1rem 0;
      background:white; margin:0 .75rem; border-radius:14px; padding:.3rem;
      box-shadow:0 2px 6px rgba(0,0,0,.04);
    }
    .tab {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.35rem;
      padding:.6rem .5rem; border:none; background:transparent;
      border-radius:10px; font-size:.78rem; font-weight:600;
      color:#6c757d; cursor:pointer; min-height:44px;
      transition:all .15s; -webkit-tap-highlight-color:transparent;
    }
    .tab i { font-size:.75rem; }
    .tab--active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; box-shadow:0 2px 8px rgba(102,126,234,.3);
    }
    .tab-count {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.65rem; font-weight:700;
      padding:.05rem .35rem; border-radius:8px; min-width:16px; text-align:center;
    }
    .tab--active .tab-count { background:rgba(255,255,255,.25); color:white; }

    /* Shimmer */
    .shimmer-area { padding:.75rem 1rem 0; display:flex; flex-direction:column; gap:.6rem; }
    .shimmer-card {
      height:80px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Error */
    .error-banner {
      margin:.75rem 1rem; padding:.75rem 1rem; border-radius:12px;
      background:#fef2f2; border:1px solid #fecaca; color:#dc2626;
      font-size:.85rem; display:flex; align-items:center; gap:.5rem;
    }

    /* Empty */
    .empty-state {
      display:flex; flex-direction:column; align-items:center;
      padding:3rem 1.5rem; text-align:center;
    }
    .empty-icon {
      width:64px; height:64px; border-radius:50%;
      background:rgba(102,126,234,.1);
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; color:#667eea; margin-bottom:1rem;
    }
    .empty-state h3 { font-size:1rem; font-weight:700; color:#1a1a2e; margin:0 0 .25rem; }
    .empty-state p { font-size:.82rem; color:#9090aa; margin:0 0 1rem; }
    .empty-btn {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.7rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; border:none; font-size:.88rem; font-weight:700; cursor:pointer;
      min-height:48px;
    }

    /* Courses list */
    .courses-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.6rem; }

    .course-card {
      display:flex; align-items:center; gap:.75rem;
      background:white; border-radius:16px; padding:.85rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
      border:1.5px solid #f0f0f5;
      cursor:pointer; transition:all .15s;
      -webkit-tap-highlight-color:transparent;
      min-height:72px;
      &:active { transform:scale(.99); box-shadow:0 1px 4px rgba(0,0,0,.06); }
    }
    .course-card--enrolled { border-color:rgba(34,197,94,.2); }
    .course-card--pending { border-color:rgba(245,158,11,.2); }

    .card-icon {
      width:46px; height:46px; border-radius:12px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:white; font-size:1.1rem;
    }
    .card-icon--enrolled { background:linear-gradient(135deg,#22c55e,#16a34a); }
    .card-icon--pending { background:linear-gradient(135deg,#f59e0b,#d97706); }

    .card-body { flex:1; min-width:0; }
    .card-name {
      display:block; font-size:.9rem; font-weight:700; color:#1a1a2e;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .card-name-en { display:block; font-size:.7rem; color:#9090aa; margin-top:.1rem; }
    .card-meta { display:flex; flex-wrap:wrap; gap:.25rem; margin-top:.3rem; }
    .chip {
      display:inline-flex; align-items:center; gap:.15rem;
      font-size:.6rem; font-weight:600; padding:.1rem .35rem; border-radius:6px;
    }
    .chip-code { background:rgba(102,126,234,.1); color:#667eea; font-family:monospace; }
    .chip-grade { background:rgba(118,75,162,.1); color:#764ba2; }
    .chip-enrolled { background:rgba(34,197,94,.1); color:#16a34a; }
    .chip-pending { background:rgba(245,158,11,.1); color:#d97706; }

    .card-arrow { color:#c4c4d4; font-size:.8rem; flex-shrink:0; }

    .card-status { flex-shrink:0; }
    .pending-text {
      font-size:.68rem; font-weight:600; color:#d97706;
      background:rgba(245,158,11,.08); padding:.35rem .6rem; border-radius:8px;
    }

    .enroll-btn {
      display:flex; align-items:center; gap:.3rem;
      padding:.45rem .85rem; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; border:none; font-size:.78rem; font-weight:700;
      cursor:pointer; flex-shrink:0; min-height:38px;
      transition:transform .15s;
      &:active { transform:scale(.95); }
    }
  `]
})
export class StudentCoursesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);

  courses = signal<StudentCourseDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchText = signal('');
  activeTab = signal<'enrolled' | 'available'>('enrolled');

  enrolledCourses = computed(() =>
    this.courses().filter(c => c.isEnrolled || c.hasPendingRequest)
  );

  availableCourses = computed(() =>
    this.courses().filter(c => !c.isEnrolled && !c.hasPendingRequest)
  );

  private applySearch(list: StudentCourseDto[]): StudentCourseDto[] {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return list;
    return list.filter(c =>
      (c.nameAr || '').toLowerCase().includes(q) ||
      (c.nameEn || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.gradeName || '').toLowerCase().includes(q)
    );
  }

  filteredEnrolled = computed(() => this.applySearch(this.enrolledCourses()));
  filteredAvailable = computed(() => this.applySearch(this.availableCourses()));

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(this.courseService.getCoursesForCurrentStudent());
      this.courses.set(result || []);
      // Auto-switch to available if no enrolled courses
      if (this.enrolledCourses().length === 0 && this.availableCourses().length > 0) {
        this.activeTab.set('available');
      }
    } catch (err) {
      console.error('Error loading student courses:', err);
      this.error.set('حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.loading.set(false);
    }
  }

  openProfile(course: StudentCourseDto): void {
    this.router.navigate(['/student/course', course.id]);
  }

  enrollInCourse(course: StudentCourseDto): void {
    this.router.navigate(['/student/enroll', course.id]);
  }

  trackById = (_: number, c: StudentCourseDto) => c.id;
}
