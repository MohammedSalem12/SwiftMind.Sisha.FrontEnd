import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface AcademicTermDto {
  id: string;
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  academicYear: string;
  termNumber: number;
}

interface CreateUpdateAcademicTermDto {
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  termNumber: number;
}

interface CopySemesterResultDto {
  enrollmentsCopied: number;
  enrollmentsSkipped: number;
  sourceTermName: string;
  targetTermName: string;
}

@Component({
  selector: 'app-academic-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <app-page-header [title]="'الفصول الدراسية'" [titleEn]="'Academic Terms'" [backTo]="'/'" [count]="terms().length">
        <button ph-actions class="ph-action" (click)="openCreateForm()" aria-label="إضافة فصل · Add term">
          <i class="fas fa-plus"></i>
        </button>
      </app-page-header>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadTerms()">
            <i class="fas fa-redo"></i>
            إعادة المحاولة · Retry
          </button>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && !error() && terms().length === 0) {
        <div class="empty-state">
          <i class="fas fa-calendar-alt"></i>
          <p>لا توجد فصول دراسية</p>
          <small>No academic semesters yet</small>
          <button class="retry-btn" (click)="openCreateForm()" style="margin-top: 1rem;">
            <i class="fas fa-plus"></i>
            إضافة فصل جديد
          </button>
        </div>
      }

      <!-- Terms list -->
      @if (!loading() && terms().length > 0) {
        <div class="terms-list">
          @for (term of terms(); track term.id) {
            <div class="term-card" [class.active-term]="term.isActive">
              <div class="term-card-header">
                <div class="term-info">
                  <div class="term-name">{{ term.nameAr }}</div>
                  <div class="term-name-en">{{ term.nameEn }}</div>
                </div>
                @if (term.isActive) {
                  <span class="active-badge">
                    <i class="fas fa-check-circle"></i>
                    نشط · Active
                  </span>
                }
              </div>

              <div class="term-details">
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="fas fa-graduation-cap"></i>
                    العام الدراسي
                  </span>
                  <span class="detail-value">{{ term.academicYear }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="fas fa-sort-numeric-up-alt"></i>
                    رقم الفصل
                  </span>
                  <span class="detail-value">{{ term.termNumber }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="fas fa-calendar-day"></i>
                    من
                  </span>
                  <span class="detail-value">{{ formatDate(term.startDate) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="fas fa-calendar-check"></i>
                    إلى
                  </span>
                  <span class="detail-value">{{ formatDate(term.endDate) }}</span>
                </div>
              </div>

              <div class="term-actions">
                @if (!term.isActive) {
                  <button class="action-btn action-activate" (click)="confirmActivate(term)">
                    <i class="fas fa-toggle-on"></i>
                    <span>تفعيل</span>
                  </button>
                }
                <button class="action-btn action-edit" (click)="openEditForm(term)">
                  <i class="fas fa-edit"></i>
                  <span>تعديل</span>
                </button>
                <button class="action-btn action-copy" (click)="openCopyDialog(term)">
                  <i class="fas fa-copy"></i>
                  <span>نسخ</span>
                </button>
                @if (!term.isActive) {
                  <button class="action-btn action-delete" (click)="confirmDelete(term)">
                    <i class="fas fa-trash-alt"></i>
                    <span>حذف</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══════════════════════════════════════════════
           MODAL OVERLAY — Create / Edit / Copy / Confirm
      ═══════════════════════════════════════════════ -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-sheet" (click)="$event.stopPropagation()">
            <div class="modal-handle"></div>

            <!-- ── Create / Edit Form ── -->
            @if (modalMode() === 'form') {
              <h2 class="modal-title">
                {{ editingTerm() ? 'تعديل الفصل · Edit Semester' : 'فصل جديد · New Semester' }}
              </h2>

              <div class="form-group">
                <label>الاسم بالعربية <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.nameAr" placeholder="مثال: الفصل الأول"
                       class="form-input" />
              </div>

              <div class="form-group">
                <label>الاسم بالإنجليزية <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.nameEn" placeholder="e.g. First Semester"
                       class="form-input" dir="ltr" />
              </div>

              <div class="form-group">
                <label>العام الدراسي <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.academicYear" placeholder="2025-2026"
                       class="form-input" dir="ltr" />
              </div>

              <div class="form-group">
                <label>رقم الفصل <span class="required">*</span></label>
                <select [(ngModel)]="formData.termNumber" class="form-input">
                  <option [ngValue]="1">1 - الأول</option>
                  <option [ngValue]="2">2 - الثاني</option>
                  <option [ngValue]="3">3 - الثالث</option>
                  <option [ngValue]="4">4 - الرابع</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group form-half">
                  <label>تاريخ البداية <span class="required">*</span></label>
                  <input type="date" [(ngModel)]="formData.startDate" class="form-input" dir="ltr" />
                </div>
                <div class="form-group form-half">
                  <label>تاريخ النهاية <span class="required">*</span></label>
                  <input type="date" [(ngModel)]="formData.endDate" class="form-input" dir="ltr" />
                </div>
              </div>

              @if (formError()) {
                <div class="form-error">
                  <i class="fas fa-exclamation-circle"></i>
                  {{ formError() }}
                </div>
              }

              <div class="modal-actions">
                <button class="btn-primary" (click)="saveTerm()" [disabled]="saving()">
                  @if (saving()) {
                    <i class="fas fa-spinner fa-spin"></i>
                  }
                  {{ editingTerm() ? 'حفظ التعديلات · Save' : 'إنشاء · Create' }}
                </button>
                <button class="btn-secondary" (click)="closeModal()">إلغاء · Cancel</button>
              </div>
            }

            <!-- ── Activate Confirmation ── -->
            @if (modalMode() === 'activate') {
              <div class="confirm-content">
                <div class="confirm-icon confirm-icon-activate">
                  <i class="fas fa-toggle-on"></i>
                </div>
                <h2 class="modal-title">تأكيد التفعيل</h2>
                <p class="confirm-text">
                  هل تريد تفعيل الفصل <strong>{{ selectedTerm()?.nameAr }}</strong>؟
                </p>
                <p class="confirm-text-en">
                  Activate <strong>{{ selectedTerm()?.nameEn }}</strong>?
                </p>
                <p class="confirm-warning">
                  <i class="fas fa-info-circle"></i>
                  سيتم إلغاء تفعيل الفصل الحالي تلقائياً
                </p>

                @if (formError()) {
                  <div class="form-error">
                    <i class="fas fa-exclamation-circle"></i>
                    {{ formError() }}
                  </div>
                }

                <div class="modal-actions">
                  <button class="btn-primary" (click)="activateTerm()" [disabled]="saving()">
                    @if (saving()) { <i class="fas fa-spinner fa-spin"></i> }
                    تفعيل · Activate
                  </button>
                  <button class="btn-secondary" (click)="closeModal()">إلغاء · Cancel</button>
                </div>
              </div>
            }

            <!-- ── Delete Confirmation ── -->
            @if (modalMode() === 'delete') {
              <div class="confirm-content">
                <div class="confirm-icon confirm-icon-delete">
                  <i class="fas fa-trash-alt"></i>
                </div>
                <h2 class="modal-title">تأكيد الحذف</h2>
                <p class="confirm-text">
                  هل تريد حذف الفصل <strong>{{ selectedTerm()?.nameAr }}</strong>؟
                </p>
                <p class="confirm-text-en">
                  Delete <strong>{{ selectedTerm()?.nameEn }}</strong>?
                </p>
                <p class="confirm-warning warning-danger">
                  <i class="fas fa-exclamation-triangle"></i>
                  هذا الإجراء لا يمكن التراجع عنه
                </p>

                @if (formError()) {
                  <div class="form-error">
                    <i class="fas fa-exclamation-circle"></i>
                    {{ formError() }}
                  </div>
                }

                <div class="modal-actions">
                  <button class="btn-danger" (click)="deleteTerm()" [disabled]="saving()">
                    @if (saving()) { <i class="fas fa-spinner fa-spin"></i> }
                    حذف · Delete
                  </button>
                  <button class="btn-secondary" (click)="closeModal()">إلغاء · Cancel</button>
                </div>
              </div>
            }

            <!-- ── Copy Dialog ── -->
            @if (modalMode() === 'copy') {
              <div class="confirm-content">
                <div class="confirm-icon confirm-icon-copy">
                  <i class="fas fa-copy"></i>
                </div>
                <h2 class="modal-title">نسخ التسجيلات إلى فصل آخر</h2>
                <p class="confirm-text-en">Copy Enrollments to Another Semester</p>

                <div class="copy-source">
                  <span class="copy-label">من · From:</span>
                  <span class="copy-value">{{ selectedTerm()?.nameAr }}</span>
                </div>

                <div class="form-group">
                  <label>إلى فصل · To Semester <span class="required">*</span></label>
                  <select [(ngModel)]="copyTargetId" class="form-input">
                    <option value="">-- اختر الفصل المستهدف --</option>
                    @for (t of otherTerms(); track t.id) {
                      <option [value]="t.id">{{ t.nameAr }} ({{ t.academicYear }})</option>
                    }
                  </select>
                </div>

                @if (formError()) {
                  <div class="form-error">
                    <i class="fas fa-exclamation-circle"></i>
                    {{ formError() }}
                  </div>
                }

                @if (copyResult()) {
                  <div class="copy-result">
                    <div class="copy-result-row success">
                      <i class="fas fa-check-circle"></i>
                      <span>تم نسخ {{ copyResult()!.enrollmentsCopied }} تسجيل</span>
                      <span class="copy-result-en">{{ copyResult()!.enrollmentsCopied }} copied</span>
                    </div>
                    @if (copyResult()!.enrollmentsSkipped > 0) {
                      <div class="copy-result-row skipped">
                        <i class="fas fa-forward"></i>
                        <span>تم تخطي {{ copyResult()!.enrollmentsSkipped }} (موجودة مسبقاً)</span>
                        <span class="copy-result-en">{{ copyResult()!.enrollmentsSkipped }} skipped</span>
                      </div>
                    }
                  </div>
                }

                <div class="modal-actions">
                  @if (!copyResult()) {
                    <button class="btn-primary" (click)="copyToSemester()" [disabled]="saving() || !copyTargetId">
                      @if (saving()) { <i class="fas fa-spinner fa-spin"></i> }
                      نسخ · Copy
                    </button>
                  }
                  <button class="btn-secondary" (click)="closeModal()">
                    {{ copyResult() ? 'إغلاق · Close' : 'إلغاء · Cancel' }}
                  </button>
                </div>
              </div>
            }

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --grad-start: #667eea;
      --grad-end:   #764ba2;
      --bg:         #f4f5fb;
      --white:      #ffffff;
      --text-dark:  #1a1a2e;
      --text-mid:   #4a4a6a;
      --text-light: #9090aa;
      --radius:     18px;
      --green:      #22c55e;
      --red:        #ef4444;
      --amber:      #f59e0b;
    }

    .page {
      min-height: 100vh;
      background: var(--bg);
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }

    /* ── Loading ── */
    .loading-area {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }
    .skeleton-card {
      height: 140px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Error / Empty ── */
    .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }
    .error-state i, .empty-state i {
      font-size: 3rem;
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    .error-state p, .empty-state p {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-mid);
      margin: 0 0 .25rem;
    }
    .empty-state small {
      font-size: .8rem;
      color: var(--text-light);
    }
    .retry-btn {
      margin-top: .75rem;
      padding: .5rem 1.25rem;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      color: var(--white);
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: .4rem;
      min-height: 44px;
    }

    /* ── Terms List ── */
    .terms-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .term-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 1rem;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
      transition: transform .15s;
    }
    .term-card.active-term {
      border: 2px solid var(--green);
      box-shadow: 0 2px 16px rgba(34,197,94,.15);
    }

    .term-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: .75rem;
    }
    .term-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-dark);
    }
    .term-name-en {
      font-size: .78rem;
      color: var(--text-light);
      margin-top: .1rem;
    }

    .active-badge {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      padding: .25rem .65rem;
      border-radius: 20px;
      background: rgba(34,197,94,.12);
      color: var(--green);
      font-size: .72rem;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .term-details {
      display: flex;
      flex-direction: column;
      gap: .4rem;
      margin-bottom: .75rem;
    }
    .detail-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: .82rem;
    }
    .detail-label {
      color: var(--text-light);
      display: flex;
      align-items: center;
      gap: .35rem;
    }
    .detail-label i { font-size: .75rem; width: 16px; text-align: center; }
    .detail-value {
      font-weight: 600;
      color: var(--text-dark);
    }

    /* ── Term Actions ── */
    .term-actions {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      padding-top: .75rem;
      border-top: 1px solid #f0f0f5;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: .35rem;
      padding: .45rem .75rem;
      border: none;
      border-radius: 10px;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      transition: transform .15s, opacity .15s;
    }
    .action-btn:active { transform: scale(.95); }
    .action-btn i { font-size: .8rem; }

    .action-activate {
      background: rgba(34,197,94,.1);
      color: var(--green);
    }
    .action-edit {
      background: rgba(102,126,234,.1);
      color: var(--grad-start);
    }
    .action-copy {
      background: rgba(245,158,11,.1);
      color: var(--amber);
    }
    .action-delete {
      background: rgba(239,68,68,.08);
      color: var(--red);
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 10000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .modal-sheet {
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      background: var(--white);
      border-radius: 24px 24px 0 0;
      padding: .75rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
      animation: slideUp .25s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    .modal-handle {
      width: 40px;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      margin: 0 auto .75rem;
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 1rem;
    }

    /* ── Form ── */
    .form-group {
      margin-bottom: .75rem;
    }
    .form-group label {
      display: block;
      font-size: .82rem;
      font-weight: 600;
      color: var(--text-mid);
      margin-bottom: .3rem;
    }
    .required { color: var(--red); }

    .form-input {
      width: 100%;
      padding: .65rem .85rem;
      border: 1.5px solid #e0e0ee;
      border-radius: 12px;
      font-size: .9rem;
      color: var(--text-dark);
      background: #fafafe;
      outline: none;
      transition: border-color .2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .form-input:focus {
      border-color: var(--grad-start);
      background: var(--white);
    }

    .form-row {
      display: flex;
      gap: .75rem;
    }
    .form-half { flex: 1; }

    .form-error {
      display: flex;
      align-items: center;
      gap: .4rem;
      padding: .6rem .75rem;
      border-radius: 10px;
      background: rgba(239,68,68,.08);
      color: var(--red);
      font-size: .82rem;
      font-weight: 600;
      margin-bottom: .75rem;
    }

    .modal-actions {
      display: flex;
      gap: .5rem;
      margin-top: 1rem;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      flex: 1;
      padding: .7rem 1rem;
      border: none;
      border-radius: 12px;
      font-size: .9rem;
      font-weight: 700;
      cursor: pointer;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .4rem;
      transition: transform .15s;
    }
    .btn-primary:active, .btn-secondary:active, .btn-danger:active {
      transform: scale(.97);
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      color: var(--white);
    }
    .btn-primary:disabled {
      opacity: .6;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: #f0f0f5;
      color: var(--text-mid);
    }
    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: var(--white);
    }
    .btn-danger:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    /* ── Confirm Dialog ── */
    .confirm-content {
      text-align: center;
    }
    .confirm-content .modal-title {
      text-align: center;
    }
    .confirm-icon {
      width: 64px; height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto .75rem;
    }
    .confirm-icon i { font-size: 1.5rem; }
    .confirm-icon-activate {
      background: rgba(34,197,94,.12);
      color: var(--green);
    }
    .confirm-icon-delete {
      background: rgba(239,68,68,.1);
      color: var(--red);
    }
    .confirm-icon-copy {
      background: rgba(245,158,11,.1);
      color: var(--amber);
    }

    .confirm-text {
      font-size: .92rem;
      color: var(--text-dark);
      margin: 0 0 .25rem;
    }
    .confirm-text-en {
      font-size: .8rem;
      color: var(--text-light);
      margin: 0 0 .75rem;
    }
    .confirm-warning {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .35rem;
      font-size: .8rem;
      color: var(--amber);
      font-weight: 600;
      margin: 0 0 .5rem;
    }
    .warning-danger {
      color: var(--red);
    }

    /* ── Copy Dialog ── */
    .copy-source {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .6rem .75rem;
      background: rgba(102,126,234,.06);
      border-radius: 10px;
      margin-bottom: .75rem;
      font-size: .85rem;
    }
    .copy-label {
      color: var(--text-light);
      font-weight: 600;
    }
    .copy-value {
      color: var(--grad-start);
      font-weight: 700;
    }

    .copy-result {
      display: flex;
      flex-direction: column;
      gap: .5rem;
      margin: .75rem 0;
    }
    .copy-result-row {
      display: flex;
      align-items: center;
      gap: .4rem;
      padding: .6rem .75rem;
      border-radius: 10px;
      font-size: .85rem;
      font-weight: 600;
    }
    .copy-result-row.success {
      background: rgba(34,197,94,.08);
      color: var(--green);
    }
    .copy-result-row.skipped {
      background: rgba(245,158,11,.08);
      color: var(--amber);
    }
    .copy-result-en {
      margin-right: auto;
      font-size: .75rem;
      opacity: .7;
    }

    /* ── Responsive ── */
    @media (min-width: 768px) {
      .terms-list {
        padding: 1.5rem 2rem;
      }
      .modal-sheet {
        border-radius: 24px;
        margin-bottom: 2rem;
      }
    }
  `],
})
export class AcademicTermsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = (environment as any).apis?.default?.url || '';

  // State
  terms = signal<AcademicTermDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal
  showModal = signal(false);
  modalMode = signal<'form' | 'activate' | 'delete' | 'copy'>('form');
  editingTerm = signal<AcademicTermDto | null>(null);
  selectedTerm = signal<AcademicTermDto | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  copyTargetId = '';
  copyResult = signal<CopySemesterResultDto | null>(null);

  formData: CreateUpdateAcademicTermDto = {
    nameAr: '',
    nameEn: '',
    startDate: '',
    endDate: '',
    academicYear: '',
    termNumber: 1,
  };

  otherTerms = signal<AcademicTermDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadTerms();
  }

  async loadTerms(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(
        this.http.get<{ items: AcademicTermDto[] }>(`${this.apiBase}/api/app/academic-term`, {
          params: { maxResultCount: '100' }
        })
      );
      this.terms.set(res?.items ?? []);
    } catch (err: any) {
      console.error('Error loading terms:', err);
      this.error.set('حدث خطأ أثناء تحميل الفصول الدراسية');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ── Create / Edit ──

  openCreateForm(): void {
    this.editingTerm.set(null);
    this.formData = { nameAr: '', nameEn: '', startDate: '', endDate: '', academicYear: '', termNumber: 1 };
    this.formError.set(null);
    this.modalMode.set('form');
    this.showModal.set(true);
  }

  openEditForm(term: AcademicTermDto): void {
    this.editingTerm.set(term);
    this.formData = {
      nameAr: term.nameAr,
      nameEn: term.nameEn,
      startDate: term.startDate ? term.startDate.substring(0, 10) : '',
      endDate: term.endDate ? term.endDate.substring(0, 10) : '',
      academicYear: term.academicYear,
      termNumber: term.termNumber,
    };
    this.formError.set(null);
    this.modalMode.set('form');
    this.showModal.set(true);
  }

  async saveTerm(): Promise<void> {
    if (!this.formData.nameAr || !this.formData.nameEn || !this.formData.academicYear
        || !this.formData.startDate || !this.formData.endDate) {
      this.formError.set('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    try {
      const body = {
        ...this.formData,
        startDate: new Date(this.formData.startDate).toISOString(),
        endDate: new Date(this.formData.endDate).toISOString(),
      };

      if (this.editingTerm()) {
        await lastValueFrom(
          this.http.put(`${this.apiBase}/api/app/academic-term/${this.editingTerm()!.id}`, body)
        );
      } else {
        await lastValueFrom(
          this.http.post(`${this.apiBase}/api/app/academic-term`, body)
        );
      }

      this.closeModal();
      await this.loadTerms();
    } catch (err: any) {
      console.error('Error saving term:', err);
      this.formError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Activate ──

  confirmActivate(term: AcademicTermDto): void {
    this.selectedTerm.set(term);
    this.formError.set(null);
    this.modalMode.set('activate');
    this.showModal.set(true);
  }

  async activateTerm(): Promise<void> {
    const term = this.selectedTerm();
    if (!term) return;

    this.saving.set(true);
    this.formError.set(null);
    try {
      await lastValueFrom(
        this.http.post(`${this.apiBase}/api/app/academic-term/${term.id}/activate`, {})
      );
      this.closeModal();
      await this.loadTerms();
    } catch (err: any) {
      console.error('Error activating term:', err);
      this.formError.set(err?.error?.error?.message || 'حدث خطأ أثناء التفعيل');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Delete ──

  confirmDelete(term: AcademicTermDto): void {
    this.selectedTerm.set(term);
    this.formError.set(null);
    this.modalMode.set('delete');
    this.showModal.set(true);
  }

  async deleteTerm(): Promise<void> {
    const term = this.selectedTerm();
    if (!term) return;

    this.saving.set(true);
    this.formError.set(null);
    try {
      await lastValueFrom(
        this.http.delete(`${this.apiBase}/api/app/academic-term/${term.id}`)
      );
      this.closeModal();
      await this.loadTerms();
    } catch (err: any) {
      console.error('Error deleting term:', err);
      this.formError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحذف');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Copy ──

  openCopyDialog(term: AcademicTermDto): void {
    this.selectedTerm.set(term);
    this.copyTargetId = '';
    this.copyResult.set(null);
    this.formError.set(null);
    this.otherTerms.set(this.terms().filter(t => t.id !== term.id));
    this.modalMode.set('copy');
    this.showModal.set(true);
  }

  async copyToSemester(): Promise<void> {
    if (!this.copyTargetId) {
      this.formError.set('يرجى اختيار الفصل المستهدف');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    try {
      const result = await lastValueFrom(
        this.http.post<CopySemesterResultDto>(
          `${this.apiBase}/api/app/academic-term/copy-groups-to-new-semester`,
          null,
          { params: { sourceTermId: this.selectedTerm()!.id, targetTermId: this.copyTargetId } }
        )
      );
      this.copyResult.set(result);
    } catch (err: any) {
      console.error('Error copying enrollments:', err);
      this.formError.set(err?.error?.error?.message || 'حدث خطأ أثناء النسخ');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Modal ──

  closeModal(): void {
    this.showModal.set(false);
    this.editingTerm.set(null);
    this.selectedTerm.set(null);
    this.formError.set(null);
    this.copyResult.set(null);
  }
}
