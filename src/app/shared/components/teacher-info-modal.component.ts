import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { TeacherService } from '@proxy/teachers';
import { RestService } from '@abp/ng.core';
import { TeacherInfoModalService } from '../services/teacher-info-modal.service';

interface TeacherFull {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phoneNumber: string;
  teacherCode: string;
  government: string;
  town: string;
  isPromoted: boolean;
}

interface CourseInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

@Component({
  selector: 'app-teacher-info-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (modalService.isOpen()) {
      <div class="modal-overlay" (click)="close()" dir="rtl">
        <div class="modal-card" (click)="$event.stopPropagation()">

          <!-- Close button -->
          <button class="close-btn" (click)="close()"><i class="fas fa-times"></i></button>

          @if (loading()) {
            <div class="modal-loading">
              <div class="spinner"></div>
              <span>جاري التحميل...</span>
            </div>
          }

          @if (!loading() && teacher()) {
            <!-- Header -->
            <div class="modal-header">
              <div class="teacher-avatar">{{ initials() }}</div>
              <div class="teacher-main">
                <h2 class="teacher-name">{{ teacher()!.firstName }} {{ teacher()!.lastName }}</h2>
                <span class="teacher-code"><i class="fas fa-hashtag"></i> {{ teacher()!.teacherCode }}</span>
              </div>
              @if (teacher()!.isPromoted) {
                <span class="promoted-tag"><i class="fas fa-crown"></i> معلم مميز · Featured</span>
              }
            </div>

            <!-- Info rows -->
            <div class="info-section">
              @if (teacher()!.government || teacher()!.town) {
                <div class="info-row">
                  <div class="info-icon"><i class="fas fa-map-marker-alt"></i></div>
                  <div class="info-content">
                    <span class="info-label">الموقع · Location</span>
                    <span class="info-value">{{ [teacher()!.government, teacher()!.town].filter(Boolean).join(' — ') }}</span>
                  </div>
                </div>
              }
              @if (teacher()!.email) {
                <div class="info-row">
                  <div class="info-icon"><i class="fas fa-envelope"></i></div>
                  <div class="info-content">
                    <span class="info-label">البريد · Email</span>
                    <span class="info-value" dir="ltr">{{ teacher()!.email }}</span>
                  </div>
                </div>
              }
              @if (teacher()!.phoneNumber) {
                <div class="info-row">
                  <div class="info-icon"><i class="fas fa-phone"></i></div>
                  <div class="info-content">
                    <span class="info-label">الهاتف · Phone</span>
                    <span class="info-value" dir="ltr">{{ teacher()!.phoneNumber }}</span>
                  </div>
                </div>
              }
              @if (teacher()!.address) {
                <div class="info-row">
                  <div class="info-icon"><i class="fas fa-home"></i></div>
                  <div class="info-content">
                    <span class="info-label">العنوان · Address</span>
                    <span class="info-value">{{ teacher()!.address }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Courses -->
            @if (courses().length > 0) {
              <div class="courses-section">
                <div class="courses-title"><i class="fas fa-book-open"></i> المقررات · Courses <span class="courses-count">{{ courses().length }}</span></div>
                <div class="courses-list">
                  @for (c of courses(); track c.id) {
                    <div class="course-chip">
                      <span class="chip-name">{{ c.nameAr }}</span>
                      <span class="chip-code">{{ c.code }}</span>
                    </div>
                  }
                </div>
              </div>
            }

          }

          @if (!loading() && !teacher()) {
            <div class="modal-error">
              <i class="fas fa-exclamation-triangle"></i>
              <p>لم يتم العثور على المعلم</p>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-card {
      background: #fff; border-radius: 20px;
      width: 100%; max-width: 400px; max-height: 85vh;
      overflow-y: auto; position: relative;
      animation: slideUp .25s ease;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .close-btn {
      position: absolute; top: .75rem; left: .75rem; z-index: 2;
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(0,0,0,.06); border: none; color: #666;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: .9rem;
    }
    .close-btn:active { background: rgba(0,0,0,.12); }

    .modal-loading {
      padding: 3rem; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: .75rem;
      color: #999; font-size: .85rem;
    }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #e0e0f0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.5rem 1.25rem 1.25rem;
      border-radius: 20px 20px 0 0;
      display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: .5rem;
    }
    .teacher-avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: 3px solid rgba(255,255,255,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem; font-weight: 800; color: #fff;
    }
    .teacher-main { display: flex; flex-direction: column; align-items: center; }
    .teacher-name { margin: 0; font-size: 1.15rem; font-weight: 800; color: #fff; }
    .teacher-code {
      font-size: .78rem; color: rgba(255,255,255,.7);
      background: rgba(255,255,255,.12); padding: .15rem .6rem; border-radius: 10px;
      display: flex; align-items: center; gap: .25rem;
    }
    .promoted-tag {
      background: rgba(245,158,11,.9); color: #fff;
      font-size: .68rem; font-weight: 700; padding: .2rem .6rem; border-radius: 10px;
      display: flex; align-items: center; gap: .25rem;
    }

    .info-section { padding: .75rem 1.25rem; }
    .info-row {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .6rem 0; border-bottom: 1px solid #f5f5fa;
    }
    .info-row:last-child { border-bottom: none; }
    .info-icon {
      width: 34px; height: 34px; border-radius: 10px;
      background: rgba(102,126,234,.08); color: #667eea;
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; flex-shrink: 0;
    }
    .info-content { display: flex; flex-direction: column; min-width: 0; }
    .info-label { font-size: .68rem; color: #9090aa; font-weight: 600; }
    .info-value { font-size: .88rem; color: #1a1a2e; font-weight: 600; word-break: break-word; }

    .courses-section {
      padding: .5rem 1.25rem 1.25rem;
    }
    .courses-title {
      font-size: .75rem; font-weight: 700; color: #555;
      text-transform: uppercase; letter-spacing: .04em;
      display: flex; align-items: center; gap: .4rem;
      margin-bottom: .5rem;
    }
    .courses-title i { color: #667eea; }
    .courses-count {
      background: rgba(102,126,234,.1); color: #667eea;
      font-size: .65rem; font-weight: 700; padding: .1rem .4rem; border-radius: 8px;
    }
    .courses-list { display: flex; flex-wrap: wrap; gap: .35rem; }
    .course-chip {
      background: rgba(102,126,234,.06); border: 1px solid rgba(102,126,234,.12);
      border-radius: 10px; padding: .35rem .6rem;
      display: flex; flex-direction: column;
    }
    .chip-name { font-size: .78rem; font-weight: 600; color: #1a1a2e; }
    .chip-code { font-size: .6rem; color: #9090aa; }

    .modal-error {
      padding: 3rem; text-align: center; color: #dc2626;
    }
    .modal-error i { font-size: 2rem; display: block; margin-bottom: .5rem; }
    .modal-error p { font-size: .85rem; margin: 0; }
  `],
})
export class TeacherInfoModalComponent {
  readonly modalService = inject(TeacherInfoModalService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly rest = inject(RestService);

  teacher = signal<TeacherFull | null>(null);
  courses = signal<CourseInfo[]>([]);
  loading = signal(false);

  constructor() {
    effect(() => {
      const id = this.modalService.teacherId();
      if (id && this.modalService.isOpen()) {
        this.loadTeacher(id);
      }
    });
  }

  initials(): string {
    const t = this.teacher();
    if (!t) return '?';
    return [t.firstName?.[0], t.lastName?.[0]].filter(Boolean).join('').toUpperCase();
  }

  close(): void {
    this.modalService.close();
    this.teacher.set(null);
    this.courses.set([]);
  }

  private async loadTeacher(id: string): Promise<void> {
    this.loading.set(true);
    this.teacher.set(null);
    this.courses.set([]);
    try {
      const [t, coursesResult] = await Promise.all([
        lastValueFrom(this.teacherSvc.get(id)),
        lastValueFrom(this.rest.request<void, CourseInfo[]>({
          method: 'GET',
          url: `/api/app/teacher/teacher-courses/${id}`,
        })).catch(() => [] as CourseInfo[]),
      ]);
      this.teacher.set(t as any);
      this.courses.set(coursesResult ?? []);
    } catch {
      this.teacher.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
