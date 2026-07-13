import { ChangeDetectionStrategy, Component, OnInit, inject, signal, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigStateService, RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { LinkCandidateStudentDto } from '@proxy/parents/models';
import type { ParentDto } from '@proxy/parents/models';
import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-parent-link-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="link-child-page">
      <app-page-header
        [title]="'ربط طالب جديد'"
        [titleEn]="'Link a Child'"
        [backTo]="'/parent'"></app-page-header>

      <!-- Freemium notice -->
      <div *ngIf="linkStatus() as ls" class="plan-notice" [class.plan-notice--paid]="ls.nextChildRequiresPayment">
        <i class="fas" [ngClass]="ls.nextChildRequiresPayment ? 'fa-crown' : 'fa-gift'"></i>
        <div class="plan-notice-text">
          <ng-container *ngIf="!ls.nextChildRequiresPayment">
            <span class="plan-notice-title">الطفل الأول مجاني</span>
            <span class="plan-notice-sub">First child is free · First child free</span>
          </ng-container>
          <ng-container *ngIf="ls.nextChildRequiresPayment">
            <span class="plan-notice-title">طفل إضافي — اشتراك {{ ls.pricePerChildPerMonthEGP }} ج.م/شهر</span>
            <span class="plan-notice-sub">Additional child — {{ ls.pricePerChildPerMonthEGP }} EGP/month subscription</span>
          </ng-container>
        </div>
      </div>

      <!-- Success Message -->
      <div *ngIf="successMessage()" class="alert success">
        <i class="fas fa-check-circle"></i>
        <span>{{ successMessage() }}</span>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage()" class="alert error">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ errorMessage() }}</span>
      </div>

      <!-- Search Method Tabs -->
      <div class="search-tabs" *ngIf="!foundStudent()">
        <button class="tab" [class.active]="searchMethod() === 'code'" 
                (click)="setSearchMethod('code')">
          <i class="fas fa-keyboard"></i>
          <span>كود الطالب</span>
        </button>
        <button class="tab" [class.active]="searchMethod() === 'qr'" 
                (click)="setSearchMethod('qr')">
          <i class="fas fa-qrcode"></i>
          <span>مسح QR</span>
        </button>
      </div>

      <!-- Search by Code -->
      <div class="search-section" *ngIf="searchMethod() === 'code' && !foundStudent()">
        <div class="search-card">
          <div class="search-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3>البحث عن الطالب</h3>
          <p>ابحث بالاسم أو رقم الهاتف أو كود الطالب</p>

          <div class="input-group">
            <input type="text"
                   [(ngModel)]="studentCode"
                   placeholder="الاسم أو الهاتف أو الكود · Name, phone or code"
                   [disabled]="searching()"
                   (keyup.enter)="searchStudent()">
            <button class="search-btn"
                    (click)="searchStudent()"
                    [disabled]="studentCode.trim().length < 3 || searching()">
              <span *ngIf="searching()" class="spinner"></span>
              <i *ngIf="!searching()" class="fas fa-search"></i>
            </button>
          </div>

          <p class="hint">
            <i class="fas fa-info-circle"></i>
            اكتب 3 أحرف على الأقل · At least 3 characters
          </p>
        </div>

        <!-- Search results -->
        <div class="results-list" *ngIf="results().length > 0">
          <p class="results-count">{{ results().length }} نتيجة · results</p>

          <button class="result-card"
                  *ngFor="let r of results()"
                  (click)="selectStudent(r)"
                  [class.result-card--linked]="r.alreadyLinked"
                  [disabled]="r.alreadyLinked">
            <div class="result-avatar">
              <img *ngIf="r.photoUrl" [src]="r.photoUrl" alt="" />
              <span *ngIf="!r.photoUrl">{{ (r.fullName || '?').charAt(0) }}</span>
            </div>

            <div class="result-info">
              <span class="result-name">{{ r.fullName }}</span>
              <span class="result-line">
                <i class="fas fa-graduation-cap"></i> {{ r.gradeName }}
              </span>
              <span class="result-line" *ngIf="r.address || r.town || r.government">
                <i class="fas fa-location-dot"></i> {{ addressOf(r) }}
              </span>
              <span class="result-code">
                <i class="fas fa-id-card"></i> {{ r.studentCode }}
              </span>
            </div>

            <span class="result-chip" *ngIf="r.alreadyLinked">مرتبط بالفعل</span>
            <i class="fas fa-chevron-left result-arrow" *ngIf="!r.alreadyLinked"></i>
          </button>
        </div>

        <div class="no-results" *ngIf="searched() && results().length === 0 && !searching()">
          <i class="fas fa-user-slash"></i>
          <p>لم يتم العثور على طلاب مطابقين</p>
        </div>
      </div>

      <!-- QR Scanner -->
      <div class="search-section" *ngIf="searchMethod() === 'qr' && !foundStudent()">
        <div class="qr-card">
          <div class="qr-scanner-area" [class.scanning]="isScanning()">
            <video #videoElement [hidden]="!isScanning()" autoplay playsinline></video>
            <div *ngIf="!isScanning()" class="qr-placeholder">
              <i class="fas fa-qrcode"></i>
              <p>اضغط للبدء</p>
            </div>
            <div class="scan-overlay" *ngIf="isScanning()">
              <div class="scan-frame"></div>
            </div>
          </div>
          
          <button *ngIf="!isScanning()" class="start-scan-btn" (click)="startQrScan()">
            <i class="fas fa-camera"></i>
            <span>فتح الكاميرا</span>
          </button>
          
          <button *ngIf="isScanning()" class="stop-scan-btn" (click)="stopQrScan()">
            <i class="fas fa-times"></i>
            <span>إيقاف</span>
          </button>
          
          <p class="hint">
            <i class="fas fa-info-circle"></i>
            وجّه الكاميرا نحو كود QR الخاص بالطالب
          </p>
        </div>
        
        <!-- Manual entry fallback -->
        <div class="manual-entry">
          <p>لا يمكنك مسح الكود؟</p>
          <button (click)="setSearchMethod('code')">أدخل الكود يدوياً</button>
        </div>
      </div>

      <!-- Student Found -->
      <div *ngIf="foundStudent()" class="student-result">
        <div class="result-card">
          <div class="student-header">
            <div class="student-avatar">
              <span>{{ getInitials() }}</span>
            </div>
            <div class="student-info">
              <h3>{{ getStudentName() }}</h3>
              <span class="student-code">{{ foundStudent()!.studentCode }}</span>
            </div>
            <button class="clear-btn" (click)="clearStudent()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Relationship Form -->
          <div class="form-section">
            <label class="form-label">نوع العلاقة <span class="required">*</span></label>
            <div class="relationship-grid">
              <button *ngFor="let rel of relationshipTypes" 
                      class="rel-btn" 
                      [class.selected]="relationshipType === rel.value"
                      (click)="relationshipType = rel.value">
                <i [class]="rel.icon"></i>
                <span>{{ rel.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label">ملاحظات (اختياري)</label>
            <input type="text" class="form-input" [(ngModel)]="notes" placeholder="أي ملاحظات إضافية...">
          </div>

          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" [(ngModel)]="isEmergencyContact">
              <span class="checkmark"></span>
              <span class="checkbox-label">
                <i class="fas fa-phone-alt"></i>
                جهة اتصال طوارئ
              </span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [(ngModel)]="canPickUp">
              <span class="checkmark"></span>
              <span class="checkbox-label">
                <i class="fas fa-car"></i>
                مصرح باستلام الطالب
              </span>
            </label>
          </div>

          <button class="submit-btn" 
                  (click)="linkChild()" 
                  [disabled]="!relationshipType || linking()">
            <span *ngIf="linking()" class="spinner white"></span>
            <i *ngIf="!linking()" class="fas fa-link"></i>
            <span>{{ linking() ? 'جاري الربط...' : 'ربط الطالب' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .link-child-page {
      min-height: 100vh;
      background: #f5f7fa;
      padding-bottom: 100px;
    }

    /* ─── Freemium notice ─── */
    .plan-notice {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 14px;
      background: #ecfdf5;
      border: 1.5px solid #a7f3d0;
    }
    .plan-notice--paid {
      background: #fff7ed;
      border-color: #fcd34d;
    }
    .plan-notice > i {
      font-size: 1.4rem;
      color: #059669;
      flex-shrink: 0;
    }
    .plan-notice--paid > i { color: #d97706; }
    .plan-notice-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .plan-notice-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #065f46;
    }
    .plan-notice--paid .plan-notice-title { color: #92400e; }
    .plan-notice-sub {
      font-size: 0.72rem;
      color: #6b7280;
    }

    /* ─── Alerts ─── */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem;
      padding: 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    .alert.success {
      background: #d1fae5;
      color: #065f46;
    }

    .alert.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .alert i {
      font-size: 1.25rem;
    }

    /* ─── Search Tabs ─── */
    .search-tabs {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      margin: 1rem;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f5f7fa;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab i {
      font-size: 1.5rem;
      color: #6b7280;
    }

    .tab span {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }

    .tab.active {
      background: #f0f4ff;
      border-color: #667eea;
    }

    .tab.active i {
      color: #667eea;
    }

    .tab.active span {
      color: #667eea;
    }

    /* ─── Search Section ─── */
    .search-section {
      padding: 0 1rem;
    }

    .search-card {
      background: white;
      border-radius: 16px;
      padding: 2rem 1.5rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .search-icon {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .search-icon i {
      font-size: 2rem;
      color: white;
    }

    .search-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.5rem;
    }

    .search-card > p {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
    }

    .input-group {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .input-group input {
      flex: 1;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 1rem;
      transition: border-color 0.2s;
      text-align: center;
      letter-spacing: 0.05em;
    }

    .input-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .search-btn {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, opacity 0.2s;
    }

    .search-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .search-btn:not(:disabled):hover {
      transform: scale(1.05);
    }

    .hint {
      font-size: 0.8rem;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0;
    }

    /* ─── Search results ─── */
    .results-list { margin-top: 1rem; }
    .results-count {
      font-size: .75rem; color: #9ca3af; margin: 0 0 .5rem; text-align: center;
    }

    .result-card {
      width: 100%;
      display: flex; align-items: center; gap: .75rem;
      padding: .75rem;
      min-height: 72px;              /* comfortably above the 44px tap target minimum */
      background: #fff;
      border: 1px solid #eef0f6;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
      text-align: start;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .result-card + .result-card { margin-top: .5rem; }
    .result-card:active:not(:disabled) { transform: scale(.99); }
    .result-card--linked { opacity: .6; cursor: default; }

    .result-avatar {
      width: 48px; height: 48px; flex: 0 0 48px;
      border-radius: 50%; overflow: hidden;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .result-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .result-info { display: flex; flex-direction: column; gap: .15rem; min-width: 0; flex: 1; }
    .result-name { font-size: .92rem; font-weight: 700; color: #1a1a2e; }
    .result-line, .result-code {
      font-size: .72rem; color: #6b7280;
      display: flex; align-items: center; gap: .35rem;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .result-code { color: #7c3aed; font-weight: 600; }

    .result-chip {
      font-size: .68rem; font-weight: 700; color: #047857;
      background: #ecfdf5; border: 1px solid #a7f3d0;
      padding: .25rem .5rem; border-radius: 999px; white-space: nowrap;
    }
    .result-arrow { color: #c7cbd6; }

    .no-results {
      text-align: center; padding: 1.5rem 1rem; color: #9ca3af;
    }
    .no-results i { font-size: 1.8rem; margin-bottom: .5rem; display: block; }
    .no-results p { margin: 0; font-size: .85rem; }

    /* ─── QR Scanner ─── */
    .qr-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .qr-scanner-area {
      width: 100%;
      aspect-ratio: 1;
      max-width: 300px;
      margin: 0 auto 1rem;
      background: #1a202c;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
    }

    .qr-scanner-area video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .qr-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #6b7280;
    }

    .qr-placeholder i {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #4b5563;
    }

    .qr-placeholder p {
      font-size: 0.9rem;
      margin: 0;
    }

    .scan-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scan-frame {
      width: 200px;
      height: 200px;
      border: 3px solid #667eea;
      border-radius: 16px;
      position: relative;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .start-scan-btn, .stop-scan-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 1rem;
    }

    .start-scan-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
    }

    .stop-scan-btn {
      background: #ef4444;
      border: none;
      color: white;
    }

    .manual-entry {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .manual-entry p {
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0 0 0.5rem;
    }

    .manual-entry button {
      background: none;
      border: none;
      color: #667eea;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }

    /* ─── Student Result ─── */
    .student-result {
      padding: 1rem;
    }

    .result-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f3f4f6;
      margin-bottom: 1.5rem;
    }

    .student-avatar {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .student-avatar span {
      font-size: 1.25rem;
      font-weight: 800;
      color: white;
    }

    .student-info {
      flex: 1;
    }

    .student-info h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.25rem;
    }

    .student-code {
      font-size: 0.85rem;
      color: #6b7280;
      font-family: monospace;
    }

    .clear-btn {
      width: 36px;
      height: 36px;
      background: #f3f4f6;
      border: none;
      border-radius: 10px;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .clear-btn:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    /* ─── Form ─── */
    .form-section {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .required {
      color: #ef4444;
    }

    .relationship-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .rel-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 0.75rem 0.5rem;
      background: #f5f7fa;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .rel-btn i {
      font-size: 1.1rem;
      color: #6b7280;
    }

    .rel-btn span {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
    }

    .rel-btn.selected {
      background: #f0f4ff;
      border-color: #667eea;
    }

    .rel-btn.selected i,
    .rel-btn.selected span {
      color: #667eea;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
    }

    /* ─── Checkboxes ─── */
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      position: relative;
      padding-right: 2rem;
    }

    .checkbox-item input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }

    .checkmark {
      position: absolute;
      right: 0;
      width: 22px;
      height: 22px;
      background: #f5f7fa;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .checkbox-item input:checked ~ .checkmark {
      background: #667eea;
      border-color: #667eea;
    }

    .checkmark::after {
      content: '';
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-item input:checked ~ .checkmark::after {
      display: block;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #374151;
    }

    .checkbox-label i {
      color: #9ca3af;
      font-size: 0.85rem;
    }

    /* ─── Submit Button ─── */
    .submit-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      border-radius: 14px;
      color: white;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submit-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    /* ─── Spinner ─── */
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner.white {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ─── Desktop ─── */
    @media (min-width: 768px) {
      .relationship-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `]
})
export class ParentLinkChildComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;
  
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rest = inject(RestService);
  private readonly configStateService = inject(ConfigStateService);
  private readonly parentService = inject(ParentService);
  private readonly studentService = inject(StudentService);
  
  private mediaStream: MediaStream | null = null;

  studentCode = '';
  results = signal<LinkCandidateStudentDto[]>([]);
  searched = signal(false);
  relationshipType = '';
  notes = '';
  isEmergencyContact = false;
  canPickUp = true;

  searchMethod = signal<'code' | 'qr'>('code');
  foundStudent = signal<StudentDto | null>(null);
  currentParent = signal<ParentDto | null>(null);
  searching = signal(false);
  linking = signal(false);
  isScanning = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  linkStatus = signal<{ freeQuota: number; linkedChildrenCount: number; pricePerChildPerMonthEGP: number; nextChildRequiresPayment: boolean } | null>(null);

  relationshipTypes = [
    { value: 'أب', label: 'أب', icon: 'fas fa-male' },
    { value: 'أم', label: 'أم', icon: 'fas fa-female' },
    { value: 'جد/جدة', label: 'جد/جدة', icon: 'fas fa-user-friends' },
    { value: 'عم/خال', label: 'عم/خال', icon: 'fas fa-user' },
    { value: 'أخ/أخت', label: 'أخ/أخت', icon: 'fas fa-users' },
    { value: 'وصي', label: 'وصي', icon: 'fas fa-user-shield' },
    { value: 'أخرى', label: 'أخرى', icon: 'fas fa-ellipsis-h' }
  ];

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

    // Load the freemium quota status so we can show the parent what the next link costs.
    try {
      const status = await lastValueFrom(
        this.rest.request<void, { freeQuota: number; linkedChildrenCount: number; pricePerChildPerMonthEGP: number; nextChildRequiresPayment: boolean }>(
          { method: 'GET', url: '/api/app/parent-child-subscription/my-child-link-status' })
      );
      this.linkStatus.set(status ?? null);
    } catch (error) {
      console.error('Error loading link status:', error);
    }

    // Pre-fill student code from ?code= query param (e.g. scanned QR)
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.studentCode = codeParam;
      await this.searchStudent();
    }
  }

  ngOnDestroy(): void {
    this.stopQrScan();
  }

  setSearchMethod(method: 'code' | 'qr'): void {
    this.searchMethod.set(method);
    this.errorMessage.set('');
    if (method === 'code') {
      this.stopQrScan();
    }
  }

  clearStudent(): void {
    this.foundStudent.set(null);
    this.studentCode = '';
    this.relationshipType = '';
    this.notes = '';
    this.isEmergencyContact = false;
    this.canPickUp = true;
  }

  async startQrScan(): Promise<void> {
    try {
      this.errorMessage.set('');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      this.isScanning.set(true);
      
      // Wait for viewchild to be available
      setTimeout(() => {
        if (this.videoRef?.nativeElement && this.mediaStream) {
          this.videoRef.nativeElement.srcObject = this.mediaStream;
          this.videoRef.nativeElement.play();
          this.scanQrCode();
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.errorMessage.set('لا يمكن الوصول للكاميرا. تأكد من منح الإذن.');
      this.isScanning.set(false);
    }
  }

  stopQrScan(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isScanning.set(false);
  }

  private scanQrCode(): void {
    if (!this.isScanning() || !this.videoRef?.nativeElement) return;

    const video = this.videoRef.nativeElement;
    
    // Check if BarcodeDetector is available (modern browsers)
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      
      const detect = async () => {
        if (!this.isScanning()) return;
        
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            this.handleQrResult(code);
            return;
          }
        } catch (err) {
          // Continue scanning
        }
        
        if (this.isScanning()) {
          requestAnimationFrame(detect);
        }
      };
      
      detect();
    } else {
      // Fallback: Manual entry suggestion
      this.errorMessage.set('مسح QR غير مدعوم في هذا المتصفح. استخدم الإدخال اليدوي.');
      this.stopQrScan();
      this.setSearchMethod('code');
    }
  }

  private handleQrResult(raw: string): void {
    this.stopQrScan();

    // QR may contain a full URL like .../parent/link-child?code=STU-2024-001
    // Extract just the student code from the "code" query param if present.
    try {
      const url = new URL(raw);
      const code = url.searchParams.get('code');
      if (code) {
        this.studentCode = code;
      } else {
        this.studentCode = raw;
      }
    } catch {
      // Not a URL — use raw value as the student code directly
      this.studentCode = raw;
    }

    this.searchStudent();
  }

  /**
   * Searches by name, phone, or student code. Code and phone match exactly; names match on a
   * contains. A QR scan yields an exact code, so it lands on a single result and auto-selects.
   */
  async searchStudent(): Promise<void> {
    const term = this.studentCode.trim();
    if (term.length < 3) {
      this.errorMessage.set('اكتب 3 أحرف على الأقل');
      return;
    }

    this.searching.set(true);
    this.searched.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.foundStudent.set(null);
    this.results.set([]);

    try {
      const found = await lastValueFrom(this.parentService.searchStudentsForLinking(term));
      this.results.set(found ?? []);
      this.searched.set(true);

      // An exact code match is unambiguous — skip the picker.
      const exact = (found ?? []).filter(r => r.studentCode === term && !r.alreadyLinked);
      if (exact.length === 1) await this.selectStudent(exact[0]);
    } catch (error) {
      console.error('Error searching student:', error);
      this.errorMessage.set('حدث خطأ أثناء البحث');
    } finally {
      this.searching.set(false);
    }
  }

  /** Loads the full student record for the chosen candidate and moves to the link form. */
  async selectStudent(candidate: LinkCandidateStudentDto): Promise<void> {
    if (candidate.alreadyLinked) return;

    this.searching.set(true);
    this.errorMessage.set('');
    try {
      const student = await lastValueFrom(this.studentService.get(candidate.id));
      this.foundStudent.set(student);
      this.results.set([]);
    } catch (error) {
      console.error('Error loading student:', error);
      this.errorMessage.set('تعذر تحميل بيانات الطالب');
    } finally {
      this.searching.set(false);
    }
  }

  /** Prefers the free-text address; falls back to town/governorate. */
  addressOf(r: LinkCandidateStudentDto): string {
    if (r.address?.trim()) return r.address;
    return [r.town, r.government].filter(v => v?.trim()).join('، ');
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
      this.clearStudent();
    } catch (error: any) {
      console.error('Error linking child:', error);
      // First child is free; an extra child requires a paid subscription. The backend
      // signals this with a specific error code — route the parent to the payment screen.
      if (error?.error?.error?.code === 'Sesha:ChildLinkPaymentRequired') {
        this.router.navigate(['/parent/child-subscription'], {
          queryParams: {
            studentId: student.id!,
            studentName: this.getStudentName(),
            studentCode: student.studentCode,
          },
        });
        return;
      }
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

  getInitials(): string {
    const name = this.getStudentName();
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
  }
}
