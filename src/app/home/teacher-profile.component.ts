import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { TeacherService, SecretaryTeacherService } from '@proxy/teachers';
import { TeacherDto, TeacherEnrolledCourseDto, SecretaryInfoDto } from '@proxy/teachers/models';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'ملفي الشخصي'" [titleEn]="'My Profile'" [backTo]="'/teacher'">
        <button ph-actions class="ph-action" (click)="logout()" aria-label="تسجيل الخروج">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </app-page-header>

      <!-- Identity card -->
      <div class="section">
        <div class="id-card">
          <div class="id-avatar">
            @if (photoUrl()) {
              <img [src]="photoUrl()" alt="Teacher photo" />
            } @else {
              <span>{{ initials() }}</span>
            }
          </div>
          <div class="id-info">
            <h1 class="id-name">{{ userInfo()?.actorName || 'المعلم' }}</h1>
            <div class="id-role"><i class="fas fa-chalkboard-teacher"></i> معلم · Teacher</div>
            <div class="id-chips">
              @if (userInfo()?.actorCode) {
                <span class="id-chip id-chip--code">{{ userInfo()?.actorCode }}</span>
              }
              @if (userInfo()?.email) {
                <span class="id-chip id-chip--email">{{ userInfo()?.email }}</span>
              }
              @if (userInfo()?.userName) {
                <span class="id-chip id-chip--email">&#64;{{ userInfo()?.userName }}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      @if (!loading()) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-book-open"></i>
            </div>
            <div class="stat-value">{{ enrolledCourses().length }}</div>
            <div class="stat-label">مقرر مسجّل</div>
            <div class="stat-label-en">Courses</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,.12);color:#059669">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="stat-value">{{ groupCount() }}</div>
            <div class="stat-label">مجموعة</div>
            <div class="stat-label-en">Groups</div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-stats">
            @for (i of [1,2]; track i) { <div class="shimmer-stat"></div> }
          </div>
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {

        <!-- Quick actions -->
        <div class="section">
          <div class="section-title"><i class="fas fa-bolt"></i> إجراءات سريعة · Quick Actions</div>
          <div class="actions-grid">
            <a class="action-btn" routerLink="/attendance">
              <div class="action-icon" style="background:rgba(102,126,234,.12);color:#667eea"><i class="fas fa-user-check"></i></div>
              <span class="al">الحضور</span><span class="ae">Attendance</span>
            </a>
            <a class="action-btn" routerLink="/teacher-groups">
              <div class="action-icon" style="background:rgba(16,185,129,.12);color:#059669"><i class="fas fa-layer-group"></i></div>
              <span class="al">مجموعاتي</span><span class="ae">Groups</span>
            </a>
            <a class="action-btn" routerLink="/teacher/qr-codes">
              <div class="action-icon" style="background:rgba(118,75,162,.12);color:#764ba2"><i class="fas fa-qrcode"></i></div>
              <span class="al">رموز QR</span><span class="ae">QR Codes</span>
            </a>
            <a class="action-btn" routerLink="/teacher/academies">
              <div class="action-icon" style="background:rgba(245,158,11,.12);color:#d97706"><i class="fas fa-university"></i></div>
              <span class="al">الأكاديميات</span><span class="ae">Academies</span>
            </a>
            <a class="action-btn" routerLink="/teacher/promotion">
              <div class="action-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><i class="fas fa-crown"></i></div>
              <span class="al">ترويج</span><span class="ae">Promote</span>
            </a>
          </div>
        </div>

        <!-- About / Profile section -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-id-badge"></i> نبذة تعريفية · About Me
            <button class="edit-loc-btn" (click)="editingProfile.set(!editingProfile())">
              <i [class]="editingProfile() ? 'fas fa-times' : 'fas fa-pen'"></i>
              {{ editingProfile() ? 'إلغاء · Cancel' : 'تعديل · Edit' }}
            </button>
          </div>
          @if (editingProfile()) {
            <div class="loc-edit-card">
              <!-- Photo -->
              <div class="photo-edit">
                <div class="photo-preview">
                  @if (photoUrl()) {
                    <img [src]="photoUrl()" alt="preview" />
                  } @else {
                    <i class="fas fa-user"></i>
                  }
                </div>
                <div class="photo-actions">
                  <label class="photo-btn">
                    @if (photoProcessing()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-camera"></i> }
                    {{ photoUrl() ? 'تغيير الصورة · Change' : 'إضافة صورة · Add photo' }}
                    <input type="file" accept="image/*" hidden (change)="onPhotoSelected($event)" />
                  </label>
                  @if (photoUrl()) {
                    <button type="button" class="photo-remove" (click)="removePhoto()">
                      <i class="fas fa-trash"></i> إزالة · Remove
                    </button>
                  }
                </div>
              </div>
              <!-- Bio -->
              <div class="loc-field-body" style="width:100%">
                <label>نبذة عنك · Bio</label>
                <textarea
                  [ngModel]="bio()" (ngModelChange)="bio.set($event)"
                  class="loc-input bio-input" rows="4" maxlength="1000"
                  placeholder="اكتب نبذة تعريفية عنك وعن خبراتك التدريسية... · Tell students about yourself and your teaching experience"></textarea>
                <span class="bio-count">{{ bio().length }}/1000</span>
              </div>
              @if (profileSaveError()) { <p class="loc-error">{{ profileSaveError() }}</p> }
              <button type="button" class="loc-save-btn" [disabled]="profileSaving()" (click)="saveProfile()">
                @if (profileSaving()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-check-circle"></i> }
                حفظ · Save
              </button>
            </div>
          } @else {
            <div class="about-card">
              @if (bio()) {
                <p class="about-text">{{ bio() }}</p>
              } @else {
                <div class="loc-empty-state" style="position:static">
                  <div class="loc-empty-icon" style="background:rgba(102,126,234,.1);color:#667eea"><i class="fas fa-id-badge"></i></div>
                  <p class="loc-empty-text" style="color:#555">لم تتم إضافة نبذة بعد</p>
                  <span class="loc-empty-sub" style="color:#9090aa">No bio yet — tap edit to add one</span>
                </div>
              }
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
              <button type="button" class="loc-save-btn" [disabled]="locSaving()" (click)="saveLocation()">
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

        <!-- Enrolled courses -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-book-open"></i> مقرراتي المسجّلة · My Courses
            @if (enrolledCourses().length > 0) { <span class="count-pill">{{ enrolledCourses().length }}</span> }
          </div>
          @if (enrolledCourses().length === 0) {
            <div class="empty-box">
              <i class="fas fa-book"></i>
              <p>لا يوجد مقررات مسجّلة</p>
              <span>No enrolled courses</span>
            </div>
          }
          @if (enrolledCourses().length > 0) {
            <div class="list">
              @for (c of enrolledCourses(); track c.id) {
                <div class="list-row">
                  <div class="list-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2)">
                    <i class="fas fa-book-open"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ c.nameAr || c.nameEn }}</span>
                    <span class="list-sub">{{ c.code }} @if (c.gradeName) { · {{ c.gradeName }} }</span>
                  </div>
                  <span class="enrolled-chip"><i class="fas fa-check"></i> مسجّل</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Secretaries -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-user-tie"></i> السكرتارية المرتبطة · My Secretaries
            @if (secretaries().length > 0) { <span class="count-pill">{{ secretaries().length }}</span> }
          </div>
          @if (secretaries().length === 0) {
            <div class="empty-box">
              <i class="fas fa-user-tie"></i>
              <p>لا يوجد سكرتارية مرتبطة</p>
              <span>No linked secretaries</span>
            </div>
          }
          @if (secretaries().length > 0) {
            <div class="list">
              @for (s of secretaries(); track s.secretaryUserId) {
                <div class="list-row">
                  <div class="list-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                    <i class="fas fa-user-tie"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ s.displayName || s.userName }}</span>
                    @if (s.email) {
                      <span class="list-sub">{{ s.email }}</span>
                    }
                  </div>
                  <span class="enrolled-chip" style="background:rgba(245,158,11,.1);color:#d97706">
                    <i class="fas fa-link"></i> مرتبط
                  </span>
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
      flex-shrink:0; width:72px; height:72px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; font-weight:800; color:#fff; overflow:hidden;
    }
    .id-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
    .id-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:.3rem; }
    .id-name { margin:0; font-size:1.15rem; font-weight:800; color:#1a1a2e; }
    .id-role {
      display:inline-flex; align-items:center; gap:.3rem; align-self:flex-start;
      background:rgba(102,126,234,.1); color:#667eea;
      padding:.2rem .6rem; border-radius:12px; font-size:.72rem; font-weight:700;
    }
    .id-chips { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.1rem; }
    .id-chip {
      font-size:.72rem; font-weight:600; color:#555;
      background:#f4f5fb; border:1px solid #e8e8f0;
      padding:.15rem .55rem; border-radius:10px;
    }
    .id-chip--code { color:#667eea; background:rgba(102,126,234,.08); border-color:rgba(102,126,234,.18); }
    .id-chip--email { color:#9090aa; font-weight:500; }

    .stats-row { display:flex; gap:.75rem; padding:1rem 1rem 0; }
    .stat-card {
      flex:1; background:#fff; border-radius:16px; padding:1rem .75rem;
      text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06);
      display:flex; flex-direction:column; align-items:center; gap:.35rem;
    }
    .stat-icon {
      width:40px; height:40px; border-radius:12px;
      display:flex; align-items:center; justify-content:center; font-size:1rem;
    }
    .stat-value { font-size:1.5rem; font-weight:800; color:#1a1a2e; line-height:1; }
    .stat-label { font-size:.72rem; font-weight:600; color:#555; }
    .stat-label-en { font-size:.62rem; color:#9090aa; }
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-stats { display:flex; gap:.75rem; }
    .shimmer-stat {
      flex:1; height:96px; border-radius:16px;
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
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }
    .count-pill {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.72rem; font-weight:700; padding:.15rem .5rem; border-radius:20px;
    }
    .actions-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.625rem; }
    .action-btn {
      display:flex; flex-direction:column; align-items:center; gap:.4rem;
      padding:.875rem .5rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f0; text-decoration:none; color:#374151;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .action-btn:active { transform:scale(.95); }
    .action-icon {
      width:40px; height:40px; border-radius:12px;
      display:flex; align-items:center; justify-content:center; font-size:1rem;
    }
    .al { font-size:.68rem; font-weight:700; text-align:center; color:#1a1a2e; }
    .ae { font-size:.58rem; color:#9090aa; text-align:center; }
    .list { display:flex; flex-direction:column; gap:.5rem; }
    .list-row {
      display:flex; align-items:center; gap:.875rem; background:#fff;
      border-radius:14px; border:1.5px solid #f0f0f0; padding:.875rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .list-avatar {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem;
    }
    .list-info { flex:1; min-width:0; }
    .list-name { display:block; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .list-sub { display:block; font-size:.75rem; color:#9090aa; margin-top:.1rem; }
    .enrolled-chip {
      font-size:.68rem; font-weight:700; color:#059669;
      background:rgba(16,185,129,.1); padding:.15rem .5rem; border-radius:10px;
      display:flex; align-items:center; gap:.25rem; flex-shrink:0;
    }
    .empty-box {
      text-align:center; padding:2rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2rem; color:#c4c4d4; display:block; margin-bottom:.5rem; }
    .empty-box p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.75rem; color:#9090aa; }

    /* Location */
    .edit-loc-btn {
      margin-right:auto; display:inline-flex; align-items:center; gap:.3rem;
      padding:.3rem .75rem; border-radius:20px;
      background:rgba(102,126,234,.08); border:1.5px solid rgba(102,126,234,.2);
      color:#667eea; font-size:.72rem; font-weight:700; cursor:pointer;
      transition:all .2s;
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
      width:100%; padding:.75rem; border:none; border-radius:12px; margin-top:.25rem;
      background:linear-gradient(135deg,#667eea,#764ba2); color:white;
      font-size:.88rem; font-weight:700; cursor:pointer; min-height:48px;
      box-shadow:0 4px 14px rgba(102,126,234,.3);
      transition:transform .15s, box-shadow .15s;
      -webkit-tap-highlight-color:transparent; touch-action:manipulation;
    }
    .loc-save-btn:active { transform:scale(.97); box-shadow:0 2px 8px rgba(102,126,234,.2); }
    .loc-save-btn:disabled { opacity:.6; cursor:not-allowed; }
    .spinner-xs {
      width:12px; height:12px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* About / Profile */
    .about-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1.125rem; box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .about-text {
      margin:0; font-size:.92rem; line-height:1.7; color:#374151; white-space:pre-wrap;
    }
    .photo-edit { display:flex; align-items:center; gap:1rem; }
    .photo-preview {
      width:72px; height:72px; border-radius:50%; flex-shrink:0; overflow:hidden;
      background:linear-gradient(135deg,rgba(102,126,234,.12),rgba(118,75,162,.12));
      display:flex; align-items:center; justify-content:center;
      color:#667eea; font-size:1.6rem; border:2px solid #e0e0f0;
    }
    .photo-preview img { width:100%; height:100%; object-fit:cover; }
    .photo-actions { display:flex; flex-direction:column; gap:.5rem; flex:1; }
    .photo-btn {
      display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.55rem .875rem; border-radius:12px; cursor:pointer; min-height:44px;
      background:rgba(102,126,234,.08); border:1.5px solid rgba(102,126,234,.25);
      color:#667eea; font-size:.82rem; font-weight:700;
      -webkit-tap-highlight-color:transparent;
    }
    .photo-btn:active { transform:scale(.97); }
    .photo-remove {
      display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.45rem .875rem; border-radius:12px; cursor:pointer; min-height:40px;
      background:rgba(220,38,38,.06); border:1.5px solid rgba(220,38,38,.2);
      color:#dc2626; font-size:.78rem; font-weight:700;
      -webkit-tap-highlight-color:transparent;
    }
    .bio-input { resize:vertical; min-height:96px; line-height:1.6; }
    .bio-count { font-size:.68rem; color:#9090aa; align-self:flex-start; margin-top:.15rem; }

  `],
})
export class TeacherProfileComponent implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly teacherSvc     = inject(TeacherService);
  private readonly secretarySvc   = inject(SecretaryTeacherService);
  private readonly restSvc        = inject(RestService);
  loading         = signal(true);
  userInfo        = signal<CurrentUserActorDto | null>(null);
  teacherInfo     = signal<TeacherDto | null>(null);
  enrolledCourses = signal<TeacherEnrolledCourseDto[]>([]);
  secretaries     = signal<SecretaryInfoDto[]>([]);
  editingLocation = signal(false);
  locSaving       = signal(false);
  locSaveError    = signal<string | null>(null);

  locGov  = signal('');
  locTown = signal('');

  // Profile (bio + photo)
  editingProfile  = signal(false);
  profileSaving   = signal(false);
  profileSaveError= signal<string | null>(null);
  bio             = signal('');
  photoUrl        = signal<string | null>(null);
  photoProcessing = signal(false);

  groupCount = () => 0;

  readonly governorates = EGYPT_GOVERNORATES_LIST;
  readonly districts    = computed(() => getDistricts(this.locGov()));

  onGovernorateChange(gov: string): void {
    this.locGov.set(gov);
    this.locTown.set('');
  }

  initials(): string {
    const name = this.userInfo()?.actorName || '?';
    return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    try {
      const [info, courses, secs] = await Promise.all([
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.teacherSvc.getCoursesWithEnrollmentStatus()),
        lastValueFrom(this.secretarySvc.getSecretariesForCurrentTeacher()).catch(() => [] as SecretaryInfoDto[]),
      ]);
      this.userInfo.set(info);
      this.enrolledCourses.set((courses ?? []).filter(c => c.isEnrolled));
      this.secretaries.set(secs ?? []);

      // Load full teacher dto for government/town
      if (info?.actorId) {
        try {
          const t = await lastValueFrom(this.teacherSvc.get(info.actorId));
          console.log('[TeacherProfile] loaded teacher:', JSON.stringify({ gov: t?.government, town: t?.town }));
          this.teacherInfo.set(t);
          if (t) {
            this.locGov.set(t.government || '');
            this.locTown.set(t.town || '');
            this.bio.set(t.bio || '');
            this.photoUrl.set(t.photoUrl || null);
          }
        } catch (e) {
          console.warn('[TeacherProfile] failed to load teacher by actorId:', e);
        }
      }
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async saveLocation(): Promise<void> {
    const id = this.userInfo()?.actorId;
    if (!id) {
      this.locSaveError.set('لم يتم العثور على معرف المعلم · Teacher ID not found. Try reloading.');
      return;
    }
    this.locSaving.set(true);
    this.locSaveError.set(null);
    try {
      const t = this.teacherInfo();
      const info = this.userInfo();
      const nameParts = (info?.actorName || '').split(' ');
      const gov = this.locGov() || '';
      const town = this.locTown() || '';
      const body: any = {
        firstName: t?.firstName || nameParts[0] || 'Teacher',
        lastName:  t?.lastName  || nameParts.slice(1).join(' ') || '',
        address:   t?.address ?? '',
        email:     t?.email ?? info?.email ?? '',
        phoneNumber: t?.phoneNumber ?? '',
        government: gov,
        town: town,
        bio: this.bio() || null,
        photoUrl: this.photoUrl() || null,
      };
      console.log('[TeacherProfile] saving location:', JSON.stringify({ gov, town }));
      await lastValueFrom(this.teacherSvc.update(id, body));
      // Re-fetch to confirm the saved values from the server
      const refreshed = await lastValueFrom(this.teacherSvc.get(id));
      console.log('[TeacherProfile] refreshed after save:', JSON.stringify({ gov: refreshed?.government, town: refreshed?.town }));
      if (refreshed) {
        this.teacherInfo.set(refreshed);
        this.locGov.set(refreshed.government || gov);
        this.locTown.set(refreshed.town || town);
      } else {
        // Fallback to local values if fetch failed
        this.locGov.set(gov);
        this.locTown.set(town);
      }
      this.editingLocation.set(false);
    } catch (err: any) {
      console.error('[TeacherProfile] save location error:', err);
      this.locSaveError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ · Error saving location');
    } finally {
      this.locSaving.set(false);
    }
  }

  /** Read a selected image file, downscale to <=320px, and store as a JPEG base64 data URL. */
  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.profileSaveError.set('الرجاء اختيار صورة صحيحة · Please select a valid image');
      return;
    }
    this.profileSaveError.set(null);
    this.photoProcessing.set(true);
    try {
      const dataUrl = await this.resizeImageToDataUrl(file, 320, 0.8);
      this.photoUrl.set(dataUrl);
    } catch (e) {
      console.error('[TeacherProfile] photo processing error:', e);
      this.profileSaveError.set('تعذّر معالجة الصورة · Could not process image');
    } finally {
      this.photoProcessing.set(false);
      input.value = '';
    }
  }

  removePhoto(): void {
    this.photoUrl.set(null);
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
          if (!ctx) { reject(new Error('no canvas context')); return; }
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
      // Self-service endpoint: the server resolves the teacher from the logged-in user,
      // so it works even if the client's actorId claim is missing/stale.
      const refreshed = await lastValueFrom(
        this.restSvc.request<{ bio: string | null; photoUrl: string | null }, TeacherDto>({
          method: 'PUT',
          url: '/api/sesha/teachers/my-profile',
          body: { bio: this.bio() || null, photoUrl: this.photoUrl() || null },
        })
      );
      if (refreshed) {
        this.teacherInfo.set(refreshed);
        this.bio.set(refreshed.bio || '');
        this.photoUrl.set(refreshed.photoUrl || null);
      }
      this.editingProfile.set(false);
    } catch (err: any) {
      console.error('[TeacherProfile] save profile error:', err);
      this.profileSaveError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ · Error saving profile');
    } finally {
      this.profileSaving.set(false);
    }
  }

  logout(): void { this.authService.logout(); }
}
