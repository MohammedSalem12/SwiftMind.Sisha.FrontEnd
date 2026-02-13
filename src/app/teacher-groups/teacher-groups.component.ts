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
                إدارة وتنظيم المجموعات المخصصة لك
              </p>
            </div>
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
                </div>
              </div>

              <div *ngIf="!group.schedules || group.schedules.length === 0" class="no-schedule-message">
                <i class="fas fa-calendar-times me-2"></i>
                لم يتم تحديد جدول زمني بعد
              </div>
            </div>
            
            <div class="card-footer-modern">
              <button class="action-btn btn-view" (click)="viewGroupDetails(group)">
                <i class="fas fa-info-circle me-1"></i>
                <span>التفاصيل</span>
              </button>
              <button class="action-btn btn-attendance" (click)="takeAttendance(group)">
                <i class="fas fa-clipboard-check me-1"></i>
                <span>الحضور</span>
              </button>
              <button class="action-btn btn-students" (click)="viewStudents(group)">
                <i class="fas fa-user-graduate me-1"></i>
                <span>الطلاب</span>
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
    .teacher-groups {
      padding: 2rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    /* Header Styles */
    .header-wrapper {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
      position: relative;
      overflow: hidden;
    }

    .header-wrapper::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.3; }
    }

    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .header-title-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      color: white;
    }

    .icon-wrapper {
      width: 70px;
      height: 70px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .main-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
    }

    .teacher-info-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      padding: 1.2rem 1.5rem;
      border-radius: 15px;
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      min-width: 250px;
    }

    .teacher-avatar {
      width: 50px;
      height: 50px;
      background: white;
      color: #667eea;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .teacher-details {
      color: white;
    }

    .teacher-name {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }

    .teacher-code {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-spinner {
      text-align: center;
    }

    .loading-text {
      color: #667eea;
      font-size: 1.1rem;
      font-weight: 500;
      margin-top: 1rem;
    }

    /* Modern Alert */
    .modern-alert {
      border-radius: 15px;
      border: none;
      box-shadow: 0 5px 20px rgba(220, 53, 69, 0.2);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
    }

    .empty-animation {
      position: relative;
      margin-bottom: 2rem;
    }

    .empty-icon-wrapper {
      position: relative;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    .empty-icon-wrapper i {
      color: #e0e0e0;
      filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
    }

    .empty-icon-shadow {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 20px;
      background: radial-gradient(ellipse, rgba(0, 0, 0, 0.15), transparent);
      border-radius: 50%;
      animation: shadow 3s ease-in-out infinite;
    }

    @keyframes shadow {
      0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
      50% { transform: translateX(-50%) scale(0.8); opacity: 0.15; }
    }

    .empty-title {
      color: #333;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .empty-description {
      color: #666;
      font-size: 1.05rem;
      line-height: 1.6;
    }

    /* Groups Grid */
    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .group-card {
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
    }

    @keyframes fadeInUp {
      from { 
        opacity: 0; 
        transform: translateY(30px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }

    .modern-card {
      border: none;
      border-radius: 20px;
      overflow: hidden;
      background: white;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modern-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.2);
    }

    /* Card Header */
    .card-header-modern {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .header-decoration {
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(30%, -30%);
    }

    .card-header-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .group-icon {
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .group-header-info {
      flex: 1;
      color: white;
    }

    .group-title {
      margin: 0;
      font-weight: 700;
      font-size: 1.3rem;
    }

    .group-code-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.25);
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    /* Card Body */
    .card-body {
      padding: 1.5rem;
    }

    .section-label {
      color: #667eea;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }

    .course-section {
      padding: 1rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .course-name {
      color: #333;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .schedules-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .schedule-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      padding: 1rem;
      border-left: 3px solid #28a745;
      transition: all 0.2s ease;
    }

    .schedule-card:hover {
      transform: translateX(-5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .schedule-day {
      font-weight: 700;
      color: #28a745;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .schedule-details {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .schedule-time {
      color: #555;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .schedule-location {
      color: #777;
      font-size: 0.9rem;
    }

    .no-schedule-message {
      text-align: center;
      padding: 2rem;
      color: #999;
      font-style: italic;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px dashed #dee2e6;
    }

    /* Card Footer */
    .card-footer-modern {
      padding: 1.25rem;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 0.75rem;
      justify-content: space-between;
    }

    .action-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-view {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-view:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-attendance {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
    }

    .btn-attendance:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
    }

    .btn-students {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
    }

    .btn-students:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(23, 162, 184, 0.4);
    }

    /* Refresh Section */
    .refresh-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
      margin-top: 2rem;
    }

    .btn-refresh {
      border-radius: 10px;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-refresh:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    }

    .groups-count {
      color: #667eea;
      font-size: 1.1rem;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 992px) {
      .groups-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .teacher-groups {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1.5rem;
      }

      .header-title-section {
        flex-direction: column;
        text-align: center;
      }

      .teacher-info-card {
        width: 100%;
        justify-content: center;
      }

      .groups-grid {
        grid-template-columns: 1fr;
      }

      .card-footer-modern {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }

      .refresh-section {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .main-title {
        font-size: 1.5rem;
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