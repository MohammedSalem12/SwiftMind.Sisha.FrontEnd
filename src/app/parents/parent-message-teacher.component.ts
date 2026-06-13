import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ParentService } from '@proxy/parents';
import { RestService } from '@abp/ng.core';

@Component({
  selector: 'app-parent-message-teacher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/parent'])"><i class="fas fa-arrow-right"></i></button>
        <h1>رسالة للمعلم · Message Teacher</h1>
      </div>
      <div class="page-body">
        @if (loading()) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else {
          <div class="field-group">
            <label class="field-label"><i class="fas fa-child"></i> الطالب · Child</label>
            <select class="field-input" [(ngModel)]="selectedStudentId" (ngModelChange)="onChildChange()">
              <option value="">-- اختر الطالب --</option>
              @for (c of children(); track c.studentId) {
                <option [value]="c.studentId">{{ c.studentName }}</option>
              }
            </select>
          </div>
          @if (teachers().length > 0) {
            <div class="field-group">
              <label class="field-label"><i class="fas fa-chalkboard-teacher"></i> المعلم · Teacher</label>
              <select class="field-input" [(ngModel)]="selectedTeacherId">
                <option value="">-- اختر المعلم --</option>
                @for (t of teachers(); track t.id) {
                  <option [value]="t.id">{{ t.name }} - {{ t.course }}</option>
                }
              </select>
            </div>
          }
          <div class="field-group">
            <label class="field-label"><i class="fas fa-heading"></i> الموضوع · Subject</label>
            <input class="field-input" [(ngModel)]="subject" placeholder="موضوع الرسالة" maxlength="200" />
          </div>
          <div class="field-group">
            <label class="field-label"><i class="fas fa-pen"></i> الرسالة · Message</label>
            <textarea class="field-input textarea" [(ngModel)]="message" rows="4" placeholder="اكتب رسالتك هنا..."></textarea>
          </div>
          @if (error()) { <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div> }
          @if (success()) { <div class="success-msg"><i class="fas fa-check-circle"></i> تم إرسال الرسالة بنجاح! · Message sent!</div> }
          <button class="submit-btn" (click)="send()" [disabled]="sending() || !selectedStudentId || !selectedTeacherId || !subject || !message">
            @if (sending()) { <div class="spinner-sm"></div> } @else { <i class="fas fa-paper-plane"></i> }
            إرسال · Send
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f5f5f7; }
    .page-header { background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:20px 16px 16px; display:flex; align-items:center; gap:12px; }
    .page-header h1 { font-size:18px; margin:0; font-weight:600; }
    .back-btn { background:rgba(255,255,255,.2); border:none; color:white; width:36px; height:36px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .page-body { padding:16px; }
    .field-group { margin-bottom:14px; }
    .field-label { font-size:13px; font-weight:600; color:#555; margin-bottom:5px; display:block; i { color:#667eea; margin-left:4px; } }
    .field-input { width:100%; padding:11px; border:1.5px solid #e5e7eb; border-radius:11px; font-size:15px; background:white; outline:none; }
    .field-input:focus { border-color:#667eea; }
    .textarea { resize:vertical; min-height:100px; font-family:inherit; }
    .submit-btn { width:100%; padding:14px; border:none; border-radius:14px; background:linear-gradient(135deg,#667eea,#764ba2); color:white; font-size:16px; font-weight:700; cursor:pointer; min-height:52px; display:flex; align-items:center; justify-content:center; gap:8px; }
    .submit-btn:disabled { opacity:.5; }
    .error-msg { background:rgba(239,68,68,.08); color:#dc2626; padding:10px; border-radius:10px; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
    .success-msg { background:rgba(16,185,129,.08); color:#059669; padding:10px; border-radius:10px; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
    .loading-state { text-align:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #e0e0e0; border-top-color:#667eea; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }
    .spinner-sm { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ParentMessageTeacherComponent implements OnInit {
  readonly router = inject(Router);
  private readonly parentService = inject(ParentService);
  private readonly rest = inject(RestService);

  loading = signal(false);
  sending = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  children = signal<any[]>([]);
  teachers = signal<{id: string; name: string; course: string}[]>([]);

  selectedStudentId = '';
  selectedTeacherId = '';
  subject = '';
  message = '';

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const dashboard = await lastValueFrom(this.parentService.getDashboard());
      this.children.set((dashboard as any)?.children ?? []);
    } catch { } finally { this.loading.set(false); }
  }

  async onChildChange(): Promise<void> {
    this.selectedTeacherId = '';
    this.teachers.set([]);
    if (!this.selectedStudentId) return;
    try {
      const child = this.children().find((c: any) => c.studentId === this.selectedStudentId);
      const courses = (child as any)?.courses ?? [];
      const teacherMap = new Map<string, {id: string; name: string; course: string}>();
      for (const c of courses) {
        const tid = c.teacherId;
        if (tid && !teacherMap.has(tid)) {
          teacherMap.set(tid, { id: tid, name: c.teacherName || 'معلم', course: c.courseNameAr || c.courseNameEn || '' });
        }
      }
      this.teachers.set([...teacherMap.values()]);
    } catch { }
  }

  async send(): Promise<void> {
    this.sending.set(true); this.error.set(null); this.success.set(false);
    try {
      await lastValueFrom(this.rest.request<any, any>({
        method: 'POST', url: '/api/app/parent/send-message-to-teacher',
        body: { studentId: this.selectedStudentId, teacherId: this.selectedTeacherId, subject: this.subject, message: this.message },
      }));
      this.success.set(true);
      this.subject = ''; this.message = '';
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'حدث خطأ');
    } finally { this.sending.set(false); }
  }
}
