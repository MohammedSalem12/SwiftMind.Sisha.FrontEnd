import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, OnDestroy, effect, computed } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ConfigStateService, AuthService } from '@abp/ng.core';
import { filter, take, Subscription, lastValueFrom } from 'rxjs';
import { ROLES } from '../route.provider';
import { RealtimeNotificationService } from './services/realtime-notification.service';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { SecretaryTeacherService } from '@proxy/teachers';

interface NavItem {
  path: string;
  label: string;
  labelEn: string;
  icon: string;
  badge?: 'requests' | 'notifications';
}

interface SecondaryItem {
  path: string;
  label: string;
  labelEn: string;
  icon: string;
}

function getRoleHomePath(roles: string[]): string {
  if (roles.includes(ROLES.STUDENT))    return '/student';
  if (roles.includes(ROLES.TEACHER))    return '/teacher';
  if (roles.includes(ROLES.PARENT))     return '/parent';
  if (roles.includes(ROLES.SECRETARY))  return '/secretary';
  if (roles.includes(ROLES.ADMIN))      return '/secretary-assignments';
  if (roles.includes(ROLES.ADVERTISER)) return '/ads/my';
  return '/';
}

function getRoleProfilePath(roles: string[]): string {
  if (roles.includes(ROLES.STUDENT))    return '/student/profile';
  if (roles.includes(ROLES.TEACHER))    return '/teacher/profile';
  if (roles.includes(ROLES.PARENT))     return '/parent/profile';
  if (roles.includes(ROLES.SECRETARY))  return '/secretary/profile';
  if (roles.includes(ROLES.ADVERTISER)) return '/profile';
  return '/profile';
}

function getRoleRequestsPath(roles: string[]): string {
  if (roles.includes(ROLES.STUDENT))    return '/student/requests';
  if (roles.includes(ROLES.TEACHER))    return '/teacher/my-requests';
  if (roles.includes(ROLES.PARENT))     return '/parent/requests';
  if (roles.includes(ROLES.SECRETARY))  return '/secretary/requests';
  if (roles.includes(ROLES.ADMIN))      return '/enrollment-requests';
  if (roles.includes(ROLES.ADVERTISER)) return '/notifications';
  return '/notifications';
}

