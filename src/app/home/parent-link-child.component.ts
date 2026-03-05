import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ParentDto } from '@proxy/parents/models';
import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';

@Component({
  selector: 'app-parent-link-child',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="link-child">
      <div class="container py-4">
        <button class="btn btn-link mb-3 p-0" (click)="goBack()">
          <i class="fas fa-arrow-right me-1"></i> العودة للرئيسية
        </button>

        <div class="form-card">
          <h2 class="mb-4"><i class="fas fa-link me-2"></i>ربط ابن/ابنة</h2>
          <p class="text-muted mb-4">أدخل كود الطالب لربطه بحسابك كولي أمر</p>

          <!-- Success Message -->
          <div *ngIf="successMessage()" class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage()" class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
          </div>

          <!-- Step 1: Search Student -->
          <div class="mb-4">
            <label class="form-label fw-bold">كود الطالب <span class="text-danger">*</span></label>
            <div class="input-group">
              <input type="text" class="form-control" [(ngModel)]="studentCode"
                     placeholder="أدخل كود الطالب" [disabled]="searching() || linking()">
              <button class="btn btn-primary" (click)="searchStudent()" [disabled]="!studentCode || searching() || linking()">
                <span *ngIf="searching()" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!searching()" class="fas fa-search me-1"></i>
                بحث
              </button>
            </div>
          </div>

          <!-- Student Found -->
          <div *ngIf="foundStudent()" class="student-found mb-4">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="avatar"><i class="fas fa-user-graduate"></i></div>
              <div>
                <h5 class="mb-0">{{ getStudentName() }}</h5>
                <small class="text-muted">{{ foundStudent()!.studentCode }}</small>
              </div>
            </div>

            <!-- Relationship Form -->
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">نوع العلاقة <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="relationshipType">
                  <option value="">اختر نوع العلاقة</option>
                  <option value="أب">أب</option>
                  <option value="أم">أم</option>
                  <option value="جد/جدة">جد/جدة</option>
                  <option value="عم/خال">عم/خال</option>
                  <option value="أخ/أخت">أخ/أخت</option>
                  <option value="وصي">وصي</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">ملاحظات</label>
                <input type="text" class="form-control" [(ngModel)]="notes" placeholder="ملاحظات إضافية (اختياري)">
              </div>
              <div class="col-md-6">
                <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="isEmergencyContact" id="emergencyCheck">
                  <label class="form-check-label" for="emergencyCheck">جهة اتصال طوارئ</label>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="canPickUp" id="pickupCheck">
                  <label class="form-check-label" for="pickupCheck">مصرح باستلام الطالب</label>
                </div>
              </div>
            </div>

            <button class="btn btn-success mt-4 w-100" (click)="linkChild()" [disabled]="!relationshipType || linking()">
              <span *ngIf="linking()" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!linking()" class="fas fa-link me-1"></i>
              ربط الطالب
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .link-child { min-height: calc(100vh - 200px); background: #f8f9fa; }
    .form-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 700px; }
    .form-card h2 { font-size: 1.5rem; font-weight: 600; color: #1a202c; }
    .student-found { background: #f0f9ff; border: 2px solid var(--ngx-primary); border-radius: 10px; padding: 1.25rem; }
    .avatar { width: 48px; height: 48px; background: var(--ngx-hero-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .avatar i { font-size: 1.25rem; color: white; }
    .btn-primary { background: var(--ngx-hero-gradient); border: none; }
    .btn-primary:hover { background: linear-gradient(135deg, #5568d3 0%, #6a4190 100%); }
    .btn-success { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border: none; padding: 0.75rem; font-weight: 500; }
  `],
})
export class ParentLinkChildComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly configStateService = inject(ConfigStateService);
  private readonly parentService = inject(ParentService);
  private readonly studentService = inject(StudentService);

  studentCode = '';
  relationshipType = '';
  notes = '';
  isEmergencyContact = false;
  canPickUp = true;

  foundStudent = signal<StudentDto | null>(null);
  currentParent = signal<ParentDto | null>(null);
  searching = signal(false);
  linking = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    const currentUserId = this.configStateService.getOne('currentUser')?.id;
    if (currentUserId) {
      try {
        const parent = await lastValueFrom(this.parentService.getByUserId(currentUserId));
        this.currentParent.set(parent);
      } catch (error) {
        console.error('Error loading parent info:', error);
      }
    }

    // Pre-fill student code from ?code= query param (e.g. scanned QR)
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.studentCode = codeParam;
      await this.searchStudent();
    }
  }

  async searchStudent(): Promise<void> {
    if (!this.studentCode.trim()) return;
    this.searching.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.foundStudent.set(null);

    try {
      const student = await lastValueFrom(
        this.studentService.getByStudentCode(this.studentCode.trim())
      );
      if (student) {
        this.foundStudent.set(student);
      } else {
        this.errorMessage.set('لم يتم العثور على طالب بهذا الكود');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      this.errorMessage.set('حدث خطأ أثناء البحث');
    } finally {
      this.searching.set(false);
    }
  }

  async linkChild(): Promise<void> {
    const student = this.foundStudent();
    const parent = this.currentParent();
    if (!student || !parent || !this.relationshipType) return;

    this.linking.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await lastValueFrom(
        this.parentService.enrollStudentToParent({
          parentId: parent.id!,
          studentId: student.id!,
          relationshipType: this.relationshipType,
          isEmergencyContact: this.isEmergencyContact,
          canPickUp: this.canPickUp,
          notes: this.notes || undefined,
        })
      );
      this.successMessage.set(`تم إرسال طلب الربط للطالب "${this.getStudentName()}" بنجاح. سيتم تأكيد الربط بعد موافقة الطالب.`);
      this.foundStudent.set(null);
      this.studentCode = '';
      this.relationshipType = '';
      this.notes = '';
      this.isEmergencyContact = false;
      this.canPickUp = true;
    } catch (error: any) {
      console.error('Error linking child:', error);
      const msg = error?.error?.error?.message || 'حدث خطأ أثناء ربط الطالب';
      this.errorMessage.set(msg);
    } finally {
      this.linking.set(false);
    }
  }

  getStudentName(): string {
    const s = this.foundStudent();
    if (!s) return '';
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }
}
