import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherRatingService } from '@proxy/teacher-ratings';
import { PageHeaderComponent } from '../shared/components/page-header.component';
import { StarRatingComponent } from '../shared/components/star-rating.component';
import { RateModalComponent, RateSubmitEvent } from '../shared/components/rate-modal.component';

interface PublicCourse {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  gradeName?: string;
}

interface TeacherPublicProfile {
  id: string;
  displayName: string;
  teacherCode: string;
  bio?: string;
  photoUrl?: string;
  government: string;
  town: string;
  courses: PublicCourse[];
  averageRating: number;
  ratingCount: number;
}

@Component({
  selector: 'app-teacher-public-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, PageHeaderComponent, StarRatingComponent, RateModalComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'ملف المعلم'" [titleEn]="'Teacher Profile'"></app-page-header>

      <!-- Profile card -->
      <div class="page-header">
        @if (loading()) {
          <div class="avatar shimmer-circle"></div>
        } @else {
          <div class="avatar">
            @if (profile()?.photoUrl) {
              <img [src]="profile()!.photoUrl" alt="" />
            } @else {
              <span>{{ initials() }}</span>
            }
          </div>
          <div class="role-badge"><i class="fas fa-chalkboard-teacher"></i> معلم · Teacher</div>
          <h1 class="t-name">{{ profile()?.displayName }}</h1>
          <span class="t-code">{{ profile()?.teacherCode }}</span>
          <app-star-rating [value]="profile()?.averageRating ?? 0" [count]="profile()?.ratingCount ?? 0"></app-star-rating>
          @if (profile()?.government) {
            <span class="t-loc"><i class="fas fa-map-marker-alt"></i> {{ profile()?.government }}{{ profile()?.town ? ' · ' + profile()?.town : '' }}</span>
          }
          @if (isParent()) {
            <button class="rate-btn" (click)="openRate()">
              <i class="fas fa-star"></i>
              {{ myRating() > 0 ? 'عدّل تقييمك · Edit rating' : 'قيّم المعلم · Rate teacher' }}
            </button>
          }
        }
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="empty-box">
          <i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i>
          <p>{{ error() }}</p>
        </div>
      }

      @if (loading()) {
        <div class="section">
          <div class="shimmer-line"></div>
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
        </div>
      }

      @if (!loading() && !error() && profile(); as p) {

        <!-- Bio -->
        <div class="section">
          <div class="section-title"><i class="fas fa-id-badge"></i> نبذة تعريفية · About</div>
          <div class="about-card">
            @if (p.bio) {
              <p class="about-text">{{ p.bio }}</p>
            } @else {
              <p class="about-empty">لم يضف المعلم نبذة تعريفية بعد · No bio yet</p>
            }
          </div>
        </div>

        <!-- Courses -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-book-open"></i> المقررات · Courses
            @if (p.courses.length > 0) { <span class="count-pill">{{ p.courses.length }}</span> }
          </div>
          @if (p.courses.length === 0) {
            <div class="empty-box small">
              <i class="fas fa-book"></i>
              <p>لا توجد مقررات متاحة</p>
              <span>No courses available</span>
            </div>
          } @else {
            <div class="list">
              @for (c of p.courses; track c.id) {
                <button class="course-card ion-activatable" (click)="joinCourse(c.id)">
                  <div class="c-icon"><i class="fas fa-book-open"></i></div>
                  <div class="c-info">
                    <span class="c-name">{{ c.nameAr || c.nameEn }}</span>
                    <span class="c-sub">{{ c.code }}@if (c.gradeName) { · {{ c.gradeName }} }</span>
                  </div>
                  <span class="join-chip"><i class="fas fa-plus"></i> انضمام</span>
                  <ion-ripple-effect></ion-ripple-effect>
                </button>
              }
            </div>
          }
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>

      <!-- Rate modal (PARENT only) -->
      <app-rate-modal
        [open]="showRate()"
        [title]="'قيّم المعلم · Rate teacher'"
        [initialStars]="myRating()"
        [initialComment]="myComment()"
        [submitting]="rating()"
        [error]="rateError()"
        (submitted)="submitRating($event)"
        (closed)="showRate.set(false)">
      </app-rate-modal>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }
    .rate-btn {
      margin-top:.5rem; position:relative; z-index:1;
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.55rem 1.1rem; border-radius:14px; min-height:44px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none;
      font-size:.82rem; font-weight:700; cursor:pointer;
      box-shadow:0 4px 14px rgba(102,126,234,.3);
      -webkit-tap-highlight-color:transparent; transition:transform .15s;
    }
    .rate-btn:active { transform:scale(.97); }
    .page-header {
      background:#fff;
      border:1.5px solid #eef0f6;
      border-radius:18px;
      box-shadow:0 2px 10px rgba(0,0,0,.05);
      margin:.75rem 1rem 0;
      padding:1.1rem 1.25rem 1.25rem;
      position:relative; overflow:hidden;
      display:flex; flex-direction:column; align-items:center; text-align:center; gap:.4rem;
    }
    .blob { display:none; }
    .avatar {
      width:88px; height:88px; border-radius:50%; position:relative; z-index:1; overflow:hidden;
      background:linear-gradient(135deg,#667eea,#764ba2); border:none;
      display:flex; align-items:center; justify-content:center;
      font-size:2rem; font-weight:800; color:#fff;
    }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .shimmer-circle { background:#eef0f6; }
    .role-badge {
      position:relative; z-index:1;
      display:inline-flex; align-items:center; gap:.35rem;
      background:rgba(102,126,234,.08); color:#667eea;
      padding:.3rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600;
      border:1px solid rgba(102,126,234,.18);
    }
    .t-name { margin:.1rem 0 0; font-size:1.4rem; font-weight:800; color:#1a1a2e; position:relative; z-index:1; }
    .t-code {
      font-size:.82rem; font-weight:600; color:#667eea;
      background:rgba(102,126,234,.08); padding:.15rem .6rem; border-radius:12px; position:relative; z-index:1;
    }
    .t-loc { font-size:.78rem; color:#9090aa; position:relative; z-index:1; }

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

    .about-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1.125rem; box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .about-text { margin:0; font-size:.92rem; line-height:1.7; color:#374151; white-space:pre-wrap; }
    .about-empty { margin:0; font-size:.85rem; color:#9090aa; text-align:center; }

    .list { display:flex; flex-direction:column; gap:.625rem; }
    .course-card {
      position:relative; overflow:hidden; width:100%; text-align:right;
      display:flex; align-items:center; gap:.875rem;
      background:#fff; border:1.5px solid #f0f0f0; border-radius:14px; padding:.875rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04); cursor:pointer;
      -webkit-tap-highlight-color:transparent; transition:transform .15s;
    }
    .course-card:active { transform:scale(.98); }
    .c-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem;
    }
    .c-info { flex:1; min-width:0; display:flex; flex-direction:column; }
    .c-name { font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .c-sub { font-size:.75rem; color:#9090aa; margin-top:.1rem; }
    .join-chip {
      font-size:.72rem; font-weight:700; color:#fff; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      padding:.35rem .7rem; border-radius:12px;
      display:inline-flex; align-items:center; gap:.25rem;
    }

    .empty-box {
      margin:1.5rem 1rem; text-align:center; padding:2.5rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box.small { margin:0; padding:1.75rem 1rem; }
    .empty-box i { font-size:2rem; color:#c4c4d4; display:block; margin-bottom:.5rem; }
    .empty-box p { font-size:.92rem; font-weight:700; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.76rem; color:#9090aa; }

    .shimmer-line, .shimmer-card {
      border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite; margin-bottom:.625rem;
    }
    .shimmer-line { height:18px; width:50%; }
    .shimmer-card { height:64px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `],
})
export class TeacherPublicProfileComponent implements OnInit {
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly restSvc   = inject(RestService);
  private readonly userSvc   = inject(CurrentUserInfoService);
  private readonly ratingSvc = inject(TeacherRatingService);

  loading = signal(true);
  error   = signal<string | null>(null);
  profile = signal<TeacherPublicProfile | null>(null);

  isParent  = signal(false);
  showRate  = signal(false);
  rating    = signal(false);
  rateError = signal<string | null>(null);
  myRating  = signal(0);
  myComment = signal('');

  private teacherId = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('معلم غير معروف · Unknown teacher'); this.loading.set(false); return; }
    this.teacherId = id;
    await this.load(id);
    await this.loadParentContext(id);
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.restSvc.request<void, TeacherPublicProfile>({
          method: 'GET',
          url: `/api/sesha/teachers/${id}/public-profile`,
        })
      );
      this.profile.set(result ?? null);
    } catch (e) {
      console.error('[TeacherPublicProfile] load error:', e);
      this.error.set('حدث خطأ أثناء تحميل الملف · Error loading profile');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadParentContext(id: string): Promise<void> {
    try {
      const info = await lastValueFrom(this.userSvc.getCurrentUserActorInfo());
      const roles = (info?.userRoles || []).map(r => (r || '').toUpperCase());
      if (!roles.includes('PARENT')) return;
      this.isParent.set(true);
      await this.refreshSummary(id);
    } catch { /* guest / not authenticated — silent */ }
  }

  private async refreshSummary(id: string): Promise<void> {
    try {
      const summary = await lastValueFrom(this.ratingSvc.getSummary(id));
      this.profile.update(p => p ? { ...p, averageRating: summary.averageRating, ratingCount: summary.ratingCount } : p);
      this.myRating.set(summary.myRating?.stars ?? 0);
      this.myComment.set(summary.myRating?.comment ?? '');
    } catch { /* silent */ }
  }

  openRate(): void {
    this.rateError.set(null);
    this.showRate.set(true);
  }

  async submitRating(ev: RateSubmitEvent): Promise<void> {
    this.rating.set(true);
    this.rateError.set(null);
    try {
      await lastValueFrom(this.ratingSvc.rate({ teacherId: this.teacherId, stars: ev.stars, comment: ev.comment }));
      await this.refreshSummary(this.teacherId);
      this.showRate.set(false);
    } catch (e: any) {
      console.error('[TeacherPublicProfile] rate error:', e);
      this.rateError.set(e?.error?.error?.message || 'حدث خطأ أثناء إرسال التقييم · Error submitting rating');
    } finally {
      this.rating.set(false);
    }
  }

  initials(): string {
    const name = this.profile()?.displayName || '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  joinCourse(courseId: string): void {
    const teacherId = this.profile()?.id;
    // Normal enrollment flow, with this teacher pre-selected
    this.router.navigate(['/student/enroll', courseId], {
      queryParams: teacherId ? { teacherId } : {},
    });
  }
}