function getSecondaryItems(roles: string[]): SecondaryItem[] {
  if (roles.includes(ROLES.ADMIN)) return [
    { path: '/students',             label: 'الطلاب',              labelEn: 'Students',           icon: 'fas fa-user-graduate' },
    { path: '/teachers',             label: 'المعلمون',             labelEn: 'Teachers',           icon: 'fas fa-chalkboard-teacher' },
    { path: '/parents',              label: 'أولياء الأمور',       labelEn: 'Parents',            icon: 'fas fa-users-cog' },
    { path: '/courses',              label: 'المقررات',             labelEn: 'Courses',            icon: 'fas fa-book' },
    { path: '/attendance',           label: 'الحضور',               labelEn: 'Attendance',         icon: 'fas fa-user-check' },
    { path: '/add-teacher',          label: 'إضافة معلم',          labelEn: 'Add Teacher',        icon: 'fas fa-user-plus' },
    { path: '/add-student',          label: 'إضافة طالب',          labelEn: 'Add Student',        icon: 'fas fa-user-plus' },
    { path: '/ads/admin',            label: 'إدارة الإعلانات',     labelEn: 'Ads Management',     icon: 'fas fa-bullhorn' },
  ];
  return [];
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
@if (!navHidden()) {
    <!-- ══════════════════════════════════════════════════
         MOBILE — Fixed bottom bar (< 768px)
    ══════════════════════════════════════════════════ -->
    <nav class="mobile-nav" dir="rtl">
      <div class="mn-inner">

        <!-- 5 core tabs -->
        @for (item of coreNav(); track item.path) {
          <a class="mn-tab" [routerLink]="item.path" [class.active]="isActive(item.path)">
            <div class="mn-icon-wrap">
              <i [class]="item.icon"></i>
              @if (badge(item) > 0) {
                <span class="mn-badge">{{ badge(item) > 9 ? '9+' : badge(item) }}</span>
              }
            </div>
            <span class="mn-label">{{ item.label }}</span>
            @if (isActive(item.path)) { <span class="mn-bar"></span> }
          </a>
        }

        <!-- More tab -->
        <button class="mn-tab" (click)="toggleMore()" [class.active]="showMore()">
          <div class="mn-icon-wrap">
            <i class="fas fa-ellipsis-h"></i>
          </div>
          <span class="mn-label">المزيد</span>
          @if (showMore()) { <span class="mn-bar"></span> }
        </button>

      </div>
    </nav>

    <!-- More Menu Overlay -->
    @if (showMore()) {
      <div class="more-overlay" (click)="showMore.set(false)"></div>
      <div class="more-sheet" dir="rtl">
        <div class="more-handle"></div>

        <!-- Profile row -->
        <a class="more-profile" [routerLink]="profilePath()" (click)="showMore.set(false)">
          <div class="more-avatar">
            @if (userInitials() !== '?') { <span>{{ userInitials() }}</span> }
            @else { <i class="fas fa-user"></i> }
          </div>
          <div class="more-profile-info">
            <span class="more-profile-name">{{ displayName() || 'مستخدم' }}</span>
            @if (userEmail()) {
              <span class="more-profile-email">{{ userEmail() }}</span>
            }
          </div>
          <i class="fas fa-chevron-left more-arrow"></i>
        </a>

        <div class="more-divider"></div>

        <!-- Menu items -->
        <div class="more-items">
          @if (isAdvertiserRole()) {
            <a class="more-item" routerLink="/ads/settlement" (click)="showMore.set(false)">
              <div class="more-item-icon more-icon-green"><i class="fas fa-file-invoice-dollar"></i></div>
              <div class="more-item-text">
                <span>التسويات المالية</span>
                <span class="more-item-en">Settlements</span>
              </div>
            </a>
          } @else {
            <a class="more-item" routerLink="/ads" (click)="showMore.set(false)">
              <div class="more-item-icon more-icon-amber"><i class="fas fa-bullhorn"></i></div>
              <div class="more-item-text">
                <span>إعلانات</span>
                <span class="more-item-en">Ads</span>
              </div>
            </a>
            <!-- Feeds hidden — kept in codebase for future use -->
            <a class="more-item" routerLink="/feeds" (click)="showMore.set(false)" style="display:none">
              <div class="more-item-icon more-icon-blue"><i class="fas fa-rss"></i></div>
              <div class="more-item-text">
                <span>النشرات</span>
                <span class="more-item-en">Feeds</span>
              </div>
            </a>
          }
          <a class="more-item" routerLink="/settings" (click)="showMore.set(false)">
            <div class="more-item-icon more-icon-gray"><i class="fas fa-cog"></i></div>
            <div class="more-item-text">
              <span>إعدادات</span>
              <span class="more-item-en">Settings</span>
            </div>
          </a>
        </div>

        <div class="more-divider"></div>

        <button class="more-logout" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i>
          <span>تسجيل الخروج · Logout</span>
        </button>
      </div>
    }

    <!-- ══════════════════════════════════════════════════
         DESKTOP — Right sidebar (≥ 768px)
    ══════════════════════════════════════════════════ -->
    <aside class="desktop-nav" dir="rtl">

      <!-- App brand -->
      <div class="dn-brand">
        <div class="dn-logo">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="dn-brand-text">
          <span class="dn-brand-name">KAI</span>
          <span class="dn-brand-sub">نظام إدارة التعليم</span>
        </div>
      </div>

      <!-- Core nav items -->
      <nav class="dn-nav">
        <p class="dn-section-label">القائمة الرئيسية</p>
        @for (item of coreNav(); track item.path) {
          <a class="dn-item" [routerLink]="item.path" [class.active]="isActive(item.path)">
            <div class="dn-item-icon">
              <i [class]="item.icon"></i>
              @if (badge(item) > 0) {
                <span class="dn-badge">{{ badge(item) > 9 ? '9+' : badge(item) }}</span>
              }
            </div>
            <div class="dn-item-text">
              <span class="dn-item-label">{{ item.label }}</span>
              <span class="dn-item-label-en">{{ item.labelEn }}</span>
            </div>
          </a>
        }

        @if (isAdvertiserRole()) {
          <!-- Advertiser: settlements link -->
          <a class="dn-item" routerLink="/ads/settlement" [class.active]="isActive('/ads/settlement')">
            <div class="dn-item-icon">
              <i class="fas fa-file-invoice-dollar"></i>
            </div>
            <div class="dn-item-text">
              <span class="dn-item-label">التسويات المالية</span>
              <span class="dn-item-label-en">Settlements</span>
            </div>
          </a>
        } @else {
          <!-- Ads link -->
          <a class="dn-item" routerLink="/ads" [class.active]="isActive('/ads')">
            <div class="dn-item-icon">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="dn-item-text">
              <span class="dn-item-label">إعلانات</span>
              <span class="dn-item-label-en">Ads</span>
            </div>
          </a>
        }

        <!-- Settings link -->
        <a class="dn-item" routerLink="/settings" [class.active]="isActive('/settings')">
          <div class="dn-item-icon">
            <i class="fas fa-cog"></i>
          </div>
          <div class="dn-item-text">
            <span class="dn-item-label">إعدادات التطبيق</span>
            <span class="dn-item-label-en">App Settings</span>
          </div>
        </a>

        <!-- Profile link -->
        <a class="dn-item" [routerLink]="profilePath()" [class.active]="isActive(profilePath()!)">
          <div class="dn-item-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="dn-item-text">
            <span class="dn-item-label">ملفي الشخصي</span>
            <span class="dn-item-label-en">My Profile</span>
          </div>
        </a>
      </nav>

      <!-- Secondary items -->
      @if (secondaryNav().length > 0) {
        <div class="dn-divider"></div>
        <nav class="dn-nav">
          <p class="dn-section-label">أدوات أخرى</p>
          @for (item of secondaryNav(); track item.path) {
            <a class="dn-item dn-item-sm" [routerLink]="item.path" [class.active]="isActive(item.path)">
              <div class="dn-item-icon sm">
                <i [class]="item.icon"></i>
              </div>
              <div class="dn-item-text">
                <span class="dn-item-label">{{ item.label }}</span>
              </div>
            </a>
          }
        </nav>
      }

      <!-- Spacer -->
      <div style="flex:1"></div>

      <!-- User profile footer -->
      <div class="dn-user">
        <div class="dn-user-avatar">
          @if (userInitials() !== '?') { <span>{{ userInitials() }}</span> }
          @else { <i class="fas fa-user"></i> }
        </div>
        <div class="dn-user-info">
          <p class="dn-user-name">{{ displayName() || 'مستخدم' }}</p>
          @if (userEmail()) { <p class="dn-user-email">{{ userEmail() }}</p> }
        </div>
        <button class="dn-logout-btn" (click)="logout()" title="تسجيل الخروج">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>

    </aside>
}
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════
       MOBILE BOTTOM NAV  (< 768px)
    ═══════════════════════════════════════════════════════ */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 1000;
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      box-shadow: 0 -2px 16px rgba(0,0,0,0.06);
      padding-bottom: max(4px, env(safe-area-inset-bottom));
    }

    .mn-inner {
      display: flex;
      align-items: stretch;
      height: 58px;
      width: 100%;
      padding: 0;
    }

    .mn-tab {
      position: relative;
      flex: 1;
      width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      text-decoration: none;
      color: #9ca3af;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 6px 0 4px;
      min-width: 0;
      transition: color 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    .mn-tab.active { color: #5b21b6; }

    .mn-icon-wrap {
      position: relative;
      width: 44px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 14px;
      transition: background 0.2s;
    }
    .mn-tab.active .mn-icon-wrap {
      background: rgba(91,33,182,0.12);
    }
    .mn-icon-wrap i { font-size: 1.25rem; }

    .mn-label {
      font-size: 0.65rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      text-align: center;
      line-height: 1;
    }

    .mn-bar {
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 24px; height: 3px;
      border-radius: 0 0 3px 3px;
      background: linear-gradient(90deg, #7c3aed, #5b21b6);
    }

    .mn-badge {
      position: absolute;
      top: -4px; right: -2px;
      background: #ef4444;
      color: #fff;
      font-size: 0.5rem;
      font-weight: 700;
      min-width: 16px; height: 16px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(239,68,68,0.3);
    }

    .mn-avatar-sm {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 1px 4px rgba(124,58,237,0.25);
    }
    .mn-tab.active .mn-avatar-sm {
      box-shadow: 0 2px 8px rgba(124,58,237,0.45);
    }

    /* Profile tab avatar */

    /* ═══════════════════════════════════════════════════════
       DESKTOP SIDEBAR  (≥ 768px)
    ═══════════════════════════════════════════════════════ */
    .desktop-nav {
      display: none;
      position: fixed;
      top: 0; right: 0;
      width: 248px;
      height: 100vh;
      height: 100dvh;
      background: #1a2142;
      flex-direction: column;
      z-index: 900;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      box-shadow: -4px 0 24px rgba(0,0,0,0.18);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .desktop-nav::-webkit-scrollbar { width: 3px; }
    .desktop-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.12); border-radius: 2px;
    }

    /* Brand */
    .dn-brand {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1.5rem 1.25rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .dn-logo {
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.15rem; flex-shrink: 0;
    }
    .dn-brand-text { line-height: 1.2; }
    .dn-brand-name {
      display: block; font-size: 1rem; font-weight: 800; color: #fff;
    }
    .dn-brand-sub {
      display: block; font-size: 0.72rem; font-weight: 500;
      color: rgba(255,255,255,0.45); letter-spacing: 0.05em;
    }

    /* Section labels */
    .dn-section-label {
      margin: 0 0 0.25rem; padding: 0 1rem;
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: rgba(255,255,255,0.3);
    }

    /* Nav */
    .dn-nav {
      padding: 1rem 0.625rem 0.5rem;
      display: flex; flex-direction: column; gap: 2px;
    }

    .dn-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.875rem;
      border-radius: 12px;
      text-decoration: none;
      color: rgba(255,255,255,0.65);
      transition: background 0.15s, color 0.15s;
      min-height: 48px;
      cursor: pointer;
    }
    .dn-item:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.9);
    }
    .dn-item.active {
      background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(91,33,182,0.35));
      color: #fff;
    }

    .dn-item-icon {
      position: relative;
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    .dn-item-icon.sm { width: 30px; height: 30px; border-radius: 8px; }
    .dn-item-icon i { font-size: 0.95rem; }
    .dn-item.active .dn-item-icon {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
    }

    .dn-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: #fff;
      font-size: 0.5rem; font-weight: 700;
      min-width: 15px; height: 15px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px; border: 1.5px solid #1a2142;
    }

    .dn-item-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .dn-item-label {
      font-size: 0.88rem; font-weight: 600; line-height: 1.2;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dn-item-label-en {
      font-size: 0.68rem; font-weight: 400; opacity: 0.5; line-height: 1;
    }

    .dn-item-sm .dn-item-label { font-size: 0.82rem; }

    /* Divider */
    .dn-divider {
      height: 1px; background: rgba(255,255,255,0.07);
      margin: 0.5rem 1rem;
    }

    /* User footer */
    .dn-user {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: rgba(0,0,0,0.15);
    }
    .dn-user-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700;
    }
    .dn-user-info { flex: 1; min-width: 0; }
    .dn-user-name {
      margin: 0; font-size: 0.82rem; font-weight: 600; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dn-user-email {
      margin: 1px 0 0; font-size: 0.68rem; color: rgba(255,255,255,0.4);
      direction: ltr; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dn-logout-btn {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.2);
      color: #f87171; font-size: 0.85rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .dn-logout-btn:hover { background: rgba(239,68,68,0.3); }

    /* ═══════════════════════════════════════════════════════
       RESPONSIVE SHOW/HIDE
    ═══════════════════════════════════════════════════════ */
    @media (max-width: 767px) {
      .mobile-nav { display: flex; }
    }

    @media (min-width: 768px) {
      .desktop-nav { display: flex; }
    }

    /* iOS safe area for mobile nav */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .mobile-nav { padding-bottom: calc(4px + env(safe-area-inset-bottom)); }
    }

    /* ═══════════════════════════════════════════════════════
       MORE SHEET  (mobile slide-up)
    ═══════════════════════════════════════════════════════ */
    .more-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.35);
      z-index: 1100;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .more-sheet {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #fff;
      border-radius: 20px 20px 0 0;
      z-index: 1200;
      padding: 0.5rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
      box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
      animation: slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
      max-height: 80vh;
      overflow-y: auto;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .more-handle {
      width: 36px; height: 4px;
      border-radius: 2px;
      background: #d1d5db;
      margin: 0.25rem auto 0.75rem;
    }

    .more-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.25rem;
      text-decoration: none;
      color: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .more-avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(102,126,234,0.3);
    }
    .more-profile-info {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column;
    }
    .more-profile-name {
      font-size: 0.95rem; font-weight: 700; color: #1a202c;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .more-profile-email {
      font-size: 0.72rem; color: #9ca3af;
      direction: ltr; text-align: right;
    }
    .more-arrow { font-size: 0.7rem; color: #d1d5db; }

    .more-divider {
      height: 1px;
      background: #f3f4f6;
      margin: 0.65rem 0;
    }

    .more-items {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .more-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.5rem;
      border-radius: 12px;
      text-decoration: none;
      color: #374151;
      font-size: 0.88rem;
      font-weight: 600;
      transition: background 0.15s;
      min-height: 48px;
      -webkit-tap-highlight-color: transparent;
    }
    .more-item:active { background: #f9fafb; }

    .more-item-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .more-icon-amber { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .more-icon-gray  { background: rgba(107,114,128,0.1); color: #6b7280; }
    .more-icon-blue  { background: rgba(59,130,246,0.1);  color: #3b82f6; }
    .more-icon-green { background: rgba(16,185,129,0.1);  color: #10b981; }

    .more-item-text {
      display: flex; flex-direction: column;
    }
    .more-item-en {
      font-size: 0.68rem; font-weight: 400; color: #9ca3af;
    }

    .more-logout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem;
      border-radius: 12px;
      border: 1.5px solid rgba(239,68,68,0.2);
      background: rgba(239,68,68,0.05);
      color: #ef4444;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      min-height: 48px;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    }
    .more-logout:active { background: rgba(239,68,68,0.12); }
  `],
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private readonly router              = inject(Router);
  private readonly configStateService  = inject(ConfigStateService);
  private readonly authService         = inject(AuthService);
  private readonly realtimeSvc         = inject(RealtimeNotificationService);
  private readonly enrollmentSvc       = inject(EnrollmentRequestService);
  private readonly secretaryTeacherSvc = inject(SecretaryTeacherService);

  private routerSub?: Subscription;
  private notifEffect = effect(() => {
    const notif = this.realtimeSvc.latestNotification();
    if (notif && this.isTeacher) this.loadPendingCount();
  });

  // ── State ──────────────────────────────────────────────────────────────────
  readonly unreadCount     = this.realtimeSvc.unreadCount;
  pendingRequestsCount     = signal(0);
  currentPath              = signal('');
  userInitials  = signal('?');
  displayName   = signal('');
  userEmail     = signal('');

  profilePath      = signal('/profile');
  coreNav          = signal<NavItem[]>([]);
  secondaryNav     = signal<SecondaryItem[]>([]);
  showMore         = signal(false);
  isAdvertiserRole = signal(false);

  private readonly NAV_HIDDEN_PATHS = ['/complete-profile', '/login', '/register'];
  navHidden = computed(() => this.NAV_HIDDEN_PATHS.some(p => this.currentPath().startsWith(p)));

  private isTeacher = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadUserAndNav();
    this.currentPath.set(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentPath.set(e.urlAfterRedirects);
        this.showMore.set(false);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.notifEffect.destroy();
  }

  // ── Setup ──────────────────────────────────────────────────────────────────
  private loadUserAndNav(): void {
    // getOne() is unreliable at init time — wait for the observable to emit
    // an authenticated user (same pattern as route.provider.ts)
    this.configStateService
      .getOne$('currentUser')
      .pipe(
        filter((u: any) => !!u && u.isAuthenticated === true),
        take(1)
      )
      .subscribe((cu: any) => {
        const roles: string[] = (cu?.roles || cu?.roleNames || cu?.userRoles || [])
          .map((r: any) => (typeof r === 'string' ? r.toUpperCase() : ''))
          .filter(Boolean);
        this.isTeacher = roles.includes(ROLES.TEACHER);

        // User info
        const first = cu?.name    || '';
        const last  = cu?.surName || '';
        const uname = cu?.userName || '';
        const full  = [first, last].filter(Boolean).join(' ') || uname;
        const parts = full.trim().split(/\s+/).filter(Boolean);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (parts[0]?.[0]?.toUpperCase() || '?');

        this.userInitials.set(initials);
        this.displayName.set(full);
        this.userEmail.set(cu?.email || '');

        // Core nav items — role-aware paths resolved AFTER user is loaded
        const homePath     = getRoleHomePath(roles);
        const requestsPath = getRoleRequestsPath(roles);

        const isStudent = roles.includes(ROLES.STUDENT);
        const isTeacher = roles.includes(ROLES.TEACHER);
        const isAdvertiser = roles.includes(ROLES.ADVERTISER);
        this.isAdvertiserRole.set(isAdvertiser);

        if (isAdvertiser) {
          // Advertiser gets minimal nav: My Ads, Create Ad, Redeem, Notifications
          this.coreNav.set([
            { path: '/ads/my',        label: 'إعلاناتي',   labelEn: 'My Ads',        icon: 'fas fa-bullhorn' },
            { path: '/ads/create',    label: 'إعلان جديد',  labelEn: 'New Ad',        icon: 'fas fa-plus-circle' },
            { path: '/ads/redeem',    label: 'استبدال',      labelEn: 'Redeem',        icon: 'fas fa-qrcode' },
            { path: '/notifications', label: 'إشعارات',     labelEn: 'Notifications', icon: 'fas fa-bell', badge: 'notifications' },
          ]);
        } else {
          this.coreNav.set([
            { path: homePath,         label: 'الرئيسية',    labelEn: 'Home',          icon: 'fas fa-home' },
            { path: requestsPath,     label: 'طلباتي',      labelEn: 'Requests',      icon: 'fas fa-clipboard-list', badge: 'requests' },
            // Students & Teachers get Academies in core nav
            ...(isStudent
              ? [{ path: '/academies',         label: 'الأكاديميات', labelEn: 'Academies', icon: 'fas fa-university' }]
              : isTeacher
              ? [{ path: '/teacher/academies', label: 'الأكاديميات', labelEn: 'Academies', icon: 'fas fa-university' }]
              : []
            ),
            { path: '/notifications', label: 'إشعارات',  labelEn: 'Notifications', icon: 'fas fa-bell', badge: 'notifications' as const },
          ]);
        }

        this.profilePath.set(getRoleProfilePath(roles));
        this.secondaryNav.set(getSecondaryItems(roles));

        if (this.isTeacher) this.loadPendingCount();
      });
  }

  private async loadPendingCount(): Promise<void> {
    try {
      const [enroll, link] = await Promise.all([
        lastValueFrom(this.enrollmentSvc.getPendingRequestsForCurrentTeacher()),
        lastValueFrom(this.secretaryTeacherSvc.getPendingRequestsForCurrentTeacher()),
      ]);
      this.pendingRequestsCount.set((enroll?.length || 0) + (link?.length || 0));
    } catch { /* silent */ }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  badge(item: NavItem): number {
    if (item.badge === 'notifications') return this.unreadCount();
    if (item.badge === 'requests')      return this.pendingRequestsCount();
    return 0;
  }

  isActive(path: string): boolean {
    const cur = this.currentPath();
    const exact = ['/', '/student', '/teacher', '/parent', '/secretary', '/secretary-assignments',
                   '/profile', '/secretary/profile', '/student/profile', '/teacher/profile', '/parent/profile',
                   '/academies', '/teacher/academies', '/feeds', '/notifications', '/settings', '/ads',
                   '/ads/my', '/ads/create', '/ads/redeem', '/ads/settlement'];
    if (exact.includes(path)) return cur === path;
    return cur.startsWith(path);
  }

  toggleMore(): void {
    this.showMore.update(v => !v);
  }

  async logout(): Promise<void> {
    this.showMore.set(false);
    await this.authService.logout();
  }
}
