import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-academies-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="academies-page" dir="rtl">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()"><i class="fas fa-arrow-right"></i></button>
        <div class="header-content">
          <h1><i class="fas fa-university me-2"></i>الأكاديميات</h1>
          <p>اكتشف الأكاديميات وانضم إليها</p>
        </div>
        <button
          *ngIf="canCreate()"
          class="btn-create"
          (click)="router.navigate(['/academies/create'])">
          <i class="fas fa-plus me-1"></i>
          إنشاء أكاديمية
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          placeholder="ابحث عن أكاديمية..."
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          class="search-input" />
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && filteredAcademies().length === 0" class="empty-state">
        <i class="fas fa-university"></i>
        <p>لا توجد أكاديميات</p>
        <button *ngIf="canCreate()" class="btn-create" (click)="router.navigate(['/academies/create'])">
          إنشاء أكاديمية جديدة
        </button>
      </div>

      <!-- Academies grid -->
      <div *ngIf="!loading() && filteredAcademies().length > 0" class="academies-grid">
        <div
          *ngFor="let academy of filteredAcademies(); trackBy: trackById"
          class="academy-card"
          (click)="goToProfile(academy)">
          <div class="card-header">
            <div class="academy-avatar">
              <i class="fas fa-university"></i>
            </div>
            <div class="academy-info">
              <h3>{{ academy.nameAr }}</h3>
              <p class="name-en">{{ academy.nameEn }}</p>
              <span class="code-badge">{{ academy.code }}</span>
            </div>
          </div>
          <div class="card-body">
            <p *ngIf="academy.description" class="description">{{ academy.description }}</p>
            <div class="stats-row">
              <div class="stat">
                <i class="fas fa-user-tie"></i>
                <span>{{ academy.supervisorName || 'غير محدد' }}</span>
              </div>
              <div class="stat">
                <i class="fas fa-users"></i>
                <span>{{ academy.memberCount }} عضو</span>
              </div>
              <div class="stat">
                <i class="fas fa-book-open"></i>
                <span>{{ academy.courseCount }} مقرر</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-view" (click)="$event.stopPropagation(); goToProfile(academy)">
              <i class="fas fa-eye me-1"></i> عرض
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; min-width: 40px; min-height: 40px;
      transition: background .15s;
      &:hover { background: rgba(255,255,255,.3); }
    }

    .academies-page {
      padding: 16px;
      max-width: 900px;
      margin: 0 auto;
      font-family: 'Segoe UI', sans-serif;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-header h1 { font-size: 22px; font-weight: 700; color: #333; margin: 0; }
    .page-header p { color: #666; margin: 4px 0 0; font-size: 14px; }
    .btn-create {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 600;
    }
    .search-bar {
      position: relative;
      margin-bottom: 20px;
    }
    .search-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #999; }
    .search-input {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      font-size: 14px;
      direction: rtl;
      box-sizing: border-box;
    }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 60px 20px; color: #999; }
    .empty-state i { font-size: 48px; margin-bottom: 12px; display: block; }
    .academies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .academy-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .academy-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
    .card-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .academy-avatar {
      width: 44px; height: 44px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 20px;
      flex-shrink: 0;
    }
    .academy-info h3 { color: #fff; font-size: 15px; margin: 0 0 2px; font-weight: 700; }
    .name-en { color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 4px; }
    .code-badge {
      background: rgba(255,255,255,0.25);
      color: #fff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .card-body { padding: 12px 16px; }
    .description { font-size: 13px; color: #555; margin: 0 0 10px; line-height: 1.5; }
    .stats-row { display: flex; gap: 14px; flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #666; }
    .stat i { color: #764ba2; }
    .card-footer { padding: 10px 16px; border-top: 1px solid #f0f0f0; }
    .btn-view {
      width: 100%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 600;
    }
    @media (max-width: 480px) {
      .academies-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; }
    }
  `]
})
export class AcademiesListComponent implements OnInit {
  private readonly location = inject(Location);
  readonly router = inject(Router);
  private readonly academyService = inject(AcademyService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  loading = signal(true);
  academies = signal<AcademyDto[]>([]);
  filteredAcademies = signal<AcademyDto[]>([]);
  searchQuery = '';
  isTeacherOrAdmin = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const [userInfo, result] = await Promise.all([
        lastValueFrom(this.currentUserService.getCurrentUserActorInfo()),
        lastValueFrom(this.academyService.getList()),
      ]);
      const roles = userInfo?.userRoles || [];
      this.isTeacherOrAdmin.set(roles.includes('TEACHER') || roles.includes('ADMIN'));
      this.academies.set(result || []);
      this.filteredAcademies.set(result || []);
    } catch (err) {
      console.error('Error loading academies:', err);
    } finally {
      this.loading.set(false);
    }
  }

  canCreate(): boolean {
    return this.isTeacherOrAdmin();
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase();
    if (!q) {
      this.filteredAcademies.set(this.academies());
    } else {
      this.filteredAcademies.set(
        this.academies().filter(a =>
          (a.nameAr || '').toLowerCase().includes(q) ||
          (a.nameEn || '').toLowerCase().includes(q) ||
          (a.code || '').toLowerCase().includes(q)
        )
      );
    }
  }

  goToProfile(academy: AcademyDto): void {
    this.router.navigate(['/academies', academy.id, 'profile']);
  }

  goBack(): void { this.location.back(); }

  trackById = (_: number, item: AcademyDto) => item.id;
}
