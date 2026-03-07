import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { CourseService } from '@proxy/courses';
import type { CourseDto, CreateUpdateCourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-academy-manage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="academy-manage-page" dir="rtl">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button class="btn-back" (click)="router.navigate(['/academies', academyId, 'profile'])">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-icon">
            <i class="fas fa-cogs"></i>
          </div>
          <div>
            <h1>إدارة الأكاديمية</h1>
            <p *ngIf="academy()">{{ academy()!.nameAr }}</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="!loading()">
        <div class="stat-card">
          <div class="stat-icon requests">
            <i class="fas fa-user-clock"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ pendingRequests().length }}</div>
            <div class="stat-label">طلبات معلقة</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon members">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ members().length }}</div>
            <div class="stat-label">إجمالي الأعضاء</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon courses">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ academyCourses().length }}</div>
            <div class="stat-label">المقررات</div>
          </div>
        </div>
      </div>

      <!-- Modern Tabs -->
      <div class="tabs-container">
        <div class="tabs-wrapper">
          <button class="tab-btn" [class.active]="activeTab() === 'requests'" (click)="activeTab.set('requests')">
            <i class="fas fa-user-clock"></i>
            <span>الطلبات</span>
            <span class="tab-badge" *ngIf="pendingRequests().length">{{ pendingRequests().length }}</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'members'" (click)="activeTab.set('members')">
            <i class="fas fa-users"></i>
            <span>الأعضاء</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'courses'" (click)="activeTab.set('courses')">
            <i class="fas fa-book-open"></i>
            <span>المقررات</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <div class="loading-spinner"></div>
        <span>جاري التحميل...</span>
      </div>

      <!-- Tab Content -->
      <div class="content-container" *ngIf="!loading()">
        <!-- Requests Tab -->
        <div class="tab-panel" [class.active]="activeTab() === 'requests'">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-user-clock me-2"></i>
              طلبات الانضمام
            </h2>
            <div class="section-count">{{ pendingRequests().length }} طلب</div>
          </div>
          
          <div *ngIf="pendingRequests().length === 0" class="empty-state">
            <i class="fas fa-check-circle"></i>
            <h3>لا توجد طلبات انضمام معلقة</h3>
            <p>جميع طلبات الانضمام تمت معالجتها</p>
          </div>
          
          <div class="requests-grid" *ngIf="pendingRequests().length > 0">
            <div class="request-card" *ngFor="let req of pendingRequests()">
              <div class="card-header">
                <div class="member-avatar">
                  {{ req.teacherName?.charAt(0) || '?' }}
                </div>
                <div class="member-info">
                  <h4 class="member-name">{{ req.teacherName }}</h4>
                  <p class="member-code">{{ req.teacherCode }}</p>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-action approve" (click)="approveMember(req)" [disabled]="actionLoading()">
                  <i class="fas fa-check"></i>
                  <span>قبول</span>
                </button>
                <button class="btn-action reject" (click)="rejectMember(req)" [disabled]="actionLoading()">
                  <i class="fas fa-times"></i>
                  <span>رفض</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Members Tab -->
        <div class="tab-panel" [class.active]="activeTab() === 'members'">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-users me-2"></i>
              أعضاء الأكاديمية
            </h2>
            <div class="section-count">{{ members().length }} عضو</div>
          </div>
          
          <div *ngIf="members().length === 0" class="empty-state">
            <i class="fas fa-users"></i>
            <h3>لا يوجد أعضاء بعد</h3>
            <p>ابدأ بدعوة المعلمين للانضمام إلى أكاديميتك</p>
          </div>
          
          <div class="members-grid" *ngIf="members().length > 0">
            <div class="member-card" *ngFor="let m of members()">
              <div class="member-avatar approved">
                {{ m.teacherName?.charAt(0) || '?' }}
              </div>
              <div class="member-info">
                <h4 class="member-name">{{ m.teacherName }}</h4>
                <p class="member-code">{{ m.teacherCode }}</p>
                <span class="member-badge approved">
                  <i class="fas fa-check-circle me-1"></i>
                  عضو
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Courses Tab -->
        <div class="tab-panel" [class.active]="activeTab() === 'courses'">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-book-open me-2"></i>
              المقررات الدراسية
            </h2>
            <div class="section-count">{{ academyCourses().length }} مقرر</div>
          </div>
          
          <!-- Current Courses -->
          <div class="courses-section">
            <h3 class="subsection-title">
              <i class="fas fa-list me-2"></i>
              المقررات الحالية
            </h3>
            
            <div *ngIf="academyCourses().length === 0" class="empty-state">
              <i class="fas fa-book-open"></i>
              <h4>لا توجد مقررات مضافة بعد</h4>
              <p>ابدأ بإضافة المقررات إلى أكاديميتك</p>
            </div>
            
            <div class="courses-grid" *ngIf="academyCourses().length > 0">
              <div class="course-card" *ngFor="let c of academyCourses()">
                <div class="course-icon">
                  <i class="fas fa-book-open"></i>
                </div>
                <div class="course-info">
                  <h4 class="course-name">{{ c.nameAr }}</h4>
                  <p class="course-code">{{ c.code }}</p>
                </div>
                <button class="btn-remove" (click)="removeCourse(c)" title="إزالة من الأكاديمية">
                  <i class="fas fa-unlink"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Existing Course -->
          <div class="add-course-section">
            <h3 class="subsection-title">
              <i class="fas fa-link me-2"></i>
              إضافة مقرر موجود
            </h3>
            <div class="add-course-form">
              <select [(ngModel)]="selectedCourseId" class="form-select">
                <option value="">اختر مقرراً...</option>
                <option *ngFor="let c of availableCourses()" [value]="c.id">{{ c.nameAr }} ({{ c.code }})</option>
              </select>
              <button class="btn-add" (click)="addExistingCourse()" [disabled]="!selectedCourseId || actionLoading()">
                <i class="fas fa-plus"></i>
                <span>إضافة</span>
              </button>
            </div>
          </div>

          <!-- Create New Course -->
          <div class="create-course-section">
            <h3 class="subsection-title">
              <i class="fas fa-plus-circle me-2"></i>
              إنشاء مقرر جديد للأكاديمية
            </h3>
            <div class="create-course-form">
              <div class="form-row">
                <div class="form-group">
                  <label>اسم المقرر بالعربية *</label>
                  <input type="text" [(ngModel)]="newCourse.nameAr" class="form-input" placeholder="اسم المقرر" />
                </div>
                <div class="form-group">
                  <label>Course Name in English *</label>
                  <input type="text" [(ngModel)]="newCourse.nameEn" class="form-input" placeholder="Course name" dir="ltr" />
                </div>
              </div>
              <div *ngIf="courseError()" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ courseError() }}
              </div>
              <button class="btn-create" (click)="createCourse()" [disabled]="creatingCourse()">
                <span *ngIf="!creatingCourse()">
                  <i class="fas fa-plus me-2"></i>
                  إنشاء المقرر
                </span>
                <span *ngIf="creatingCourse()">
                  <div class="btn-spinner"></div>
                  جاري الإنشاء...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // ─── Academy Management Page Design ───────────────────────────────

    .academy-manage-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 0;
      direction: rtl;
    }

    // ─── Page Header ───────────────────────────────────────────────
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1.5rem;
      color: white;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        pointer-events: none;
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        position: relative;
        z-index: 1;
      }

      .btn-back {
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
      }

      .header-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.25rem;
      }

      p {
        margin: 0;
        opacity: 0.9;
        font-size: 1rem;
      }
    }

    // ─── Stats Grid ─────────────────────────────────────────────────
    .stats-grid {
      max-width: 1200px;
      margin: -1.5rem auto 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 0 1.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: white;
      flex-shrink: 0;

      &.requests {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      &.members {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }

      &.courses {
        background: linear-gradient(135deg, #10b981, #059669);
      }
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #64748b;
        font-weight: 500;
        margin-top: 0.25rem;
      }
    }

    // ─── Tabs Container ─────────────────────────────────────────────
    .tabs-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .tabs-wrapper {
      background: white;
      border-radius: 16px;
      padding: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      gap: 0.5rem;
    }

    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      position: relative;

      &:hover {
        background: #f8fafc;
        color: #334155;
      }

      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      i {
        font-size: 1rem;
      }

      .tab-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.75rem;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 0.7rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    // ─── Content Container ─────────────────────────────────────────────
    .content-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem 2rem;
    }

    // ─── Loading State ─────────────────────────────────────────────
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      color: #64748b;

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid #e2e8f0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      span {
        font-size: 1rem;
        font-weight: 500;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    // ─── Tab Panels ─────────────────────────────────────────────────
    .tab-panel {
      display: none;
      
      &.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    // ─── Section Headers ─────────────────────────────────────────────
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding: 1rem 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          color: #667eea;
          font-size: 1.1rem;
        }
      }

      .section-count {
        background: #f1f5f9;
        color: #64748b;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
      }
    }

    .subsection-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: #667eea;
        font-size: 1rem;
      }
    }

    // ─── Empty States ─────────────────────────────────────────────────
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #64748b;

      i {
        font-size: 3rem;
        color: #cbd5e1;
        margin-bottom: 1rem;
        display: block;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 0.5rem;
      }

      h4 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem;
      }

      p {
        font-size: 0.95rem;
        color: #6b7280;
        margin: 0;
      }
    }

    // ─── Requests Grid ─────────────────────────────────────────────────
    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }

    .request-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 6px 10px -5px rgba(0, 0, 0, 0.04);
      }
    }

    // ─── Members Grid ─────────────────────────────────────────────────
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .member-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 6px 10px -5px rgba(0, 0, 0, 0.04);
      }
    }

    // ─── Card Elements ─────────────────────────────────────────────────
    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .member-avatar {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;

      &.approved {
        background: linear-gradient(135deg, #10b981, #059669);
      }
    }

    .member-info {
      flex: 1;

      .member-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.25rem;
      }

      .member-code {
        font-size: 0.875rem;
        color: #64748b;
        font-family: 'Courier New', monospace;
        margin: 0;
      }
    }

    .member-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #dcfce7;
      color: #166534;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.approved {
        background: #dcfce7;
        color: #166534;
      }

      i {
        font-size: 0.7rem;
      }
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-action {
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &.approve {
        background: #dcfce7;
        color: #166534;

        &:hover {
          background: #bbf7d0;
          transform: translateY(-1px);
        }
      }

      &.reject {
        background: #fee2e2;
        color: #dc2626;

        &:hover {
          background: #fecaca;
          transform: translateY(-1px);
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    }

    // ─── Courses Section ─────────────────────────────────────────────
    .courses-section {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .course-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      }
    }

    .course-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .course-info {
      flex: 1;

      .course-name {
        font-size: 1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.25rem;
      }

      .course-code {
        font-size: 0.875rem;
        color: #64748b;
        font-family: 'Courier New', monospace;
        margin: 0;
      }
    }

    .btn-remove {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        background: #dc2626;
        color: white;
        transform: translateY(-1px);
      }
    }

    // ─── Add Course Section ─────────────────────────────────────────
    .add-course-section,
    .create-course-section {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .add-course-form,
    .create-course-form {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      width: 100%;
    }

    .form-group {
      margin-bottom: 1rem;
      width: 100%;

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }
    }

    .form-select,
    .form-input {
      flex: 1;
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.95rem;
      background: #f9fafb;
      color: #1a202c;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    .btn-add,
    .btn-create {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }

    .btn-create {
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef2f2;
      color: #dc2626;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid #fecaca;

      i {
        font-size: 1rem;
      }
    }

    // ─── Responsive Design ─────────────────────────────────────────────
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 1.5rem 1rem;

        .header-content {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
          position: relative;
        }

        h1 {
          font-size: 1.5rem;
          margin: 0;
        }

        p {
          font-size: 0.9rem;
          margin: 0;
        }

        .btn-back {
          position: absolute;
          top: 1.5rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          font-size: 1rem;
        }

        .header-icon {
          width: 50px;
          height: 50px;
          font-size: 1.25rem;
        }
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
        margin: -1rem 1rem 1.5rem;
        padding: 0;
      }

      .stat-card {
        padding: 1.25rem;

        .stat-icon {
          width: 48px;
          height: 48px;
          font-size: 1.1rem;
        }

        .stat-content .stat-value {
          font-size: 1.75rem;
        }
      }

      .tabs-container {
        padding: 0 1rem;
      }

      .tabs-wrapper {
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.375rem;
      }

      .tab-btn {
        padding: 1rem;
        font-size: 0.875rem;
        gap: 0.75rem;

        i {
          font-size: 0.9rem;
        }

        .tab-badge {
          top: 0.375rem;
          right: 0.625rem;
          width: 18px;
          height: 18px;
          font-size: 0.65rem;
        }
      }

      .content-container {
        padding: 0 1rem 1.5rem;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;

        .section-title {
          font-size: 1.1rem;

          i {
            font-size: 1rem;
          }
        }

        .section-count {
          font-size: 0.8rem;
          padding: 0.375rem 0.875rem;
        }
      }

      .requests-grid,
      .members-grid,
      .courses-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .request-card,
      .member-card {
        padding: 1.25rem;
        border-radius: 12px;
      }

      .card-header {
        margin-bottom: 1rem;
      }

      .member-avatar {
        width: 48px;
        height: 48px;
        font-size: 1.125rem;
      }

      .member-info .member-name {
        font-size: 1rem;
      }

      .card-actions {
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;

        .btn-action {
          justify-content: center;
          padding: 0.625rem 1rem;
        }
      }

      .course-card {
        padding: 1rem;
        border-radius: 12px;
      }

      .course-icon {
        width: 42px;
        height: 42px;
        font-size: 1rem;
      }

      .add-course-section,
      .create-course-section {
        padding: 1.25rem;
        margin-bottom: 1.5rem;
      }

      .add-course-form,
      .create-course-form {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-group {
        margin-bottom: 0.75rem;

        label {
          font-size: 0.8rem;
          margin-bottom: 0.375rem;
        }
      }

      .form-select,
      .form-input {
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
      }

      .btn-add,
      .btn-create {
        padding: 0.75rem 1.25rem;
        font-size: 0.875rem;
      }
    }

    @media (max-width: 480px) {
      .page-header {
        padding: 1.25rem 0.75rem;

        .header-content {
          gap: 0.75rem;
        }

        h1 {
          font-size: 1.25rem;
        }

        p {
          font-size: 0.85rem;
        }

        .btn-back {
          top: 1.25rem;
          right: 0.75rem;
          width: 36px;
          height: 36px;
          font-size: 0.9rem;
        }

        .header-icon {
          width: 45px;
          height: 45px;
          font-size: 1.125rem;
        }
      }

      .stats-grid {
        margin: -0.75rem 0.75rem 1.25rem;
        gap: 0.875rem;
      }

      .stat-card {
        padding: 1rem;

        .stat-icon {
          width: 42px;
          height: 42px;
          font-size: 1rem;
        }

        .stat-content .stat-value {
          font-size: 1.5rem;
        }

        .stat-content .stat-label {
          font-size: 0.8rem;
        }
      }

      .tabs-container {
        padding: 0 0.75rem;
      }

      .tabs-wrapper {
        padding: 0.25rem;
        gap: 0.375rem;
      }

      .tab-btn {
        padding: 0.875rem 0.75rem;
        font-size: 0.8rem;
        gap: 0.5rem;

        i {
          font-size: 0.85rem;
        }

        .tab-badge {
          width: 16px;
          height: 16px;
          font-size: 0.6rem;
          top: 0.25rem;
          right: 0.5rem;
        }
      }

      .content-container {
        padding: 0 0.75rem 1.25rem;
      }

      .section-header {
        padding: 0.875rem;
        gap: 0.75rem;

        .section-title {
          font-size: 1rem;

          i {
            font-size: 0.9rem;
          }
        }

        .section-count {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
        }
      }

      .subsection-title {
        font-size: 1rem;
        margin-bottom: 0.875rem;

        i {
          font-size: 0.9rem;
        }
      }

      .empty-state {
        padding: 2rem 1rem;

        i {
          font-size: 2.5rem;
          margin-bottom: 0.875rem;
        }

        h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        h4 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.875rem;
        }
      }

      .request-card,
      .member-card {
        padding: 1rem;
        border-radius: 10px;
      }

      .card-header {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
        margin-bottom: 0.875rem;
      }

      .member-avatar {
        width: 42px;
        height: 42px;
        font-size: 1rem;
      }

      .member-info .member-name {
        font-size: 0.95rem;
      }

      .member-info .member-code {
        font-size: 0.75rem;
      }

      .member-badge {
        font-size: 0.675rem;
        padding: 0.1875rem 0.625rem;
      }

      .card-actions {
        gap: 0.375rem;

        .btn-action {
          padding: 0.5rem 0.875rem;
          font-size: 0.8rem;
          gap: 0.375rem;
        }
      }

      .course-card {
        padding: 0.875rem;
        border-radius: 10px;
        gap: 0.75rem;
      }

      .course-icon {
        width: 36px;
        height: 36px;
        font-size: 0.9rem;
      }

      .course-info .course-name {
        font-size: 0.9rem;
      }

      .course-info .course-code {
        font-size: 0.75rem;
      }

      .btn-remove {
        padding: 0.375rem 0.625rem;
        font-size: 0.75rem;
      }

      .add-course-section,
      .create-course-section {
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .add-course-form,
      .create-course-form {
        gap: 0.75rem;
        margin-bottom: 0.625rem;
      }

      .form-group {
        margin-bottom: 0.625rem;

        label {
          font-size: 0.75rem;
          margin-bottom: 0.3125rem;
        }
      }

      .form-select,
      .form-input {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }

      .btn-add,
      .btn-create {
        padding: 0.625rem 1rem;
        font-size: 0.8rem;
      }

      .error-message {
        padding: 0.625rem 0.875rem;
        font-size: 0.75rem;
      }
    }

    @media (max-width: 360px) {
      .page-header {
        padding: 1rem 0.5rem;

        .btn-back {
          top: 1rem;
          right: 0.5rem;
          width: 32px;
          height: 32px;
          font-size: 0.8rem;
        }

        .header-icon {
          width: 40px;
          height: 40px;
          font-size: 1rem;
        }

        h1 {
          font-size: 1.125rem;
        }
      }

      .stats-grid {
        margin: -0.5rem 0.5rem 1rem;
        gap: 0.75rem;
      }

      .stat-card {
        padding: 0.875rem;
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;

        .stat-icon {
          width: 40px;
          height: 40px;
          font-size: 0.9rem;
        }

        .stat-content .stat-value {
          font-size: 1.375rem;
        }

        .stat-content .stat-label {
          font-size: 0.75rem;
        }
      }

      .tabs-container {
        padding: 0 0.5rem;
      }

      .tab-btn {
        padding: 0.75rem 0.625rem;
        font-size: 0.75rem;
        gap: 0.375rem;
      }

      .content-container {
        padding: 0 0.5rem 1rem;
      }

      .section-header {
        padding: 0.75rem;

        .section-title {
          font-size: 0.95rem;
        }

        .section-count {
          font-size: 0.7rem;
          padding: 0.1875rem 0.625rem;
        }
      }

      .request-card,
      .member-card {
        padding: 0.875rem;
      }

      .member-avatar {
        width: 38px;
        height: 38px;
        font-size: 0.9rem;
      }

      .member-info .member-name {
        font-size: 0.9rem;
      }

      .card-actions .btn-action {
        padding: 0.4375rem 0.75rem;
        font-size: 0.75rem;
      }

      .course-card {
        padding: 0.75rem;
        flex-direction: column;
        text-align: center;
        gap: 0.625rem;
      }

      .course-icon {
        width: 32px;
        height: 32px;
        font-size: 0.8rem;
      }

      .form-select,
      .form-input {
        padding: 0.4375rem 0.625rem;
        font-size: 0.75rem;
      }

      .btn-add,
      .btn-create {
        padding: 0.5625rem 0.875rem;
        font-size: 0.75rem;
      }
    }
  `]
})
export class AcademyManageComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly academyService = inject(AcademyService);
  private readonly courseService = inject(CourseService);

  academyId = '';
  loading = signal(true);
  actionLoading = signal(false);
  activeTab = signal<'requests' | 'members' | 'courses'>('requests');

  academy = signal<AcademyDto | null>(null);
  pendingRequests = signal<AcademyMemberDto[]>([]);
  members = signal<AcademyMemberDto[]>([]);
  academyCourses = signal<CourseDto[]>([]);
  availableCourses = signal<CourseDto[]>([]);

  selectedCourseId = '';
  creatingCourse = signal(false);
  courseError = signal<string | null>(null);
  newCourse: CreateUpdateCourseDto = { nameAr: '', nameEn: '', gradeId: undefined as any };

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('id') || '';
    try {
      const [academyData, requests, membersData, courses, allCourses] = await Promise.all([
        lastValueFrom(this.academyService.get(this.academyId)),
        lastValueFrom(this.academyService.getPendingRequests(this.academyId)).catch(() => []),
        lastValueFrom(this.academyService.getMembers(this.academyId)).catch(() => []),
        lastValueFrom(this.academyService.getAcademyCourses(this.academyId)).catch(() => []),
        lastValueFrom(this.courseService.getList({ maxResultCount: 200, skipCount: 0, sorting: '' })).catch(() => null),
      ]);
      this.academy.set(academyData);
      this.pendingRequests.set(requests || []);
      this.members.set(membersData || []);
      this.academyCourses.set(courses || []);

      // Available = not already in academy
      const academyCourseIds = new Set((courses || []).map((c: CourseDto) => c.id));
      const all = allCourses?.items || [];
      this.availableCourses.set(all.filter((c: CourseDto) => !academyCourseIds.has(c.id)));
    } catch (err) {
      console.error('Error loading manage page:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async approveMember(req: AcademyMemberDto): Promise<void> {
    if (!req.teacherId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.approveMember(this.academyId, req.teacherId));
      this.pendingRequests.update(list => list.filter(r => r.teacherId !== req.teacherId));
      this.members.update(list => [...list, { ...req }]);
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async rejectMember(req: AcademyMemberDto): Promise<void> {
    if (!req.teacherId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.rejectMember(this.academyId, req.teacherId));
      this.pendingRequests.update(list => list.filter(r => r.teacherId !== req.teacherId));
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async addExistingCourse(): Promise<void> {
    if (!this.selectedCourseId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.addCourseToAcademy(this.academyId, this.selectedCourseId));
      const course = this.availableCourses().find(c => c.id === this.selectedCourseId);
      if (course) {
        this.academyCourses.update(list => [...list, course]);
        this.availableCourses.update(list => list.filter(c => c.id !== this.selectedCourseId));
      }
      this.selectedCourseId = '';
    } catch (err) {
      console.error('Add course error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async removeCourse(course: CourseDto): Promise<void> {
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.removeCourseFromAcademy(course.id!));
      this.academyCourses.update(list => list.filter(c => c.id !== course.id));
      this.availableCourses.update(list => [...list, course]);
    } catch (err) {
      console.error('Remove course error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async createCourse(): Promise<void> {
    if (!this.newCourse.nameAr?.trim() || !this.newCourse.nameEn?.trim()) {
      this.courseError.set('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    this.creatingCourse.set(true);
    this.courseError.set(null);
    try {
      const created = await lastValueFrom(
        this.academyService.createCourseForAcademy(this.academyId, this.newCourse)
      );
      this.academyCourses.update(list => [...list, created as any]);
      this.newCourse = { nameAr: '', nameEn: '', gradeId: undefined as any };
    } catch (err: any) {
      const msg = err?.error?.error?.message || 'حدث خطأ أثناء إنشاء المقرر.';
      this.courseError.set(msg);
    } finally {
      this.creatingCourse.set(false);
    }
  }
}
