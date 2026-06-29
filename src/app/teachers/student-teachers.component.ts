import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../shared/components/page-header.component';

interface TeacherCard {
  id: string;
  displayName: string;
  teacherCode: string;
  bio?: string;
  photoUrl?: string;
  government: string;
  town: string;
  courseCount: number;
}

@Component({
  selector: 'app-student-teachers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'معلمو صفّي'" [titleEn]="'My Teachers'" [backTo]="'/student'"></app-page-header>

      <!-- Search -->
      @if (!loading() && teachers().length > 0) {
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input class="search-input" type="text"
                 [ngModel]="search()" (ngModelChange)="search.set($event)"
                 placeholder="ابحث بالاسم أو الكود · Search by name or code" />
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="list">
          @for (i of [1,2,3,4]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="empty-box">
          <i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i>
          <p>{{ error() }}</p>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && !error() && teachers().length === 0) {
        <div class="empty-box">
          <i class="fas fa-user-slash"></i>
          <p>لا يوجد معلمون لصفّك حالياً</p>
          <span>No teachers available for your grade yet</span>
        </div>
      }

      <!-- List -->
      @if (!loading() && !error() && filtered().length > 0) {
        <div class="list">
          @for (t of filtered(); track t.id) {
            <button class="teacher-card ion-activatable" (click)="openProfile(t.id)">
              <div class="t-avatar">
                @if (t.photoUrl) {
                  <img [src]="t.photoUrl" alt="" />
                } @else {
                  <span>{{ initials(t.displayName) }}</span>
                }
              </div>
              <div class="t-info">
                <span class="t-name">{{ t.displayName }}</span>
                <span class="t-code">{{ t.teacherCode }}</span>
                @if (t.bio) { <span class="t-bio">{{ t.bio }}</span> }
                <div class="t-meta">
                  <span class="t-chip"><i class="fas fa-book-open"></i> {{ t.courseCount }} مقرر</span>
                  @if (t.government) {
                    <span class="t-chip t-loc"><i class="fas fa-map-marker-alt"></i> {{ t.government }}{{ t.town ? ' · ' + t.town : '' }}</span>
                  }
                </div>
              </div>
              <i class="fas fa-chevron-left t-arrow"></i>
              <ion-ripple-effect></ion-ripple-effect>
            </button>
          }
        </div>
      }

      @if (!loading() && filtered().length === 0 && teachers().length > 0) {
        <div class="empty-box">
          <i class="fas fa-search"></i>
          <p>لا نتائج مطابقة</p>
          <span>No matching teachers</span>
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    .search-wrap {
      margin:1rem 1rem 0; position:relative; display:flex; align-items:center;
    }
    .search-wrap i { position:absolute; right:.9rem; color:#9090aa; font-size:.9rem; }
    .search-input {
      width:100%; box-sizing:border-box; padding:.75rem 2.4rem .75rem .9rem;
      border:1.5px solid #e0e0f0; border-radius:14px; background:#fff;
      font-size:16px; font-family:inherit;
    }
    .search-input:focus { outline:none; border-color:#667eea; box-shadow:0 0 0 3px rgba(102,126,234,.1); }

    .list { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:96px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .teacher-card {
      position:relative; overflow:hidden;
      display:flex; align-items:center; gap:.875rem; width:100%; text-align:right;
      background:#fff; border:1.5px solid #f0f0f0; border-radius:16px; padding:.875rem;
      box-shadow:0 2px 10px rgba(0,0,0,.05); cursor:pointer;
      -webkit-tap-highlight-color:transparent; transition:transform .15s;
    }
    .teacher-card:active { transform:scale(.98); }
    .t-avatar {
      width:56px; height:56px; border-radius:50%; flex-shrink:0; overflow:hidden;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.15rem; font-weight:800;
    }
    .t-avatar img { width:100%; height:100%; object-fit:cover; }
    .t-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:.2rem; }
    .t-name { font-size:1rem; font-weight:800; color:#1a1a2e; }
    .t-code { font-size:.72rem; font-weight:600; color:#667eea; }
    .t-bio {
      font-size:.78rem; color:#777; line-height:1.4;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
    }
    .t-meta { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.15rem; }
    .t-chip {
      font-size:.68rem; font-weight:700; color:#059669;
      background:rgba(16,185,129,.1); padding:.15rem .5rem; border-radius:10px;
      display:inline-flex; align-items:center; gap:.25rem;
    }
    .t-chip.t-loc { color:#667eea; background:rgba(102,126,234,.1); }
    .t-arrow { color:#c4c4d4; font-size:.9rem; flex-shrink:0; }

    .empty-box {
      margin:1.5rem 1rem; text-align:center; padding:2.5rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2.2rem; color:#c4c4d4; display:block; margin-bottom:.6rem; }
    .empty-box p { font-size:.95rem; font-weight:700; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.78rem; color:#9090aa; }
  `],
})
export class StudentTeachersComponent implements OnInit {
  private readonly router  = inject(Router);
  private readonly restSvc = inject(RestService);

  loading  = signal(true);
  error    = signal<string | null>(null);
  teachers = signal<TeacherCard[]>([]);
  search   = signal('');

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.teachers();
    return this.teachers().filter(t =>
      t.displayName.toLowerCase().includes(q) ||
      t.teacherCode.toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.restSvc.request<void, TeacherCard[]>({
          method: 'GET',
          url: '/api/sesha/teachers/for-my-grade',
        })
      );
      this.teachers.set(result ?? []);
    } catch (e) {
      console.error('[StudentTeachers] load error:', e);
      this.error.set('حدث خطأ أثناء تحميل المعلمين · Error loading teachers');
    } finally {
      this.loading.set(false);
    }
  }

  initials(name: string): string {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  openProfile(id: string): void {
    this.router.navigate(['/student/teacher', id]);
  }
}
