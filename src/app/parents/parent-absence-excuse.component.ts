import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ParentService } from '@proxy/parents';
import { RestService } from '@abp/ng.core';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-parent-absence-excuse',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'عذر الغياب'" [titleEn]="'Absence Excuse'" [backTo]="'/parent'"></app-page-header>
      <div class="page-body">
        @if (loading()) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else {
          <div class="field-group">
            <label class="field-label"><i class="fas fa-child"></i> الطالب · Child</label>
            <select class="field-input" [(ngModel)]="studentId">
              <option value="">-- اختر الطالب --</option>
              @for (c of children(); track c.studentId) {
                <option [value]="c.studentId">{{ c.studentName }}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label class="field-label"><i class="fas fa-calendar"></i> تاريخ الغياب · Date</label>
            <input type="date" class="field-input" [(ngModel)]="date" />
          </div>
          <div class="field-group">
            <label class="field-label"><i class="fas fa-question-circle"></i> السبب · Reason</label>
            <select class="field-input" [(ngModel)]="reason">
              <option value="">-- اختر السبب --</option>
              <option value="مرض · Illness">مرض · Illness</option>
              <option value="ظروف عائلية · Family matters">ظروف عائلية · Family matters</option>
              <option value="موعد طبي · Medical appointment">موعد طبي · Medical appointment</option>
              <option value="سفر · Travel">سفر · Travel</option>
              <option value="أخرى · Other">أخرى · Other</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label"><i class="fas fa-sticky-note"></i> ملاحظات · Notes</label>
            <textarea class="field-input textarea" [(ngModel)]="notes" rows="3" placeholder="تفاصيل إضافية (اختياري)"></textarea>
          </div>
          @if (error()) { <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div> }
          @if (success()) { <div class="success-msg"><i class="fas fa-check-circle"></i> تم إرسال العذر بنجاح للمعلمين! · Excuse sent to teachers!</div> }
          <button class="submit-btn" (click)="submit()" [disabled]="sending() || !studentId || !date || !reason">
            @if (sending()) { <div class="spinner-sm"></div> } @else { <i class="fas fa-paper-plane"></i> }
            إرسال العذر · Submit Excuse
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f5f5f7; }
    .page-body { padding:16px; }
    .field-group { margin-bottom:14px; }
    .field-label { font-size:13px; font-weight:600; color:#555; margin-bottom:5px; display:block; i { color:#667eea; margin-left:4px; } }
    .field-input { width:100%; padding:11px; border:1.5px solid #e5e7eb; border-radius:11px; font-size:15px; background:white; outline:none; }
    .textarea { resize:vertical; min-height:80px; font-family:inherit; }
    .submit-btn { width:100%; padding:14px; border:none; border-radius:14px; background:linear-gradient(135deg,#f59e0b,#d97706); color:white; font-size:16px; font-weight:700; cursor:pointer; min-height:52px; display:flex; align-items:center; justify-content:center; gap:8px; }
    .submit-btn:disabled { opacity:.5; }
    .error-msg { background:rgba(239,68,68,.08); color:#dc2626; padding:10px; border-radius:10px; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
    .success-msg { background:rgba(16,185,129,.08); color:#059669; padding:10px; border-radius:10px; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
    .loading-state { text-align:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #e0e0e0; border-top-color:#667eea; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }
    .spinner-sm { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ParentAbsenceExcuseComponent implements OnInit {
  private readonly parentService = inject(ParentService);
  private readonly rest = inject(RestService);

  loading = signal(false);
  sending = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  children = signal<any[]>([]);

  studentId = '';
  date = new Date().toISOString().split('T')[0];
  reason = '';
  notes = '';

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const dashboard = await lastValueFrom(this.parentService.getDashboard());
      this.children.set((dashboard as any)?.children ?? []);
    } catch { } finally { this.loading.set(false); }
  }

  async submit(): Promise<void> {
    this.sending.set(true); this.error.set(null); this.success.set(false);
    try {
      await lastValueFrom(this.rest.request<any, any>({
        method: 'POST', url: '/api/app/parent/submit-absence-excuse',
        body: { studentId: this.studentId, date: this.date, reason: this.reason, notes: this.notes || undefined },
      }));
      this.success.set(true);
      this.reason = ''; this.notes = '';
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'حدث خطأ');
    } finally { this.sending.set(false); }
  }
}
