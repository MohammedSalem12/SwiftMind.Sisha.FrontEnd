import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyCourseDto, AcademyDto } from '@proxy/academies/models';

@Component({
  selector: 'app-teacher-academy-courses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-info">
          <h1>{{ academyName() || 'مقررات الأكاديمية' }}</h1>
          <p class="opacity-75 mb-0">{{ courses().length }} مقرر</p>
        </div>
        <button class="add-btn" (click)="goToAddCourse()">
          <i class="fas fa-plus"></i>
          <span>إضافة مقرر</span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error()" class="error-banner">
        <i class="fas fa-exclamation-circle me-2"></i>{{ error() }}
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && !error() && courses().length === 0" class="empty-state">
        <i class="fas fa-book-open"></i>
        <h4>لا توجد مقررات</h4>
        <p>لم يتم إضافة أي مقرر لهذه الأكاديمية بعد</p>
        <button class="btn-create-lg" (click)="goToAddCourse()">
          <i class="fas fa-plus me-2"></i>إضافة مقرر جديد
        </button>
      </div>

      <!-- Courses list -->
      <div class="course-list" *ngIf="!loading() && courses().length > 0">
        <div
          class="course-card"
          *ngFor="let c of courses(); trackBy: trackByCourseId">
          <div class="course-icon">
            <i class="fas fa-book"></i>
          </div>
          <div class="course-info">
            <h4>{{ c.courseNameAr || c.courseNameEn }}</h4>
            <p *ngIf="c.courseNameAr && c.courseNameEn" class="name-en">{{ c.courseNameEn }}</p>
            <div class="course-meta">
              <span *ngIf="c.courseCode" class="meta-chip">
                <i class="fas fa-hashtag me-1"></i>{{ c.courseCode }}
              </span>
              <span *ngIf="c.gradeName" class="meta-chip meta-chip-grade">{{ c.gradeName }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding-bottom: calc(80px + env(safe-area-inset-bottom));
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: calc(.75rem + env(safe-area-inset-top)) 1rem .75rem;
      display: flex; align-items: center; gap: .75rem;
      position: sticky; top: 0; z-index: 50;
    }

    .back-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; min-width: 40px;
    }

    .header-info { flex: 1; min-width: 0; }
    .header-info h1 {
      font-size: 1.1rem; font-weight: 700; margin: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .add-btn {
      display: inline-flex; align-items: center; gap: .35rem;
      background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.35);
      color: white; border-radius: 20px;
      padding: .45rem .9rem; font-size: .82rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; min-height: 40px;
      transition: background .15s;
    }
    .add-btn:hover, .add-btn:active { background: rgba(255,255,255,.3); }

    .loading-state { text-align: center; padding: 3rem 1rem; color: #6c757d; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0; border-top-color: #667eea;
      border-radius: 50%; animation: spin .7s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      background: #fff3cd; color: #856404;
      padding: .875rem 1rem; font-size: .9rem; margin: 1rem;
      border-radius: 10px;
    }

    .empty-state { text-align: center; padding: 4rem 1.5rem; color: #6c757d; }
    .empty-state i { font-size: 3rem; margin-bottom: .75rem; display: block; opacity: .4; }
    .empty-state h4 { color: #343a40; margin: 0 0 .25rem; }
    .empty-state p { margin: 0 0 1.25rem; font-size: .9rem; }

    .btn-create-lg {
      display: inline-flex; align-items: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 24px;
      padding: .875rem 1.75rem; font-size: 1rem; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 14px rgba(102,126,234,.35);
      min-height: 52px; transition: opacity .15s;
    }
    .btn-create-lg:hover, .btn-create-lg:active { opacity: .88; }

    .course-list { padding: 1rem; display: flex; flex-direction: column; gap: .75rem; }

    .course-card {
      background: white; border-radius: 14px;
      border: 1.5px solid #e9ecef; padding: 1rem;
      display: flex; align-items: center; gap: .875rem;
    }

    .course-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.2rem; flex-shrink: 0;
    }

    .course-info { flex: 1; min-width: 0; }
    .course-info h4 { margin: 0 0 .2rem; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .name-en { font-size: .78rem; color: #6c757d; margin: 0 0 .3rem; }

    .course-meta { display: flex; gap: .4rem; flex-wrap: wrap; }
    .meta-chip {
      display: inline-flex; align-items: center;
      background: rgba(102,126,234,.1); color: #667eea;
      font-size: .72rem; font-weight: 600; padding: .15rem .5rem;
      border-radius: 10px;
    }
    .meta-chip-grade { background: rgba(118,75,162,.1); color: #764ba2; }
  `],
})
export class TeacherAcademyCoursesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly academyService = inject(AcademyService);

  loading = signal(true);
  error = signal<string | null>(null);
  academyName = signal<string>('');
  courses = signal<AcademyCourseDto[]>([]);

  private academyId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('academyId');
    if (!this.academyId) {
      this.error.set('معرّف الأكاديمية غير موجود');
      this.loading.set(false);
      return;
    }
    await Promise.all([this.loadAcademy(), this.loadCourses()]);
  }

  private async loadAcademy(): Promise<void> {
    try {
      const academy: AcademyDto = await lastValueFrom(
        this.academyService.get(this.academyId!, { skipHandleError: true })
      );
      this.academyName.set(academy?.nameAr || academy?.nameEn || '');
    } catch { /* name stays empty */ }
  }

  private async loadCourses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.academyService.getAcademyCourses(this.academyId!, { skipHandleError: true })
      );
      this.courses.set(result || []);
    } catch (err: any) {
      this.error.set(err?.error?.error?.message || 'حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.loading.set(false);
    }
  }

  goToAddCourse(): void {
    this.router.navigate(['/add-course'], { queryParams: { academyId: this.academyId } });
  }

  goBack(): void {
    this.router.navigate(['/teacher/academies']);
  }

  trackByCourseId = (_: number, item: AcademyCourseDto) => item.courseId;
}
