import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';

import { StudentService } from '@proxy/students';

@Component({
  selector: 'app-student-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-qr.component.html',
  styleUrls: ['./student-qr.component.scss'],
})
export class StudentQrComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);

  loading = signal(false);
  error = signal<string | null>(null);
  qrDataUrl = signal<string | null>(null);
  studentName = signal('');
  studentCode = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadQR();
  }

  async loadQR(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const student = await lastValueFrom(this.studentService.getCurrentStudent());
      if (!student?.studentCode) {
        this.error.set('لم يتم العثور على بيانات الطالب');
        return;
      }

      const name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
      this.studentName.set(name);
      this.studentCode.set(student.studentCode);

      const origin = window.location.origin;
      const linkUrl = `${origin}/parent/link-child?code=${student.studentCode}`;
      const dataUrl = await QRCode.toDataURL(linkUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#667eea', light: '#ffffff' },
      });
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Error generating student QR:', err);
      this.error.set('حدث خطأ أثناء إنشاء رمز QR');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }
}
