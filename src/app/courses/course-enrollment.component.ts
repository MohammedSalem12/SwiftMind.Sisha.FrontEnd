import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { CurrentUserInfoService } from '@proxy/common';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { TeacherService } from '@proxy/teachers';
import { TeacherInfoModalService } from '../shared/services/teacher-info-modal.service';
import type { TeacherAutocompleteDto } from '@proxy/teachers/models';
import { AcademyService } from '@proxy/academies';
import { lastValueFrom } from 'rxjs';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-course-enrollment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="enroll-page" dir="rtl">

      <app-page-header
        [title]="'التسجيل في المقرر'"
        [titleEn]="academyId() ? 'معلمو الأكاديمية فقط · Academy teachers only' : 'اختر المعلم ثم المجموعة'"
        (back)="goBack()"></app-page-header>

      <!-- Step Indicator -->
      @if (!enrollmentSuccess()) {
        <div class="stepper">
          <div class="stp" [class.stp--active]="!selectedTeacher()" [class.stp--done]="!!selectedTeacher()">
            <span class="stp-dot">
              @if (selectedTeacher()) { <ion-icon name="checkmark"></ion-icon> } @else { 1 }
            </span>
            <span class="stp-text">المعلم</span>
          </div>
          <span class="stp-bar" [class.stp-bar--done]="!!selectedTeacher()"></span>
          <div class="stp" [class.stp--active]="!!selectedTeacher()">
            <span class="stp-dot">2</span>
            <span class="stp-text">المجموعة</span>
          </div>
        </div>
      }

      <div class="enroll-body">

      <!-- Error Banner -->
      @if (errorMessage()) {
        <div class="error-banner" role="alert">
          <ion-icon name="alert-circle"></ion-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <ion-spinner name="crescent" class="enroll-spinner"></ion-spinner>
          <span class="loading-text">جاري التحميل...</span>
        </div>
      }

      <!-- Step 1: Teachers -->
      @if (!loading() && !selectedTeacher() && !enrollmentSuccess()) {
        <div class="step-content">
          <!-- Filter panel -->
          <ion-card class="filter-card">
            <ion-searchbar
              class="enroll-searchbar"
              [value]="filterNameCode()"
              (ionInput)="filterNameCode.set($any($event).detail.value || '')"
              placeholder="ابحث باسم المعلم أو كوده"
              search-icon="search-outline"
              [animated]="true"></ion-searchbar>

            <div class="filter-row">
              <ion-item class="filter-item" lines="none">
                <ion-icon name="location-outline" slot="start" class="filter-ico"></ion-icon>
                <ion-select
                  label="المحافظة"
                  label-placement="stacked"
                  interface="alert"
                  [interfaceOptions]="{ header: 'المحافظة', cssClass: 'enroll-select-alert' }"
                  okText="اختيار" cancelText="إلغاء"
                  placeholder="كل المحافظات"
                  [value]="filterGovernment()"
                  (ionChange)="filterGovernment.set($any($event).detail.value); filterTown.set(''); onLocationFilterChange()">
                  <ion-select-option value="">كل المحافظات</ion-select-option>
                  @for (g of governorates; track g) {
                    <ion-select-option [value]="g">{{ g }}</ion-select-option>
                  }
                </ion-select>
              </ion-item>

              <ion-item class="filter-item" lines="none">
                <ion-icon name="business-outline" slot="start" class="filter-ico"></ion-icon>
                <ion-select
                  label="المركز / الحي"
                  label-placement="stacked"
                  interface="alert"
                  [interfaceOptions]="{ header: 'المركز / الحي', cssClass: 'enroll-select-alert' }"
                  okText="اختيار" cancelText="إلغاء"
                  [placeholder]="filterGovernment() ? 'كل المراكز' : 'اختر المحافظة أولاً'"
                  [disabled]="!filterGovernment()"
                  [value]="filterTown()"
                  (ionChange)="filterTown.set($any($event).detail.value); onLocationFilterChange()">
                  <ion-select-option value="">كل المراكز</ion-select-option>
                  @for (d of districts(); track d) {
                    <ion-select-option [value]="d">{{ d }}</ion-select-option>
                  }
                </ion-select>
              </ion-item>
            </div>

            @if (locationFilterLoading()) {
              <div class="filter-loading">
                <ion-spinner name="dots"></ion-spinner> جاري البحث...
              </div>
            }
          </ion-card>

          <div class="section-lbl">
            <ion-icon name="school-outline"></ion-icon>
            <span>اختر المعلم</span>
            <span class="lbl-count">{{ filteredTeachers().length }}</span>
          </div>

          @if (filteredTeachers().length === 0 && !locationFilterLoading()) {
            <div class="empty-state">
              <ion-icon name="person-remove-outline"></ion-icon>
              <p>{{ teachers().length === 0 ? 'لا يوجد معلمون متاحون لهذا المقرر حالياً' : 'لا يوجد معلمون بهذه المعايير' }}</p>
            </div>
          }

          <div class="teachers-list">
            @for (t of filteredTeachers(); track t.id) {
              <ion-card class="teacher-card ion-activatable" [class.teacher-promoted]="t.isPromoted" button (click)="selectTeacher(t)">
                <div class="tc-row">
                  <ion-avatar class="tc-avatar">
                    @if ($any(t).photoUrl) {
                      <img [src]="$any(t).photoUrl" [alt]="t.displayName" />
                    } @else {
                      <span class="tc-initials">{{ getInitials(t.displayName) }}</span>
                    }
                  </ion-avatar>
                  <div class="tc-info">
                    <div class="tc-name-row">
                      <span class="teacher-name">{{ t.displayName }}</span>
                      @if (t.isPromoted) {
                        <ion-chip class="promoted-chip" outline="false">
                          <ion-icon name="star"></ion-icon>
                          <ion-label>مميز</ion-label>
                        </ion-chip>
                      }
                    </div>
                    @if (t.government || t.town) {
                      <ion-chip class="loc-chip" outline="false">
                        <ion-icon name="location-outline"></ion-icon>
                        <ion-label>{{ [t.government, t.town].filter(Boolean).join(' — ') }}</ion-label>
                      </ion-chip>
                    }
                    @if ($any(t).bio) {
                      <p class="teacher-bio">{{ $any(t).bio }}</p>
                    }
                  </div>
                  <ion-button class="info-btn" fill="clear" shape="round" (click)="openTeacherInfo(t.id!); $event.stopPropagation()" title="معلومات المعلم">
                    <ion-icon name="information-circle-outline" slot="icon-only"></ion-icon>
                  </ion-button>
                </div>
                <div class="tc-cta">
                  <span class="tc-cta-text">اختيار المعلم</span>
                  <ion-icon name="chevron-back-outline"></ion-icon>
                </div>
                <ion-ripple-effect></ion-ripple-effect>
              </ion-card>
            }
          </div>
        </div>
      }

      <!-- Step 2: Groups -->
      @if (!loading() && selectedTeacher() && !enrollmentSuccess()) {
        <div class="step-content">

          <!-- Selected teacher bar -->
          <ion-card class="selected-teacher-bar">
            <ion-avatar class="st-avatar">
              @if ($any(selectedTeacher()).photoUrl) {
                <img [src]="$any(selectedTeacher()).photoUrl" [alt]="selectedTeacher()?.displayName" />
              } @else {
                <span class="st-initials">{{ getInitials(selectedTeacher()?.displayName) }}</span>
              }
            </ion-avatar>
            <div class="st-info">
              <span class="st-lbl">المعلم المختار</span>
              <span class="st-name">{{ selectedTeacher()?.displayName }}</span>
            </div>
            <ion-button class="change-btn" fill="outline" size="small" (click)="backToTeachers()">
              <ion-icon name="swap-horizontal-outline" slot="start"></ion-icon>
              تغيير
            </ion-button>
          </ion-card>

          <!-- Teacher code input — only shown when groups are available -->
          @if (groups().length > 0) {
            <ion-card class="code-card">
              <div class="code-label">
                <ion-icon name="key-outline"></ion-icon>
                <span>رمز الطالب الداخلي</span>
                <ion-chip class="optional-chip" outline="false"><ion-label>اختياري</ion-label></ion-chip>
              </div>
              <ion-input
                class="code-input"
                type="text"
                fill="outline"
                [(ngModel)]="teacherStudentCodeInput"
                placeholder="أدخل الرمز إن زودك به المعلم"
                [maxlength]="32"></ion-input>
            </ion-card>
          }

          <div class="section-lbl">
            <ion-icon name="people-outline"></ion-icon>
            <span>اختر المجموعة</span>
            <span class="lbl-count">{{ groups().length }}</span>
          </div>

          @if (groups().length === 0) {
            <div class="empty-state">
              <ion-icon name="calendar-clear-outline"></ion-icon>
              <p>لا توجد مجموعات متاحة لهذا المعلم حالياً</p>
            </div>
          }

          <div class="groups-list">
            @for (g of groups(); track g.groupId) {
              <ion-card class="group-card">
                <ion-card-header>
                  <ion-card-title class="group-name">{{ g.name }}</ion-card-title>
                  <ion-chip class="group-code" outline="false">
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <ion-label>{{ g.groupCode }}</ion-label>
                  </ion-chip>
                </ion-card-header>
                <ion-card-content>
                  @if (g.schedules && g.schedules.length > 0) {
                    <div class="schedules">
                      @for (s of g.schedules; track s.dayOfWeek) {
                        <div class="schedule-row">
                          <ion-icon name="calendar-outline" class="sch-ico"></ion-icon>
                          <span class="sch-day">{{ getDayName(s.dayOfWeek) }}</span>
                          <span class="sch-time">
                            <ion-icon name="time-outline"></ion-icon>
                            {{ formatTime(s.startTime) }} - {{ formatTime(s.endTime) }}
                          </span>
                          @if (s.location) {
                            <span class="sch-loc"><ion-icon name="location-outline"></ion-icon> {{ s.location }}</span>
                          }
                        </div>
                      }
                    </div>
                  }

                  <ion-button class="join-btn" expand="block" (click)="selectGroup(g)" [disabled]="submitting()">
                    @if (submitting()) {
                      <ion-spinner name="crescent" slot="start"></ion-spinner> جاري الإرسال...
                    } @else {
                      <ion-icon name="person-add-outline" slot="start"></ion-icon> انضم للمجموعة
                    }
                  </ion-button>
                </ion-card-content>
              </ion-card>
            }
          </div>
        </div>
      }

      <!-- Success Screen -->
      @if (enrollmentSuccess()) {
        <div class="success-screen">
          <div class="success-icon"><ion-icon name="checkmark-circle"></ion-icon></div>
          <h2>تم إرسال الطلب!</h2>
          <p>سيتم مراجعة طلب التسجيل من قبل المعلم والموافقة عليه قريباً</p>
          <p class="success-en">Your enrollment request has been sent successfully</p>
          <div class="success-actions">
            <ion-button class="sa-btn" fill="outline" expand="block" (click)="goBack()">
              <ion-icon name="home-outline" slot="start"></ion-icon> الرئيسية
            </ion-button>
            <ion-button class="sa-btn" expand="block" (click)="goToRequests()">
              <ion-icon name="clipboard-outline" slot="start"></ion-icon> طلباتي
            </ion-button>
          </div>
        </div>
      }

      </div>
    </div>
  `,
  styles: [`
    $pg: linear-gradient(135deg, #667eea, #764ba2);
    $ps: #667eea;
    $pe: #764ba2;
    $surface: #ffffff;
    $bg: #f5f4fb;
    $line: #ece9fb;
    $ink: #1a1d29;
    $muted: #7a7f8c;

    .enroll-page {
      min-height: 100vh;
      background: $bg;
      direction: rtl;
      --ion-color-primary: #667eea;
      --ion-color-primary-rgb: 102,126,234;
    }
    .enroll-body {
      padding: 0 0 calc(env(safe-area-inset-bottom) + 1.25rem);
      max-width: 560px;
      margin: 0 auto;
    }

    /* ── Stepper ─────────────────────────────────────────────── */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 0.9rem 1.5rem 1rem;
      background: $surface;
      border-bottom: 1px solid $line;
      position: sticky; top: 0; z-index: 5;
    }
    .stp { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
    .stp-dot {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: #eceaf9;
      color: #a3a8b8;
      font-size: 0.82rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.25s ease;
      ion-icon { font-size: 1rem; }
    }
    .stp--active .stp-dot { background: $pg; color: #fff; box-shadow: 0 4px 12px rgba(102,126,234,0.35); }
    .stp--done .stp-dot { background: #22c55e; color: #fff; }
    .stp-text { font-size: 0.72rem; color: $muted; font-weight: 600; }
    .stp--active .stp-text { color: $pe; }
    .stp-bar {
      flex: 0 1 80px; height: 3px; border-radius: 3px;
      background: #eceaf9;
      margin: 0 0.6rem 1.1rem;
      transition: background 0.25s ease;
    }
    .stp-bar--done { background: #22c55e; }

    /* ── Error ───────────────────────────────────────────────── */
    .error-banner {
      margin: 0.85rem 1rem 0;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 12px;
      padding: 0.75rem 0.9rem;
      font-size: 0.85rem;
      display: flex; align-items: center; gap: 0.5rem;
      ion-icon { font-size: 1.1rem; flex-shrink: 0; }
    }

    /* ── Loading ─────────────────────────────────────────────── */
    .loading-area {
      padding: 3rem 1rem; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 0.6rem;
    }
    .enroll-spinner { width: 44px; height: 44px; --color: #667eea; }
    .loading-text { color: $muted; font-size: 0.9rem; }

    /* ── Section label ───────────────────────────────────────── */
    .section-lbl {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0 1.1rem;
      margin: 1.25rem 0 0.65rem;
      font-size: 0.9rem; font-weight: 700; color: $ink;
      ion-icon { color: $ps; font-size: 1.1rem; }
    }
    .lbl-count {
      background: rgba(102,126,234,0.12); color: $pe;
      border-radius: 20px; padding: 0.05rem 0.55rem;
      font-size: 0.72rem; font-weight: 800;
      min-width: 1.4rem; text-align: center;
    }

    /* ── Empty ───────────────────────────────────────────────── */
    .empty-state {
      text-align: center; padding: 2.75rem 1.5rem; color: $muted;
      ion-icon { font-size: 3rem; color: #c4b9f2; display: block; margin: 0 auto 0.75rem; }
      p { font-size: 0.9rem; color: $muted; margin: 0; line-height: 1.6; }
    }

    /* ── Filter card ─────────────────────────────────────────── */
    ion-card.filter-card {
      margin: 0.85rem 1rem 0;
      background: $surface;
      border-radius: 18px;
      border: 1px solid $line;
      box-shadow: 0 4px 18px rgba(102,126,234,0.07);
      padding: 0.75rem;
      display: flex; flex-direction: column; gap: 0.55rem;
    }
    ion-searchbar.enroll-searchbar {
      --background: #f5f4fb; --border-radius: 12px; --box-shadow: none;
      --color: #{$ink}; --placeholder-color: #9aa0ae; --icon-color: #667eea;
      padding: 0;
      min-height: 48px;
      font-size: 16px;
    }
    .filter-row { display: flex; gap: 0.5rem; }
    .filter-item {
      flex: 1; margin: 0;
      border: 1px solid $line; border-radius: 12px;
      --background: #fafaff; --border-radius: 12px; --min-height: 56px;
      --padding-start: 0.6rem; --inner-padding-end: 0.4rem;
      --highlight-color-focused: #667eea;
      font-size: 16px;
    }
    .filter-ico { color: #667eea; font-size: 1.05rem; margin-inline-end: 0.45rem; }
    ion-select { font-size: 0.92rem; --placeholder-color: #9aa0ae; }
    .filter-loading {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.8rem; color: #667eea; padding: 0.15rem 0.25rem;
      ion-spinner { width: 18px; height: 18px; --color: #667eea; }
    }

    /* ── Teachers ────────────────────────────────────────────── */
    .teachers-list {
      padding: 0 1rem; display: flex; flex-direction: column; gap: 0.7rem;
    }
    ion-card.teacher-card {
      margin: 0; --background: #{$surface};
      border-radius: 18px;
      border: 1px solid $line;
      box-shadow: 0 3px 14px rgba(20,20,50,0.05);
      padding: 0.85rem 0.9rem 0.7rem;
      text-align: start;
      position: relative; overflow: hidden;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      &:active { transform: scale(0.99); }
    }
    ion-card.teacher-card.teacher-promoted {
      border-color: #f6c64d;
      box-shadow: 0 4px 16px rgba(245,158,11,0.18);
    }
    .tc-row { display: flex; align-items: flex-start; gap: 0.75rem; }
    ion-avatar.tc-avatar {
      width: 56px; height: 56px; flex-shrink: 0;
      background: $pg;
      display: flex; align-items: center; justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .tc-initials { color: #fff; font-size: 1.2rem; font-weight: 700; }
    .tc-info { flex: 1; min-width: 0; }
    .tc-name-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .teacher-name {
      font-size: 1rem; font-weight: 700; color: $ink; line-height: 1.3;
    }
    ion-chip.promoted-chip {
      margin: 0; height: 22px; --background: #fff7e6; --color: #b45309;
      font-size: 0.68rem; font-weight: 700;
      ion-icon { color: #f59e0b; font-size: 0.8rem; }
      ion-label { margin-inline: 0.2rem; }
    }
    ion-chip.loc-chip {
      margin: 0.3rem 0 0; height: 24px;
      --background: rgba(102,126,234,0.09); --color: #5b62c9;
      font-size: 0.72rem; font-weight: 600;
      ion-icon { color: #667eea; font-size: 0.85rem; }
      ion-label { margin-inline: 0.15rem; }
    }
    .teacher-bio {
      font-size: 0.8rem; color: #6b6f7e; line-height: 1.55; margin: 0.45rem 0 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    ion-button.info-btn {
      flex-shrink: 0; margin: -0.2rem -0.3rem 0 0;
      width: 40px; height: 40px;
      --color: #667eea; --background: rgba(102,126,234,0.08);
      --padding-start: 0; --padding-end: 0;
      ion-icon { font-size: 1.25rem; }
    }
    .tc-cta {
      display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem;
      margin-top: 0.55rem; padding-top: 0.55rem;
      border-top: 1px dashed $line;
      color: $pe; font-size: 0.82rem; font-weight: 700;
      ion-icon { font-size: 1rem; }
    }
    .tc-cta-text { color: $pe; }

    /* ── Selected teacher bar ────────────────────────────────── */
    ion-card.selected-teacher-bar {
      margin: 0.85rem 1rem 0;
      background: $surface;
      border-radius: 16px;
      border: 1px solid $line;
      box-shadow: 0 3px 14px rgba(102,126,234,0.09);
      padding: 0.7rem 0.85rem;
      display: flex; align-items: center; gap: 0.7rem;
    }
    ion-avatar.st-avatar {
      width: 44px; height: 44px; flex-shrink: 0; background: $pg;
      display: flex; align-items: center; justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .st-initials { color: #fff; font-size: 0.95rem; font-weight: 700; }
    .st-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
    .st-lbl { font-size: 0.68rem; color: $muted; font-weight: 600; }
    .st-name { font-size: 0.92rem; font-weight: 700; color: $ink; }
    ion-button.change-btn {
      --color: #667eea; --border-color: #c7cbf3; --border-radius: 10px;
      font-weight: 700; margin: 0; --padding-start: 0.7rem; --padding-end: 0.7rem;
      height: 38px;
      ion-icon { font-size: 0.95rem; }
    }

    /* ── Code input ──────────────────────────────────────────── */
    ion-card.code-card {
      margin: 0.7rem 1rem 0;
      background: $surface; border-radius: 16px;
      border: 1px solid $line; box-shadow: 0 3px 14px rgba(20,20,50,0.04);
      padding: 0.85rem 0.9rem;
    }
    .code-label {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.85rem; font-weight: 700; color: $ink;
      margin-bottom: 0.55rem;
      ion-icon { color: $ps; font-size: 1rem; }
    }
    ion-chip.optional-chip {
      margin: 0 0 0 auto; height: 20px;
      --background: #ede9fe; --color: #{$pe};
      font-size: 0.66rem; font-weight: 700;
      ion-label { margin-inline: 0.35rem; }
    }
    ion-input.code-input {
      --background: #fafaff; --border-radius: 12px; --color: #{$ink};
      --border-color: #{$line}; --highlight-color-focused: #667eea;
      --padding-start: 0.85rem; --padding-end: 0.85rem;
      font-size: 16px; direction: rtl;
    }

    /* ── Groups ──────────────────────────────────────────────── */
    .groups-list { padding: 0 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    ion-card.group-card {
      margin: 0; --background: #{$surface};
      border-radius: 18px;
      border: 1px solid $line;
      box-shadow: 0 3px 14px rgba(20,20,50,0.05);
      overflow: hidden;
    }
    ion-card.group-card ion-card-header {
      padding: 0.9rem 0.95rem 0.4rem;
      display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
    }
    .group-name { font-size: 1rem; font-weight: 700; color: $ink; }
    ion-chip.group-code {
      margin: 0; flex-shrink: 0; height: 24px;
      --background: rgba(118,75,162,0.1); --color: #{$pe};
      font-size: 0.74rem; font-weight: 700;
      ion-icon { color: $pe; font-size: 0.82rem; }
      ion-label { margin-inline: 0.15rem; }
    }
    ion-card.group-card ion-card-content { padding: 0 0.95rem 0.95rem; }
    .schedules { margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem; }
    .schedule-row {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem;
      background: #f5f4fb; border-radius: 12px; padding: 0.55rem 0.75rem;
      font-size: 0.8rem; color: #3b3f4d;
      ion-icon { color: $pe; font-size: 0.92rem; vertical-align: -2px; }
    }
    .sch-ico { color: $pe; }
    .sch-day { font-weight: 700; color: $ink; }
    .sch-time { display: inline-flex; align-items: center; gap: 0.25rem; }
    .sch-loc {
      color: $muted; margin-inline-start: auto;
      display: inline-flex; align-items: center; gap: 0.2rem;
    }
    ion-button.join-btn {
      margin: 0; font-weight: 800; font-size: 0.92rem;
      height: 50px;
      --background: linear-gradient(135deg, #667eea, #764ba2);
      --background-activated: #5b6fd6;
      --color: #fff; --border-radius: 14px;
      --box-shadow: 0 6px 16px rgba(102,126,234,0.3);
      ion-icon { font-size: 1.1rem; }
      ion-spinner { width: 20px; height: 20px; }
    }

    /* ── Success ─────────────────────────────────────────────── */
    .success-screen {
      display: flex; flex-direction: column; align-items: center;
      padding: 3.5rem 2rem; text-align: center;
    }
    .success-icon {
      margin-bottom: 1rem;
      animation: popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275);
      ion-icon { font-size: 5rem; color: #22c55e; }
    }
    @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .success-screen h2 { font-size: 1.45rem; font-weight: 800; color: $ink; margin: 0 0 0.5rem; }
    .success-screen p { font-size: 0.9rem; color: $muted; margin: 0; line-height: 1.6; max-width: 320px; }
    .success-en { font-size: 0.78rem; color: #a3a8b8; margin-top: 0.35rem !important; }
    .success-actions { display: flex; gap: 0.7rem; margin-top: 2.25rem; width: 100%; max-width: 340px; }
    ion-button.sa-btn {
      flex: 1; margin: 0; height: 50px;
      --border-radius: 14px; font-weight: 800; font-size: 0.9rem;
      ion-icon { font-size: 1.05rem; }
    }
    ion-button.sa-btn[fill="outline"] { --color: #{$pe}; --border-color: #c7b9e8; }
    ion-button.sa-btn:not([fill]) {
      --background: linear-gradient(135deg, #667eea, #764ba2);
      --color: #fff; --box-shadow: 0 6px 16px rgba(102,126,234,0.3);
    }
  `]
})
export class CourseEnrollmentComponent implements OnInit {
  private readonly route                  = inject(ActivatedRoute);
  private readonly router                 = inject(Router);
  private readonly groupService           = inject(GroupService);
  private readonly enrollmentRequestSvc   = inject(EnrollmentRequestService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);
  private readonly teacherService         = inject(TeacherService);
  private readonly academyService         = inject(AcademyService);
  private readonly restSvc                = inject(RestService);
  private readonly teacherInfoModal       = inject(TeacherInfoModalService);
  private readonly destroyRef             = inject(DestroyRef);

  readonly governorates = EGYPT_GOVERNORATES_LIST;
  readonly districts    = computed(() => getDistricts(this.filterGovernment()));

  courseId          = signal<string>('');
  academyId         = signal<string | null>(null);
  academyMemberIds  = signal<Set<string>>(new Set());
  teachers          = signal<TeacherAutocompleteDto[]>([]);
  groups            = signal<GroupWithSchedulesDto[]>([]);
  selectedTeacher   = signal<TeacherAutocompleteDto | null>(null);
  loading           = signal(false);
  submitting        = signal(false);
  enrollmentSuccess = signal(false);
  errorMessage      = signal('');
  teacherStudentCodeInput = '';

  // Location filter
  filterGovernment      = signal('');
  filterTown            = signal('');
  filterNameCode        = signal('');
  govTownTeacherIds     = signal<string[] | null>(null);
  locationFilterLoading = signal(false);

  filteredTeachers = computed(() => {
    const all  = this.teachers();
    const ids  = this.govTownTeacherIds();
    const nc   = this.filterNameCode().toLowerCase().trim();
    let result = ids !== null ? all.filter(t => ids.includes(t.id!)) : all;
    if (nc) result = result.filter(t =>
      (t.displayName?.toLowerCase() ?? '').includes(nc) ||
      ((t as any).teacherCode?.toLowerCase() ?? '').includes(nc)
    );
    return result;
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const aId = this.route.snapshot.queryParamMap.get('academyId');
    const tId = this.route.snapshot.queryParamMap.get('teacherId');
    if (id) {
      this.courseId.set(id);
      if (aId) this.academyId.set(aId);
      await this.loadTeachers();
      // Pre-select the teacher when arriving from a teacher's public profile
      if (tId) {
        const match = this.teachers().find(t => t.id === tId);
        if (match) this.selectTeacher(match);
      }
    }
  }

  async loadTeachers(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      // Get student location for promoted teacher sorting
      let studentGov: string | undefined;
      let studentTown: string | undefined;
      try {
        const userInfo: any = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
        if (userInfo?.actorType === 'Student' && userInfo.actorId) {
          const student = await lastValueFrom(
            this.restSvc.request<void, any>({ method: 'GET', url: `/api/app/student/current-student` })
          );
          studentGov = student?.government || undefined;
          studentTown = student?.town || undefined;
        }
      } catch { /* ignore - location is optional */ }

      // Auto-select the student's own governorate & center as the default teacher filter.
      if (studentGov && !this.filterGovernment()) this.filterGovernment.set(studentGov);
      if (studentTown && !this.filterTown()) this.filterTown.set(studentTown);

      const teachers = await lastValueFrom(
        this.restSvc.request<void, TeacherAutocompleteDto[]>({
          method: 'GET',
          url: `/api/app/teacher/teachers-by-course/${this.courseId()}`,
          params: { maxResults: 100, studentGovernment: studentGov, studentTown: studentTown },
        })
      );

      // If academy context, filter to only academy members
      if (this.academyId()) {
        try {
          const members = await lastValueFrom(
            this.academyService.getMembers(this.academyId()!, { skipHandleError: true })
          );
          const memberIds = new Set((members || []).map(m => m.teacherId));
          this.academyMemberIds.set(memberIds);
          this.teachers.set((teachers || []).filter(t => memberIds.has(t.id!)));
        } catch {
          // Fallback: show all teachers if member lookup fails
          this.teachers.set(teachers || []);
        }
      } else {
        this.teachers.set(teachers || []);
      }

      // Apply the auto-selected location filter now that the teachers are loaded.
      if (this.filterGovernment() || this.filterTown()) {
        await this.onLocationFilterChange();
      }
    } catch {
      this.errorMessage.set('حدث خطأ أثناء تحميل المعلمين');
    } finally {
      this.loading.set(false);
    }
  }

  async onLocationFilterChange(): Promise<void> {
    const gov  = this.filterGovernment().trim();
    const town = this.filterTown().trim();
    if (!gov && !town) { this.govTownTeacherIds.set(null); return; }
    this.locationFilterLoading.set(true);
    try {
      const params: any = { maxResultCount: 1000 };
      if (gov)  params.government = gov;
      if (town) params.town = town;
      const result = await lastValueFrom(
        this.restSvc.request<any, { items: any[] }>(
          { method: 'GET', url: '/api/sesha/teachers', params },
          { apiName: 'Default' }
        )
      );
      this.govTownTeacherIds.set((result?.items ?? []).map((t: any) => t.id as string));
    } catch { this.govTownTeacherIds.set([]); }
    finally { this.locationFilterLoading.set(false); }
  }

  selectTeacher(teacher: TeacherAutocompleteDto): void {
    this.selectedTeacher.set(teacher);
    this.teacherStudentCodeInput = '';
    this.loading.set(true);
    this.errorMessage.set('');
    this.groupService.getGroupsForTeacherAndCourse(teacher.id!, this.courseId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: groups => { this.groups.set(groups); this.loading.set(false); },
      error: () => { this.errorMessage.set('حدث خطأ أثناء تحميل المجموعات'); this.loading.set(false); }
    });
  }

  selectGroup(group: GroupWithSchedulesDto): void {
    this.submitEnrollmentRequest(group);
  }

  async submitEnrollmentRequest(group: GroupWithSchedulesDto): Promise<void> {
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      if (!userInfo?.actorId) {
        this.errorMessage.set('تعذّر تحديد بيانات الطالب، يرجى تسجيل الدخول مجدداً.');
        this.submitting.set(false);
        return;
      }
      const request: any = {
        studentId: userInfo.actorId,
        courseId: this.courseId(),
        teacherId: this.selectedTeacher()!.id!,
        groupId: group.groupId!,
        initiator: EnrollmentRequestInitiator.Student,
      };
      if (this.teacherStudentCodeInput?.trim()) {
        request.teacherStudentCode = this.teacherStudentCodeInput.trim();
      }
      await lastValueFrom(this.enrollmentRequestSvc.create(request));
      this.enrollmentSuccess.set(true);
    } catch (error: any) {
      this.errorMessage.set(error?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      this.submitting.set(false);
    }
  }

  backToTeachers(): void {
    this.selectedTeacher.set(null);
    this.groups.set([]);
    this.teacherStudentCodeInput = '';
  }

  goBack(): void { this.router.navigate(['/student']); }
  goToRequests(): void { this.router.navigate(['/student/requests']); }

  openTeacherInfo(teacherId: string): void {
    this.teacherInfoModal.open(teacherId);
  }

  getInitials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getDayName(dayOfWeek: number): string {
    return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek] || '';
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${parts[1]} ${h >= 12 ? 'م' : 'ص'}`;
    }
    return time;
  }
}
