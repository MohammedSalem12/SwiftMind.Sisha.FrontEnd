import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { GroupService } from '@proxy/groups';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="form-card">
        <div class="card-header-section">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div>
            <h2>إنشاء مجموعة جديدة</h2>
            <p class="subtitle">أضف مجموعة جديدة لأحد المقررات المسندة إليك</p>
          </div>
        </div>

        <form class="card-body-section" (ngSubmit)="submit()">
          <div class="field">
            <label>اسم المجموعة <span class="required">*</span></label>
            <input
              name="name"
              [(ngModel)]="name"
              required
              placeholder="مثال: مجموعة أ - رياضيات" />
          </div>

          <div class="field">
            <label>المقرر الدراسي <span class="required">*</span></label>
            <select name="courseId" [(ngModel)]="courseId" required>
              <option value="">-- اختر المقرر --</option>
              <option *ngFor="let c of courses()" [value]="c.id">
                {{ c.nameAr }} ({{ c.code }})
              </option>
            </select>
          </div>

          <div *ngIf="errorMsg()" class="error-msg">
            <i class="fas fa-exclamation-circle me-1"></i>
            {{ errorMsg() }}
          </div>

          <div class="actions">
            <button class="btn-primary" type="submit" [disabled]="saving() || !name || !courseId">
              <i class="fas fa-plus me-1"></i>
              {{ saving() ? 'جاري الحفظ...' : 'إنشاء المجموعة' }}
            </button>
            <button type="button" class="btn-outline" (click)="goBack()">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; justify-content: center; padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .form-card { width: 100%; max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .card-header-section { padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; gap: 1rem; }
    .card-header-section h2 { margin: 0; font-size: 1.5rem; }
    .card-header-section .subtitle { margin: 0.25rem 0 0; opacity: 0.85; font-size: 0.9rem; }
    .btn-back { background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 1.1rem; }
    .card-body-section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .field { display: flex; flex-direction: column; }
    .field label { font-weight: 600; margin-bottom: 0.5rem; color: #333; }
    .field .required { color: #dc3545; }
    .field input, .field select { padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 1rem; }
    .field input:focus, .field select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
    .error-msg { color: #dc3545; background: #fff5f5; padding: 0.75rem; border-radius: 8px; border: 1px solid #ffe0e0; }
    .actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1px solid #ccc; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; }
  `],
})
export class CreateGroupComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly groupService = inject(GroupService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  courses = signal<CourseDto[]>([]);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  teacherId = '';
  name = '';
  courseId = '';

  async ngOnInit() {
    // Pre-select course from query params if provided
    const params = this.route.snapshot.queryParamMap;
    this.courseId = params.get('courseId') || '';
    await this.loadData();
  }

  private async loadData() {
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.teacherId = userInfo?.actorId || '';

      // Load teacher's enrolled courses
      const courses = await lastValueFrom(this.courseService.getCoursesForTeacher());
      this.courses.set(courses || []);
    } catch (err) {
      console.error('Error loading data:', err);
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
      }));
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
