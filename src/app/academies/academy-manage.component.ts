import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { CourseService } from '@proxy/courses';
import type { CourseDto, CreateUpdateCourseDto } from '@proxy/courses/dtos/models';
import { GradeService } from '@proxy/grades';
import type { GradeDto } from '@proxy/grades/dtos/models';

@Component({
  selector: 'app-academy-manage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="manage-page" dir="rtl">
      <div class="page-header">
        <button class="btn-back" (click)="router.navigate(['/academies', academyId, 'profile'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div>
          <h1>إدارة الأكاديمية</h1>
          <p *ngIf="academy()">{{ academy()!.nameAr }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'requests'" (click)="activeTab.set('requests')">
          الطلبات
          <span class="badge" *ngIf="pendingRequests().length">{{ pendingRequests().length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'members'" (click)="activeTab.set('members')">
          الأعضاء
        </button>
        <button class="tab" [class.active]="activeTab() === 'courses'" (click)="activeTab.set('courses')">
          المقررات
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Requests Tab -->
      <div *ngIf="!loading() && activeTab() === 'requests'" class="tab-content">
        <div *ngIf="pendingRequests().length === 0" class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>لا توجد طلبات انضمام معلقة</p>
        </div>
        <div *ngFor="let req of pendingRequests()" class="member-card">
          <div class="member-avatar">{{ req.teacherName?.charAt(0) || '?' }}</div>
          <div class="member-info">
            <strong>{{ req.teacherName }}</strong>
            <small>{{ req.teacherCode }}</small>
          </div>
          <div class="member-actions">
            <button class="btn-approve" (click)="approveMember(req)" [disabled]="actionLoading()">
              <i class="fas fa-check"></i> قبول
            </button>
            <button class="btn-reject" (click)="rejectMember(req)" [disabled]="actionLoading()">
              <i class="fas fa-times"></i> رفض
            </button>
          </div>
        </div>
      </div>

      <!-- Members Tab -->
      <div *ngIf="!loading() && activeTab() === 'members'" class="tab-content">
        <div *ngIf="members().length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <p>لا يوجد أعضاء بعد</p>
        </div>
        <div *ngFor="let m of members()" class="member-card">
          <div class="member-avatar approved">{{ m.teacherName?.charAt(0) || '?' }}</div>
          <div class="member-info">
            <strong>{{ m.teacherName }}</strong>
            <small>{{ m.teacherCode }}</small>
          </div>
          <span class="badge-approved"><i class="fas fa-check-circle me-1"></i> عضو</span>
        </div>
      </div>

      <!-- Courses Tab -->
      <div *ngIf="!loading() && activeTab() === 'courses'" class="tab-content">
        <!-- Current courses -->
        <div *ngIf="academyCourses().length === 0" class="empty-state">
          <i class="fas fa-book-open"></i>
          <p>لا توجد مقررات مضافة بعد</p>
        </div>
        <div *ngFor="let c of academyCourses()" class="course-card">
          <div class="course-icon"><i class="fas fa-book-open"></i></div>
          <div class="course-info">
            <strong>{{ c.nameAr }}</strong>
            <small>{{ c.code }}</small>
          </div>
          <button class="btn-remove" (click)="removeCourse(c)" title="إزالة من الأكاديمية">
            <i class="fas fa-unlink"></i>
          </button>
        </div>

        <!-- Add existing course -->
        <div class="add-section">
          <h4><i class="fas fa-link me-1"></i> إضافة مقرر موجود</h4>
          <div class="add-existing-row">
            <select [(ngModel)]="selectedCourseId" class="form-select">
              <option value="">اختر مقرراً...</option>
              <option *ngFor="let c of availableCourses()" [value]="c.id">{{ c.nameAr }} ({{ c.code }})</option>
            </select>
            <button class="btn-add" (click)="addExistingCourse()" [disabled]="!selectedCourseId || actionLoading()">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <!-- Create new course inline -->
        <div class="add-section">
          <h4><i class="fas fa-plus-circle me-1"></i> إنشاء مقرر جديد للأكاديمية</h4>
          <div class="form-group">
            <label>اسم المقرر بالعربية *</label>
            <input type="text" [(ngModel)]="newCourse.nameAr" class="form-input" placeholder="اسم المقرر" />
          </div>
          <div class="form-group">
            <label>Course Name in English *</label>
            <input type="text" [(ngModel)]="newCourse.nameEn" class="form-input" placeholder="Course name" dir="ltr" />
          </div>
          <div class="form-group">
            <label>الصف الدراسي *</label>
            <select [(ngModel)]="newCourse.gradeId" class="form-select">
              <option value="">اختر الصف...</option>
              <option *ngFor="let g of grades()" [value]="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div *ngIf="courseError()" class="error-msg">{{ courseError() }}</div>
          <button class="btn-create-course" (click)="createCourse()" [disabled]="creatingCourse()">
            <span *ngIf="!creatingCourse()"><i class="fas fa-plus me-1"></i> إنشاء المقرر</span>
            <span *ngIf="creatingCourse()">جاري الإنشاء...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manage-page { padding: 16px; max-width: 700px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .btn-back {
      background: #f5f5f5; border: none; border-radius: 50%;
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #555;
    }
    .page-header h1 { font-size: 20px; font-weight: 700; margin: 0; color: #333; }
    .page-header p { font-size: 13px; color: #888; margin: 0; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; background: #f5f5f5; border-radius: 12px; padding: 4px; }
    .tab {
      flex: 1; padding: 10px; border: none; background: transparent;
      border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; color: #666;
      position: relative;
    }
    .tab.active { background: #fff; color: #764ba2; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .badge {
      position: absolute; top: 4px; right: 8px;
      background: #e74c3c; color: #fff; border-radius: 50%;
      width: 18px; height: 18px; font-size: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .tab-content { display: flex; flex-direction: column; gap: 12px; }
    .empty-state { text-align: center; color: #999; padding: 40px; }
    .empty-state i { font-size: 40px; margin-bottom: 10px; display: block; }
    .member-card {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border-radius: 12px; padding: 14px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .member-avatar {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .member-avatar.approved { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .member-info { flex: 1; }
    .member-info strong { display: block; font-size: 14px; color: #333; }
    .member-info small { font-size: 12px; color: #888; }
    .member-actions { display: flex; gap: 8px; }
    .btn-approve, .btn-reject {
      padding: 6px 12px; border: none; border-radius: 7px;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .btn-approve { background: #e8f5e9; color: #27ae60; }
    .btn-reject { background: #fdecea; color: #c0392b; }
    .badge-approved { font-size: 12px; color: #27ae60; font-weight: 600; }
    .course-card {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border-radius: 12px; padding: 12px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .course-icon {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 16px; flex-shrink: 0;
    }
    .course-info { flex: 1; }
    .course-info strong { display: block; font-size: 14px; color: #333; }
    .course-info small { font-size: 12px; color: #888; }
    .btn-remove {
      background: #fdecea; color: #c0392b; border: none;
      border-radius: 7px; padding: 7px 10px; cursor: pointer; font-size: 13px;
    }
    .add-section {
      background: #fff; border-radius: 12px; padding: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06); margin-top: 8px;
    }
    .add-section h4 { font-size: 14px; font-weight: 700; color: #444; margin: 0 0 12px; }
    .add-existing-row { display: flex; gap: 8px; }
    .form-select, .form-input {
      flex: 1; width: 100%;
      padding: 10px 12px; border: 1px solid #e0e0e0;
      border-radius: 8px; font-size: 13px; direction: rtl;
      box-sizing: border-box;
    }
    .form-select:focus, .form-input:focus { outline: none; border-color: #764ba2; }
    .btn-add {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff; border: none; border-radius: 8px;
      padding: 10px 16px; cursor: pointer; font-size: 14px;
    }
    .form-group { margin-bottom: 12px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }
    .error-msg { color: #c0392b; font-size: 13px; margin-bottom: 10px; }
    .btn-create-course {
      width: 100%; padding: 11px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 700; cursor: pointer;
    }
    .btn-create-course:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class AcademyManageComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly academyService = inject(AcademyService);
  private readonly courseService = inject(CourseService);
  private readonly gradeService = inject(GradeService);

  academyId = '';
  loading = signal(true);
  actionLoading = signal(false);
  activeTab = signal<'requests' | 'members' | 'courses'>('requests');

  academy = signal<AcademyDto | null>(null);
  pendingRequests = signal<AcademyMemberDto[]>([]);
  members = signal<AcademyMemberDto[]>([]);
  academyCourses = signal<CourseDto[]>([]);
  availableCourses = signal<CourseDto[]>([]);
  grades = signal<GradeDto[]>([]);

  selectedCourseId = '';
  creatingCourse = signal(false);
  courseError = signal<string | null>(null);
  newCourse: CreateUpdateCourseDto = { nameAr: '', nameEn: '', gradeId: '' as any };

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('id') || '';
    try {
      const [academyData, requests, membersData, courses, allCourses, gradesData] = await Promise.all([
        lastValueFrom(this.academyService.get(this.academyId)),
        lastValueFrom(this.academyService.getPendingRequests(this.academyId)).catch(() => []),
        lastValueFrom(this.academyService.getMembers(this.academyId)).catch(() => []),
        lastValueFrom(this.academyService.getAcademyCourses(this.academyId)).catch(() => []),
        lastValueFrom(this.courseService.getList({ maxResultCount: 200, skipCount: 0, sorting: '' })).catch(() => null),
        lastValueFrom(this.gradeService.getList()).catch(() => []),
      ]);
      this.academy.set(academyData);
      this.pendingRequests.set(requests || []);
      this.members.set(membersData || []);
      this.academyCourses.set(courses || []);
      this.grades.set((gradesData as any)?.items || gradesData || []);

      // Available = not already in academy
      const academyCourseIds = new Set((courses || []).map((c: CourseDto) => c.id));
      const all = allCourses?.items || [];
      this.availableCourses.set(all.filter((c: CourseDto) => !academyCourseIds.has(c.id)));
    } catch (err) {
      console.error('Error loading manage page:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async approveMember(req: AcademyMemberDto): Promise<void> {
    if (!req.teacherId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.approveMember(this.academyId, req.teacherId));
      this.pendingRequests.update(list => list.filter(r => r.teacherId !== req.teacherId));
      this.members.update(list => [...list, { ...req }]);
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async rejectMember(req: AcademyMemberDto): Promise<void> {
    if (!req.teacherId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.rejectMember(this.academyId, req.teacherId));
      this.pendingRequests.update(list => list.filter(r => r.teacherId !== req.teacherId));
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async addExistingCourse(): Promise<void> {
    if (!this.selectedCourseId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.addCourseToAcademy(this.academyId, this.selectedCourseId));
      const course = this.availableCourses().find(c => c.id === this.selectedCourseId);
      if (course) {
        this.academyCourses.update(list => [...list, course]);
        this.availableCourses.update(list => list.filter(c => c.id !== this.selectedCourseId));
      }
      this.selectedCourseId = '';
    } catch (err) {
      console.error('Add course error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async removeCourse(course: CourseDto): Promise<void> {
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.removeCourseFromAcademy(course.id!));
      this.academyCourses.update(list => list.filter(c => c.id !== course.id));
      this.availableCourses.update(list => [...list, course]);
    } catch (err) {
      console.error('Remove course error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async createCourse(): Promise<void> {
    if (!this.newCourse.nameAr?.trim() || !this.newCourse.nameEn?.trim() || !this.newCourse.gradeId) {
      this.courseError.set('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    this.creatingCourse.set(true);
    this.courseError.set(null);
    try {
      const created = await lastValueFrom(
        this.academyService.createCourseForAcademy(this.academyId, this.newCourse)
      );
      this.academyCourses.update(list => [...list, created]);
      this.newCourse = { nameAr: '', nameEn: '', gradeId: '' as any };
    } catch (err: any) {
      const msg = err?.error?.error?.message || 'حدث خطأ أثناء إنشاء المقرر.';
      this.courseError.set(msg);
    } finally {
      this.creatingCourse.set(false);
    }
  }
}
