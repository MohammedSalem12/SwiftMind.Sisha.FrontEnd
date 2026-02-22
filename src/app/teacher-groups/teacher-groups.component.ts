import { AuthService, ConfigStateService } from '@abp/ng.core';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="teacher-groups">
      <!-- Modern Header with Gradient Background -->
      <div class="header-wrapper mb-4">
        <div class="header-content">
          <div class="header-title-section">
            <div class="icon-wrapper">
              <i class="fas fa-users-cog"></i>
            </div>
            <div>
              <h1 class="main-title mb-1">مجموعاتي التدريسية</h1>
              <p class="subtitle mb-0">
                <i class="fas fa-chalkboard-teacher me-1"></i>
                <span *ngIf="courseName()">مجموعات مقرر: {{ courseName() }}</span>
                <span *ngIf="!courseName()">إدارة وتنظيم المجموعات المخصصة لك</span>
              </p>
              <a *ngIf="courseId()" class="show-all-link" (click)="clearFilter()">
                <i class="fas fa-th-list me-1"></i>
                عرض جميع المجموعات
              </a>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-create-group" [routerLink]="['create']" [queryParams]="courseId() ? { courseId: courseId() } : {}">
              <i class="fas fa-plus me-2"></i>
              إنشاء مجموعة
            </button>
          </div>
          <div class="teacher-info-card" *ngIf="teacherName()">
            <div class="teacher-avatar">
              <i class="fas fa-user-tie"></i>
            </div>
            <div class="teacher-details">
              <div class="teacher-name">{{ teacherName() }}</div>
              <div class="teacher-code" *ngIf="teacherCode()">
                <i class="fas fa-id-badge me-1"></i>
                {{ teacherCode() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading()" class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جارٍ التحميل...</span>
          </div>
          <div class="loading-text">
            <i class="fas fa-sync fa-spin me-2"></i>
            جارٍ تحميل المجموعات...
          </div>
        </div>
      </div>

      <div *ngIf="error()" class="alert alert-danger modern-alert" role="alert">
        <div class="d-flex align-items-center">
          <i class="fas fa-exclamation-circle fa-2x me-3"></i>
          <div>
            <strong>خطأ!</strong>
            <p class="mb-0 mt-1">{{ error() }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="!loading() && !error() && groups().length === 0" class="empty-state">
        <div class="empty-animation">
          <div class="empty-icon-wrapper">
            <i class="fas fa-users fa-5x"></i>
            <div class="empty-icon-shadow"></div>
          </div>
        </div>
        <h3 class="empty-title">لا توجد مجموعات حالياً</h3>
        <p class="empty-description">
          لم يتم تخصيص أي مجموعات لك حتى الآن.<br>
          ستظهر المجموعات هنا عند إضافتها من قبل الإدارة.
        </p>
        <button class="btn btn-primary btn-lg mt-3" (click)="loadTeacherGroups()">
          <i class="fas fa-sync me-2"></i>
          تحديث القائمة
        </button>
      </div>

      <div class="groups-grid" *ngIf="!loading() && !error() && groups().length > 0">
        <div *ngFor="let group of groups(); let idx = index" class="group-card" 
             [style.animation-delay.ms]="idx * 100">
          <div class="card h-100 modern-card">
            <div class="card-header-modern">
              <div class="card-header-content">
                <div class="group-icon">
                  <i class="fas fa-user-friends"></i>
                </div>
                <div class="group-header-info">
                  <h5 class="group-title mb-1">
                    {{ group.name }}
                  </h5>
                  <span class="group-code-badge">
                    <i class="fas fa-hashtag me-1"></i>
                    {{ group.groupCode }}
                  </span>
                </div>
              </div>
              <div class="header-decoration"></div>
            </div>
            
            <div class="card-body">
              <div class="course-section mb-3">
                <div class="section-label">
                  <i class="fas fa-book-open me-2"></i>
                  المقرر الدراسي
                </div>
                <div class="course-name">{{ group.courseName }}</div>
              </div>

              <div class="schedules-section" *ngIf="group.schedules && group.schedules.length > 0">
                <div class="section-label mb-2">
                  <i class="fas fa-calendar-week me-2"></i>
                  الجدول الأسبوعي
                </div>
                <div class="schedules-list">
                  <div *ngFor="let schedule of group.schedules" class="schedule-card">
                    <div class="schedule-main">
                      <div class="schedule-day">
                        <i class="fas fa-calendar-day me-1"></i>
                        {{ getDayName(schedule.dayOfWeek) }}
                      </div>
                      <div class="schedule-details">
                        <div class="schedule-time">
                          <i class="far fa-clock me-1"></i>
                          {{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}
                        </div>
                        <div class="schedule-location" *ngIf="schedule.location">
                          <i class="fas fa-map-marker-alt me-1"></i>
                          {{ schedule.location }}
                        </div>
                      </div>
                    </div>
                    <div class="schedule-actions">
                      <button class="btn-icon btn-icon-edit" [routerLink]="['edit-schedule', schedule.id]" [queryParams]="{groupId: group.groupId}" title="تعديل">
                        <i class="fas fa-pen"></i>
                      </button>
                      <button class="btn-icon btn-icon-delete" (click)="deleteSchedule(schedule.id!, group)" title="حذف">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="!group.schedules || group.schedules.length === 0" class="no-schedule-message">
                <i class="fas fa-calendar-times me-2"></i>
                لم يتم تحديد جدول زمني بعد
              </div>

              <button class="btn-add-schedule" [routerLink]="['add-schedule', group.groupId]">
                <i class="fas fa-plus me-1"></i>
                إضافة موعد
              </button>
            </div>

            <div class="card-footer-modern">
              <button class="action-btn btn-view" (click)="takeAttendance(group)">
                <i class="fas fa-clipboard-check me-1"></i>
                <span>الحضور</span>
              </button>
              <button class="action-btn btn-edit" [routerLink]="['edit', group.groupId]">
                <i class="fas fa-edit me-1"></i>
                <span>تعديل</span>
              </button>
              <button class="action-btn btn-delete" (click)="deleteGroup(group)">
                <i class="fas fa-trash me-1"></i>
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="refresh-section" *ngIf="!loading() && groups().length > 0">
        <button class="btn btn-outline-primary btn-refresh" (click)="loadTeacherGroups()">
          <i class="fas fa-sync-alt me-2"></i>
          تحديث البيانات
        </button>
        <div class="groups-count">
          <i class="fas fa-layer-group me-2"></i>
          عدد المجموعات: <strong>{{ groups().length }}</strong>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teacher-groups { padding: 2rem; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; }
    .show-all-link { display: inline-block; margin-top: 0.5rem; color: rgba(255,255,255,0.95); cursor: pointer; font-size: 0.85rem; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
    .show-all-link:hover { color: white; }
    .header-wrapper { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 40px rgba(102,126,234,0.3); position: relative; overflow: hidden; }
    .header-content { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .header-title-section { display: flex; align-items: center; gap: 1rem; color: white; }
    .icon-wrapper { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
    .main-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.9); font-size: 0.9rem; }
    .teacher-info-card { background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; border: 1px solid rgba(255,255,255,0.2); }
    .teacher-avatar { width: 44px; height: 44px; background: white; color: #667eea; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
    .teacher-details { color: white; }
    .teacher-name { font-weight: 600; font-size: 1rem; }
    .teacher-code { font-size: 0.8rem; opacity: 0.9; }
    .header-actions { display: flex; align-items: center; }
    .btn-create-group { background: white; color: #667eea; border: none; padding: 0.6rem 1.2rem; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 300px; }
    .loading-spinner { text-align: center; }
    .loading-text { color: #667eea; font-weight: 500; margin-top: 1rem; }
    .modern-alert { border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(220,53,69,0.2); }
    .empty-state { text-align: center; padding: 3rem 2rem; background: white; border-radius: 16px; }
    .empty-animation { margin-bottom: 1.5rem; }
    .empty-icon-wrapper { display: inline-block; }
    .empty-icon-wrapper i { color: #e0e0e0; }
    .empty-icon-shadow { display: none; }
    .empty-title { color: #333; font-weight: 600; }
    .empty-description { color: #666; line-height: 1.6; }
    .groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .group-card { opacity: 1; }
    .modern-card { border: none; border-radius: 16px; overflow: hidden; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
    .modern-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(102,126,234,0.15); }
    .card-header-modern { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.25rem; position: relative; }
    .header-decoration { display: none; }
    .card-header-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 0.75rem; }
    .group-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: white; }
    .group-header-info { flex: 1; color: white; }
    .group-title { margin: 0; font-weight: 700; font-size: 1.2rem; }
    .group-code-badge { display: inline-block; background: rgba(255,255,255,0.25); padding: 0.2rem 0.6rem; border-radius: 16px; font-size: 0.8rem; font-weight: 600; }
    .card-body { padding: 1.25rem; }
    .section-label { color: #667eea; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    .course-section { padding: 0.75rem; background: #f5f7fa; border-radius: 10px; border-left: 4px solid #667eea; }
    .course-name { color: #333; font-weight: 600; }
    .schedules-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .schedule-card { background: #f8f9fa; border-radius: 10px; padding: 0.75rem; border-left: 3px solid #28a745; display: flex; justify-content: space-between; align-items: center; }
    .schedule-main { flex: 1; }
    .schedule-day { font-weight: 700; color: #28a745; margin-bottom: 0.25rem; }
    .schedule-details { display: flex; flex-direction: column; gap: 0.2rem; }
    .schedule-time { color: #555; font-family: monospace; font-weight: 600; font-size: 0.9rem; }
    .schedule-location { color: #777; font-size: 0.85rem; }
    .schedule-actions { display: flex; gap: 0.25rem; }
    .btn-icon { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
    .btn-icon-edit { background: #fff3cd; color: #856404; }
    .btn-icon-edit:hover { background: #ffc107; color: white; }
    .btn-icon-delete { background: #f8d7da; color: #721c24; }
    .btn-icon-delete:hover { background: #dc3545; color: white; }
    .no-schedule-message { text-align: center; padding: 1.5rem; color: #999; font-style: italic; background: #f8f9fa; border-radius: 10px; border: 2px dashed #dee2e6; }
    .btn-add-schedule { width: 100%; padding: 0.5rem; background: #f0fff4; border: 2px dashed #28a745; border-radius: 8px; color: #28a745; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
    .btn-add-schedule:hover { background: #d4edda; }
    .card-footer-modern { padding: 1rem; background: #f8f9fa; border-top: 1px solid #e9ecef; display: flex; gap: 0.5rem; }
    .action-btn { flex: 1; padding: 0.6rem; border: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem; }
    .btn-view { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
    .btn-edit { background: linear-gradient(135deg, #ffc107, #e0a800); color: #333; }
    .btn-delete { background: linear-gradient(135deg, #dc3545, #c82333); color: white; }
    .refresh-section { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: 12px; margin-top: 1.5rem; }
    .btn-refresh { border-radius: 8px; padding: 0.6rem 1.2rem; font-weight: 600; }
    .groups-count { color: #667eea; font-weight: 500; }
    @media (max-width: 768px) {
      .teacher-groups { padding: 1rem; }
      .header-content { flex-direction: column; }
      .groups-grid { grid-template-columns: 1fr; }
      .card-footer-modern { flex-direction: column; }
      .refresh-section { flex-direction: column; gap: 0.75rem; }
      .main-title { font-size: 1.3rem; }
    }
  `],
})
export class TeacherGroupsComponent implements OnInit {
  private authService = inject(AuthService);
  private configStateService = inject(ConfigStateService);
  private currentUserService = inject(CurrentUserInfoService);
  private groupService = inject(GroupService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Component state
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  groups = signal<GroupWithSchedulesDto[]>([]);

  // Teacher info
  teacherName = signal<string | null>(null);
  teacherCode = signal<string | null>(null);
  teacherId = signal<string | null>(null);

  // Filter by course
  courseId = signal<string | null>(null);
  courseName = signal<string | null>(null);

  // Day names in Arabic
  private dayNames = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  ngOnInit() {
    // Read courseId from query params
    this.route.queryParams.subscribe(params => {
      this.courseId.set(params['courseId'] || null);
    });
    this.loadCurrentUserAndGroups();
  }

  private async loadCurrentUserAndGroups() {
    if (!this.authService.isAuthenticated) {
      this.error.set('يجب تسجيل الدخول للوصول إلى هذه الصفحة');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      // Get current user actor info to get teacher ID
      const currentUserActor = await this.currentUserService.getCurrentUserActorInfo().toPromise();

      if (!currentUserActor) {
        throw new Error('لا يمكن الحصول على معلومات المستخدم الحالي');
      }

      // Check if user is a teacher
      const isTeacher = currentUserActor.userRoles?.some(role => role.toLowerCase() === 'teacher') ||
        currentUserActor.actorType?.toLowerCase() === 'teacher';

      if (!isTeacher) {
        this.error.set('هذه الصفحة متاحة للمعلمين فقط');
        return;
      }

      // Set teacher info
      this.teacherId.set(currentUserActor.actorId || null);
      this.teacherName.set(currentUserActor.actorName || null);
      this.teacherCode.set(currentUserActor.actorCode || null);

      if (!currentUserActor.actorId) {
        throw new Error('لا يمكن تحديد معرف المعلم');
      }

      // Load teacher groups
      await this.loadTeacherGroups();

    } catch (error: any) {
      console.error('Error loading teacher groups:', error);
      this.error.set(error.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTeacherGroups() {
    const teacherId = this.teacherId();
    if (!teacherId) {
      this.error.set('معرف المعلم غير متوفر');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const filterCourseId = this.courseId();

      // If a specific courseId is provided, load only that course's groups
      if (filterCourseId) {
        try {
          const groupsWithSchedules = await lastValueFrom(
            this.groupService.getGroupsForTeacherAndCourse(teacherId, filterCourseId)
          );
          this.groups.set(groupsWithSchedules || []);
          // Set course name from the first group's data
          if (groupsWithSchedules?.length > 0) {
            this.courseName.set(groupsWithSchedules[0].courseName || null);
          }
        } catch {
          // Fallback: load all then filter client-side
          const allGroups = await lastValueFrom(this.groupService.getList());
          if (allGroups?.items) {
            const filtered = allGroups.items
              .filter(g => g.courseId === filterCourseId)
              .map(g => ({
                groupId: g.id,
                name: g.name,
                teacherId: g.teacherId,
                teacherName: g.teacherName,
                groupCode: g.groupCode,
                courseId: g.courseId,
                courseName: g.courseName,
                schedules: [],
              }));
            this.groups.set(filtered);
            if (filtered.length > 0) {
              this.courseName.set(filtered[0].courseName || null);
            }
          } else {
            this.groups.set([]);
          }
        }
        return;
      }

      // No filter — load all groups
      const allGroups = await lastValueFrom(this.groupService.getList());

      if (allGroups?.items && allGroups.items.length > 0) {
        const courseIds = [...new Set(allGroups.items.map(g => g.courseId).filter(Boolean))] as string[];

        const allGroupsWithSchedules: GroupWithSchedulesDto[] = [];
        for (const courseId of courseIds) {
          try {
            const groupsWithSchedules = await lastValueFrom(
              this.groupService.getGroupsForTeacherAndCourse(teacherId, courseId)
            );
            allGroupsWithSchedules.push(...groupsWithSchedules);
          } catch {
            const basicGroups = allGroups.items
              .filter(g => g.courseId === courseId)
              .map(g => ({
                groupId: g.id,
                name: g.name,
                teacherId: g.teacherId,
                teacherName: g.teacherName,
                groupCode: g.groupCode,
                courseId: g.courseId,
                courseName: g.courseName,
                schedules: [],
              }));
            allGroupsWithSchedules.push(...basicGroups);
          }
        }

        this.groups.set(allGroupsWithSchedules);
      } else {
        this.groups.set([]);
      }
    } catch (error: any) {
      console.error('Error loading teacher groups:', error);
      this.error.set('حدث خطأ أثناء تحميل المجموعات');
      this.groups.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getDayName(dayOfWeek: number): string {
    return this.dayNames[dayOfWeek] || `يوم ${dayOfWeek}`;
  }

  formatTime(time?: string): string {
    if (!time) return '';

    try {
      // Assuming time is in HH:mm format
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const min = minutes || '00';

      if (hour === 0) return `12:${min} ص`;
      if (hour < 12) return `${hour}:${min} ص`;
      if (hour === 12) return `12:${min} م`;
      return `${hour - 12}:${min} م`;
    } catch {
      return time;
    }
  }

  async deleteGroup(group: GroupWithSchedulesDto) {
    if (!confirm(`هل تريد حذف المجموعة "${group.name}"؟ سيتم حذف جميع المواعيد المرتبطة.`)) {
      return;
    }
    try {
      await lastValueFrom(this.groupService.delete(group.groupId!));
      await this.loadTeacherGroups();
    } catch (err) {
      console.error('Error deleting group:', err);
      this.error.set('حدث خطأ أثناء حذف المجموعة');
    }
  }

  async deleteSchedule(scheduleId: string, group: GroupWithSchedulesDto) {
    if (!confirm('هل تريد حذف هذا الموعد؟')) {
      return;
    }
    try {
      await lastValueFrom(this.groupService.deleteSchedule(scheduleId));
      // Remove from local state
      this.groups.update(groups =>
        groups.map(g =>
          g.groupId === group.groupId
            ? { ...g, schedules: g.schedules.filter(s => s.id !== scheduleId) }
            : g
        )
      );
    } catch (err) {
      console.error('Error deleting schedule:', err);
      this.error.set('حدث خطأ أثناء حذف الموعد');
    }
  }

  clearFilter() {
    this.courseId.set(null);
    this.courseName.set(null);
    this.router.navigate(['/teacher-groups']);
    this.loadTeacherGroups();
  }

  takeAttendance(group: GroupWithSchedulesDto) {
    // Navigate to attendance page for this group
    this.router.navigate(['/attendance'], {
      queryParams: {
        groupId: group.groupId,
        courseName: group.courseName,
        groupName: group.name
      }
    });
  }

  viewStudents(group: GroupWithSchedulesDto) {
    // Navigate to students page filtered by this group
    this.router.navigate(['/students'], {
      queryParams: {
        groupId: group.groupId,
        filter: 'group'
      }
    });
  }
}