import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { GroupService } from '@proxy/groups';
import { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-course-enrollment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="course-enrollment-container">
      <div class="container py-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>التسجيل في المقرر</h2>
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="bi bi-arrow-right"></i> رجوع
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <!-- Step 1: Select Teacher -->
        <div *ngIf="!loading() && !selectedTeacher()" class="teachers-section">
          <h4 class="mb-3">اختر المعلم</h4>
          <div class="row g-3">
            <div class="col-md-4" *ngFor="let teacher of teachers()">
              <div class="card teacher-card h-100" (click)="selectTeacher(teacher)" style="cursor: pointer;">
                <div class="card-body text-center">
                  <i class="bi bi-person-circle fs-1 text-primary mb-2"></i>
                  <h5 class="card-title">{{ teacher.displayName }}</h5>
                  <button class="btn btn-primary btn-sm mt-2">اختيار</button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="teachers().length === 0" class="alert alert-info">
            لا يوجد معلمون متاحون لهذا المقرر حالياً
          </div>
        </div>

        <!-- Step 2: Select Group -->
        <div *ngIf="!loading() && selectedTeacher() && !selectedGroup()" class="groups-section">
          <div class="mb-3">
            <button class="btn btn-link" (click)="backToTeachers()">
              <i class="bi bi-arrow-right"></i> تغيير المعلم
            </button>
          </div>
          <h4 class="mb-3">اختر المجموعة - المعلم: {{ selectedTeacher()?.fullName }}</h4>
          <div class="row g-3">
            <div class="col-md-6" *ngFor="let group of groups()">
              <div class="card group-card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 class="card-title">{{ group.name }}</h5>
                      <p class="text-muted mb-0">كود المجموعة: {{ group.groupCode }}</p>
                    </div>
                  </div>
                  
                  <!-- Schedules -->
                  <div class="schedules mb-3" *ngIf="group.schedules && group.schedules.length > 0">
                    <h6 class="mb-2">المواعيد:</h6>
                    <div class="schedule-item" *ngFor="let schedule of group.schedules">
                      <i class="bi bi-calendar3"></i>
                      <span class="me-2">{{ getDayName(schedule.dayOfWeek) }}</span>
                      <i class="bi bi-clock"></i>
                      <span>{{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}</span>
                      <span class="text-muted ms-2" *ngIf="schedule.location">
                        <i class="bi bi-geo-alt"></i> {{ schedule.location }}
                      </span>
                    </div>
                  </div>

                  <button 
                    class="btn btn-success w-100" 
                    (click)="selectGroup(group)"
                    [disabled]="submitting()">
                    <span *ngIf="!submitting()">انضم لهذه المجموعة</span>
                    <span *ngIf="submitting()">جاري الإرسال...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="groups().length === 0" class="alert alert-warning">
            لا توجد مجموعات متاحة لهذا المعلم حالياً
          </div>
        </div>

        <!-- Success Message -->
        <div *ngIf="enrollmentSuccess()" class="alert alert-success">
          <h5><i class="bi bi-check-circle"></i> تم إرسال طلب التسجيل بنجاح!</h5>
          <p>سيتم مراجعة طلبك من قبل المعلم والموافقة عليه قريباً.</p>
          <button class="btn btn-primary" (click)="goBack()">العودة للرئيسية</button>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage()" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> {{ errorMessage() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teacher-card {
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid transparent;
    }
    
    .teacher-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-color: var(--bs-primary);
    }

    .group-card {
      border: 1px solid #ddd;
    }

    .schedule-item {
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .schedule-item i {
      color: #6c757d;
      margin-right: 4px;
    }
  `]
})
export class CourseEnrollmentComponent implements OnInit {
  courseId = signal<string>('');
  teachers = signal<TeacherAutocompleteDto[]>([]);
  groups = signal<GroupWithSchedulesDto[]>([]);
  selectedTeacher = signal<TeacherAutocompleteDto | null>(null);
  selectedGroup = signal<GroupWithSchedulesDto | null>(null);
  loading = signal(false);
  submitting = signal(false);
  enrollmentSuccess = signal(false);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private groupService: GroupService,
    private enrollmentRequestService: EnrollmentRequestService,
    private currentUserInfoService: CurrentUserInfoService,
    private teacherService: TeacherService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadTeachers();
    }
  }

  loadTeachers() {
    this.loading.set(true);
    this.errorMessage.set('');
    
    this.teacherService.getTeachersByCourse(this.courseId(), undefined, 100).subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.errorMessage.set('حدث خطأ أثناء تحميل المعلمين');
        this.loading.set(false);
      }
    });
  }

  selectTeacher(teacher: TeacherAutocompleteDto) {
    this.selectedTeacher.set(teacher);
    this.loading.set(true);
    this.errorMessage.set('');

    this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId()).subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.errorMessage.set('حدث خطأ أثناء تحميل المجموعات');
        this.loading.set(false);
      }
    });
  }

  selectGroup(group: GroupWithSchedulesDto) {
    this.selectedGroup.set(group);
    this.submitEnrollmentRequest(group);
  }

  async submitEnrollmentRequest(group: GroupWithSchedulesDto) {
    this.submitting.set(true);
    this.errorMessage.set('');

    try {
      // Get current user's actor info (student ID) from the backend
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      
      if (!userInfo || !userInfo.actorId) {
        this.errorMessage.set('غير قادر على تحديد معلومات الطالب. يرجى تسجيل الدخول مرة أخرى.');
        this.submitting.set(false);
        return;
      }

      const request = {
        studentId: userInfo.actorId,
        courseId: this.courseId(),
        teacherId: this.selectedTeacher()!.id!,
        groupId: group.groupId!,
        initiator: EnrollmentRequestInitiator.Student
      };

      await lastValueFrom(this.enrollmentRequestService.create(request));
      this.submitting.set(false);
      this.enrollmentSuccess.set(true);
    } catch (error: any) {
      console.error('Error submitting enrollment request:', error);
      let errorMsg = 'حدث خطأ أثناء إرسال طلب التسجيل. يرجى المحاولة مرة أخرى.';
      
      // Check if it's a duplicate enrollment error
      if (error?.error?.error?.message) {
        errorMsg = error.error.error.message;
      }
      
      this.errorMessage.set(errorMsg);
      this.submitting.set(false);
    }
  }

  backToTeachers() {
    this.selectedTeacher.set(null);
    this.groups.set([]);
  }

  goBack() {
    this.router.navigate(['/student']);
  }

  getDayName(dayOfWeek: number): string {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayOfWeek] || '';
  }

  formatTime(time: string): string {
    if (!time) return '';
    // Assuming time is in format "HH:mm:ss"
    const parts = time.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const period = hours >= 12 ? 'م' : 'ص';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes} ${period}`;
    }
    return time;
  }
}
