import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';

import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '@proxy/courses/dtos/models';

interface CourseQR {
  course: CourseDto;
  qrDataUrl: string;
  enrollUrl: string;
}

@Component({
  selector: 'app-teacher-qr-codes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-qr-codes.component.html',
  styleUrls: ['./teacher-qr-codes.component.scss'],
})
export class TeacherQrCodesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly teacherService = inject(TeacherService);

  loading = signal(false);
  error = signal<string | null>(null);
  courseQRs = signal<CourseQR[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadQRCodes();
  }

  async loadQRCodes(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      const teacherId = userInfo?.actorId;
      if (!teacherId) {
        this.error.set('لم يتم التعرف على المعلم');
        return;
      }

      const courses = await lastValueFrom(this.teacherService.getTeacherCourses(teacherId));
      if (!courses?.length) {
        this.courseQRs.set([]);
        return;
      }

      const origin = window.location.origin;
      const results: CourseQR[] = await Promise.all(
        courses.map(async course => {
          const enrollUrl = `${origin}/student/enroll/${course.id}`;
          const qrDataUrl = await QRCode.toDataURL(enrollUrl, {
            width: 260,
            margin: 2,
            color: { dark: '#667eea', light: '#ffffff' },
          });
          return { course, qrDataUrl, enrollUrl };
        })
      );
      this.courseQRs.set(results);
    } catch (err) {
      console.error('Error loading QR codes:', err);
      this.error.set('حدث خطأ أثناء تحميل رموز QR');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/teacher']);
  }

  trackByCourseId = (_: number, item: CourseQR) => item.course.id;
}
