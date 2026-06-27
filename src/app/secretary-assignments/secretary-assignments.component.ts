import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { TeacherService, SecretaryTeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import type { SecretaryTeacherDto } from '@proxy/teachers/models';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-secretary-assignments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header
        [title]="'تعيين السكرتارية'"
        [titleEn]="'Secretary Assignments'"
        [backTo]="'/secretary'"></app-page-header>

      <!-- Assign Section -->
      <div class="section">
        <div class="section-title"><i class="fas fa-link"></i> ربط معلم بسكرتير · Assign Teacher</div>
        <div class="card">
          <div class="form-field">
            <label class="field-label">معرّف مستخدم السكرتير · Secretary User ID</label>
            <input class="field-input" type="text" [(ngModel)]="secretaryUserId"
                   placeholder="GUID الخاص بالسكرتير" dir="ltr" />
          </div>
          <div class="form-field">
            <label class="field-label">المعلم · Teacher</label>
            <select class="field-select" [(ngModel)]="selectedTeacherId">
              <option value="">-- اختر المعلم --</option>
              @for (t of teachers(); track t.id) {
                <option [value]="t.id">{{ t.displayName }}</option>
              }
            </select>
          </div>
          <button class="btn-primary" (click)="assign()"
                  [disabled]="!secretaryUserId || !selectedTeacherId || saving()">
            @if (saving()) { <i class="fas fa-spinner fa-spin"></i> }
            @else { <i class="fas fa-link"></i> }
            ربط · Assign
          </button>

          @if (assignError()) {
            <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ assignError() }}</div>
          }
          @if (assignSuccess()) {
            <div class="msg msg--success"><i class="fas fa-check-circle"></i> {{ assignSuccess() }}</div>
          }
        </div>
      </div>

      <!-- Lookup Section -->
      <div class="section">
        <div class="section-title"><i class="fas fa-search"></i> عرض معلمي سكرتير · Lookup</div>
        <div class="card">
          <div class="search-row">
            <input class="field-input" type="text" [(ngModel)]="lookupSecretaryUserId"
                   placeholder="معرّف مستخدم السكرتير" dir="ltr" />
            <button class="btn-search" (click)="loadAssignments()"
                    [disabled]="!lookupSecretaryUserId || loadingAssignments()">
              @if (loadingAssignments()) { <i class="fas fa-spinner fa-spin"></i> }
              @else { <i class="fas fa-search"></i> }
            </button>
          </div>

          @if (assignments().length > 0) {
            <div class="list">
              @for (a of assignments(); track a.teacherId) {
                <div class="list-row">
                  <div class="list-avatar">
                    <i class="fas fa-chalkboard-teacher"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ a.teacherName }}</span>
                    <span class="list-sub">{{ a.teacherId }}</span>
                  </div>
                  <button class="btn-remove" (click)="removeAssignment(a)"
                          [disabled]="removingId() === a.teacherId">
                    @if (removingId() === a.teacherId) {
                      <i class="fas fa-spinner fa-spin"></i>
                    } @else {
                      <i class="fas fa-unlink"></i>
                    }
                  </button>
                </div>
              }
            </div>
          }
          @if (assignments().length === 0 && assignmentsLoaded()) {
            <div class="empty-msg">
              <i class="fas fa-inbox"></i>
              <span>لا يوجد معلمون مرتبطون · No assigned teachers</span>
            </div>
          }
        </div>
      </div>

      <!-- My Teachers -->
      <div class="section">
        <div class="section-title"><i class="fas fa-users"></i> معلميّ · My Teachers</div>
        <div class="card">
          <button class="btn-outline" (click)="loadMyTeachers()" [disabled]="loadingMine()">
            @if (loadingMine()) { <i class="fas fa-spinner fa-spin"></i> }
            @else { <i class="fas fa-sync"></i> }
            تحميل معلميّ · Load My Teachers
          </button>

          @if (myTeachers().length > 0) {
            <div class="list">
              @for (t of myTeachers(); track t.teacherId) {
                <div class="list-row">
                  <div class="list-avatar">
                    <i class="fas fa-chalkboard-teacher"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ t.teacherName }}</span>
                  </div>
                </div>
              }
            </div>
          }
          @if (myTeachers().length === 0 && myTeachersLoaded()) {
            <div class="empty-msg">
              <i class="fas fa-inbox"></i>
              <span>لا يوجد معلمون مرتبطون بحسابك · No teachers linked to your account</span>
            </div>
          }
        </div>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }

    .card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
      display:flex; flex-direction:column; gap:.75rem;
    }

    .form-field { display:flex; flex-direction:column; gap:.3rem; }
    .field-label { font-size:.78rem; font-weight:600; color:#555; }
    .field-input, .field-select {
      width:100%; padding:.7rem .875rem; border-radius:12px;
      border:1.5px solid #e5e7eb; font-size:.88rem; color:#1a1a2e;
      background:#fafaff; box-sizing:border-box; outline:none;
      transition:border-color .2s;
    }
    .field-input:focus, .field-select:focus { border-color:#667eea; }
    .field-select { appearance:auto; }

    .search-row { display:flex; gap:.5rem; }
    .search-row .field-input { flex:1; }
    .btn-search {
      width:48px; height:48px; border-radius:12px; border:none; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .btn-search:disabled { opacity:.5; cursor:not-allowed; }

    .btn-primary {
      width:100%; padding:.75rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.88rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:48px;
    }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }

    .btn-outline {
      width:100%; padding:.65rem; border-radius:12px;
      border:1.5px solid rgba(102,126,234,.25); background:rgba(102,126,234,.04);
      color:#667eea; font-size:.82rem; font-weight:600; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:44px;
    }
    .btn-outline:disabled { opacity:.5; cursor:not-allowed; }

    .msg {
      padding:.65rem .875rem; border-radius:10px; font-size:.82rem; font-weight:600;
      display:flex; align-items:center; gap:.35rem;
    }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }
    .msg--success { background:rgba(16,185,129,.08); color:#059669; }

    .list { display:flex; flex-direction:column; gap:.5rem; }
    .list-row {
      display:flex; align-items:center; gap:.75rem;
      padding:.75rem; border-radius:12px; background:#fafaff;
      border:1px solid #f0f0f0;
    }
    .list-avatar {
      width:40px; height:40px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:.9rem;
    }
    .list-info { flex:1; min-width:0; }
    .list-name { display:block; font-size:.88rem; font-weight:700; color:#1a1a2e; }
    .list-sub {
      display:block; font-size:.65rem; color:#9090aa; margin-top:.1rem;
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    }
    .btn-remove {
      width:40px; height:40px; border-radius:10px; border:none; flex-shrink:0;
      background:rgba(239,68,68,.08); color:#dc2626;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      font-size:.9rem;
    }
    .btn-remove:disabled { opacity:.5; cursor:not-allowed; }

    .empty-msg {
      text-align:center; padding:1rem; color:#9090aa; font-size:.82rem;
      display:flex; flex-direction:column; align-items:center; gap:.5rem;
    }
    .empty-msg i { font-size:1.5rem; color:#c4c4d4; }
  `]
})
export class SecretaryAssignmentsComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherService);
  private readonly secretaryTeacherSvc = inject(SecretaryTeacherService);

  teachers = signal<TeacherAutocompleteDto[]>([]);
  assignments = signal<SecretaryTeacherDto[]>([]);
  myTeachers = signal<SecretaryTeacherDto[]>([]);

  secretaryUserId = '';
  selectedTeacherId = '';
  lookupSecretaryUserId = '';

  saving = signal(false);
  assignError = signal('');
  assignSuccess = signal('');
  loadingAssignments = signal(false);
  assignmentsLoaded = signal(false);
  loadingMine = signal(false);
  myTeachersLoaded = signal(false);
  removingId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const result = await lastValueFrom(this.teacherSvc.getTeachersBySearch('', 100));
      this.teachers.set(result || []);
    } catch (e) {
      console.error('Error loading teachers:', e);
    }
  }

  async assign(): Promise<void> {
    if (!this.secretaryUserId || !this.selectedTeacherId) return;
    this.saving.set(true);
    this.assignError.set('');
    this.assignSuccess.set('');
    try {
      await lastValueFrom(this.secretaryTeacherSvc.assignTeacherToSecretary({
        secretaryUserId: this.secretaryUserId,
        teacherId: this.selectedTeacherId,
      }));
      this.assignSuccess.set('تم ربط المعلم بالسكرتير بنجاح · Teacher assigned successfully');
      this.selectedTeacherId = '';
      if (this.lookupSecretaryUserId === this.secretaryUserId) {
        await this.loadAssignments();
      }
    } catch (e: any) {
      this.assignError.set(e?.error?.error?.message || 'حدث خطأ أثناء الربط · Assignment failed');
    } finally {
      this.saving.set(false);
    }
  }

  async loadAssignments(): Promise<void> {
    if (!this.lookupSecretaryUserId) return;
    this.loadingAssignments.set(true);
    this.assignmentsLoaded.set(false);
    try {
      const teacherIds = await lastValueFrom(
        this.secretaryTeacherSvc.getTeacherIdsForSecretary(this.lookupSecretaryUserId)
      );
      const mapped: SecretaryTeacherDto[] = (teacherIds || []).map(tid => {
        const t = this.teachers().find(x => x.id === tid);
        return { id: '', secretaryUserId: this.lookupSecretaryUserId, teacherId: tid, teacherName: t?.displayName || tid } as any;
      });
      this.assignments.set(mapped);
      this.assignmentsLoaded.set(true);
    } catch (e) {
      console.error('Error loading assignments:', e);
    } finally {
      this.loadingAssignments.set(false);
    }
  }

  async removeAssignment(a: SecretaryTeacherDto): Promise<void> {
    this.removingId.set(a.teacherId);
    try {
      await lastValueFrom(
        this.secretaryTeacherSvc.removeTeacherFromSecretary(a.secretaryUserId, a.teacherId)
      );
      this.assignments.update(list => list.filter(x => x.teacherId !== a.teacherId));
    } catch (e) {
      console.error('Error removing assignment:', e);
    } finally {
      this.removingId.set(null);
    }
  }

  async loadMyTeachers(): Promise<void> {
    this.loadingMine.set(true);
    this.myTeachersLoaded.set(false);
    try {
      const result = await lastValueFrom(this.secretaryTeacherSvc.getTeachersForCurrentSecretary());
      this.myTeachers.set(result || []);
      this.myTeachersLoaded.set(true);
    } catch (e) {
      console.error('Error loading my teachers:', e);
    } finally {
      this.loadingMine.set(false);
    }
  }
}
