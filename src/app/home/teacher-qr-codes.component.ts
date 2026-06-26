import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

interface FullscreenQR {
  course: CourseDto;
  dataUrl: string;
  enrollUrl: string;
}

@Component({
  selector: 'app-teacher-qr-codes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  fullscreen = signal<FullscreenQR | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadQRCodes();
  }

  /** Open a single course QR full-screen, re-rendered at high resolution for easy scanning. */
  async openFullscreen(item: CourseQR): Promise<void> {
    try {
      const dataUrl = await QRCode.toDataURL(item.enrollUrl, {
        width: 720,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' }, // high-contrast for reliable scanning
      });
      this.fullscreen.set({ course: item.course, dataUrl, enrollUrl: item.enrollUrl });
    } catch {
      this.fullscreen.set({ course: item.course, dataUrl: item.qrDataUrl, enrollUrl: item.enrollUrl });
    }
  }

  closeFullscreen(): void {
    this.fullscreen.set(null);
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
            color: { dark: '#3366ff', light: '#ffffff' },
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
