import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { SecretaryTeacherService } from '@proxy/teachers';
import type { SecretaryTeacherDto } from '@proxy/teachers';

@Component({
  selector: 'app-secretary-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="secretary-home" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="header-icon"><i class="fas fa-user-tie"></i></div>
        <div class="header-text">
          <h1>لوحة السكرتارية</h1>
          <p class="opacity-75 mb-0">إدارة المعلمين المرتبطين</p>
        </div>
      </div>

      <div class="page-body">

        <!-- Section header with link button -->
        <div class="section-header mb-3">
          <h2 class="section-title">
            <i class="fas fa-chalkboard-teacher me-2"></i>
            المعلمون المرتبطون
            <span class="count-pill">{{ teachers().length }}</span>
          </h2>
          <button class="link-btn" (click)="goToLinkTeacher()">
            <i class="fas fa-plus"></i>
            ربط بمعلم
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted">جاري التحميل...</p>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading() && teachers().length === 0" class="empty-state">
          <i class="fas fa-user-plus fa-3x text-muted mb-3"></i>
          <h4>لا يوجد معلمون مرتبطون</h4>
          <p class="text-muted mb-3">اضغط على "ربط بمعلم" لإضافة معلم</p>
          <button class="link-btn-lg" (click)="goToLinkTeacher()">
            <i class="fas fa-plus me-2"></i>ربط بمعلم جديد
          </button>
        </div>

        <!-- Teacher cards -->
        <div *ngIf="!loading()" class="teacher-list">
          <div
            class="teacher-card"
            *ngFor="let t of teachers(); trackBy: trackById"
            (click)="goToTeacherCourses(t)">
            <div class="teacher-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="teacher-info">
              <h4>{{ t.teacherName }}</h4>
              <span *ngIf="t.teacherCode" class="teacher-code">
                <i class="fas fa-id-badge me-1"></i>{{ t.teacherCode }}
              </span>
            </div>
            <div class="arrow-icon">
              <i class="fas fa-chevron-left"></i>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .secretary-home { min-height: 100vh; background: #f8f9fa; }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 1.5rem 1rem;
      display: flex; align-items: center; gap: 1rem;
    }
    .header-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; flex-shrink: 0;
    }
    .page-header h1 { font-size: 1.4rem; font-weight: 700; margin: 0; }

    .page-body { padding: 1rem; }

    .section-header {
      display: flex; align-items: center;
      justify-content: space-between; gap: .75rem;
    }
    .section-title { font-size: 1.1rem; font-weight: 700; margin: 0; color: #1a1a2e; }
    .count-pill {
      display: inline-flex; align-items: center; justify-content: center;
      background: rgba(102,126,234,.12); color: #667eea;
      font-size: .75rem; font-weight: 700; padding: .1rem .5rem;
      border-radius: 20px; margin-right: .4rem;
    }

    .link-btn {
      display: inline-flex; align-items: center; gap: .4rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 20px;
      padding: .55rem 1.1rem; font-size: .85rem; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      box-shadow: 0 3px 10px rgba(102,126,234,.35);
      min-height: 44px; transition: opacity .15s;
    }
    .link-btn:hover, .link-btn:active { opacity: .88; }

    .link-btn-lg {
      display: inline-flex; align-items: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 24px;
      padding: .875rem 1.75rem; font-size: 1rem; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 14px rgba(102,126,234,.35);
      min-height: 52px; transition: opacity .15s;
    }
    .link-btn-lg:hover, .link-btn-lg:active { opacity: .88; }

    .loading-state { text-align: center; padding: 3rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: #6c757d; }
    .empty-state h4 { color: #343a40; margin-top: .75rem; }

    .teacher-list { display: flex; flex-direction: column; gap: .75rem; }
    .teacher-card {
      background: white; border-radius: 14px;
      border: 1.5px solid #e9ecef; padding: 1.1rem;
      display: flex; align-items: center; gap: .875rem;
      cursor: pointer; transition: all .2s ease;
    }
    .teacher-card:hover, .teacher-card:active {
      border-color: #667eea; box-shadow: 0 4px 16px rgba(102,126,234,.15);
      transform: translateY(-1px);
    }
    .teacher-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.5rem; flex-shrink: 0;
    }
    .teacher-info { flex: 1; min-width: 0; }
    .teacher-info h4 { margin: 0 0 .25rem; font-size: 1rem; font-weight: 600; }
    .teacher-code { font-size: .8rem; color: #667eea; font-weight: 500; }
    .arrow-icon { color: #adb5bd; font-size: .85rem; }
  `],
})
export class SecretaryHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);

  teachers = signal<SecretaryTeacherDto[]>([]);
  loading = signal(false);

  async ngOnInit() {
    await this.loadTeachers();
  }

  private async loadTeachers() {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.secretaryTeacherService.getTeachersForCurrentSecretary({ skipHandleError: true })
      );
      this.teachers.set(res ?? []);
    } catch (err) {
      console.error('Error loading teachers:', err);
    } finally {
      this.loading.set(false);
    }
  }

  goToLinkTeacher() {
    this.router.navigate(['/secretary/link-teacher']);
  }

  goToTeacherCourses(teacher: SecretaryTeacherDto) {
    this.router.navigate(['/secretary/teacher', teacher.teacherId], {
      state: { teacherName: teacher.teacherName }
    });
  }

  trackById = (_: number, item: SecretaryTeacherDto) => item.id;
}
