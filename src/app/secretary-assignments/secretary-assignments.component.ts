import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { TeacherService, SecretaryTeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import type { SecretaryTeacherDto } from '@proxy/teachers/models';

@Component({
  selector: 'app-secretary-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container" dir="rtl">
      <div class="container py-4">
        <h2 class="mb-4"><i class="bi bi-person-lines-fill me-2"></i>إدارة ارتباط السكرتارية بالمعلمين</h2>

        <!-- Assign Form -->
        <div class="card mb-4">
          <div class="card-header fw-bold">ربط معلم بسكرتير</div>
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label">معرّف مستخدم السكرتير (User ID)</label>
                <input type="text" class="form-control" [(ngModel)]="secretaryUserId"
                       placeholder="GUID الخاص بالسكرتير" />
              </div>
              <div class="col-md-4">
                <label class="form-label">المعلم</label>
                <select class="form-select" [(ngModel)]="selectedTeacherId">
                  <option value="">-- اختر المعلم --</option>
                  <option *ngFor="let t of teachers()" [value]="t.id">{{ t.displayName }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <button class="btn btn-primary w-100" (click)="assign()"
                        [disabled]="!secretaryUserId || !selectedTeacherId || saving()">
                  <span *ngIf="saving()" class="spinner-border spinner-border-sm me-1"></span>
                  ربط
                </button>
              </div>
            </div>
            <div *ngIf="assignError()" class="alert alert-danger mt-3 mb-0">{{ assignError() }}</div>
            <div *ngIf="assignSuccess()" class="alert alert-success mt-3 mb-0">{{ assignSuccess() }}</div>
          </div>
        </div>

        <!-- View Assignments for Secretary -->
        <div class="card mb-4">
          <div class="card-header fw-bold">عرض معلمي سكرتير</div>
          <div class="card-body">
            <div class="input-group mb-3">
              <input type="text" class="form-control" [(ngModel)]="lookupSecretaryUserId"
                     placeholder="معرّف مستخدم السكرتير (User ID)" />
              <button class="btn btn-outline-secondary" (click)="loadAssignments()" [disabled]="!lookupSecretaryUserId || loadingAssignments()">
                <span *ngIf="loadingAssignments()" class="spinner-border spinner-border-sm me-1"></span>
                بحث
              </button>
            </div>

            <div *ngIf="assignments().length > 0">
              <table class="table table-bordered table-sm">
                <thead class="table-light">
                  <tr>
                    <th>المعلم</th>
                    <th>معرّف المعلم</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let a of assignments()">
                    <td>{{ a.teacherName }}</td>
                    <td><small class="text-muted">{{ a.teacherId }}</small></td>
                    <td>
                      <button class="btn btn-danger btn-sm" (click)="removeAssignment(a)"
                              [disabled]="removingId() === a.teacherId">
                        <span *ngIf="removingId() === a.teacherId" class="spinner-border spinner-border-sm"></span>
                        <span *ngIf="removingId() !== a.teacherId">إزالة</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="assignments().length === 0 && assignmentsLoaded()" class="alert alert-info mb-0">
              لا يوجد معلمون مرتبطون بهذا السكرتير
            </div>
          </div>
        </div>

        <!-- My Assigned Teachers (for SECRETARY role) -->
        <div class="card">
          <div class="card-header fw-bold">معلميّ (للسكرتير الحالي)</div>
          <div class="card-body">
            <button class="btn btn-outline-primary btn-sm mb-3" (click)="loadMyTeachers()" [disabled]="loadingMine()">
              <span *ngIf="loadingMine()" class="spinner-border spinner-border-sm me-1"></span>
              تحميل معلميّ
            </button>
            <div *ngIf="myTeachers().length > 0">
              <ul class="list-group">
                <li *ngFor="let t of myTeachers()" class="list-group-item">
                  <i class="bi bi-person-fill me-2 text-primary"></i>{{ t.teacherName }}
                </li>
              </ul>
            </div>
            <div *ngIf="myTeachers().length === 0 && myTeachersLoaded()" class="alert alert-info mb-0">
              لا يوجد معلمون مرتبطون بحسابك
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { min-height: calc(100vh - 200px); background: #f8f9fa; }
    .card { box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
    .card-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
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
      this.assignSuccess.set('تم ربط المعلم بالسكرتير بنجاح');
      this.selectedTeacherId = '';
      if (this.lookupSecretaryUserId === this.secretaryUserId) {
        await this.loadAssignments();
      }
    } catch (e: any) {
      this.assignError.set(e?.error?.error?.message || 'حدث خطأ أثناء الربط');
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
