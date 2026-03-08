import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { SecretaryTeacherService, TeacherService } from '@proxy/teachers';
import type { TeacherAutocompleteDto } from '@proxy/teachers';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-secretary-link-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div>
          <h1>ربط بمعلم</h1>
          <p class="opacity-75 mb-0">ابحث بالاسم أو الكود</p>
        </div>
      </div>

      <!-- Search box -->
      <div class="search-section">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input
            class="search-input"
            type="text"
            placeholder="أدخل اسم المعلم أو كوده..."
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            autofocus />
          <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Success / error banner -->
      <div *ngIf="msg()" class="msg-banner"
           [class.success]="msgSuccess()"
           [class.error]="!msgSuccess()">
        <i [class]="msgSuccess() ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        <span>{{ msg() }}</span>
      </div>

      <!-- Searching spinner -->
      <div *ngIf="searching()" class="center-state">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">جاري البحث...</p>
      </div>

      <!-- Empty prompt -->
      <div *ngIf="!searching() && !searchQuery" class="center-state">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <p class="text-muted">ابدأ بالكتابة للبحث عن معلم</p>
      </div>

      <!-- No results -->
      <div *ngIf="!searching() && searchQuery && results().length === 0" class="center-state">
        <i class="fas fa-user-slash fa-3x text-muted mb-3"></i>
        <p class="text-muted">لا توجد نتائج لـ "{{ searchQuery }}"</p>
      </div>

      <!-- Results list -->
      <div class="results-list" *ngIf="!searching() && results().length > 0">
        <div
          class="result-card"
          *ngFor="let t of results(); trackBy: trackById"
          (click)="link(t)"
          [class.linking]="linking() === t.id">

          <div class="teacher-avatar">
            <i class="fas fa-user-circle"></i>
          </div>

          <div class="teacher-info">
            <h4>{{ t.displayName }}</h4>
            <span *ngIf="t.code" class="teacher-code">
              <i class="fas fa-id-badge me-1"></i>{{ t.code }}
            </span>
          </div>

          <div class="action-area">
            <span *ngIf="linking() === t.id"
                  class="spinner-border spinner-border-sm text-primary" role="status"></span>
            <span *ngIf="linking() !== t.id" class="link-chip">
              <i class="fas fa-paper-plane me-1"></i>إرسال طلب
            </span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
    }

    /* Header */
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      gap: .875rem;
    }
    .back-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; min-width: 40px;
    }
    .page-header h1 { font-size: 1.2rem; font-weight: 700; margin: 0; }

    /* Search */
    .search-section {
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #e9ecef;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute; right: .875rem;
      color: #9090aa; font-size: .9rem; pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: .75rem 2.5rem .75rem .875rem;
      border: 1.5px solid #e2e4f0;
      border-radius: 12px;
      font-size: 1rem;
      direction: rtl;
      outline: none;
      transition: border-color .15s;
      background: #f8f9fa;
    }
    .search-input:focus {
      border-color: #667eea;
      background: white;
    }
    .clear-btn {
      position: absolute; left: .75rem;
      background: none; border: none; color: #adb5bd;
      cursor: pointer; font-size: .9rem; padding: .25rem;
    }

    /* Message banner */
    .msg-banner {
      display: flex; align-items: center; gap: .75rem;
      padding: .875rem 1rem; font-size: .9rem; font-weight: 500;
    }
    .msg-banner.success { background: #d4edda; color: #155724; }
    .msg-banner.error   { background: #fff3cd; color: #856404; }

    /* Center state */
    .center-state {
      text-align: center;
      padding: 4rem 1.5rem;
      color: #6c757d;
    }

    /* Results */
    .results-list {
      padding: .75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: .625rem;
    }

    .result-card {
      background: white;
      border-radius: 14px;
      border: 1.5px solid #e9ecef;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: .875rem;
      cursor: pointer;
      transition: all .15s ease;
      min-height: 72px;
    }
    .result-card:hover, .result-card:active {
      border-color: #667eea;
      box-shadow: 0 3px 12px rgba(102,126,234,.15);
    }
    .result-card.linking {
      opacity: .7;
      pointer-events: none;
    }

    .teacher-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.5rem; flex-shrink: 0;
    }

    .teacher-info { flex: 1; min-width: 0; }
    .teacher-info h4 { margin: 0 0 .2rem; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .teacher-code { font-size: .8rem; color: #667eea; font-weight: 500; }

    .action-area { flex-shrink: 0; }
    .link-chip {
      display: inline-flex; align-items: center;
      background: rgba(102,126,234,.1); color: #667eea;
      border-radius: 20px; padding: .35rem .85rem;
      font-size: .82rem; font-weight: 600;
    }
  `],
})
export class SecretaryLinkTeacherComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  searchQuery = '';
  results = signal<TeacherAutocompleteDto[]>([]);
  searching = signal(false);
  linking = signal<string | null>(null);
  msg = signal<string | null>(null);
  msgSuccess = signal(false);

  private searchTimeout: any;

  ngOnInit() {}

  onSearchInput() {
    clearTimeout(this.searchTimeout);
    this.msg.set(null);
    if (!this.searchQuery.trim()) {
      this.results.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => this.doSearch(), 350);
  }

  clearSearch() {
    this.searchQuery = '';
    this.results.set([]);
    this.msg.set(null);
  }

  private async doSearch() {
    this.searching.set(true);
    try {
      const res = await lastValueFrom(
        this.teacherService.getTeachersBySearch(this.searchQuery.trim(), 20, { skipHandleError: true })
      );
      this.results.set(res ?? []);
    } catch {
      this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  async link(teacher: TeacherAutocompleteDto) {
    if (!teacher.id || this.linking()) return;
    this.linking.set(teacher.id);
    this.msg.set(null);
    try {
      await lastValueFrom(
        this.secretaryTeacherService.sendLinkRequest(teacher.id, { skipHandleError: true })
      );
      this.msgSuccess.set(true);
      this.msg.set(`✓ تم إرسال طلب الربط إلى المعلم "${teacher.displayName}" بنجاح`);
      this.results.update(list => list.filter(t => t.id !== teacher.id));
    } catch (err: any) {
      this.msgSuccess.set(false);
      this.msg.set(err?.error?.error?.message || 'فشل إرسال الطلب، حاول مرة أخرى');
    } finally {
      this.linking.set(null);
    }
  }

  goBack() {
    this.router.navigate(['/secretary']);
  }

  trackById = (_: number, t: TeacherAutocompleteDto) => t.id;
}
