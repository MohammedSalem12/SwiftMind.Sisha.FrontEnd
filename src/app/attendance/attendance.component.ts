import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import { CourseService } from '@proxy/courses';
import { StudentService } from '@proxy/students';
import { TeacherService } from '@proxy/teachers';
import { AttendanceService } from '@proxy/attendances';
import { CurrentUserInfoService } from '@proxy/common';
import { RestService } from '@abp/ng.core';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  private readonly enrollmentSvc = inject(EnrollmentService);
  private readonly courseSvc = inject(CourseService);
  private readonly studentSvc = inject(StudentService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);
  private readonly rest = inject(RestService);

  loading = signal(false);
  teachers = signal<any[]>([]);
  currentUserId = signal<string | null>(null);
  selectedTeacherId = signal<string | null>(null);

  courses = signal<any[]>([]);
  selectedCourseId = signal<string | null>(null);

  students = signal<{ enrollmentId: string; studentId: string; studentName?: string; selected?: boolean; alreadyAbsent?: boolean }[]>([]);
  // today's absentees for selected course+teacher
  todaysAbsentees = signal<{ attendanceId?: string; enrollmentId: string; studentName: string; date: string; note?: string }[]>([]);
  deletingAttendanceId = signal<string | null>(null);

  attendanceDate = signal<string>(new Date().toISOString().slice(0,10)); // yyyy-mm-dd
  saving = signal(false);
  message = signal<string | null>(null);
  note = signal<string>('');
  absentCount = signal<number>(0);

  ngOnInit(): void {
    void this.initializeComponent();
  }

  async initializeComponent() {
    try {
      // Get current user's actor_id from token
      const currentUser = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      if (currentUser?.actorId) {
        this.currentUserId.set(currentUser.actorId);
        this.selectedTeacherId.set(currentUser.actorId);
        // Load courses for the current teacher
        await this.loadCoursesForCurrentTeacher();
      } else {
        console.error('Unable to get current user actorId');
      }
    } catch (error) {
      console.error('Failed to initialize component:', error);
    }
  }

  async loadCoursesForCurrentTeacher() {
    const teacherId = this.currentUserId();
    if (!teacherId) return;
    
    this.loading.set(true);
    try {
      const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(teacherId));
      const normalized = (res ?? []).map(c => ({ ...c, gradeId: c.gradeId ?? null, gradeName: c.gradeName ?? '' }));
      this.courses.set(normalized);
    } catch (e) {
      console.error('Failed to load courses for current teacher', e);
      this.courses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadTeachers() {
    this.loading.set(true);
    try {
      const res: any = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      this.teachers.set(res.items ?? []);
    } catch (e) {
      console.error(e);
      this.teachers.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async onTeacherChange(id?: string) {
    const newTeacher = id || null;
    const prevCourse = this.selectedCourseId();
    this.selectedTeacherId.set(newTeacher);
    this.courses.set([]);
    this.students.set([]);
    this.todaysAbsentees.set([]);
    if (!newTeacher) {
      this.selectedCourseId.set(null);
      return;
    }
    await this.loadCoursesForTeacher(newTeacher);
    // if previously selected course still belongs to this teacher, keep it
    if (prevCourse) {
      const found = this.courses().find(c => c.id === prevCourse);
      if (found) {
        this.selectedCourseId.set(prevCourse);
        await this.loadStudentsForCourse(prevCourse, newTeacher);
        // await this.loadTodaysAbsentees();
        return;
      } else {
        this.selectedCourseId.set(null);
      }
    }
  }

  async loadCoursesForTeacher(teacherId: string) {
    this.loading.set(true);
    try {
      // Use the teacher API to fetch courses assigned to this teacher
      const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(teacherId));
      const normalized = (res ?? []).map(c => ({ ...c, gradeId: c.gradeId ?? null, gradeName: c.gradeName ?? '' }));
      this.courses.set(normalized);
    } catch (e) {
      console.error(e);
      this.courses.set([]);
    } finally { this.loading.set(false); }
  }

  async onCourseChange(courseId?: string) {
    this.selectedCourseId.set(courseId || null);
    this.students.set([]);
    // this.todaysAbsentees.set([]);
    this.absentCount.set(0);
    if (!courseId) return;
    await this.loadStudentsForCourse(courseId, this.currentUserId());
    // after students loaded, load today's absentees for this selection
    //await this.loadTodaysAbsentees();
  }

  async loadTodaysAbsentees() {
    const courseId = this.selectedCourseId();
    const teacherId = this.currentUserId();
    if (!courseId || !teacherId) { 
      //this.todaysAbsentees.set([]); 
      return; 
    }
    
    this.loading.set(true);
    try {
      const targetDate = new Date(this.attendanceDate()).toISOString().slice(0, 10);
      
      // Use the new API to get student attendance status and filter for absent students
      const response: any = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceStatus({
          courseId: courseId,
          teacherId: teacherId,
          date: targetDate,
          skipCount: 0,
          maxResultCount: 1000
        })
      );

      // Filter only absent students and map to the expected format
      const absentStudents = (response.items ?? [])
        .filter((item: any) => item.isAbsent)
        .map((item: any) => ({
          // Note: We need to find the attendanceId from the attendance records
          // since the new API doesn't provide it directly
          attendanceId: undefined, // Will be set below if needed
          enrollmentId: item.enrollmentId,
          studentName: item.fullName || `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`.replace(/\s+/g, ' ').trim(),
          date: item.date,
          note: item.note || '--'
        }));

      // If we need attendance IDs for cancellation, we could fetch them separately
      // For now, we'll rely on the enrollmentId and date for cancellation
      this.todaysAbsentees.set(absentStudents);
    } catch (e) {
      console.error('Failed to load today\'s absentees:', e);
     // this.todaysAbsentees.set([]);
    } finally { 
      this.loading.set(false); 
    }
  }

  async cancelAttendance(attendanceId?: string, enrollmentId?: string) {
    // If we don't have attendanceId, we need to find it by enrollmentId and date
    if (!attendanceId && !enrollmentId) return;
    
    this.deletingAttendanceId.set(attendanceId || enrollmentId || '');
    try {
      if (attendanceId) {
        // Direct deletion if we have the attendance ID
        await lastValueFrom(this.attendanceSvc.delete(attendanceId));
      } else if (enrollmentId) {
        // Find the attendance record by enrollmentId and date, then delete it
        const targetDate = new Date(this.attendanceDate()).toISOString().slice(0, 10);
        const attendanceResponse: any = await lastValueFrom(
          this.attendanceSvc.getList({ skipCount: 0, maxResultCount: 1000 })
        );
        
        const attendanceRecord = (attendanceResponse.items ?? []).find((item: any) => 
          item.enrollmentId === enrollmentId && 
          new Date(item.date).toISOString().slice(0, 10) === targetDate &&
          item.isAbsent
        );
        
        if (attendanceRecord?.id) {
          await lastValueFrom(this.attendanceSvc.delete(attendanceRecord.id));
        } else {
          throw new Error('Attendance record not found');
        }
      }

      // Refresh both lists to show updated data
      await this.loadTodaysAbsentees();
      if (this.selectedCourseId()) {
        await this.loadStudentsForCourse(this.selectedCourseId() as string, this.currentUserId());
      }
      
      this.message.set('تم إلغاء الحضور/الغياب');
    } catch (e) {
      console.error('Failed to cancel attendance', e);
      this.message.set('فشل إلغاء الحضور/الغياب');
    } finally {
      this.deletingAttendanceId.set(null);
    }
  }

  // helper used from template to set date and reload today's absentees
  setDateAndReload(dateStr: string) {
    this.attendanceDate.set(dateStr);
    void this.loadStudentsForCourse(this.selectedCourseId() as string, this.currentUserId() );
  }



  async loadStudentsForCourse(courseId: string, teacherId?: string | null) {
    this.loading.set(true);
    this.students.set([]);

    try {
      const targetDate = new Date(this.attendanceDate()).toISOString().slice(0, 10);
      const currentTeacherId = teacherId || this.currentUserId();
      
      if (!currentTeacherId) {
        console.error('Teacher ID is required for loading students');
        return;
      }
      
      // Use the new API to get student attendance status directly
      const response: any = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceStatus({
          courseId: courseId,
          teacherId: currentTeacherId,
          date: targetDate,
          skipCount: 0,
          maxResultCount: 1000
        })
      );

      const students = (response.items ?? []).map((item: any) => ({
        enrollmentId: item.enrollmentId,
        studentId: item.studentId,
        studentName: item.fullName || `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`.replace(/\s+/g, ' ').trim(),
        selected: false,
        alreadyAbsent: item.isAbsent
      }));

   //   alert(JSON.stringify(students));
      this.students.set(students);
      // Update absent counter
      this.absentCount.set(students.filter(s => s.alreadyAbsent).length);
    } catch (e) {
      console.error('Failed to load students for course:', e);
      this.students.set([]);
      this.absentCount.set(0);
    } finally { 
      this.loading.set(false); 
    }
  }

  toggleStudent(i: number) {
    const arr = [...this.students()]; arr[i].selected = !arr[i].selected; this.students.set(arr);
  }

  async markAttendances() {
    const selected = this.students().filter(s => s.selected);
    if (selected.length === 0) { this.message.set('No student selected'); return; }
    this.saving.set(true); this.message.set(null);
    try {
      const date = this.attendanceDate();
        const note = '--';
      for (const s of selected) {
        const payload = { enrollmentId: s.enrollmentId, date: new Date(date).toISOString(), isAbsent: true, note } as any;
        try { await lastValueFrom(this.attendanceSvc.create(payload)); } catch (e) { console.error('create attendance failed', e); }
      }
      // reload today's absentees after marking
      await this.loadTodaysAbsentees();
      // reload students list so UI reflects state
      if (this.selectedCourseId()) await this.loadStudentsForCourse(this.selectedCourseId() as string, this.currentUserId());
  this.message.set('Attendances recorded');
    } catch (e) {
      console.error(e);
  this.message.set('Failed to record attendances');
    } finally { this.saving.set(false); }
  }

  async toggleAttendance(enrollmentId: string, isCurrentlyAbsent: boolean) {
    if (!enrollmentId) return;
    this.saving.set(true);
    
    try {
      if (isCurrentlyAbsent) {

          await lastValueFrom(this.attendanceSvc.delete(enrollmentId));

          
      } else {
        // Mark as absent - create new attendance record
        const payload = { 
          enrollmentId, 
          date: new Date(this.attendanceDate()).toLocaleDateString(), 
          isAbsent: true, 
          note: '--' 
        } as any;
        await lastValueFrom(this.attendanceSvc.create(payload));
        this.message.set('تم تسجيل الغياب');
      }
      
      // Refresh lists to update UI
      await this.loadTodaysAbsentees();
      if (this.selectedCourseId()) {
        await this.loadStudentsForCourse(this.selectedCourseId() as string, this.currentUserId());
      }
    } catch (e) {
      console.error('Failed to toggle attendance', e);
      this.message.set(isCurrentlyAbsent ? 'فشل إلغاء الغياب' : 'فشل تسجيل الغياب');
    } finally {
      this.saving.set(false);
    }
  }

  async markAbsent(enrollmentId: string) {
    if (!enrollmentId) return;
    this.saving.set(true);
    try {
        const payload = { enrollmentId, gradeId : '11111111-1111-1111-1111-111111111104' , date: new Date(this.attendanceDate()).toISOString(), isAbsent: true, note: '--' } as any;
      await lastValueFrom(this.attendanceSvc.create(payload));
      // refresh lists
      await this.loadTodaysAbsentees();
      if (this.selectedCourseId()) await this.loadStudentsForCourse(this.selectedCourseId() as string, this.currentUserId());
      this.message.set('تم تسجيل الغياب');
    } catch (e) {
      console.error('Failed to mark absent', e);
      this.message.set('فشل تسجيل الغياب');
    } finally {
      this.saving.set(false);
    }
  }
}
