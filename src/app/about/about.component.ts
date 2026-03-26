import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-text">
            <h1>عن التطبيق</h1>
            <p>About KAI</p>
          </div>
          <div class="header-icon">
            <i class="fas fa-info-circle"></i>
          </div>
        </div>
      </div>

      <!-- App Logo & Name -->
      <div class="app-brand">
        <img src="assets/images/logo/logo-light.png" alt="KAI" class="app-logo" />
        <h2 class="app-name">KAI</h2>
        <p class="app-tagline">نظام المتابعة الذكية للتعلم</p>
        <p class="app-tagline-en">Smart Learning Follow-up System</p>
        <span class="app-version">الإصدار 1.0.0 · Version 1.0.0</span>
      </div>

      <!-- Description -->
      <div class="section">
        <div class="section-title"><i class="fas fa-star"></i> نبذة عن KAI · About KAI</div>
        <div class="info-card">
          <p class="desc">
            KAI هو نظام متكامل لإدارة التعليم يتيح لك متابعة الطلاب والمعلمين والمقررات والحضور والدرجات بكل سهولة.
            صُمم خصيصاً لتلبية احتياجات الأكاديميات ومراكز التعليم.
          </p>
          <p class="desc-en">
            KAI is a comprehensive educational management system that enables you to track students, teachers, courses, attendance, and grades with ease.
            Designed specifically for academies and education centers.
          </p>
        </div>
      </div>

      <!-- Features -->
      <div class="section">
        <div class="section-title"><i class="fas fa-bolt"></i> المميزات · Features</div>
        <div class="features-list">
          <div class="feature-item">
            <div class="feature-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="feature-text">
              <span class="feature-ar">إدارة الطلاب والتسجيل</span>
              <span class="feature-en">Student Management & Enrollment</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:rgba(16,185,129,.12);color:#059669">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="feature-text">
              <span class="feature-ar">إدارة المعلمين والمقررات</span>
              <span class="feature-en">Teacher & Course Management</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:rgba(245,158,11,.12);color:#d97706">
              <i class="fas fa-user-friends"></i>
            </div>
            <div class="feature-text">
              <span class="feature-ar">متابعة أولياء الأمور لأبنائهم</span>
              <span class="feature-en">Parent Follow-up for Children</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:rgba(220,38,38,.12);color:#dc2626">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="feature-text">
              <span class="feature-ar">تسجيل الحضور والغياب</span>
              <span class="feature-en">Attendance Tracking</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:rgba(118,75,162,.12);color:#764ba2">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="feature-text">
              <span class="feature-ar">تسجيل ومتابعة الدرجات</span>
              <span class="feature-en">Grade Entry & Tracking</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon" style="background:rgba(14,165,233,.12);color:#0ea5e9">
              <i class="fas fa-bell"></i>
            </div>
            <div class="feature-text">
              <span class="feature-ar">إشعارات فورية</span>
              <span class="feature-en">Real-time Notifications</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Developer Info -->
      <div class="section">
        <div class="section-title"><i class="fas fa-code"></i> المطور · Developer</div>
        <div class="info-card">
          <div class="dev-row">
            <span class="dev-key">الشركة · Company</span>
            <span class="dev-val">SwiftMind</span>
          </div>
          <div class="dev-row">
            <span class="dev-key">البريد · Email</span>
            <span class="dev-val ltr">support&#64;swiftmind.dev</span>
          </div>
        </div>
      </div>

      <!-- Links -->
      <div class="section">
        <div class="section-title"><i class="fas fa-link"></i> روابط · Links</div>
        <div class="links-list">
          <a class="link-item" routerLink="/privacy-policy">
            <div class="link-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="link-text">
              <span>سياسة الخصوصية</span>
              <small>Privacy Policy</small>
            </div>
            <i class="fas fa-chevron-left link-arrow"></i>
          </a>
          <a class="link-item" routerLink="/data-deletion">
            <div class="link-icon"><i class="fas fa-trash-alt"></i></div>
            <div class="link-text">
              <span>طلب حذف البيانات</span>
              <small>Data Deletion Request</small>
            </div>
            <i class="fas fa-chevron-left link-arrow"></i>
          </a>
          <a class="link-item" routerLink="/support">
            <div class="link-icon"><i class="fas fa-headset"></i></div>
            <div class="link-text">
              <span>الدعم الفني</span>
              <small>Support</small>
            </div>
            <i class="fas fa-chevron-left link-arrow"></i>
          </a>
        </div>
      </div>

      <p class="copyright">&copy; 2024-2026 SwiftMind. جميع الحقوق محفوظة · All rights reserved.</p>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-row {
      position:relative; z-index:1;
      display:flex; align-items:center; gap:1rem;
    }
    .btn-back {
      width:40px; height:40px; border-radius:12px;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.4rem; font-weight:800; color:#fff; }
    .header-text p { margin:.15rem 0 0; font-size:.82rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:48px; height:48px; border-radius:14px;
      background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center;
      color:rgba(255,255,255,.9); font-size:1.3rem; flex-shrink:0;
    }

    /* Brand section */
    .app-brand {
      display:flex; flex-direction:column; align-items:center;
      padding:1.5rem 1rem 1rem; text-align:center;
    }
    .app-logo {
      width:80px; height:80px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      padding:.5rem; border:3px solid rgba(102,126,234,.2);
      box-shadow:0 4px 16px rgba(102,126,234,.25);
    }
    .app-name {
      margin:.75rem 0 .1rem; font-size:1.5rem; font-weight:900; color:#1a1a2e;
    }
    .app-tagline { margin:0; font-size:.85rem; font-weight:600; color:#4a4a6a; }
    .app-tagline-en { margin:.1rem 0 0; font-size:.72rem; color:#9090aa; }
    .app-version {
      margin-top:.5rem; font-size:.68rem; font-weight:600;
      background:rgba(102,126,234,.1); color:#667eea;
      padding:.25rem .75rem; border-radius:20px;
    }

    /* Sections */
    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
      i { color:#667eea; font-size:.85rem; }
    }

    .info-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .desc { margin:0 0 .5rem; font-size:.82rem; color:#4a4a6a; line-height:1.6; }
    .desc-en { margin:0; font-size:.72rem; color:#9090aa; line-height:1.5; }

    /* Features */
    .features-list {
      display:flex; flex-direction:column; gap:.4rem;
    }
    .feature-item {
      display:flex; align-items:center; gap:.65rem;
      padding:.7rem .85rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f5; box-shadow:0 2px 6px rgba(0,0,0,.03);
    }
    .feature-icon {
      width:40px; height:40px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:1rem;
    }
    .feature-text { display:flex; flex-direction:column; }
    .feature-ar { font-size:.82rem; font-weight:700; color:#1a1a2e; }
    .feature-en { font-size:.65rem; color:#9090aa; }

    /* Developer info */
    .dev-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:.5rem 0; border-bottom:1px solid #f8f8fc;
    }
    .dev-row:last-child { border-bottom:none; }
    .dev-key { font-size:.82rem; color:#555; }
    .dev-val { font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .dev-val.ltr { direction:ltr; }

    /* Links */
    .links-list { display:flex; flex-direction:column; gap:.4rem; }
    .link-item {
      display:flex; align-items:center; gap:.65rem;
      padding:.75rem .85rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f5; text-decoration:none;
      box-shadow:0 2px 6px rgba(0,0,0,.03);
      -webkit-tap-highlight-color:transparent;
      &:active { transform:scale(.99); }
    }
    .link-icon {
      width:38px; height:38px; border-radius:10px;
      background:rgba(102,126,234,.1); color:#667eea;
      display:flex; align-items:center; justify-content:center;
      font-size:.95rem; flex-shrink:0;
    }
    .link-text { flex:1; display:flex; flex-direction:column; }
    .link-text span { font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .link-text small { font-size:.65rem; color:#9090aa; }
    .link-arrow { color:#c4c4d4; font-size:.75rem; flex-shrink:0; }

    .copyright {
      text-align:center; font-size:.68rem; color:#9090aa;
      padding:1.5rem 1rem .5rem;
    }
  `],
})
export class AboutComponent {
  private readonly location = inject(Location);
  goBack(): void { this.location.back(); }
}
