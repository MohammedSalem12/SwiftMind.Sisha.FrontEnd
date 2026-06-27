import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { SecretaryTeacherService } from '@proxy/teachers';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-secretary-announce',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'إعلان للطلاب'" [titleEn]="'Announce'" [backTo]="'/secretary'"></app-page-header>

      <div class="page-body">
        @if (loading()) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else {

          <!-- Select Teacher -->
          <div class="field-group">
            <label class="field-label"><i class="fas fa-chalkboard-teacher"></i> المعلم · Teacher</label>
            <select class="field-input" [(ngModel)]="selectedTeacherId">
              <option value="">-- اختر المعلم --</option>
              @for (t of teachers(); track t.teacherId) {
                <option [value]="t.teacherId">{{ t.teacherName }}</option>
              }
            </select>
          </div>

          <!-- Title -->
          <div class="field-group">
            <label class="field-label"><i class="fas fa-heading"></i> عنوان الإعلان · Title</label>
            <input class="field-input" [(ngModel)]="title" placeholder="أدخل عنوان الإعلان" maxlength="200" />
          </div>

          <!-- Message -->
          <div class="field-group">
            <label class="field-label"><i class="fas fa-pen"></i> نص الإعلان · Message</label>
            <textarea class="field-input field-textarea" [(ngModel)]="message" rows="4"
                      placeholder="أدخل نص الإعلان الذي سيصل للطلاب..."></textarea>
          </div>

          @if (error()) {
            <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div>
          }

          @if (success()) {
            <div class="success-msg"><i class="fas fa-check-circle"></i> تم إرسال الإعلان بنجاح! · Announcement sent!</div>
          }

          <button class="submit-btn" (click)="send()" [disabled]="sending() || !selectedTeacherId || !title || !message">
            @if (sending()) { <div class="spinner-sm"></div> }
            @else { <i class="fas fa-bullhorn"></i> }
            إرسال الإعلان · Send Announcement
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f5f7; }
    .page-body { padding: 16px; }
    .field-group { margin-bottom: 16px; }
    .field-label { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; display: block; i { color: #667eea; margin-left: 4px; } }
    .field-input {
      width: 100%; padding: 12px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      font-size: 15px; background: white; outline: none; font-family: inherit;
    }
    .field-input:focus { border-color: #667eea; }
    .field-textarea { resize: vertical; min-height: 100px; }
    .submit-btn {
      width: 100%; padding: 14px; border: none; border-radius: 14px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white;
      font-size: 16px; font-weight: 700; cursor: pointer; min-height: 52px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
    .error-msg {
      background: rgba(239,68,68,.08); color: #dc2626; padding: 10px; border-radius: 10px;
      font-size: 13px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
    }
    .success-msg {
      background: rgba(16,185,129,.08); color: #059669; padding: 10px; border-radius: 10px;
      font-size: 13px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
    }
    .loading-state { text-align: center; padding: 60px; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e0e0e0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .8s linear infinite; margin: 0 auto;
    }
    .spinner-sm {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SecretaryAnnounceComponent implements OnInit {
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);
  private readonly rest = inject(RestService);

  loading = signal(false);
  sending = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  teachers = signal<any[]>([]);

  selectedTeacherId = '';
  title = '';
  message = '';

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await lastValueFrom(this.secretaryTeacherService.getTeachersForCurrentSecretary());
      this.teachers.set(list ?? []);
    } catch (e) {
      console.error('Error loading teachers:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async send(): Promise<void> {
    if (!this.selectedTeacherId || !this.title || !this.message) return;
    this.sending.set(true);
    this.error.set(null);
    this.success.set(false);
    try {
      // Create a feed/announcement targeting the teacher's students
      await lastValueFrom(this.rest.request<any, any>({
        method: 'POST',
        url: '/api/app/feed',
        body: {
          title: this.title,
          content: this.message,
          type: 0, // General
          extraProperties: {
            TargetIds: [this.selectedTeacherId],
          },
        },
      }));
      this.success.set(true);
      this.title = '';
      this.message = '';
      this.selectedTeacherId = '';
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'حدث خطأ أثناء إرسال الإعلان');
    } finally {
      this.sending.set(false);
    }
  }
}
