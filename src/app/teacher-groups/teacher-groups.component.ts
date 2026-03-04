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
    <div class="teacher-groups modern-bg">
      <!-- Sparkling animated header -->
      <div class="header-wrapper fancy-header mb-4">
        <svg class="header-blob" viewBox="0 0 600 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stop-color="#667eea" />
              <stop offset="100%" stop-color="#764ba2" />
            </linearGradient>
          </defs>
          <path d="M0,100 C150,200 350,0 600,100 L600,200 L0,200 Z" fill="url(#g1)" opacity="0.95"></path>
        </svg>

        <div class="header-content">
          <div class="header-left">
            <div class="icon-wrapper glow">
              <i class="fas fa-users-cog"></i>
            </div>
            <div class="title-block">
              <h1 class="main-title">مجموعاتي التدريسية</h1>
              <p class="subtitle">
                <i class="fas fa-chalkboard-teacher me-1"></i>
                <span *ngIf="courseName()">مجموعات مقرر: {{ courseName() }}</span>
                <span *ngIf="!courseName()">إدارة وتنظيم المجموعات — واجهة جديدة وجذابة</span>
              </p>
              <div class="header-chips">
                <span *ngIf="courseId()" class="chip" (click)="clearFilter()"><i class="fas fa-th-list me-1"></i>عرض جميع المجموعات</span>
                <span class="chip count-chip"><i class="fas fa-layer-group me-1"></i><strong class="count-number">{{ groups().length }}</strong> مجموعات</span>
              </div>
            </div>
          </div>

          <div class="header-right">
            <button class="btn-create-group btn-fancy" [routerLink]="['create']" [queryParams]="courseId() ? { courseId: courseId() } : {}">
              <i class="fas fa-plus me-2"></i>
              إنشاء مجموعة جديدة
            </button>
            <div class="teacher-card" *ngIf="teacherName()">
              <div class="teacher-avatar">{{ teacherName()?.charAt(0) }}</div>
              <div class="teacher-meta">
                <div class="teacher-name">{{ teacherName() }}</div>
                <div class="teacher-code">{{ teacherCode() }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading / Error / Empty states -->
      <div *ngIf="loading()" class="loading-container fancy-loading">
        <div class="dot-spinner">
          <div></div><div></div><div></div>
        </div>
        <div class="loading-text">جارٍ تحميل المجموعات...</div>
      </div>

      <div *ngIf="error()" class="alert alert-danger modern-alert" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error() }}
      </div>

      <div *ngIf="!loading() && !error() && groups().length === 0" class="empty-state fancy-empty">
        <div class="sparkle">
          <i class="fas fa-users fa-4x"></i>
        </div>
        <h3>لا توجد مجموعات بعد</h3>
        <p>ابدأ بإنشاء مجموعة وتابع جدول الحصص بسهولة.</p>
        <button class="btn btn-primary" [routerLink]="['create']">إنشاء أول مجموعة</button>
      </div>

      <!-- Groups grid -->
      <div class="groups-grid" *ngIf="!loading() && !error() && groups().length > 0">
        <div *ngFor="let group of groups(); let idx = index" class="group-card fancy-card" [style.animationDelay]="(idx * 80) + 'ms'">
          <div class="card">
            <div class="card-badge">{{ group.schedules?.length || 0 }} مواعيد</div>
            <div class="card-body">
              <div class="group-top">
                <div class="group-title">{{ group.name }}</div>
                <div class="group-code">{{ group.groupCode }}</div>
              </div>
              <div class="group-course">{{ group.courseName }}</div>
              <div class="schedules-preview" *ngIf="group.schedules && group.schedules.length > 0">
                <span *ngFor="let s of group.schedules | slice:0:3" class="schedule-chip">
                  {{ getDayName(s.dayOfWeek) }} • {{ formatTime(s.startTime) }}
                </span>
                <span *ngIf="group.schedules.length > 3" class="more-chip">+{{ group.schedules.length - 3 }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button class="btn action" (click)="takeAttendance(group)"><i class="fas fa-clipboard-check"></i></button>
              <button class="btn action" [routerLink]="['edit', group.groupId]"><i class="fas fa-edit"></i></button>
              <button class="btn action danger" (click)="deleteGroup(group)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>

      <div class="refresh-section" *ngIf="!loading() && groups().length > 0">
        <button class="btn-refresh" (click)="loadTeacherGroups()"><i class="fas fa-sync-alt me-2"></i>تحديث</button>
        <div class="groups-count fancy-count"><i class="fas fa-layer-group me-2"></i><strong>{{ groups().length }}</strong> مجموعات</div>
      </div>
    </div>
  `,
  styles: [`
    .modern-bg { padding: 2rem; min-height: 100vh; background: linear-gradient(180deg,#fbfdff 0%, #eef4ff 100%); }
    .fancy-header { position: relative; border-radius: 16px; overflow: hidden; padding: 1rem 1.25rem 2.25rem; box-shadow: 0 12px 40px rgba(102,126,234,0.18); }
    .header-blob { position: absolute; inset: 0; width: 100%; height: 140px; pointer-events: none; }
    .header-content { position: relative; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .header-left { display:flex; align-items:center; gap:1rem; }
    .icon-wrapper { width:64px; height:64px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.6rem; background:linear-gradient(135deg,#7b8cff,#8f6be9); box-shadow: 0 6px 20px rgba(115,103,240,0.25); }
    .icon-wrapper.glow { filter: drop-shadow(0 6px 18px rgba(118,91,255,0.25)); }
    .title-block .main-title { margin:0; color:#fff; font-size:1.6rem; font-weight:800; }
    .subtitle { margin:0.25rem 0 0; color:rgba(255,255,255,0.95); }
    .header-chips { margin-top:0.5rem; display:flex; gap:0.5rem; }
    .chip { background: rgba(255,255,255,0.12); color: #fff; padding: 0.35rem 0.6rem; border-radius: 999px; font-weight:600; cursor:pointer; }
    .count-chip { background: rgba(255,255,255,0.18); }
    .count-number { display:inline-block; min-width:32px; text-align:center; }
    .header-right { display:flex; align-items:center; gap:1rem; }
    .btn-fancy { background: linear-gradient(90deg,#fff 0%, #f7f7ff 100%); color:#4a2bd6; padding:0.6rem 1rem; border-radius:10px; border:none; font-weight:700; box-shadow: 0 6px 18px rgba(74,43,214,0.12); }
    .teacher-card { display:flex; align-items:center; gap:0.6rem; background: rgba(255,255,255,0.15); padding:0.35rem 0.6rem; border-radius:10px; }
    .teacher-avatar { width:40px; height:40px; border-radius:10px; background:white; color:#4a2bd6; display:flex; align-items:center; justify-content:center; font-weight:800; }
    .teacher-meta { color: white; font-weight:600; }

    /* Loading dots */
    .fancy-loading { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:2rem; }
    .dot-spinner { display:flex; gap:8px; }
    .dot-spinner div { width:12px; height:12px; background:#667eea; border-radius:50%; animation: bounce 0.9s infinite; }
    .dot-spinner div:nth-child(2){ animation-delay:0.12s; }
    .dot-spinner div:nth-child(3){ animation-delay:0.24s; }
    @keyframes bounce { 0%{ transform:translateY(0);}50%{ transform:translateY(-8px);}100%{transform:translateY(0);} }

    .fancy-empty { text-align:center; padding:2.5rem; border-radius:12px; background:white; box-shadow:0 6px 18px rgba(80,90,140,0.06); }
    .fancy-empty .sparkle i{ color:#e9eefc; background: linear-gradient(135deg,#667eea,#764ba2); -webkit-background-clip:text; background-clip:text; color:transparent; }

    .groups-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:1rem; margin-top:1.25rem; }
    .fancy-card { animation: cardIn 380ms ease both; }
    @keyframes cardIn { from{ transform: translateY(12px); opacity:0 } to{ transform:none; opacity:1 } }
    .card { position:relative; border-radius:14px; padding:1rem; background:linear-gradient(180deg,#ffffff, #fbfdff); box-shadow: 0 8px 30px rgba(69,84,170,0.06); overflow:hidden; }
    .card-badge { position:absolute; top:12px; right:12px; background:linear-gradient(90deg,#ffd166,#ff7b7b); color:#3a2a2a; padding:6px 10px; border-radius:999px; font-weight:700; font-size:0.85rem; }
    .group-top { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
    .group-title { font-weight:800; font-size:1.05rem; color:#1f2a44; }
    .group-code { color:#8b93b1; font-weight:700; }
    .group-course { margin-top:0.5rem; color:#4b5568; font-weight:600; }
    .schedules-preview { margin-top:0.75rem; display:flex; gap:0.4rem; flex-wrap:wrap; }
    .schedule-chip { background:#eef6ff; color:#1f6fb7; padding:0.35rem 0.5rem; border-radius:8px; font-weight:700; font-size:0.8rem; }
    .more-chip { background:#f1f1f1; color:#666; padding:0.35rem 0.5rem; border-radius:8px; font-weight:700; }

    .card-actions { display:flex; gap:0.5rem; margin-top:1rem; justify-content:flex-end; }
    .btn.action { background:linear-gradient(135deg,#eef2ff,#fff); border:none; padding:0.55rem 0.6rem; border-radius:8px; cursor:pointer; box-shadow:0 6px 18px rgba(102,103,250,0.06); }
    .btn.action.danger { background:linear-gradient(135deg,#ffdede,#ffefef); }

    .refresh-section { display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; }
    .btn-refresh { background:transparent; border:1px dashed #cdd6ff; padding:0.5rem 0.8rem; border-radius:8px; }
    .fancy-count { color:#4a2bd6; font-weight:800; }

    /* Responsive tweaks */
    @media (max-width:768px){ .header-content{flex-direction:column; align-items:flex-start} .groups-grid{grid-template-columns:1fr} .header-right{width:100%; display:flex; justify-content:space-between} }
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
