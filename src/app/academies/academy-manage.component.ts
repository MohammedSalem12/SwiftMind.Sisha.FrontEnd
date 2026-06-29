import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { CourseService } from '@proxy/courses';
import type { CourseDto, CreateUpdateCourseDto } from '@proxy/courses/dtos/models';
import type { AcademyCourseDto } from '@proxy/academies/models';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-academy-manage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="academy-manage-page" dir="rtl">
      <!-- Header -->
      <app-page-header
        [title]="'إدارة الأكاديمية'"
        [titleEn]="academy()?.nameAr || ''"
        [backTo]="['/academies', academyId, 'profile']">
      </app-page-header>

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
        <div class="stat-card" *ngIf="pendingTeachRequests().length > 0">
          <div class="stat-icon requests">
            <i class="fas fa-hand-paper"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ pendingTeachRequests().length }}</div>
            <div class="stat-label">طلبات تدريس</div>
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
          
          <!-- Pending Course-Teacher Requests -->
          <div class="courses-section" *ngIf="pendingTeachRequests().length > 0">
            <h3 class="subsection-title">
              <i class="fas fa-hand-paper me-2" style="color:#d97706"></i>
              طلبات تدريس معلقة · Pending Teach Requests
              <span class="subsection-count">{{ pendingTeachRequests().length }}</span>
            </h3>
            <div class="teach-requests-list">
              <div class="teach-request-card" *ngFor="let req of pendingTeachRequests()">
                <div class="tr-avatar">{{ req.teacherName?.charAt(0) || '?' }}</div>
                <div class="tr-info">
                  <span class="tr-teacher">{{ req.teacherName }}</span>
                  <span class="tr-course">{{ req.courseNameAr || req.courseNameEn }} <span class="tr-code" *ngIf="req.courseCode">{{ req.courseCode }}</span></span>
                </div>
                <div class="tr-actions">
                  <button class="tr-btn tr-approve" (click)="approveCourseTeacher(req)" [disabled]="courseTeacherActionLoading()">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="tr-btn tr-reject" (click)="rejectCourseTeacher(req)" [disabled]="courseTeacherActionLoading()">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
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
                  <h4 class="course-name">{{ c.courseNameAr }}</h4>
                  <p class="course-code">{{ c.courseCode }}</p>
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
              إضافة مقرر موجود · Add Existing Course
            </h3>
            <!-- Search filter -->
            <div class="course-filter">
              <div class="filter-box">
                <i class="fas fa-search filter-icon"></i>
                <input
                  type="text"
                  class="filter-input"
                  placeholder="بحث بالاسم أو الكود · Filter by name or code"
                  [ngModel]="courseFilter"
                  (ngModelChange)="courseFilter = $event" />
                <button class="filter-clear" *ngIf="courseFilter" (click)="courseFilter = ''">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div class="add-course-list">
              <div *ngFor="let c of filteredAvailableCourses()" class="add-course-item" (click)="selectedCourseId = c.id!">
                <div class="aci-radio" [class.aci-radio--selected]="selectedCourseId === c.id">
                  <i class="fas fa-check" *ngIf="selectedCourseId === c.id"></i>
                </div>
                <div class="aci-info">
                  <span class="aci-name">{{ c.nameAr || c.nameEn }}</span>
                  <span class="aci-meta">
                    <span class="aci-code" *ngIf="c.code">{{ c.code }}</span>
                    <span class="aci-grade" *ngIf="c.gradeName">{{ c.gradeName }}</span>
                  </span>
                </div>
              </div>
              <div *ngIf="filteredAvailableCourses().length === 0" class="add-course-empty">
                <i class="fas fa-search"></i>
                <span *ngIf="courseFilter">لا توجد نتائج · No results</span>
                <span *ngIf="!courseFilter">لا توجد مقررات متاحة · No available courses</span>
              </div>
            </div>
            <button class="btn-add" (click)="addExistingCourse()" [disabled]="!selectedCourseId || actionLoading()">
              <i class="fas fa-plus"></i>
              <span>إضافة المقرر المحدد · Add Selected</span>
            </button>
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

    // ─── Stats Grid ─────────────────────────────────────────────────
    .stats-grid {
      display: flex;
      gap: .5rem;
      padding: .75rem 1rem;
    }

    .stat-card {
      flex: 1;
      background: white;
      border-radius: 14px;
      padding: .65rem .5rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .35rem;
      text-align: center;
    }

    .stat-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
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
      .stat-value {
        font-size: 1.3rem;
        font-weight: 800;
        color: #1e293b;
        line-height: 1;
      }

      .stat-label {
        font-size: .68rem;
        color: #64748b;
        font-weight: 500;
        margin-top: .15rem;
      }
    }

    // ─── Tabs Container ─────────────────────────────────────────────
    .tabs-container {
      padding: 0 1rem;
    }

    .tabs-wrapper {
      background: white;
      border-radius: 14px;
      padding: .3rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      display: flex;
      gap: .25rem;
    }

    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      padding: .6rem .5rem;
      border-radius: 10px;
      font-size: .78rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all .2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .35rem;
      position: relative;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;

      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.35);
      }

      i { font-size: .8rem; }

      .tab-badge {
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: .6rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    // ─── Content Container ─────────────────────────────────────────────
    .content-container {
      padding: 0 1rem calc(80px + env(safe-area-inset-bottom, 0px));
    }

    // ─── Course Filter & List ─────────────────────────────────────────
    .course-filter { margin-bottom: .75rem; }
    .filter-box {
      display: flex; align-items: center; gap: .5rem;
      background: #f8fafc; border-radius: 12px;
      border: 1.5px solid #e5e7eb; padding: 0 .75rem;
      transition: border-color .2s;
      &:focus-within { border-color: #667eea; }
    }
    .filter-icon { color: #9ca3af; font-size: .8rem; flex-shrink: 0; }
    .filter-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 16px; padding: .6rem 0; font-family: inherit;
      color: #1a1a2e; min-width: 0;
      &::placeholder { color: #b0b0c0; font-size: .8rem; }
    }
    .filter-clear {
      border: none; background: none; color: #9ca3af; cursor: pointer;
      padding: 4px; font-size: .75rem;
      min-width: 44px; min-height: 44px;
      display: flex; align-items: center; justify-content: center;
    }

    .add-course-list {
      max-height: 260px;
      overflow-y: auto;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      background: #f9fafb;
      margin-bottom: .75rem;
    }

    .add-course-item {
      display: flex; align-items: center; gap: .6rem;
      padding: .65rem .85rem;
      border-bottom: 1px solid #f0f0f5;
      cursor: pointer;
      transition: background .15s;
      min-height: 48px;
      -webkit-tap-highlight-color: transparent;
      &:last-child { border-bottom: none; }
      &:active { background: #eef0ff; }
    }

    .aci-radio {
      width: 22px; height: 22px; border-radius: 50%;
      border: 2px solid #d1d5db; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: all .15s;
      &--selected {
        border-color: #667eea; background: #667eea; color: white;
        i { font-size: .6rem; }
      }
    }

    .aci-info {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: .1rem;
    }
    .aci-name {
      font-size: .85rem; font-weight: 600; color: #1a1a2e;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .aci-meta {
      display: flex; gap: .4rem; flex-wrap: wrap;
    }
    .aci-code {
      font-size: .65rem; font-weight: 600;
      background: rgba(102,126,234,.1); color: #667eea;
      padding: .05rem .35rem; border-radius: 6px;
      font-family: monospace;
    }
    .aci-grade {
      font-size: .65rem; font-weight: 600;
      background: rgba(16,185,129,.1); color: #059669;
      padding: .05rem .35rem; border-radius: 6px;
    }

    .add-course-empty {
      padding: 1.5rem; text-align: center;
      color: #9ca3af; font-size: .82rem;
      display: flex; flex-direction: column; align-items: center; gap: .4rem;
      i { font-size: 1.2rem; }
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

    // ─── Teach Request Cards ─────────────────────────────────────────
    .subsection-count {
      background: rgba(245,158,11,.12); color: #d97706;
      font-size: .65rem; font-weight: 700;
      padding: .1rem .4rem; border-radius: 8px; margin-right: .4rem;
    }
    .teach-requests-list {
      display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem;
    }
    .teach-request-card {
      display: flex; align-items: center; gap: .65rem;
      padding: .7rem .85rem; background: #fffbeb;
      border: 1.5px solid #fcd34d; border-radius: 12px;
    }
    .tr-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white; font-weight: 700; font-size: .95rem;
      display: flex; align-items: center; justify-content: center;
    }
    .tr-info {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .1rem;
    }
    .tr-teacher { font-size: .85rem; font-weight: 700; color: #1a1a2e; }
    .tr-course { font-size: .72rem; color: #6b7280; }
    .tr-code {
      background: rgba(102,126,234,.1); color: #667eea;
      font-size: .62rem; padding: .05rem .3rem; border-radius: 4px;
      font-family: monospace; margin-right: .2rem;
    }
    .tr-actions { display: flex; gap: .35rem; flex-shrink: 0; }
    .tr-btn {
      width: 38px; height: 38px; border-radius: 10px; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: .9rem; cursor: pointer; transition: all .15s;
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
    .tr-approve {
      background: #dcfce7; color: #16a34a;
      &:active { background: #bbf7d0; }
    }
    .tr-reject {
      background: #fee2e2; color: #dc2626;
      &:active { background: #fecaca; }
    }

    // ─── Responsive Design ─────────────────────────────────────────────
    @media (max-width: 768px) {
      .requests-grid,
      .members-grid,
      .courses-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .create-course-form {
        flex-direction: column;
        align-items: stretch;
      }

      .card-actions {
        flex-direction: row;
        .btn-action { flex: 1; justify-content: center; }
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
  academyCourses = signal<AcademyCourseDto[]>([]);
  availableCourses = signal<CourseDto[]>([]);
  pendingTeachRequests = signal<any[]>([]);
  courseTeacherActionLoading = signal(false);

  selectedCourseId = '';
  courseFilter = '';
  creatingCourse = signal(false);
  courseError = signal<string | null>(null);
  newCourse: CreateUpdateCourseDto = { nameAr: '', nameEn: '', gradeId: undefined as any };

  async ngOnInit(): Promise<void> {
    this.academyId = this.route.snapshot.paramMap.get('id') || '';
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'courses' || tabParam === 'members' || tabParam === 'requests') {
      this.activeTab.set(tabParam);
    }
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

      // Load pending course-teacher requests
      try {
        const teachReqs = await lastValueFrom(
          this.academyService.getPendingCourseTeacherRequests(this.academyId, { skipHandleError: true })
        );
        this.pendingTeachRequests.set(teachReqs || []);
      } catch { /* silent */ }
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

  async approveCourseTeacher(req: any): Promise<void> {
    this.courseTeacherActionLoading.set(true);
    try {
      await lastValueFrom(
        this.academyService.approveCourseTeacher(this.academyId, req.courseId, req.teacherId)
      );
      this.pendingTeachRequests.update(list => list.filter(r => !(r.courseId === req.courseId && r.teacherId === req.teacherId)));
    } catch (err: any) {
      console.error('Approve course teacher error:', err);
    } finally {
      this.courseTeacherActionLoading.set(false);
    }
  }

  async rejectCourseTeacher(req: any): Promise<void> {
    this.courseTeacherActionLoading.set(true);
    try {
      await lastValueFrom(
        this.academyService.rejectCourseTeacher(this.academyId, req.courseId, req.teacherId)
      );
      this.pendingTeachRequests.update(list => list.filter(r => !(r.courseId === req.courseId && r.teacherId === req.teacherId)));
    } catch (err: any) {
      console.error('Reject course teacher error:', err);
    } finally {
      this.courseTeacherActionLoading.set(false);
    }
  }

  filteredAvailableCourses(): CourseDto[] {
    const q = (this.courseFilter || '').trim().toLowerCase();
    const list = this.availableCourses();
    if (!q) return list;
    return list.filter(c =>
      (c.nameAr || '').toLowerCase().includes(q) ||
      (c.nameEn || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      ((c as any).gradeName || '').toLowerCase().includes(q)
    );
  }

  async addExistingCourse(): Promise<void> {
    if (!this.selectedCourseId) return;
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.addCourseToAcademy(this.academyId, this.selectedCourseId));
      const course = this.availableCourses().find(c => c.id === this.selectedCourseId);
      if (course) {
        this.academyCourses.update(list => [...list, course as unknown as AcademyCourseDto]);
        this.availableCourses.update(list => list.filter(c => c.id !== this.selectedCourseId));
      }
      this.selectedCourseId = '';
    } catch (err) {
      console.error('Add course error:', err);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async removeCourse(course: AcademyCourseDto): Promise<void> {
    this.actionLoading.set(true);
    try {
      await lastValueFrom(this.academyService.removeCourseFromAcademy(course.courseId!));
      this.academyCourses.update(list => list.filter(c => c.courseId !== course.courseId));
      const reloaded = await lastValueFrom(this.academyService.getAcademyCourses(this.academyId)).catch(() => []);
      this.academyCourses.set(reloaded);
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
      const createdCourse = await lastValueFrom(this.courseService.create(this.newCourse));
      await lastValueFrom(this.academyService.addCourseToAcademy(this.academyId, createdCourse.id!));
      const courses = await lastValueFrom(this.academyService.getAcademyCourses(this.academyId));
      this.academyCourses.set(courses || []);
      this.newCourse = { nameAr: '', nameEn: '', gradeId: undefined as any };
    } catch (err: any) {
      const msg = err?.error?.error?.message || 'حدث خطأ أثناء إنشاء المقرر.';
      this.courseError.set(msg);
    } finally {
      this.creatingCourse.set(false);
    }
  }
}
