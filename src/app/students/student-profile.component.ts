import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { StudentService } from '@proxy/students';
import { StudentDto } from '@proxy/students/models';
import { ParentStudentDto } from '@proxy/parents/models';
import { BiometricService } from '../shared/services/biometric.service';

@Component({
  selector: 'app-student-profile',
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
          <div class="role-badge"><i class="fas fa-graduation-cap"></i> طالب · Student</div>
        </div>
        <div class="header-info">
          <h1 class="user-name">{{ student()?.firstName }} {{ student()?.lastName }}</h1>
          @if (student()?.studentCode) {
            <span class="user-code">{{ student()?.studentCode }}</span>
          }
          @if (userInfo()?.email) {
            <span class="user-email">{{ userInfo()?.email }}</span>
          }
          @if (userInfo()?.currentGrade) {
            <span class="grade-badge">{{ gradeName(userInfo()?.currentGrade) }}</span>
          }
        </div>
        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> خروج
        </button>
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
          </div>
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
      padding:.3rem .75rem; border-radius:20px;
      font-size:.75rem; font-weight:600; border:1px solid rgba(255,255,255,.25);
    }
    .header-info { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:.2rem; }
    .user-name { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .user-code {
      font-size:.82rem; font-weight:600; color:rgba(255,255,255,.7);
      background:rgba(255,255,255,.12); padding:.15rem .6rem; border-radius:12px;
    }
    .user-email { font-size:.78rem; color:rgba(255,255,255,.65); }
    .grade-badge {
      font-size:.78rem; font-weight:600; color:rgba(255,255,255,.9);
      background:rgba(255,255,255,.2); padding:.2rem .65rem; border-radius:12px;
    }
    .logout-btn {
      position:absolute; top:max(1rem,env(safe-area-inset-top,0px)); left:1rem; z-index:2;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:rgba(255,255,255,.9); padding:.4rem .875rem; border-radius:12px;
      font-size:.8rem; font-weight:600; cursor:pointer;
      display:flex; align-items:center; gap:.35rem;
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

    /* ── Biometric ── */
    .bio-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .bio-row {
      display:flex; align-items:center; gap:.875rem; padding:.875rem;
    }
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
export class StudentProfileComponent implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly studentSvc     = inject(StudentService);
  private readonly biometricSvc   = inject(BiometricService);

  loading  = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);
  student  = signal<StudentDto | null>(null);
  parents  = signal<ParentStudentDto[]>([]);

  // Biometric
  biometricAvailable = signal(false);
  biometricEnabled   = signal(false);
  biometricBusy      = signal(false);
  biometricMsg       = signal('');
  biometricError     = signal(false);
  showEnableForm     = signal(false);
  enablePassword     = '';

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
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }

    // Check biometric availability after data loads
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
      // Verify identity with biometric before saving credentials
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

  logout(): void { this.authService.logout(); }
}
