import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { CurrentUserInfoService } from '@proxy/common';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="teacher-groups">
      <div class="header mb-4">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h2 class="mb-1">مجموعاتي</h2>
            <p class="text-muted mb-0">المجموعات المخصصة لي كمعلم</p>
          </div>
          <div class="teacher-info" *ngIf="teacherName()">
            <div class="text-end">
              <div class="fw-bold">{{ teacherName() }}</div>
              <small class="text-muted">{{ teacherCode() ? 'كود المعلم: ' + teacherCode() : '' }}</small>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">جارٍ التحميل...</span>
        </div>
        <p class="mt-2 text-muted">جارٍ تحميل المجموعات...</p>
      </div>

      <div *ngIf="error()" class="alert alert-danger" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error() }}
      </div>

      <div *ngIf="!loading() && !error() && groups().length === 0" class="empty-state text-center py-5">
        <div class="empty-illustration mb-3">
          <i class="fas fa-users fa-4x text-muted"></i>
        </div>
        <h4>لا توجد مجموعات</h4>
        <p class="text-muted">لم يتم تخصيص أي مجموعات لك حتى الآن.</p>
      </div>

      <div class="groups-grid" *ngIf="!loading() && !error() && groups().length > 0">
        <div *ngFor="let group of groups()" class="group-card">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-header bg-primary text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">
                  <i class="fas fa-users me-2"></i>
                  {{ group.name }}
                </h5>
                <span class="badge bg-light text-primary">{{ group.groupCode }}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="course-info mb-3">
                <h6 class="text-primary mb-1">
                  <i class="fas fa-book me-1"></i>
                  {{ group.courseName }}
                </h6>
                <small class="text-muted">{{ group.courseId }}</small>
              </div>

              <div class="schedules-section" *ngIf="group.schedules && group.schedules.length > 0">
                <h6 class="mb-2">
                  <i class="fas fa-calendar-alt me-1"></i>
                  الجدول الزمني
                </h6>
                <div class="schedules-list">
                  <div *ngFor="let schedule of group.schedules" class="schedule-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="fw-bold">{{ getDayName(schedule.dayOfWeek) }}</span>
                        <div class="time-range text-muted small">
                          {{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}
                        </div>
                      </div>
                      <div class="location text-muted small" *ngIf="schedule.location">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        {{ schedule.location }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="!group.schedules || group.schedules.length === 0" class="no-schedule text-muted text-center py-2">
                <i class="fas fa-calendar-times me-1"></i>
                لا يوجد جدول زمني محدد
              </div>
            </div>
            <div class="card-footer bg-light">
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" (click)="viewGroupDetails(group)">
                  <i class="fas fa-eye me-1"></i>
                  التفاصيل
                </button>
                <button class="btn btn-sm btn-outline-success" (click)="takeAttendance(group)">
                  <i class="fas fa-user-check me-1"></i>
                  الحضور
                </button>
                <button class="btn btn-sm btn-outline-info" (click)="viewStudents(group)">
                  <i class="fas fa-users me-1"></i>
                  الطلاب
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="refresh-section text-center mt-4" *ngIf="!loading()">
        <button class="btn btn-outline-secondary" (click)="loadTeacherGroups()">
          <i class="fas fa-sync-alt me-1"></i>
          تحديث
        </button>
      </div>
    </div>
  `,
  styles: [`
    .teacher-groups {
      padding: 1rem;
    }

    .header {
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 1rem;
    }

    .teacher-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      min-width: 200px;
    }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .group-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .group-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
    }

    .card-header {
      border-bottom: none;
    }

    .schedule-item {
      padding: 0.5rem;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      background: #f8f9fa;
    }

    .schedule-item:last-child {
      margin-bottom: 0;
    }

    .time-range {
      font-family: 'Courier New', monospace;
    }

    .empty-state {
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px dashed #dee2e6;
    }

    .empty-illustration {
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .groups-grid {
        grid-template-columns: 1fr;
      }
      
      .header .d-flex {
        flex-direction: column;
        gap: 1rem;
      }
      
      .teacher-info {
        align-self: stretch;
        text-align: center;
      }
    }
  `],
})
export class TeacherGroupsComponent implements OnInit {
  private authService = inject(AuthService);
  private configStateService = inject(ConfigStateService);
  private currentUserService = inject(CurrentUserInfoService);
  private groupService = inject(GroupService);
  private router = inject(Router);

  // Component state
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  groups = signal<GroupWithSchedulesDto[]>([]);
  
  // Teacher info
  teacherName = signal<string | null>(null);
  teacherCode = signal<string | null>(null);
  teacherId = signal<string | null>(null);

  // Day names in Arabic
  private dayNames = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  ngOnInit() {
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
      // For now, we'll get all groups and filter by teacher ID
      // In the future, we can add a specific API endpoint for teacher groups
      const allGroups = await this.groupService.getList().toPromise();
      
      if (allGroups?.items) {
        // Filter groups that belong to this teacher
        const teacherGroups: GroupWithSchedulesDto[] = allGroups.items
          .filter(group => group.teacherId === teacherId)
          .map(group => ({
            groupId: group.id,
            name: group.name,
            teacherId: group.teacherId,
            teacherName: group.teacherName,
            groupCode: group.groupCode,
            courseId: group.courseId,
            courseName: group.courseName,
            schedules: [] // We'll need to load schedules separately if needed
          }));

        this.groups.set(teacherGroups);
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

  viewGroupDetails(group: GroupWithSchedulesDto) {
    // Navigate to group details page
    this.router.navigate(['/groups', group.groupId]);
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