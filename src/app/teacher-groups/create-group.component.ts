import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { GroupService } from '@proxy/groups';
import { AcademyService } from '@proxy/academies';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-create-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="create-page" dir="rtl">

      <app-page-header
        [title]="'إنشاء مجموعة جديدة'"
        [titleEn]="'أضف مجموعة جديدة لأحد المقررات المسندة إليك'"
        (back)="goBack()"></app-page-header>

      <!-- Form -->
      <div class="form-wrap">
        <form (ngSubmit)="submit()">

          <!-- Group name -->
          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-pen-fancy"></i> اسم المجموعة <span class="req">*</span>
            </label>
            <input class="field-input"
              name="name"
              [(ngModel)]="name"
              required
              placeholder="مثال: مجموعة أ - رياضيات" />
          </div>

          <!-- Course selection -->
          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-book-open"></i> المقرر الدراسي <span class="req">*</span>
            </label>
            @if (lockedCourseId) {
              <div class="locked-course">
                <div class="locked-icon">
                  <i class="fas fa-lock"></i>
                </div>
                <span>{{ getLockedCourseName() }}</span>
              </div>
            } @else if (loadingCourses()) {
              <div class="loading-field">
                <div class="spinner-sm"></div>
                <span>جاري تحميل المقررات...</span>
              </div>
            } @else {
              <select class="field-input" name="courseId" [(ngModel)]="courseId" required>
                <option value="">-- اختر المقرر --</option>
                @for (c of courses(); track c.id) {
                  <option [value]="c.id">
                    {{ c.nameAr || c.nameEn }} ({{ c.code }})
                  </option>
                }
              </select>
              @if (courses().length === 0) {
                <p class="hint-text">
                  <i class="fas fa-info-circle"></i>
                  لا توجد مقررات مسندة إليك حالياً
                </p>
              }
            }
          </div>

          <!-- Selected course preview -->
          @if (courseId && !lockedCourseId) {
            <div class="course-preview">
              <i class="fas fa-book"></i>
              <span>{{ getSelectedCourseName() }}</span>
            </div>
          }

          <!-- Group Type: Online / Offline -->
          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-signal"></i> نوع المجموعة · Group Type
            </label>
            <div class="type-toggle">
              <button type="button" class="type-btn" [class.active]="groupType === 0" (click)="groupType = 0">
                <i class="fas fa-map-marker-alt"></i> حضوري · Offline
              </button>
              <button type="button" class="type-btn" [class.active]="groupType === 1" (click)="groupType = 1">
                <i class="fas fa-video"></i> أونلاين · Online
              </button>
            </div>
          </div>

          @if (groupType === 1) {
            <div class="field-group">
              <label class="field-label">
                <i class="fas fa-link"></i> رابط الاجتماع · Meeting Link
              </label>
              <input class="field-input" name="meetingLink" [(ngModel)]="meetingLink"
                     placeholder="https://zoom.us/j/... أو https://meet.google.com/..." />
            </div>
          }

          @if (groupType === 0) {
            <div class="field-group">
              <label class="field-label">
                <i class="fas fa-map-pin"></i> العنوان · Location
              </label>
              <input class="field-input" name="location" [(ngModel)]="locationAddr"
                     placeholder="مثال: مكتبة النور، شارع التحرير" />
            </div>
          }

          <!-- Error -->
          @if (errorMsg()) {
            <div class="error-banner">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMsg() }}
            </div>
          }

          <!-- Actions -->
          <div class="form-actions">
            <button class="btn-submit" type="submit"
              [disabled]="saving() || !name || !courseId">
              @if (saving()) {
                <div class="spinner"></div>
                <span>جاري الإنشاء...</span>
              } @else {
                <i class="fas fa-plus"></i>
                <span>إنشاء المجموعة</span>
              }
            </button>
            <button class="btn-cancel" type="button" (click)="goBack()">إلغاء</button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

    /* Form */
    .form-wrap { padding: 1.25rem 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field-label { font-size: 0.8rem; font-weight: 700; color: #4a4a6a; display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { color: #667eea; font-size: 0.72rem; }
    .req { color: #ef4444; }
    .field-input { padding: 0.75rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 0.95rem; background: #fff; width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; direction: rtl; font-family: inherit; }
    .field-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }
    select.field-input { appearance: none; -webkit-appearance: none; cursor: pointer; }

    .locked-course {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.75rem 1rem; border: 1.5px solid rgba(102,126,234,0.25);
      border-radius: 12px; background: rgba(102,126,234,0.06);
      font-weight: 600; font-size: 0.92rem; color: #4a4a6a;
    }
    .locked-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .locked-icon i { font-size: 0.7rem; color: #fff; }

    .loading-field {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.75rem 1rem; background: #f9fafb;
      border: 1.5px solid #e5e7eb; border-radius: 12px;
      font-size: 0.85rem; color: #6b7280;
    }

    .hint-text {
      font-size: 0.78rem; color: #9ca3af; margin: 0.35rem 0 0;
      display: flex; align-items: center; gap: 0.35rem;
    }
    .hint-text i { font-size: 0.7rem; color: #667eea; }

    .course-preview {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; background: #f0f4ff;
      border: 1px solid #c7d7fd; border-radius: 12px;
      font-size: 0.875rem; font-weight: 600; color: #3730a3;
      margin-bottom: 1rem;
    }
    .course-preview i { font-size: 0.8rem; color: #667eea; }

    .error-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.875rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; margin-bottom: 1rem; }
    .error-banner i { font-size: 1rem; flex-shrink: 0; }

    .form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-submit { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(145deg, #667eea, #764ba2); color: #fff; border: none; padding: 0.875rem; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; min-height: 50px; box-shadow: 0 4px 14px rgba(102,126,234,0.35); transition: opacity 0.15s; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
    .btn-cancel { padding: 0.875rem 1.25rem; border-radius: 12px; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.9rem; font-weight: 600; cursor: pointer; min-height: 50px; }
    .type-toggle { display: flex; gap: 8px; }
    .type-btn {
      flex: 1; padding: 10px; border: 2px solid #e5e7eb; border-radius: 12px;
      background: white; color: #6b7280; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
      min-height: 48px; transition: all 0.2s;
    }
    .type-btn.active {
      border-color: #667eea; background: rgba(102,126,234,0.06); color: #667eea;
    }

    .spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid #667eea; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class CreateGroupComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly groupService = inject(GroupService);
  private readonly academyService = inject(AcademyService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  courses = signal<CourseDto[]>([]);
  saving = signal(false);
  loadingCourses = signal(false);
  errorMsg = signal<string | null>(null);
  teacherId = '';
  name = '';
  courseId = '';
  lockedCourseId = '';
  groupType = 0; // 0 = Offline, 1 = Online
  meetingLink = '';
  locationAddr = '';

  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.courseId = params.get('courseId') || '';
    if (this.courseId) this.lockedCourseId = this.courseId;
    await this.loadData();
  }

  getLockedCourseName(): string {
    const c = this.courses().find(c => c.id === this.lockedCourseId);
    return c ? `${c.nameAr || c.nameEn} (${c.code})` : this.lockedCourseId;
  }

  getSelectedCourseName(): string {
    const c = this.courses().find(c => c.id === this.courseId);
    return c ? `${c.nameAr || c.nameEn} (${c.code})` : '';
  }

  private async loadData() {
    this.loadingCourses.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.teacherId = userInfo?.actorId || '';

      const [teacherCourses, myAcademy] = await Promise.all([
        lastValueFrom(this.courseService.getCoursesForTeacher()).catch(() => [] as CourseDto[]),
        lastValueFrom(this.academyService.getMyAcademy()).catch(() => null),
      ]);

      const merged = [...(teacherCourses || [])];

      if (myAcademy?.id) {
        const academyCourses = await lastValueFrom(
          this.academyService.getAcademyCourses(myAcademy.id)
        ).catch(() => []);

        for (const ac of (academyCourses || [])) {
          if (ac.courseId && !merged.some(c => c.id === ac.courseId)) {
            merged.push({
              id: ac.courseId,
              nameAr: ac.courseNameAr || '',
              nameEn: ac.courseNameEn || '',
              code: ac.courseCode || '',
              gradeName: ac.gradeName,
            } as CourseDto);
          }
        }
      }

      this.courses.set(merged);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      this.loadingCourses.set(false);
    }
  }

  async submit() {
    if (!this.name || !this.courseId || !this.teacherId) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    try {
      await lastValueFrom(this.groupService.create({
        name: this.name,
        teacherId: this.teacherId,
        courseId: this.courseId,
        groupType: this.groupType,
        meetingLink: this.meetingLink || undefined,
        location: this.locationAddr || undefined,
      } as any));
      this.navigateBack();
    } catch (err: any) {
      console.error('Error creating group:', err);
      this.errorMsg.set('حدث خطأ أثناء إنشاء المجموعة. يرجى المحاولة مرة أخرى.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.navigateBack();
  }

  private navigateBack() {
    if (this.courseId) {
      this.router.navigate(['/teacher-groups'], { queryParams: { courseId: this.courseId } });
    } else {
      this.router.navigate(['/teacher-groups']);
    }
  }
}
