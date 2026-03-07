import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';

import { CurrentUserInfoService } from '@proxy/common';
import { StudentService } from '@proxy/students';
import { CourseService } from '@proxy/courses';
import type { ParentStudentDto } from '@proxy/parents/models';
import type { StudentCourseDto } from '@proxy/courses/dtos/models';

const GRADE_NAMES: Record<number, string> = {
  1: 'الصف الأول الابتدائي',
  2: 'الصف الثاني الابتدائي',
  3: 'الصف الثالث الابتدائي',
  4: 'الصف الرابع الابتدائي',
  5: 'الصف الخامس الابتدائي',
  6: 'الصف السادس الابتدائي',
  7: 'الصف الأول الإعدادي',
  8: 'الصف الثاني الإعدادي',
  9: 'الصف الثالث الإعدادي',
  10: 'الصف الأول الثانوي',
  11: 'الصف الثاني الثانوي',
  12: 'الصف الثالث الثانوي',
};

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-home.component.html',
  styleUrls: ['./student-home.component.scss'],
})
export class StudentHomeComponent implements OnInit {
  private readonly router         = inject(Router);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly studentService = inject(StudentService);
  private readonly courseService  = inject(CourseService);

  studentName        = signal('');
  studentCode        = signal('');
  gradeName          = signal('');
  confirmedParents   = signal<ParentStudentDto[]>([]);
  pendingParentLinks = signal<ParentStudentDto[]>([]);
  courses            = signal<StudentCourseDto[]>([]);
  loading            = signal(true);
  qrDataUrl          = signal<string | null>(null);
  showQr             = signal(false);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.studentName.set(userInfo?.actorName || '');
      this.studentCode.set(userInfo?.actorCode || '');
      if (userInfo?.currentGrade) {
        this.gradeName.set(GRADE_NAMES[userInfo.currentGrade] || `الصف ${userInfo.currentGrade}`);
      }
      await Promise.all([
        this.loadPendingParentLinks(),
        this.loadConfirmedParents(),
        this.loadCourses(),
      ]);
      if (userInfo?.actorCode) {
        this.generateQr(userInfo.actorCode);
      }
    } catch (err) {
      console.error('Error loading student home:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPendingParentLinks(): Promise<void> {
    try {
      const links = await lastValueFrom(this.studentService.getPendingLinksForCurrentStudent());
      this.pendingParentLinks.set(links || []);
    } catch { /* silent */ }
  }

  private async loadConfirmedParents(): Promise<void> {
    try {
      const parents = await lastValueFrom(this.studentService.getConfirmedParentsForCurrentStudent());
      this.confirmedParents.set(parents || []);
    } catch { /* silent */ }
  }

  private async loadCourses(): Promise<void> {
    try {
      const result = await lastValueFrom(this.courseService.getCoursesForCurrentStudent());
      this.courses.set(result || []);
    } catch { /* silent */ }
  }

  private async generateQr(code: string): Promise<void> {
    try {
      const url = `${window.location.origin}/parent/link-child?code=${code}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: { dark: '#764ba2', light: '#ffffff' },
      });
      this.qrDataUrl.set(dataUrl);
    } catch { /* silent */ }
  }

  toggleQr(): void {
    this.showQr.update(v => !v);
  }

  async confirmParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.studentService.confirmParentStudentLink(link.parentId!, link.studentId!));
      await Promise.all([this.loadPendingParentLinks(), this.loadConfirmedParents()]);
    } catch (err) {
      console.error('Error confirming parent link:', err);
    }
  }

  async rejectParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.studentService.rejectParentStudentLink(link.parentId!, link.studentId!));
      await this.loadPendingParentLinks();
    } catch (err) {
      console.error('Error rejecting parent link:', err);
    }
  }

  enrolledCourses(): StudentCourseDto[] {
    return this.courses().filter(c => c.isEnrolled || c.hasPendingRequest);
  }

  availableCourses(): StudentCourseDto[] {
    return this.courses().filter(c => !c.isEnrolled && !c.hasPendingRequest);
  }

  goRegister(): void {
    this.router.navigate(['/student/courses']);
  }

  goToRequests(): void {
    this.router.navigate(['/student/requests']);
  }

  goEnroll(course: StudentCourseDto): void {
    this.router.navigate(['/student/enroll', course.id]);
  }
}
