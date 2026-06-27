import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { StudentService } from '@proxy/students';
import { StudentDto } from '@proxy/students/models';
import { ParentStudentDto } from '@proxy/parents/models';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'ملفي الشخصي'" [titleEn]="'My Profile'" [backTo]="'/student'">
        <button ph-actions class="ph-action" (click)="logout()" aria-label="تسجيل الخروج">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </app-page-header>

      <!-- Identity card -->
      <div class="section">
        <div class="id-card">
          <div class="id-avatar">
            @if (student()?.photoUrl) { <img [src]="student()!.photoUrl" alt="" /> }
            @else { <span>{{ initials() }}</span> }
            <button class="avatar-edit" (click)="toggleProfileEdit()" aria-label="تعديل الصورة">
              <i class="fas fa-camera"></i>
            </button>
          </div>
          <div class="id-info">
            <h1 class="id-name">{{ student()?.firstName }} {{ student()?.lastName }}</h1>
            <div class="id-role"><i class="fas fa-graduation-cap"></i> طالب · Student</div>
            @if (student()?.statusMessage) {
              <span class="id-status"><i class="fas fa-quote-right"></i> {{ student()?.statusMessage }}</span>
            }
            <div class="id-chips">
              @if (student()?.studentCode) {
                <span class="id-chip id-chip--code">{{ student()?.studentCode }}</span>
              }
              @if (userInfo()?.currentGrade) {
                <span class="id-chip">{{ gradeName(userInfo()?.currentGrade) }}</span>
              }
              @if (userInfo()?.email) {
                <span class="id-chip id-chip--email">{{ userInfo()?.email }}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Shimmer -->
      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-row">
            @for (i of [1,2,3,4]; track i) { <div class="shimmer-action"></div> }
          </div>
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {

        <!-- Photo & status editor -->
        @if (editingProfile()) {
          <div class="section">
            <div class="section-title">
              <i class="fas fa-id-badge"></i> صورتي وحالتي · Photo & Status
              <button class="edit-loc-btn" (click)="toggleProfileEdit()">
                <i class="fas fa-times"></i> إلغاء · Cancel
              </button>
            </div>
            <div class="loc-edit-card">
              <div class="photo-row">
                <div class="photo-preview">
                  @if (editPhoto()) { <img [src]="editPhoto()" alt="" /> }
                  @else { <i class="fas fa-user"></i> }
                </div>
                <label class="photo-btn">
                  @if (photoProcessing()) { <span class="spinner-xs"></span> }
                  @else { <i class="fas fa-image"></i> }
                  {{ editPhoto() ? 'تغيير · Change' : 'إضافة صورة · Add' }}
                  <input type="file" accept="image/*" hidden (change)="onPhotoSelected($event)" />
                </label>
                @if (editPhoto()) {
                  <button type="button" class="photo-remove" (click)="editPhoto.set('')">
                    <i class="fas fa-trash"></i> إزالة
                  </button>
                }
              </div>
              <div class="loc-field-body">
                <label>حالتي (اختياري) · Status message</label>
                <input class="loc-input" maxlength="140"
                  [ngModel]="editStatus()" (ngModelChange)="editStatus.set($event)"
                  placeholder="اكتب حالتك أو هدفك الدراسي... · Share a short status..." />
              </div>
              @if (profileSaveError()) { <p class="loc-error">{{ profileSaveError() }}</p> }
              <button class="loc-save-btn" [disabled]="profileSaving()" (click)="saveProfile()">
                @if (profileSaving()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-check-circle"></i> }
                حفظ · Save
              </button>
            </div>
          </div>
        }

        <!-- Quick actions -->
        <div class="section">
          <div class="section-title"><i class="fas fa-bolt"></i> إجراءات سريعة · Quick Actions</div>
          <div class="actions-grid">
            <a class="action-btn" routerLink="/student/courses">
              <div class="action-icon" style="background:rgba(102,126,234,.12);color:#667eea"><i class="fas fa-book-open"></i></div>
              <span class="al">مقرراتي</span><span class="ae">Courses</span>
            </a>
            <a class="action-btn" routerLink="/student/grades">
              <div class="action-icon" style="background:rgba(16,185,129,.12);color:#059669"><i class="fas fa-star"></i></div>
              <span class="al">درجاتي</span><span class="ae">Grades</span>
            </a>
            <a class="action-btn" routerLink="/student/attendance">
              <div class="action-icon" style="background:rgba(245,158,11,.12);color:#d97706"><i class="fas fa-calendar-check"></i></div>
              <span class="al">حضوري</span><span class="ae">Attendance</span>
            </a>
            <a class="action-btn" routerLink="/student/requests">
              <div class="action-icon" style="background:rgba(239,68,68,.1);color:#dc2626"><i class="fas fa-clipboard-list"></i></div>
              <span class="al">طلباتي</span><span class="ae">Requests</span>
            </a>
            <a class="action-btn" routerLink="/student/qr">
              <div class="action-icon" style="background:rgba(118,75,162,.12);color:#764ba2"><i class="fas fa-qrcode"></i></div>
              <span class="al">رمز QR</span><span class="ae">My QR</span>
            </a>
            <a class="action-btn" routerLink="/student/points">
              <div class="action-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><i class="fas fa-trophy"></i></div>
              <span class="al">نقاطي</span><span class="ae">Points</span>
            </a>
            <button class="action-btn" (click)="requestPromotion()" [disabled]="promotionLoading()">
              <div class="action-icon" style="background:rgba(34,197,94,.12);color:#16a34a">
                @if (promotionLoading()) { <span class="spinner-xs"></span> }
                @else { <i class="fas fa-arrow-up"></i> }
              </div>
              <span class="al">ترقية الصف</span><span class="ae">Promote</span>
            </button>
          </div>
          @if (promotionMsg()) {
            <div class="promo-msg" [class.promo-msg--success]="promotionSuccess()" [class.promo-msg--error]="!promotionSuccess()">
              <i [class]="promotionSuccess() ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              {{ promotionMsg() }}
            </div>
          }
        </div>

        <!-- Location section -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-map-marker-alt"></i> الموقع الجغرافي · Location
            <button class="edit-loc-btn" (click)="editingLocation.set(!editingLocation())">
              <i [class]="editingLocation() ? 'fas fa-times' : 'fas fa-pen'"></i>
              {{ editingLocation() ? 'إلغاء · Cancel' : 'تعديل · Edit' }}
            </button>
          </div>
          @if (editingLocation()) {
            <div class="loc-edit-card">
              <div class="loc-field">
                <div class="loc-field-icon"><i class="fas fa-city"></i></div>
                <div class="loc-field-body">
                  <label>المحافظة · Governorate</label>
                  <select [ngModel]="locGov()" (ngModelChange)="onGovernorateChange($event)" class="loc-input">
                    <option value="">-- اختر المحافظة --</option>
                    @for (g of governorates; track g) {
                      <option [value]="g">{{ g }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="loc-field">
                <div class="loc-field-icon"><i class="fas fa-map-pin"></i></div>
                <div class="loc-field-body">
                  <label>المركز / الحي · District</label>
                  @if (locGov()) {
                    <select [ngModel]="locTown()" (ngModelChange)="locTown.set($event)" class="loc-input">
                      <option value="">-- اختر المركز / الحي --</option>
                      @for (d of districts(); track d) {
                        <option [value]="d">{{ d }}</option>
                      }
                    </select>
                  } @else {
                    <select class="loc-input" disabled>
                      <option>-- اختر المحافظة أولاً --</option>
                    </select>
                  }
                </div>
              </div>
              @if (locSaveError()) { <p class="loc-error">{{ locSaveError() }}</p> }
              <button class="loc-save-btn" [disabled]="locSaving()" (click)="saveLocation()">
                @if (locSaving()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-check-circle"></i> }
                حفظ الموقع · Save Location
              </button>
            </div>
          } @else {
            <div class="loc-card">
              <div class="loc-card-bg"></div>
              @if (locGov() || locTown()) {
                <div class="loc-pin-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div class="loc-details">
                  @if (locGov()) {
                    <div class="loc-row">
                      <span class="loc-label">المحافظة · Gov.</span>
                      <span class="loc-value">{{ locGov() }}</span>
                    </div>
                  }
                  @if (locTown()) {
                    <div class="loc-row">
                      <span class="loc-label">المركز · District</span>
                      <span class="loc-value">{{ locTown() }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="loc-empty-state">
                  <div class="loc-empty-icon"><i class="fas fa-map-marked-alt"></i></div>
                  <p class="loc-empty-text">لم يتم تحديد الموقع بعد</p>
                  <span class="loc-empty-sub">Location not set — tap edit to add</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Linked parents -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-user-shield"></i> أولياء الأمور · Parents
            @if (parents().length > 0) { <span class="count-pill">{{ parents().length }}</span> }
          </div>
          @if (parents().length === 0) {
            <div class="empty-box">
              <i class="fas fa-user-slash"></i>
              <p>لا يوجد أولياء أمور مرتبطون</p>
              <span>No linked parents</span>
            </div>
          }
          @if (parents().length > 0) {
            <div class="list">
              @for (p of parents(); track p.parentId) {
                <div class="list-row">
                  <div class="list-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                    <i class="fas fa-user-shield"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ p.parent?.fullName || p.parent?.firstName }}</span>
                    @if (p.relationshipType) {
                      <span class="list-sub">{{ p.relationshipType }}</span>
                    }
                  </div>
                  @if (p.isEmergencyContact) {
                    <span class="emergency-chip"><i class="fas fa-phone"></i> طوارئ</span>
                  }
                </div>
              }
            </div>
          }
        </div>




      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* Identity card */
    .id-card {
      display:flex; align-items:center; gap:1rem;
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1rem; box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .id-avatar {
      position:relative; flex-shrink:0;
      width:72px; height:72px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; font-weight:800; color:#fff; overflow:visible;
    }
    .id-avatar img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
    .id-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:.3rem; }
    .id-name { margin:0; font-size:1.15rem; font-weight:800; color:#1a1a2e; }
    .id-role {
      display:inline-flex; align-items:center; gap:.3rem; align-self:flex-start;
      background:rgba(102,126,234,.1); color:#667eea;
      padding:.2rem .6rem; border-radius:12px; font-size:.72rem; font-weight:700;
    }
    .id-status {
      font-size:.76rem; color:#6b7280; font-style:italic;
      display:flex; align-items:center; gap:.3rem;
    }
    .id-status i { font-size:.58rem; opacity:.5; }
    .id-chips { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.1rem; }
    .id-chip {
      font-size:.72rem; font-weight:600; color:#555;
      background:#f4f5fb; border:1px solid #e8e8f0;
      padding:.15rem .55rem; border-radius:10px;
    }
    .id-chip--code { color:#667eea; background:rgba(102,126,234,.08); border-color:rgba(102,126,234,.18); }
    .id-chip--email { color:#9090aa; font-weight:500; }

    .avatar-edit {
      position:absolute; bottom:-2px; left:-2px;
      width:26px; height:26px; border-radius:50%;
      background:#fff; color:#667eea; border:2px solid #764ba2;
      display:flex; align-items:center; justify-content:center;
      font-size:.65rem; cursor:pointer; padding:0;
      -webkit-tap-highlight-color:transparent;
    }
    .avatar-edit:active { transform:scale(.92); }

    .photo-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .photo-preview {
      width:64px; height:64px; border-radius:50%; flex-shrink:0; overflow:hidden;
      background:#f0f0f5; border:1.5px solid #e0e0f0;
      display:flex; align-items:center; justify-content:center; color:#9090aa; font-size:1.3rem;
    }
    .photo-preview img { width:100%; height:100%; object-fit:cover; }
    .photo-btn {
      display:inline-flex; align-items:center; gap:.4rem; cursor:pointer;
      background:rgba(102,126,234,.1); border:1.5px solid rgba(102,126,234,.25);
      color:#667eea; border-radius:12px; padding:.5rem .85rem;
      font-size:.8rem; font-weight:700; min-height:44px;
    }
    .photo-remove {
      display:inline-flex; align-items:center; gap:.35rem; cursor:pointer;
      background:rgba(239,68,68,.08); border:1.5px solid rgba(239,68,68,.2);
      color:#dc2626; border-radius:12px; padding:.5rem .75rem;
      font-size:.78rem; font-weight:700; min-height:44px;
    }
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-row { display:flex; gap:.5rem; }
    .shimmer-action {
      flex:1; height:80px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    .shimmer-card {
      height:72px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem;
      font-size:.8rem; font-weight:700; color:#555;
      text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }
    .count-pill {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.72rem; font-weight:700; padding:.15rem .5rem; border-radius:20px;
    }

    .actions-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:.5rem; }
    @media (max-width:380px) { .actions-grid { grid-template-columns:repeat(3,1fr); } }
    .action-btn {
      display:flex; flex-direction:column; align-items:center; gap:.35rem;
      padding:.75rem .25rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f0; text-decoration:none; color:#374151;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .action-btn:active { transform:scale(.95); }
    .action-icon {
      width:38px; height:38px; border-radius:11px;
      display:flex; align-items:center; justify-content:center; font-size:.95rem;
    }
    .al { font-size:.68rem; font-weight:700; text-align:center; color:#1a1a2e; }
    .ae { font-size:.58rem; color:#9090aa; text-align:center; }

    .list { display:flex; flex-direction:column; gap:.5rem; }
    .list-row {
      display:flex; align-items:center; gap:.875rem;
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .list-avatar {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem;
    }
    .list-info { flex:1; min-width:0; }
    .list-name { display:block; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .list-sub { display:block; font-size:.75rem; color:#9090aa; margin-top:.1rem; }
    .emergency-chip {
      font-size:.68rem; font-weight:700; color:#dc2626;
      background:rgba(239,68,68,.1); padding:.15rem .5rem; border-radius:10px;
      display:flex; align-items:center; gap:.25rem; flex-shrink:0;
    }

    .empty-box {
      text-align:center; padding:2rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2rem; color:#c4c4d4; display:block; margin-bottom:.5rem; }
    .empty-box p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.75rem; color:#9090aa; }

    .edit-loc-btn {
      margin-right:auto; background:rgba(102,126,234,.08); border:1.5px solid rgba(102,126,234,.2);
      color:#667eea; border-radius:20px; padding:.3rem .75rem;
      font-size:.72rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; gap:.3rem; transition:all .2s;
    }
    .edit-loc-btn:active { transform:scale(.95); background:rgba(102,126,234,.15); }

    .loc-card {
      position:relative; overflow:hidden;
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      border-radius:16px; padding:1.25rem;
      display:flex; align-items:center; gap:1rem;
      box-shadow:0 4px 20px rgba(102,126,234,.25);
    }
    .loc-card-bg {
      position:absolute; top:-30px; left:-30px;
      width:120px; height:120px; border-radius:50%;
      background:rgba(255,255,255,.08); pointer-events:none;
    }
    .loc-pin-icon {
      width:48px; height:48px; border-radius:14px; flex-shrink:0;
      background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.25);
      display:flex; align-items:center; justify-content:center;
      font-size:1.2rem; color:#fff; position:relative; z-index:1;
    }
    .loc-details { flex:1; min-width:0; position:relative; z-index:1; }
    .loc-row {
      display:flex; align-items:center; justify-content:space-between; gap:.5rem;
      padding:.25rem 0;
    }
    .loc-row + .loc-row { border-top:1px solid rgba(255,255,255,.12); }
    .loc-label { font-size:.7rem; font-weight:600; color:rgba(255,255,255,.65); }
    .loc-value { font-size:.88rem; font-weight:700; color:#fff; text-align:left; }
    .loc-empty-state {
      width:100%; text-align:center; padding:.5rem 0; position:relative; z-index:1;
    }
    .loc-empty-icon {
      width:48px; height:48px; border-radius:50%; margin:0 auto .6rem;
      background:rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center;
      font-size:1.3rem; color:rgba(255,255,255,.7);
    }
    .loc-empty-text { margin:0; font-size:.88rem; font-weight:700; color:rgba(255,255,255,.9); }
    .loc-empty-sub { font-size:.72rem; color:rgba(255,255,255,.55); }

    .loc-edit-card {
      background:#fff; border-radius:16px; border:1.5px solid #e0e0f0;
      padding:1.125rem; display:flex; flex-direction:column; gap:.75rem;
      box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .loc-field {
      display:flex; align-items:flex-start; gap:.75rem;
    }
    .loc-field-icon {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,rgba(102,126,234,.12),rgba(118,75,162,.12));
      display:flex; align-items:center; justify-content:center;
      color:#667eea; font-size:.9rem; margin-top:1.1rem;
    }
    .loc-field-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:.25rem; }
    .loc-edit-card label { font-size:.72rem; font-weight:700; color:#667eea; letter-spacing:.02em; }
    .loc-input {
      padding:.6rem .85rem; border:1.5px solid #e0e0f0; border-radius:12px;
      font-size:.88rem; font-family:inherit; background:#fafaff; width:100%; box-sizing:border-box;
      transition:border-color .2s, box-shadow .2s;
    }
    .loc-input:focus { outline:none; border-color:#667eea; box-shadow:0 0 0 3px rgba(102,126,234,.1); background:#fff; }
    .loc-input:disabled { background:#f0f0f5; color:#9090aa; }
    .loc-error { color:#dc2626; font-size:.75rem; margin:0; }
    .loc-save-btn {
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      padding:.75rem; border:none; border-radius:12px; margin-top:.25rem;
      background:linear-gradient(135deg,#667eea,#764ba2); color:white;
      font-size:.88rem; font-weight:700; cursor:pointer; min-height:48px;
      box-shadow:0 4px 14px rgba(102,126,234,.3);
      transition:transform .15s, box-shadow .15s;
      -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    }
    .loc-save-btn:active { transform:scale(.97); box-shadow:0 2px 8px rgba(102,126,234,.2); }
    .loc-save-btn:disabled { opacity:.6; cursor:not-allowed; }

    .promo-msg {
      display:flex; align-items:center; gap:.5rem;
      padding:.6rem .85rem; border-radius:10px; margin-top:.5rem;
      font-size:.82rem; font-weight:600;
    }
    .promo-msg--success { background:rgba(34,197,94,.1); color:#16a34a; border:1px solid rgba(34,197,94,.2); }
    .promo-msg--error { background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.15); }
    .spinner-xs {
      width:14px; height:14px; border:2px solid currentColor;
      border-top-color:transparent; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

  `],
})
export class StudentProfileComponent implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly studentSvc     = inject(StudentService);
  loading  = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);
  student  = signal<StudentDto | null>(null);
  parents  = signal<ParentStudentDto[]>([]);
  promotionLoading = signal(false);
  promotionMsg = signal<string | null>(null);
  promotionSuccess = signal(false);

  // Photo + status editing
  editingProfile = signal(false);
  editPhoto = signal('');
  editStatus = signal('');
  photoProcessing = signal(false);
  profileSaving = signal(false);
  profileSaveError = signal<string | null>(null);

  // Location editing
  editingLocation = signal(false);
  locSaving = signal(false);
  locSaveError = signal<string | null>(null);
  locGov = signal('');
  locTown = signal('');
  readonly governorates = EGYPT_GOVERNORATES_LIST;
  readonly districts = computed(() => getDistricts(this.locGov()));

  readonly gradeNames: Record<number, string> = {
    1:'الأول الابتدائي',2:'الثاني الابتدائي',3:'الثالث الابتدائي',
    4:'الرابع الابتدائي',5:'الخامس الابتدائي',6:'السادس الابتدائي',
    7:'الأول الإعدادي',8:'الثاني الإعدادي',9:'الثالث الإعدادي',
    10:'الأول الثانوي',11:'الثاني الثانوي',12:'الثالث الثانوي',
  };

  initials(): string {
    const s = this.student();
    const name = [s?.firstName, s?.lastName].filter(Boolean).join(' ') || '?';
    return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }

  gradeName(g?: number): string {
    if (!g) return '';
    return this.gradeNames[g] ?? `الصف ${g}`;
  }

  async ngOnInit(): Promise<void> {
    try {
      const [info, student, parents] = await Promise.all([
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.studentSvc.getCurrentStudent()),
        lastValueFrom(this.studentSvc.getConfirmedParentsForCurrentStudent()),
      ]);
      this.userInfo.set(info);
      this.student.set(student);
      this.parents.set(parents ?? []);
      if (student) {
        this.locGov.set(student.government || '');
        this.locTown.set(student.town || '');
      }
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async requestPromotion(): Promise<void> {
    const s = this.student();
    if (!s?.id) return;
    if ((s.currentGrade ?? 0) >= 12) {
      this.promotionMsg.set('أنت في أعلى صف دراسي · Already at highest grade');
      this.promotionSuccess.set(false);
      return;
    }
    this.promotionLoading.set(true);
    this.promotionMsg.set(null);
    try {
      const result = await lastValueFrom(
        this.studentSvc.requestPromotion({ studentId: s.id } as any)
      );
      if (result.status === 1) { // Approved (parent/admin auto-approve)
        this.promotionMsg.set(`تمت الترقية إلى الصف ${result.toGrade} · Promoted to grade ${result.toGrade}`);
        this.promotionSuccess.set(true);
      } else {
        this.promotionMsg.set('تم إرسال طلب الترقية لولي الأمر · Promotion request sent to parent');
        this.promotionSuccess.set(true);
      }
    } catch (e: any) {
      this.promotionMsg.set(e?.error?.error?.message || 'حدث خطأ · An error occurred');
      this.promotionSuccess.set(false);
    } finally {
      this.promotionLoading.set(false);
    }
  }

  toggleProfileEdit(): void {
    if (!this.editingProfile()) {
      const s = this.student();
      this.editPhoto.set(s?.photoUrl || '');
      this.editStatus.set(s?.statusMessage || '');
      this.profileSaveError.set(null);
    }
    this.editingProfile.set(!this.editingProfile());
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.photoProcessing.set(true);
    try {
      this.editPhoto.set(await this.resizeImageToDataUrl(file, 320, 0.8));
    } catch { this.profileSaveError.set('تعذّر معالجة الصورة · Could not process image'); }
    finally { this.photoProcessing.set(false); input.value = ''; }
  }

  private resizeImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('image load failed'));
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
          else if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('no canvas ctx')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async saveProfile(): Promise<void> {
    this.profileSaving.set(true);
    this.profileSaveError.set(null);
    try {
      const updated = await lastValueFrom(this.studentSvc.updateMyProfile({
        photoUrl: this.editPhoto() || undefined,
        statusMessage: this.editStatus().trim() || undefined,
      }));
      if (updated) this.student.set(updated);
      this.editingProfile.set(false);
    } catch (err: any) {
      this.profileSaveError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ · Error saving');
    } finally {
      this.profileSaving.set(false);
    }
  }

  onGovernorateChange(gov: string): void {
    this.locGov.set(gov);
    this.locTown.set('');
  }

  async saveLocation(): Promise<void> {
    const s = this.student();
    if (!s?.id) return;
    this.locSaving.set(true);
    this.locSaveError.set(null);
    try {
      const body: any = {
        firstName: s.firstName || '',
        middleName: s.middleName || '',
        lastName: s.lastName || '',
        address: s.address || '',
        currentGrade: s.currentGrade || 1,
        schoolName: s.schoolName || '',
        teacherStudentCode: s.teacherStudentCode || '',
        government: this.locGov() || '',
        town: this.locTown() || '',
      };
      await lastValueFrom(this.studentSvc.update(s.id, body));
      const refreshed = await lastValueFrom(this.studentSvc.getCurrentStudent());
      if (refreshed) {
        this.student.set(refreshed);
        this.locGov.set(refreshed.government || '');
        this.locTown.set(refreshed.town || '');
      }
      this.editingLocation.set(false);
    } catch (err: any) {
      this.locSaveError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ · Error saving location');
    } finally {
      this.locSaving.set(false);
    }
  }

  logout(): void { this.authService.logout(); }
}
