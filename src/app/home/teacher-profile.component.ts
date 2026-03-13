import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { TeacherService } from '@proxy/teachers';
import { TeacherDto, TeacherEnrolledCourseDto } from '@proxy/teachers/models';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';
import { BiometricService } from '../shared/services/biometric.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="avatar-wrap">
          <div class="avatar"><span>{{ initials() }}</span></div>
          <div class="role-badge"><i class="fas fa-chalkboard-teacher"></i> معلم · Teacher</div>
        </div>
        <div class="header-info">
          <h1 class="user-name">{{ userInfo()?.actorName || 'المعلم' }}</h1>
          @if (userInfo()?.actorCode) {
            <span class="user-code">{{ userInfo()?.actorCode }}</span>
          }
          @if (userInfo()?.email) {
            <span class="user-email">{{ userInfo()?.email }}</span>
          }
          @if (userInfo()?.userName) {
            <span class="user-email">&#64;{{ userInfo()?.userName }}</span>
          }
        </div>
        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> خروج
        </button>
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
          </div>
        </div>

        <!-- Location section -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-map-marker-alt"></i> الموقع الجغرافي · Location
            <button class="edit-loc-btn" (click)="editingLocation.set(!editingLocation())">
              <i [class]="editingLocation() ? 'fas fa-times' : 'fas fa-pen'"></i>
              {{ editingLocation() ? 'إلغاء' : 'تعديل' }}
            </button>
          </div>
          @if (editingLocation()) {
            <div class="loc-edit-card">
              <label>المحافظة · Governorate</label>
              <select [ngModel]="locGov()" (ngModelChange)="onGovernorateChange($event)" class="loc-input">
                <option value="">-- اختر المحافظة --</option>
                @for (g of governorates; track g) {
                  <option [value]="g">{{ g }}</option>
                }
              </select>
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
              @if (locSaveError()) { <p class="loc-error">{{ locSaveError() }}</p> }
              <button class="loc-save-btn" [disabled]="locSaving()" (click)="saveLocation()">
                @if (locSaving()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-check"></i> }
                حفظ الموقع
              </button>
            </div>
          } @else {
            <div class="loc-display">
              @if (locGov() || locTown()) {
                <span class="loc-item"><i class="fas fa-map-marker-alt"></i>
                  {{ [locGov(), locTown()].filter(Boolean).join(' — ') }}
                </span>
              } @else {
                <span class="loc-empty">لم يتم تحديد الموقع بعد · Location not set</span>
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

        <!-- Biometric Security -->
        @if (biometricAvailable()) {
          <div class="section">
            <div class="section-title"><i class="fas fa-fingerprint"></i> الأمان · Security</div>
            <div class="bio-card">
              <div class="bio-row">
                <div class="bio-icon" [class.bio-icon--on]="biometricEnabled()">
                  <i class="fas fa-fingerprint"></i>
                </div>
                <div class="bio-info">
                  <span class="bio-label">تسجيل الدخول بالبصمة</span>
                  <span class="bio-sub">{{ biometricEnabled() ? 'مفعّل · Enabled' : 'معطّل · Disabled' }}</span>
                </div>
                <button class="bio-toggle" [class.bio-toggle--on]="biometricEnabled()"
                        (click)="biometricEnabled() ? disableBiometric() : showEnableForm.set(true)"
                        [disabled]="biometricBusy()">
                  <span class="bio-knob"></span>
                </button>
              </div>

              @if (showEnableForm() && !biometricEnabled()) {
                <div class="bio-form">
                  <p class="bio-form-hint">
                    <i class="fas fa-info-circle"></i>
                    أدخل كلمة المرور الحالية لحفظها بشكل آمن وتفعيل تسجيل الدخول بالبصمة
                  </p>
                  <p class="bio-form-hint-en">Enter your password to enable biometric login</p>
                  <input class="bio-input" type="password" [(ngModel)]="enablePassword"
                         placeholder="كلمة المرور · Password" autocomplete="current-password" />
                  <div class="bio-form-actions">
                    <button class="bio-cancel-btn" (click)="showEnableForm.set(false); enablePassword = ''">
                      إلغاء · Cancel
                    </button>
                    <button class="bio-save-btn" (click)="enableBiometric()" [disabled]="biometricBusy() || !enablePassword">
                      @if (biometricBusy()) { <i class="fas fa-spinner fa-spin"></i> }
                      @else { <i class="fas fa-check"></i> }
                      تفعيل · Enable
                    </button>
                  </div>
                  @if (biometricMsg()) {
                    <p class="bio-msg" [class.bio-msg--error]="biometricError()">{{ biometricMsg() }}</p>
                  }
                </div>
              }

              @if (biometricEnabled() && biometricMsg()) {
                <p class="bio-msg" [class.bio-msg--error]="biometricError()">{{ biometricMsg() }}</p>
              }
            </div>
          </div>
        }

      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
      display:flex; flex-direction:column; align-items:center; text-align:center; gap:.5rem;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .avatar-wrap { display:flex; flex-direction:column; align-items:center; gap:.5rem; position:relative; z-index:1; }
    .avatar {
      width:80px; height:80px; border-radius:50%;
      background:rgba(255,255,255,.2); border:3px solid rgba(255,255,255,.5);
      display:flex; align-items:center; justify-content:center;
      font-size:1.8rem; font-weight:800; color:#fff;
    }
    .role-badge {
      display:flex; align-items:center; gap:.35rem;
      background:rgba(255,255,255,.18); color:rgba(255,255,255,.92);
      padding:.3rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600;
      border:1px solid rgba(255,255,255,.25);
    }
    .header-info { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:.2rem; }
    .user-name { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .user-code {
      font-size:.82rem; font-weight:600; color:rgba(255,255,255,.7);
      background:rgba(255,255,255,.12); padding:.15rem .6rem; border-radius:12px;
    }
    .user-email { font-size:.78rem; color:rgba(255,255,255,.65); }
    .logout-btn {
      position:absolute; top:max(1rem,env(safe-area-inset-top,0px)); left:1rem; z-index:2;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:rgba(255,255,255,.9); padding:.4rem .875rem; border-radius:12px;
      font-size:.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:.35rem;
    }
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
      padding:.3rem .75rem; border-radius:20px; border:1.5px solid #e0e0f0;
      background:white; color:#667eea; font-size:.72rem; font-weight:700; cursor:pointer;
    }
    .loc-display {
      background:white; border-radius:12px; border:1.5px solid #f0f0f0;
      padding:.875rem 1rem; display:flex; align-items:center; gap:.5rem;
    }
    .loc-item { font-size:.9rem; color:#1a1a2e; font-weight:500; }
    .loc-item i { color:#667eea; margin-left:.4rem; }
    .loc-empty { font-size:.85rem; color:#9090aa; font-style:italic; }
    .loc-edit-card {
      background:white; border-radius:12px; border:1.5px solid #e0e0f0;
      padding:1rem; display:flex; flex-direction:column; gap:.4rem;
    }
    .loc-edit-card label { font-size:.72rem; font-weight:600; color:#667eea; }
    .loc-input {
      padding:.55rem .75rem; border:1.5px solid #e0e0f0; border-radius:10px;
      font-size:.88rem; font-family:inherit; background:white; width:100%; box-sizing:border-box;
    }
    .loc-input:focus { outline:none; border-color:#667eea; }
    .loc-error { color:#dc2626; font-size:.75rem; margin:0; }
    .loc-save-btn {
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.7rem; border:none; border-radius:10px; margin-top:.25rem;
      background:linear-gradient(135deg,#667eea,#764ba2); color:white;
      font-size:.88rem; font-weight:700; cursor:pointer; min-height:44px;
    }
    .loc-save-btn:disabled { opacity:.6; cursor:not-allowed; }
    .spinner-xs {
      width:12px; height:12px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* ── Biometric ── */
    .bio-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .bio-row { display:flex; align-items:center; gap:.875rem; padding:.875rem; }
    .bio-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      background:rgba(156,163,175,.12); color:#9ca3af;
      display:flex; align-items:center; justify-content:center; font-size:1.2rem;
      transition:background .25s, color .25s;
    }
    .bio-icon--on { background:rgba(102,126,234,.12); color:#667eea; }
    .bio-info { flex:1; min-width:0; }
    .bio-label { display:block; font-size:.92rem; font-weight:700; color:#1a1a2e; }
    .bio-sub { display:block; font-size:.72rem; color:#9090aa; margin-top:.1rem; }
    .bio-toggle {
      position:relative; width:48px; height:28px; border-radius:14px;
      background:#d1d5db; border:none; cursor:pointer; padding:0; flex-shrink:0;
      transition:background .25s; outline:none;
      -webkit-tap-highlight-color:transparent;
    }
    .bio-toggle--on { background:linear-gradient(135deg,#667eea,#764ba2); }
    .bio-toggle:disabled { opacity:.5; cursor:not-allowed; }
    .bio-knob {
      position:absolute; top:3px; right:3px; width:22px; height:22px;
      border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.25);
      transition:transform .25s;
    }
    .bio-toggle--on .bio-knob { transform:translateX(-20px); }
    .bio-form {
      border-top:1px solid #f0f0f0; padding:.875rem;
      display:flex; flex-direction:column; gap:.6rem;
    }
    .bio-form-hint {
      font-size:.78rem; color:#555; margin:0;
      display:flex; align-items:flex-start; gap:.35rem; line-height:1.4;
    }
    .bio-form-hint i { color:#667eea; margin-top:.1rem; flex-shrink:0; }
    .bio-form-hint-en { font-size:.7rem; color:#9090aa; margin:0; }
    .bio-input {
      width:100%; padding:.65rem .75rem; border-radius:10px;
      border:1.5px solid #e5e7eb; font-size:.9rem; outline:none;
      box-sizing:border-box; direction:ltr; text-align:left;
      transition:border-color .2s;
    }
    .bio-input:focus { border-color:#667eea; }
    .bio-form-actions { display:flex; gap:.5rem; }
    .bio-cancel-btn {
      flex:1; padding:.65rem; border-radius:10px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.82rem; font-weight:600; cursor:pointer;
    }
    .bio-save-btn {
      flex:1; padding:.65rem; border-radius:10px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.82rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
    }
    .bio-save-btn:disabled { opacity:.5; cursor:not-allowed; }
    .bio-msg {
      font-size:.78rem; color:#059669; font-weight:600; margin:0;
      padding:.5rem .75rem; background:rgba(16,185,129,.08); border-radius:8px;
    }
    .bio-msg--error { color:#dc2626; background:rgba(239,68,68,.08); }
  `],
})
export class TeacherProfileComponent implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly teacherSvc     = inject(TeacherService);
  private readonly restSvc        = inject(RestService);
  private readonly biometricSvc   = inject(BiometricService);

  loading         = signal(true);
  userInfo        = signal<CurrentUserActorDto | null>(null);
  teacherInfo     = signal<TeacherDto | null>(null);
  enrolledCourses = signal<TeacherEnrolledCourseDto[]>([]);
  editingLocation = signal(false);
  locSaving       = signal(false);
  locSaveError    = signal<string | null>(null);

  locGov  = signal('');
  locTown = signal('');

  groupCount = () => 0;

  // Biometric
  biometricAvailable = signal(false);
  biometricEnabled   = signal(false);
  biometricBusy      = signal(false);
  biometricMsg       = signal('');
  biometricError     = signal(false);
  showEnableForm     = signal(false);
  enablePassword     = '';

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
      const [info, courses] = await Promise.all([
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.teacherSvc.getCoursesWithEnrollmentStatus()),
      ]);
      this.userInfo.set(info);
      this.enrolledCourses.set((courses ?? []).filter(c => c.isEnrolled));

      // Load full teacher dto for government/town
      if (info?.actorId) {
        // Use the sesha custom endpoint — more permissive than the admin CRUD endpoint
        const t = await lastValueFrom(
          this.restSvc.request<any, any>(
            { method: 'GET', url: `/api/sesha/teachers/${info.actorId}` },
            { apiName: 'Default', skipHandleError: true }
          )
        ).catch(() => null)
          // Fallback to standard proxy endpoint
          ?? await lastValueFrom(this.teacherSvc.get(info.actorId)).catch(() => null);

        this.teacherInfo.set(t);
        if (t) {
          this.locGov.set(t.government ?? '');
          this.locTown.set(t.town ?? '');
        }
      }
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }

    // Check biometric availability
    const available = await this.biometricSvc.isAvailable();
    this.biometricAvailable.set(available);
    if (available) {
      this.biometricEnabled.set(await this.biometricSvc.hasStoredCredentials());
    }
  }

  async enableBiometric(): Promise<void> {
    if (!this.enablePassword) return;
    this.biometricBusy.set(true);
    this.biometricMsg.set('');
    try {
      const verified = await this.biometricSvc.authenticate();
      if (!verified) {
        this.biometricError.set(true);
        this.biometricMsg.set('فشل التحقق بالبصمة · Biometric verification failed');
        return;
      }
      const username = this.userInfo()?.userName || this.userInfo()?.email || '';
      await this.biometricSvc.saveCredentials(username, this.enablePassword);
      this.biometricEnabled.set(true);
      this.showEnableForm.set(false);
      this.enablePassword = '';
      this.biometricError.set(false);
      this.biometricMsg.set('تم تفعيل تسجيل الدخول بالبصمة · Biometric login enabled');
      setTimeout(() => this.biometricMsg.set(''), 3000);
    } catch {
      this.biometricError.set(true);
      this.biometricMsg.set('حدث خطأ · Something went wrong');
    } finally {
      this.biometricBusy.set(false);
    }
  }

  async disableBiometric(): Promise<void> {
    this.biometricBusy.set(true);
    this.biometricMsg.set('');
    try {
      await this.biometricSvc.clearCredentials();
      this.biometricEnabled.set(false);
      this.biometricError.set(false);
      this.biometricMsg.set('تم إلغاء تفعيل البصمة · Biometric login disabled');
      setTimeout(() => this.biometricMsg.set(''), 3000);
    } catch {
      this.biometricError.set(true);
      this.biometricMsg.set('حدث خطأ · Something went wrong');
    } finally {
      this.biometricBusy.set(false);
    }
  }

  async saveLocation(): Promise<void> {
    const id = this.userInfo()?.actorId;
    if (!id) return;
    this.locSaving.set(true);
    this.locSaveError.set(null);
    try {
      const t = this.teacherInfo();
      await lastValueFrom(
        this.restSvc.request<any, any>(
          {
            method: 'PUT',
            url: `/api/app/teacher/${id}`,
            body: {
              firstName: t?.firstName ?? '',
              lastName:  t?.lastName  ?? '',
              address:   t?.address,
              email:     t?.email,
              phoneNumber: t?.phoneNumber,
              password: '',
              government: this.locGov(),
              town: this.locTown(),
            },
          },
          { apiName: 'Default', skipHandleError: true }
        )
      );
      this.editingLocation.set(false);
    } catch (err: any) {
      this.locSaveError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      this.locSaving.set(false);
    }
  }

  logout(): void { this.authService.logout(); }
}
