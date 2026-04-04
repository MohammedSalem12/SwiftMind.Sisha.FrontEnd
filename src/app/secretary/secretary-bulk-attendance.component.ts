import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { SecretaryTeacherService } from '@proxy/teachers';
import { AttendanceService } from '@proxy/attendances';

interface StudentRow {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  isAbsent: boolean;
  attendanceId?: string;
  marked: boolean;
}

@Component({
  selector: 'app-secretary-bulk-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/secretary'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1>تسجيل الحضور الجماعي · Bulk Attendance</h1>
      </div>

      <div class="page-body">
        <!-- Filters -->
        <div class="filters">
          <div class="field-group">
            <label class="field-label"><i class="fas fa-chalkboard-teacher"></i> المعلم</label>
            <select class="field-input" [(ngModel)]="selectedTeacherId" (ngModelChange)="onTeacherChange()">
              <option value="">-- اختر المعلم --</option>
              @for (t of teachers(); track t.teacherId) {
                <option [value]="t.teacherId">{{ t.teacherName }}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label class="field-label"><i class="fas fa-calendar"></i> التاريخ</label>
            <input type="date" class="field-input" [(ngModel)]="selectedDate" (ngModelChange)="loadStudents()" />
          </div>
        </div>

        @if (loadingStudents()) {
          <div class="loading-state"><div class="spinner"></div><p>جاري تحميل الطلاب...</p></div>
        } @else if (students().length > 0) {

          <!-- Summary -->
          <div class="summary-bar">
            <span>{{ students().length }} طالب</span>
            <span class="absent-count">{{ absentCount() }} غائب</span>
          </div>

          <!-- Student List -->
          @for (s of students(); track s.enrollmentId) {
            <div class="student-row" [class.absent]="s.isAbsent">
              <div class="student-info">
                <span class="student-name">{{ s.studentName }}</span>
              </div>
              <button class="toggle-btn" [class.is-absent]="s.isAbsent" (click)="toggleAbsent(s)">
                @if (s.isAbsent) {
                  <i class="fas fa-times-circle"></i> غائب
                } @else {
                  <i class="fas fa-check-circle"></i> حاضر
                }
              </button>
            </div>
          }

          <!-- Save Button -->
          <button class="save-btn" (click)="saveAll()" [disabled]="saving()">
            @if (saving()) { <div class="spinner-sm"></div> }
            @else { <i class="fas fa-save"></i> }
            حفظ الحضور · Save Attendance
          </button>

          @if (saveResult()) {
            <div class="success-msg"><i class="fas fa-check-circle"></i> {{ saveResult() }}</div>
          }
        } @else if (selectedTeacherId && selectedDate) {
          <div class="empty-state">
            <i class="fas fa-users-slash"></i>
            <p>لا يوجد طلاب لهذا المعلم في هذا التاريخ</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f5f7; }
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 20px 16px 16px; display: flex; align-items: center; gap: 12px;
    }
    .page-header h1 { font-size: 18px; margin: 0; font-weight: 600; }
    .back-btn {
      background: rgba(255,255,255,.2); border: none; color: white;
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .page-body { padding: 16px; }
    .filters { display: flex; gap: 10px; margin-bottom: 16px; }
    .field-group { flex: 1; }
    .field-label { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; display: block; i { color: #667eea; } }
    .field-input {
      width: 100%; padding: 10px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; background: white;
    }
    .summary-bar {
      display: flex; justify-content: space-between; padding: 10px 14px;
      background: white; border-radius: 10px; margin-bottom: 10px; font-size: 14px; font-weight: 600;
    }
    .absent-count { color: #dc2626; }
    .student-row {
      display: flex; align-items: center; justify-content: space-between;
      background: white; border-radius: 12px; padding: 12px 14px;
      margin-bottom: 6px; box-shadow: 0 1px 3px rgba(0,0,0,.03);
      transition: background .2s;
    }
    .student-row.absent { background: rgba(239,68,68,.04); }
    .student-name { font-size: 14px; font-weight: 500; color: #1a1a2e; }
    .toggle-btn {
      border: none; border-radius: 10px; padding: 8px 16px;
      font-size: 13px; font-weight: 700; cursor: pointer; min-height: 40px;
      display: flex; align-items: center; gap: 6px;
      background: rgba(16,185,129,.1); color: #059669;
    }
    .toggle-btn.is-absent { background: rgba(239,68,68,.1); color: #dc2626; }
    .save-btn {
      width: 100%; margin-top: 16px; padding: 14px; border: none; border-radius: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2); color: white;
      font-size: 16px; font-weight: 700; cursor: pointer; min-height: 52px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .save-btn:disabled { opacity: .5; }
    .success-msg {
      background: rgba(16,185,129,.08); color: #059669; padding: 10px; border-radius: 10px;
      font-size: 13px; margin-top: 10px; display: flex; align-items: center; gap: 6px; text-align: center; justify-content: center;
    }
    .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .empty-state i { font-size: 48px; color: #ccc; display: block; margin-bottom: 12px; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e0e0e0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .8s linear infinite; margin: 0 auto 12px;
    }
    .spinner-sm {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SecretaryBulkAttendanceComponent implements OnInit {
  readonly router = inject(Router);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);
  private readonly attendanceService = inject(AttendanceService);

  teachers = signal<any[]>([]);
  students = signal<StudentRow[]>([]);
  loadingStudents = signal(false);
  saving = signal(false);
  saveResult = signal<string | null>(null);

  selectedTeacherId = '';
  selectedDate = new Date().toISOString().split('T')[0];

  absentCount = () => this.students().filter(s => s.isAbsent).length;

  async ngOnInit(): Promise<void> {
    try {
      const list = await lastValueFrom(this.secretaryTeacherService.getTeachersForCurrentSecretary());
      this.teachers.set(list ?? []);
    } catch { /* ignore */ }
  }

  onTeacherChange(): void {
    this.students.set([]);
    this.saveResult.set(null);
    if (this.selectedTeacherId && this.selectedDate) this.loadStudents();
  }

  async loadStudents(): Promise<void> {
    if (!this.selectedTeacherId || !this.selectedDate) return;
    this.loadingStudents.set(true);
    this.saveResult.set(null);
    try {
      const result = await lastValueFrom(this.attendanceService.getStudentAttendanceStatus({
        date: this.selectedDate,
        teacherId: this.selectedTeacherId,
        maxResultCount: 200,
        skipCount: 0,
      } as any));

      this.students.set((result?.items ?? []).map((s: any) => ({
        studentId: s.studentId,
        studentName: s.fullName || `${s.firstName} ${s.lastName}`,
        enrollmentId: s.enrollmentId,
        isAbsent: s.isAbsent ?? false,
        attendanceId: s.attendanceId,
        marked: !!s.attendanceId,
      })));
    } catch (e) {
      console.error('Error loading students:', e);
    } finally {
      this.loadingStudents.set(false);
    }
  }

  toggleAbsent(student: StudentRow): void {
    student.isAbsent = !student.isAbsent;
    this.students.update(list => [...list]); // trigger signal
  }

  async saveAll(): Promise<void> {
    const toMark = this.students().filter(s => s.isAbsent && !s.marked);
    if (toMark.length === 0) {
      this.saveResult.set('لا توجد تغييرات لحفظها · No changes to save');
      return;
    }
    this.saving.set(true);
    let success = 0;
    let fail = 0;
    for (const s of toMark) {
      try {
        await lastValueFrom(this.attendanceService.create({
          enrollmentId: s.enrollmentId,
          date: new Date(this.selectedDate).toISOString(),
          isAbsent: true,
          note: 'سجّل بواسطة السكرتير',
        } as any));
        s.marked = true;
        success++;
      } catch {
        fail++;
      }
    }
    this.saving.set(false);
    this.saveResult.set(`تم تسجيل غياب ${success} طالب · Marked ${success} students absent` +
      (fail > 0 ? ` (${fail} فشل)` : ''));
  }
}
