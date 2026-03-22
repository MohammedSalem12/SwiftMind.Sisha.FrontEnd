import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { environment } from '../../environments/environment';

interface AdvertiserDto {
  id: string;
  name: string;
  nameEn?: string;
  type: number;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  address?: string;
  websiteUrl?: string;
  isApproved: boolean;
  userId?: string;
  creationTime?: string;
}

interface CreateAdvertiserForm {
  name: string;
  nameEn: string;
  type: number;
  contactPhone: string;
  contactEmail: string;
  description: string;
  address: string;
  websiteUrl: string;
  createUser: boolean;
  userName: string;
  password: string;
}

@Component({
  selector: 'app-advertiser-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()"><i class="fas fa-arrow-right"></i></button>
          <div class="header-text">
            <h1>ادارة المعلنين</h1>
            <p>Advertiser Management</p>
          </div>
          <div class="header-icon"><i class="fas fa-store"></i></div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <button class="btn-create" (click)="showForm.set(!showForm())">
          <i class="fas" [class.fa-plus]="!showForm()" [class.fa-times]="showForm()"></i>
          {{ showForm() ? 'الغاء · Cancel' : 'اضافة معلن · Add' }}
        </button>
        <span class="total-count" *ngIf="totalCount() > 0">{{ totalCount() }} معلن · advertisers</span>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <i class="fas fa-search search-icon"></i>
        <input class="search-input" type="text" placeholder="بحث بالاسم أو البريد · Search..."
               [(ngModel)]="searchQuery"
               (ngModelChange)="filterAdvertisers()" />
      </div>

      <!-- Create Form -->
      @if (showForm()) {
        <div class="form-card">
          <div class="form-title"><i class="fas fa-plus-circle"></i> معلن جديد · New Advertiser</div>

          <div class="form-group">
            <label>الاسم <span class="req">*</span></label>
            <input type="text" [(ngModel)]="form.name" placeholder="اسم المعلن" />
          </div>

          <div class="form-group">
            <label>الاسم بالانجليزية</label>
            <input type="text" [(ngModel)]="form.nameEn" placeholder="Name in English" dir="ltr" />
          </div>

          <div class="form-group">
            <label>النوع <span class="req">*</span></label>
            <select [(ngModel)]="form.type">
              <option [ngValue]="0">معلم · Teacher</option>
              <option [ngValue]="1">مكتبة · Library</option>
              <option [ngValue]="2">قرطاسية · Bookstore</option>
              <option [ngValue]="3">مركز تعليمي · Educational Center</option>
              <option [ngValue]="4">اخرى · Other</option>
            </select>
          </div>

          <div class="form-group">
            <label>رقم الهاتف <span class="req">*</span></label>
            <input type="tel" [(ngModel)]="form.contactPhone" placeholder="05XXXXXXXX" dir="ltr" />
          </div>

          <div class="form-group">
            <label>البريد الالكتروني <span class="req">*</span></label>
            <input type="email" [(ngModel)]="form.contactEmail" placeholder="email@example.com" dir="ltr" />
          </div>

          <div class="form-group">
            <label>الوصف</label>
            <textarea [(ngModel)]="form.description" placeholder="وصف المعلن" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>العنوان</label>
            <input type="text" [(ngModel)]="form.address" placeholder="العنوان" />
          </div>

          <div class="form-group">
            <label>الموقع الالكتروني</label>
            <input type="url" [(ngModel)]="form.websiteUrl" placeholder="https://..." dir="ltr" />
          </div>

          <!-- Create User Toggle -->
          <div class="toggle-row" (click)="form.createUser = !form.createUser">
            <div class="toggle-info">
              <span class="toggle-label">انشاء حساب مستخدم</span>
              <span class="toggle-sub">Create user account</span>
            </div>
            <button type="button" class="toggle-btn" [class.toggle-btn--on]="form.createUser">
              <span class="toggle-knob"></span>
            </button>
          </div>

          @if (form.createUser) {
            <div class="user-fields">
              <div class="form-group">
                <label>رقم الموبايل أو اسم مستخدم <span class="req">*</span></label>
                <span class="field-hint">سيتم استخدامه لتسجيل الدخول · Will be used for login</span>
                <input type="text" [(ngModel)]="form.userName" placeholder="01XXXXXXXXX / username" dir="ltr" />
              </div>
              <div class="form-group">
                <label>كلمة المرور <span class="req">*</span></label>
                <span class="field-hint">يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص · Must include uppercase, lowercase, number & special char</span>
                <input type="password" [(ngModel)]="form.password" placeholder="e.g. Pass@123" dir="ltr" />
              </div>
            </div>
          }

          @if (formError()) {
            <div class="form-error"><i class="fas fa-exclamation-circle"></i> {{ formError() }}</div>
          }

          <button class="btn-submit" (click)="createAdvertiser()" [disabled]="submitting()">
            @if (submitting()) {
              <i class="fas fa-spinner fa-spin"></i> جاري الحفظ...
            } @else {
              <i class="fas fa-check"></i> حفظ المعلن
            }
          </button>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {
        @if (advertisers().length === 0) {
          <div class="empty-state">
            <i class="fas fa-store-slash"></i>
            <p>لا يوجد معلنون</p>
            <span>No advertisers yet</span>
          </div>
        }

        <div class="cards-list">
          @for (adv of filteredList(); track adv.id) {
            <div class="adv-card" [class.adv-card--pending]="!adv.isApproved">
              <div class="adv-card-main">
                <div class="adv-avatar" [class]="getTypeClass(adv.type)">
                  {{ adv.name?.charAt(0) || '?' }}
                </div>
                <div class="adv-info">
                  <div class="adv-name-row">
                    <h3 class="adv-name">{{ adv.name }}</h3>
                    <div class="status-dot" [class.status-dot--approved]="adv.isApproved" [class.status-dot--pending]="!adv.isApproved"></div>
                  </div>
                  @if (adv.nameEn) { <span class="adv-name-en">{{ adv.nameEn }}</span> }
                  <div class="adv-chips">
                    <span class="adv-type-chip" [class]="getTypeClass(adv.type)">{{ getTypeLabel(adv.type) }}</span>
                    @if (adv.userId) {
                      <span class="chip-linked"><i class="fas fa-link"></i></span>
                    }
                  </div>
                </div>
              </div>

              <div class="adv-meta">
                @if (adv.contactPhone) { <span><i class="fas fa-phone"></i> {{ adv.contactPhone }}</span> }
                @if (adv.contactEmail) { <span><i class="fas fa-envelope"></i> {{ adv.contactEmail }}</span> }
              </div>

              <div class="adv-actions">
                @if (!adv.isApproved) {
                  <button class="btn-action btn-approve" (click)="approveAdvertiser(adv.id)" [disabled]="actionLoading()">
                    <i class="fas fa-check"></i> موافقة
                  </button>
                } @else {
                  <button class="btn-action btn-reject-sm" (click)="rejectAdvertiser(adv.id)" [disabled]="actionLoading()">
                    <i class="fas fa-ban"></i> إيقاف
                  </button>
                }
                <button class="btn-action btn-delete" (click)="confirmDelete(adv)" [disabled]="actionLoading()">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalCount() > pageSize) {
          <div class="pagination">
            <button class="page-btn" (click)="prevPage()" [disabled]="currentPage() <= 0">
              <i class="fas fa-chevron-right"></i>
            </button>
            <span class="page-info">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <button class="page-btn" (click)="nextPage()" [disabled]="currentPage() >= totalPages() - 1">
              <i class="fas fa-chevron-left"></i>
            </button>
          </div>
        }
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteTarget()) {
        <div class="modal-overlay" (click)="deleteTarget.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h3>حذف المعلن</h3>
            <p>هل انت متاكد من حذف <strong>{{ deleteTarget()!.name }}</strong>؟</p>
            <p class="modal-sub">This action cannot be undone.</p>
            <div class="modal-actions">
              <button class="btn-modal-cancel" (click)="deleteTarget.set(null)">الغاء</button>
              <button class="btn-modal-delete" (click)="deleteAdvertiser()" [disabled]="actionLoading()">
                @if (actionLoading()) {
                  <i class="fas fa-spinner fa-spin"></i>
                } @else {
                  <i class="fas fa-trash"></i> حذف
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Success Modal -->
      @if (createdInfo()) {
        <div class="modal-overlay" (click)="createdInfo.set(null)">
          <div class="modal-card success-modal" (click)="$event.stopPropagation()">
            <div class="success-icon"><i class="fas fa-check-circle"></i></div>
            <h3>تم انشاء المعلن بنجاح</h3>
            <p class="success-sub">Advertiser created successfully</p>

            <div class="credentials-box">
              <div class="cred-row">
                <span class="cred-label"><i class="fas fa-user"></i> تسجيل الدخول · Login</span>
                <span class="cred-value" dir="ltr">{{ createdInfo()!.userName }}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label"><i class="fas fa-key"></i> كلمة المرور · Password</span>
                <span class="cred-value" dir="ltr">{{ createdInfo()!.password }}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label"><i class="fas fa-hashtag"></i> كود المعلن · Advertiser Code</span>
                <span class="cred-value" dir="ltr">{{ createdInfo()!.code }}</span>
              </div>
              <span class="cred-hint"><i class="fas fa-info-circle"></i> كود المعلن يُستخدم للتعريف والربط مع العروض والصفقات · The code is used for identification and linking with deals</span>
            </div>

            <div class="cred-warning">
              <i class="fas fa-exclamation-triangle"></i>
              احفظ هذه البيانات — لن تظهر مرة اخرى
              <br/><small>Save these credentials — they won't be shown again</small>
            </div>

            <button class="btn-submit" (click)="createdInfo.set(null)">
              <i class="fas fa-check"></i> تم · Done
            </button>
          </div>
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + .75rem) 1.25rem 1rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-row {
      position:relative; z-index:1; display:flex; align-items:center; gap:.75rem;
    }
    .btn-back {
      width:44px; height:44px; border-radius:12px; border:none;
      background:rgba(255,255,255,.15); color:#fff; font-size:1.1rem;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      -webkit-tap-highlight-color:transparent; flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-text p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:44px; height:44px; border-radius:12px;
      background:rgba(255,255,255,.15); color:#fff; font-size:1.2rem;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }

    .action-bar {
      display:flex; align-items:center; justify-content:space-between;
      padding:1rem 1rem .5rem;
    }
    .btn-create {
      padding:.6rem 1rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.82rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; gap:.35rem; min-height:44px;
      -webkit-tap-highlight-color:transparent;
    }
    .total-count { font-size:.72rem; color:#9090aa; font-weight:600; }

    .search-bar {
      display:flex; align-items:center; gap:.5rem;
      margin:0 1rem .5rem; padding:0 .75rem;
      background:#fff; border-radius:12px; border:1.5px solid #e5e7eb;
      min-height:44px;
    }
    .search-icon { color:#9090aa; font-size:.8rem; flex-shrink:0; }
    .search-input {
      flex:1; border:none; outline:none; background:transparent;
      font-size:16px; font-family:inherit; color:#1a1a2e; min-height:44px;
      &::placeholder { color:#b0b0c0; font-size:.82rem; }
    }

    /* Form */
    .form-card {
      margin:.5rem 1rem; background:#fff; border-radius:16px;
      border:1.5px solid #f0f0f0; padding:1rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .form-title {
      font-size:.85rem; font-weight:700; color:#667eea; margin-bottom:1rem;
      display:flex; align-items:center; gap:.4rem;
    }
    .form-group { margin-bottom:.75rem; }
    .form-group label {
      display:block; font-size:.78rem; font-weight:600; color:#555; margin-bottom:.3rem;
    }
    .req { color:#dc2626; }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width:100%; padding:.6rem .75rem; border-radius:10px; border:1.5px solid #e5e7eb;
      font-size:.85rem; color:#1a1a2e; background:#fafafe;
      box-sizing:border-box; min-height:44px; outline:none;
      transition:border-color .2s;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      border-color:#667eea;
    }
    .form-group textarea { min-height:80px; resize:vertical; }

    .toggle-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:.75rem 0; border-top:1px solid #f0f0f4; margin-top:.5rem;
      cursor:pointer; -webkit-tap-highlight-color:transparent;
    }
    .toggle-info { display:flex; flex-direction:column; gap:.1rem; }
    .toggle-label { font-size:.82rem; font-weight:600; color:#1a1a2e; }
    .toggle-sub { font-size:.7rem; color:#9090aa; }
    .toggle-btn {
      position:relative; width:48px; height:28px; border-radius:14px;
      background:#d1d5db; border:none; cursor:pointer; padding:0; flex-shrink:0;
      transition:background .25s; outline:none;
      -webkit-tap-highlight-color:transparent;
    }
    .toggle-btn--on { background:linear-gradient(135deg,#667eea,#764ba2); }
    .toggle-knob {
      position:absolute; top:3px; right:3px; width:22px; height:22px;
      border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.25);
      transition:transform .25s;
    }
    .toggle-btn--on .toggle-knob { transform:translateX(-20px); }

    .user-fields {
      background:#f8f7ff; border-radius:12px; padding:.75rem; margin-top:.5rem;
      border:1px dashed #c4b5fd;
    }

    .form-error {
      padding:.5rem .75rem; border-radius:10px; background:rgba(239,68,68,.08);
      color:#dc2626; font-size:.78rem; font-weight:600; margin-bottom:.75rem;
      display:flex; align-items:center; gap:.35rem;
    }

    .btn-submit {
      width:100%; padding:.65rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.88rem; font-weight:700; cursor:pointer;
      min-height:48px; display:flex; align-items:center; justify-content:center; gap:.35rem;
      -webkit-tap-highlight-color:transparent;
    }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; }

    /* Shimmer */
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:140px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty State */
    .empty-state { text-align:center; padding:2.5rem 1rem; }
    .empty-state i { font-size:2.5rem; color:#c4c4d4; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; }

    /* Cards */
    .cards-list { padding:.5rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .adv-card {
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.75rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .adv-card--pending { border-color:rgba(245,158,11,.2); }
    .adv-card-main {
      display:flex; align-items:center; gap:.65rem; margin-bottom:.4rem;
    }
    .adv-avatar {
      width:42px; height:42px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.1rem; font-weight:800;
    }
    .adv-info { flex:1; min-width:0; }
    .adv-name-row { display:flex; align-items:center; gap:.35rem; }
    .status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .status-dot--approved { background:#22c55e; }
    .status-dot--pending { background:#f59e0b; }
    .adv-chips { display:flex; gap:.25rem; margin-top:.2rem; }
    .chip-linked {
      font-size:.55rem; background:rgba(102,126,234,.1); color:#667eea;
      padding:.1rem .3rem; border-radius:4px;
    }
    .adv-type-chip {
      font-size:.65rem; font-weight:700; padding:.15rem .5rem; border-radius:8px;
    }
    .type-teacher { background:rgba(102,126,234,.1); color:#667eea; }
    .type-library { background:rgba(16,185,129,.1); color:#059669; }
    .type-bookstore { background:rgba(245,158,11,.1); color:#d97706; }
    .type-educational { background:rgba(139,92,246,.1); color:#7c3aed; }
    .type-other { background:rgba(156,163,175,.1); color:#6b7280; }

    .status-chip { font-size:.62rem; font-weight:700; padding:.15rem .5rem; border-radius:8px; }
    .status-approved { background:rgba(16,185,129,.1); color:#059669; }
    .status-pending { background:rgba(245,158,11,.1); color:#d97706; }

    .adv-name { margin:0; font-size:.88rem; font-weight:700; color:#1a1a2e; }
    .adv-name-en { font-size:.68rem; color:#9090aa; display:block; }

    .adv-meta {
      display:flex; flex-wrap:wrap; gap:.5rem;
      font-size:.68rem; color:#9090aa;
      padding:.35rem 0; border-top:1px solid #f4f5fb;
    }
    .adv-meta span { display:flex; align-items:center; gap:.2rem; }

    .adv-actions {
      display:flex; gap:.35rem; padding-top:.35rem; border-top:1px solid #f4f5fb;
    }
    .btn-action {
      flex:1; padding:.45rem; border-radius:10px; border:none;
      font-size:.72rem; font-weight:700; cursor:pointer;
      min-height:38px; display:flex; align-items:center; justify-content:center; gap:.25rem;
      -webkit-tap-highlight-color:transparent;
      &:disabled { opacity:.5; cursor:not-allowed; }
    }
    .btn-approve {
      flex:1; padding:.5rem; border-radius:10px; border:none;
      background:rgba(16,185,129,.1); color:#059669;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:44px; display:flex; align-items:center; justify-content:center; gap:.25rem;
      -webkit-tap-highlight-color:transparent;
    }
    .btn-reject-sm {
      flex:1; padding:.5rem; border-radius:10px; border:none;
      background:rgba(245,158,11,.08); color:#d97706;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:44px; display:flex; align-items:center; justify-content:center; gap:.25rem;
      -webkit-tap-highlight-color:transparent;
    }
    .btn-delete {
      width:44px; height:44px; border-radius:10px; border:none;
      background:rgba(239,68,68,.08); color:#dc2626;
      font-size:.88rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      -webkit-tap-highlight-color:transparent; flex-shrink:0;
    }
    .btn-approve:disabled, .btn-reject-sm:disabled, .btn-delete:disabled { opacity:.5; cursor:not-allowed; }

    /* Pagination */
    .pagination {
      display:flex; align-items:center; justify-content:center; gap:1rem;
      padding:1rem;
    }
    .page-btn {
      width:44px; height:44px; border-radius:12px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.9rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      -webkit-tap-highlight-color:transparent;
    }
    .page-btn:disabled { opacity:.4; cursor:not-allowed; }
    .page-info { font-size:.82rem; font-weight:600; color:#555; }

    /* Modal */
    .modal-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:10000;
      display:flex; align-items:center; justify-content:center; padding:1rem;
    }
    .modal-card {
      background:#fff; border-radius:20px; padding:1.5rem; max-width:340px; width:100%;
      text-align:center;
    }
    .modal-icon { font-size:2.5rem; color:#dc2626; margin-bottom:.75rem; }
    .modal-card h3 { margin:0 0 .5rem; font-size:1rem; font-weight:700; color:#1a1a2e; }
    .modal-card p { margin:0 0 .25rem; font-size:.85rem; color:#555; }
    .modal-sub { font-size:.75rem; color:#9090aa; margin-bottom:1rem !important; }
    .modal-actions { display:flex; gap:.5rem; margin-top:1rem; }
    .btn-modal-cancel {
      flex:1; padding:.6rem; border-radius:12px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.82rem; font-weight:600;
      cursor:pointer; min-height:44px;
      -webkit-tap-highlight-color:transparent;
    }
    .btn-modal-delete {
      flex:1; padding:.6rem; border-radius:12px; border:none;
      background:#dc2626; color:#fff; font-size:.82rem; font-weight:700;
      cursor:pointer; min-height:44px;
      display:flex; align-items:center; justify-content:center; gap:.25rem;
      -webkit-tap-highlight-color:transparent;
    }
    .btn-modal-delete:disabled { opacity:.6; cursor:not-allowed; }

    .field-hint {
      display:block; font-size:.68rem; color:#667eea; margin-bottom:.3rem;
      font-weight:500;
    }

    /* Success Modal */
    .success-modal { max-width:380px; }
    .success-icon { font-size:2.8rem; color:#059669; margin-bottom:.5rem; }
    .success-sub { font-size:.78rem; color:#9090aa; margin-bottom:1rem !important; }

    .credentials-box {
      background:#f8f7ff; border-radius:14px; padding:.875rem;
      border:1.5px solid #e5e7f0; margin-bottom:.75rem;
      display:flex; flex-direction:column; gap:.6rem;
    }
    .cred-row {
      display:flex; flex-direction:column; gap:.15rem;
    }
    .cred-label {
      font-size:.7rem; font-weight:600; color:#9090aa;
      display:flex; align-items:center; gap:.3rem;
    }
    .cred-value {
      font-size:.92rem; font-weight:700; color:#1a1a2e;
      background:#fff; padding:.4rem .6rem; border-radius:8px;
      border:1px solid #e5e7eb; font-family:monospace; word-break:break-all;
      user-select:all;
    }
    .cred-hint {
      font-size:.68rem; color:#667eea; font-weight:500;
      display:flex; align-items:flex-start; gap:.3rem;
      line-height:1.4; margin-top:.25rem;
    }
    .cred-warning {
      background:rgba(245,158,11,.08); border-radius:10px; padding:.6rem .75rem;
      font-size:.75rem; font-weight:600; color:#d97706;
      text-align:center; line-height:1.5; margin-bottom:.75rem;
    }
    .cred-warning small { font-weight:500; }
  `],
})
export class AdvertiserAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  submitting = signal(false);
  actionLoading = signal(false);
  showForm = signal(false);
  formError = signal<string | null>(null);
  advertisers = signal<AdvertiserDto[]>([]);
  searchQuery = '';

  filteredList(): AdvertiserDto[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.advertisers();
    return this.advertisers().filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.nameEn || '').toLowerCase().includes(q) ||
      (a.contactEmail || '').toLowerCase().includes(q) ||
      (a.contactPhone || '').includes(q)
    );
  }

  filterAdvertisers(): void { /* trigger change detection via searchQuery binding */ }
  totalCount = signal(0);
  currentPage = signal(0);
  deleteTarget = signal<AdvertiserDto | null>(null);
  createdInfo = signal<{ userName: string; password: string; code: string } | null>(null);
  pageSize = 10;

  form: CreateAdvertiserForm = this.getEmptyForm();

  async ngOnInit(): Promise<void> {
    await this.loadAdvertisers();
  }

  goBack(): void {
    this.location.back();
  }

  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize) || 1;
  }

  async loadAdvertisers(): Promise<void> {
    this.loading.set(true);
    try {
      const skip = this.currentPage() * this.pageSize;
      const res = await this.http.get<{ totalCount: number; items: AdvertiserDto[] }>(
        `${this.apiBase}/api/app/advertiser?skipCount=${skip}&maxResultCount=${this.pageSize}`
      ).toPromise();
      this.advertisers.set(res?.items ?? []);
      this.totalCount.set(res?.totalCount ?? 0);
    } catch (e) {
      console.error('Error loading advertisers:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async nextPage(): Promise<void> {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      await this.loadAdvertisers();
    }
  }

  async prevPage(): Promise<void> {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      await this.loadAdvertisers();
    }
  }

  async createAdvertiser(): Promise<void> {
    this.formError.set(null);

    if (!this.form.name.trim()) {
      this.formError.set('الاسم مطلوب · Name is required');
      return;
    }
    if (!this.form.contactPhone.trim()) {
      this.formError.set('رقم الهاتف مطلوب · Phone is required');
      return;
    }
    if (!this.form.contactEmail.trim()) {
      this.formError.set('البريد الالكتروني مطلوب · Email is required');
      return;
    }
    if (this.form.createUser) {
      if (!this.form.userName.trim()) {
        this.formError.set('اسم المستخدم مطلوب · Username is required');
        return;
      }
      if (!this.form.password.trim()) {
        this.formError.set('كلمة المرور مطلوبة · Password is required');
        return;
      }
    }

    this.submitting.set(true);
    try {
      // Step 1: Create the advertiser
      const body: any = {
        name: this.form.name.trim(),
        nameEn: this.form.nameEn.trim() || undefined,
        type: this.form.type,
        contactPhone: this.form.contactPhone.trim(),
        contactEmail: this.form.contactEmail.trim(),
        description: this.form.description.trim() || undefined,
        address: this.form.address.trim() || undefined,
        websiteUrl: this.form.websiteUrl.trim() || undefined,
      };

      const advertiser = await this.http.post<AdvertiserDto>(
        `${this.apiBase}/api/app/advertiser`, body
      ).toPromise();

      // Step 2: If createUser is checked, create ABP user and link
      let userCreated = false;
      if (this.form.createUser && advertiser?.id) {
        const userBody = {
          userName: this.form.userName.trim(),
          password: this.form.password,
          email: this.form.contactEmail.trim(),
          name: this.form.name.trim(),
          surname: this.form.name.trim(),
          isActive: true,
          roleNames: ['ADVERTISER'],
        };
        const user = await this.http.post<{ id: string }>(
          `${this.apiBase}/api/identity/users`, userBody
        ).toPromise();

        if (user?.id) {
          // Link user to advertiser
          await this.http.put(
            `${this.apiBase}/api/app/advertiser/${advertiser.id}`,
            { ...body, userId: user.id }
          ).toPromise();
          userCreated = true;
        }
      }

      // Show success modal with credentials if user was created
      if (userCreated) {
        this.createdInfo.set({
          userName: this.form.userName.trim(),
          password: this.form.password,
          code: advertiser?.id?.substring(0, 8).toUpperCase() || '',
        });
      }

      // Reset form and reload
      this.form = this.getEmptyForm();
      this.showForm.set(false);
      this.currentPage.set(0);
      await this.loadAdvertisers();
    } catch (e: any) {
      console.error('Error creating advertiser:', e);
      const msg = e?.error?.error?.message
        || e?.error?.error_description
        || e?.message
        || 'حدث خطا اثناء الحفظ · Error saving advertiser';
      this.formError.set(msg);
    } finally {
      this.submitting.set(false);
    }
  }

  async approveAdvertiser(id: string): Promise<void> {
    this.actionLoading.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/advertiser/${id}/approve`, {}).toPromise();
      this.advertisers.update(list =>
        list.map(a => a.id === id ? { ...a, isApproved: true } : a)
      );
    } catch (e) {
      console.error('Error approving advertiser:', e);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async rejectAdvertiser(id: string): Promise<void> {
    this.actionLoading.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/advertiser/${id}/reject`, {}).toPromise();
      this.advertisers.update(list =>
        list.map(a => a.id === id ? { ...a, isApproved: false } : a)
      );
    } catch (e) {
      console.error('Error rejecting advertiser:', e);
    } finally {
      this.actionLoading.set(false);
    }
  }

  confirmDelete(adv: AdvertiserDto): void {
    this.deleteTarget.set(adv);
  }

  async deleteAdvertiser(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;

    this.actionLoading.set(true);
    try {
      await this.http.delete(`${this.apiBase}/api/app/advertiser/${target.id}`).toPromise();
      this.deleteTarget.set(null);
      this.advertisers.update(list => list.filter(a => a.id !== target.id));
      this.totalCount.update(c => c - 1);
    } catch (e) {
      console.error('Error deleting advertiser:', e);
    } finally {
      this.actionLoading.set(false);
    }
  }

  getTypeClass(type: number): string {
    const map: Record<number, string> = {
      0: 'adv-type-chip type-teacher',
      1: 'adv-type-chip type-library',
      2: 'adv-type-chip type-bookstore',
      3: 'adv-type-chip type-educational',
      4: 'adv-type-chip type-other',
    };
    return map[type] ?? 'adv-type-chip type-other';
  }

  getTypeLabel(type: number): string {
    const map: Record<number, string> = {
      0: 'معلم · Teacher',
      1: 'مكتبة · Library',
      2: 'قرطاسية · Bookstore',
      3: 'مركز تعليمي · Edu Center',
      4: 'اخرى · Other',
    };
    return map[type] ?? 'اخرى';
  }

  private getEmptyForm(): CreateAdvertiserForm {
    return {
      name: '', nameEn: '', type: 1,
      contactPhone: '', contactEmail: '',
      description: '', address: '', websiteUrl: '',
      createUser: false, userName: '', password: '',
    };
  }
}
