import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto } from '@proxy/academies/models';

@Component({
  selector: 'app-teacher-academies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-info">
          <h1>الأكاديميات</h1>
          <p class="opacity-75 mb-0">Academies</p>
        </div>
        <button class="add-btn" (click)="goToCreate()">
          <i class="fas fa-plus"></i>
          <span>إضافة أكاديمية</span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && academies().length === 0" class="empty-state">
        <i class="fas fa-university"></i>
        <h4>لا توجد أكاديميات</h4>
        <p>لم تنشئ أي أكاديمية بعد</p>
        <button class="btn-create-lg" (click)="goToCreate()">
          <i class="fas fa-plus me-2"></i>إنشاء أكاديمية جديدة
        </button>
      </div>

      <!-- Academies list -->
      <div class="academy-list" *ngIf="!loading() && academies().length > 0">
        <div
          class="academy-card"
          *ngFor="let a of academies(); trackBy: trackById"
          (click)="goToCourses(a)">
          <div class="academy-avatar">
            <i class="fas fa-university"></i>
          </div>
          <div class="academy-info">
            <h4>{{ a.nameAr || a.nameEn }}</h4>
            <p *ngIf="a.nameAr && a.nameEn" class="name-en">{{ a.nameEn }}</p>
            <span class="code-badge" *ngIf="a.code">{{ a.code }}</span>
            <div class="stats">
              <span><i class="fas fa-book-open me-1"></i>{{ a.courseCount || 0 }} مقرر</span>
              <span><i class="fas fa-users me-1"></i>{{ a.memberCount || 0 }} عضو</span>
            </div>
          </div>
          <div class="arrow-icon">
            <i class="fas fa-chevron-left"></i>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding-bottom: calc(80px + env(safe-area-inset-bottom));
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: calc(.75rem + env(safe-area-inset-top)) 1rem .75rem;
      display: flex; align-items: center; gap: .75rem;
      position: sticky; top: 0; z-index: 50;
    }

    .back-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; min-width: 40px;
    }

    .header-info { flex: 1; min-width: 0; }
    .header-info h1 { font-size: 1.2rem; font-weight: 700; margin: 0; }

    .add-btn {
      display: inline-flex; align-items: center; gap: .35rem;
      background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.35);
      color: white; border-radius: 20px;
      padding: .45rem .9rem; font-size: .82rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; min-height: 40px;
      transition: background .15s;
    }
    .add-btn:hover, .add-btn:active { background: rgba(255,255,255,.3); }

    .loading-state { text-align: center; padding: 3rem 1rem; color: #6c757d; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0; border-top-color: #667eea;
      border-radius: 50%; animation: spin .7s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 4rem 1.5rem; color: #6c757d; }
    .empty-state i { font-size: 3rem; margin-bottom: .75rem; display: block; opacity: .4; }
    .empty-state h4 { color: #343a40; margin: 0 0 .25rem; }
    .empty-state p { margin: 0 0 1.25rem; font-size: .9rem; }

    .btn-create-lg {
      display: inline-flex; align-items: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 24px;
      padding: .875rem 1.75rem; font-size: 1rem; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 14px rgba(102,126,234,.35);
      min-height: 52px; transition: opacity .15s;
    }
    .btn-create-lg:hover, .btn-create-lg:active { opacity: .88; }

    .academy-list { padding: 1rem; display: flex; flex-direction: column; gap: .75rem; }

    .academy-card {
      background: white; border-radius: 14px;
      border: 1.5px solid #e9ecef; padding: 1rem;
      display: flex; align-items: center; gap: .875rem;
      cursor: pointer; transition: all .2s ease; min-height: 80px;
    }
    .academy-card:hover, .academy-card:active {
      border-color: #667eea;
      box-shadow: 0 4px 16px rgba(102,126,234,.15);
      transform: translateY(-1px);
    }

    .academy-avatar {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.4rem; flex-shrink: 0;
    }

    .academy-info { flex: 1; min-width: 0; }
    .academy-info h4 { margin: 0 0 .2rem; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .name-en { font-size: .78rem; color: #6c757d; margin: 0 0 .25rem; }
    .code-badge {
      display: inline-block;
      background: rgba(102,126,234,.1); color: #667eea;
      font-size: .72rem; font-weight: 600; padding: .1rem .5rem;
      border-radius: 10px; margin-bottom: .3rem;
    }
    .stats { display: flex; gap: .75rem; font-size: .78rem; color: #6c757d; margin-top: .25rem; }
    .stats i { color: #764ba2; }

    .arrow-icon { color: #adb5bd; font-size: .85rem; flex-shrink: 0; }
  `],
})
export class TeacherAcademiesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly academyService = inject(AcademyService);

  loading = signal(true);
  academies = signal<AcademyDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadAcademies();
  }

  private async loadAcademies(): Promise<void> {
    this.loading.set(true);
    try {
      const result: AcademyDto[] = [];

      // Load own academy (if teacher owns one)
      const ownAcademy = await lastValueFrom(
        this.academyService.getMyAcademy({ skipHandleError: true })
      ).catch(() => null);
      if (ownAcademy?.id) result.push(ownAcademy);

      this.academies.set(result);
    } catch {
      this.academies.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  goToCourses(academy: AcademyDto): void {
    this.router.navigate(['/teacher/academies', academy.id, 'courses']);
  }

  goToCreate(): void {
    this.router.navigate(['/academies/create']);
  }

  goBack(): void {
    this.router.navigate(['/teacher']);
  }

  trackById = (_: number, item: AcademyDto) => item.id;
}
