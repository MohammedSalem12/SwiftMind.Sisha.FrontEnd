import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import { AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-academies-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="blob b1"></div><div class="blob b2"></div>
        <div class="header-content">
          <div class="header-text">
            <h1>الأكاديميات</h1>
            <p>اكتشف الأكاديميات وانضم إليها · Discover & Join Academies</p>
          </div>
          @if (canCreate()) {
            <button class="create-btn" (click)="router.navigate(['/academies/create'])">
              <i class="fas fa-plus"></i>
              إنشاء
            </button>
          }
        </div>
      </div>

      <!-- ── Search & join by code ── -->
      <div class="search-area">
        <!-- Search by name -->
        <div class="search-row">
          <div class="search-wrap">
            <i class="fas fa-search si"></i>
            <input class="search-input" type="text"
                   placeholder="ابحث بالاسم أو الكود…"
                   [ngModel]="searchQuery()"
                   (ngModelChange)="searchQuery.set($event)" />
          </div>
        </div>

        <!-- Join by code (student-focused) -->
        @if (isStudent()) {
          <div class="code-join-wrap">
            <div class="code-join-label">
              <i class="fas fa-key"></i>
              انضم بكود الأكاديمية
            </div>
            <div class="code-join-row">
              <input class="code-input" type="text" dir="ltr"
                     placeholder="A-XXXXX"
                     [(ngModel)]="joinCode"
                     (keyup.enter)="joinByCode()" />
              <button class="code-btn" [disabled]="!joinCode.trim() || joiningByCode()"
                      (click)="joinByCode()">
                @if (joiningByCode()) { <span class="spinner"></span> }
                @else { <i class="fas fa-arrow-left"></i> }
                ابحث
              </button>
            </div>
            @if (codeError()) {
              <div class="code-msg code-error"><i class="fas fa-times-circle"></i> {{ codeError() }}</div>
            }
            @if (codeSuccess()) {
              <div class="code-msg code-success"><i class="fas fa-check-circle"></i> {{ codeSuccess() }}</div>
            }
          </div>
        }
      </div>

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && filteredAcademies().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-university"></i></div>
          <h3>لا توجد أكاديميات</h3>
          <p>{{ searchQuery() ? 'لا توجد نتائج مطابقة' : 'لم يتم إنشاء أي أكاديمية بعد' }}</p>
          @if (canCreate() && !searchQuery()) {
            <button class="empty-create-btn" (click)="router.navigate(['/academies/create'])">
              <i class="fas fa-plus"></i>
              إنشاء أكاديمية
            </button>
          }
        </div>
      }

      <!-- ── Academies grid ── -->
      @if (!loading() && filteredAcademies().length > 0) {
        <div class="academies-list">
          @for (academy of filteredAcademies(); track academy.id) {
            <div class="academy-card" (click)="goToProfile(academy)">

              <!-- Card header -->
              <div class="card-header-band">
                <div class="academy-avatar">
                  <i class="fas fa-university"></i>
                </div>
                <div class="academy-meta">
                  <h3>{{ academy.nameAr }}</h3>
                  @if (academy.nameEn) { <p class="name-en">{{ academy.nameEn }}</p> }
                  @if (academy.code) { <span class="code-chip">{{ academy.code }}</span> }
                </div>
                @if (academy.isActive) {
                  <span class="active-dot"></span>
                }
              </div>

              <!-- Description -->
              @if (academy.description) {
                <p class="card-desc">{{ academy.description }}</p>
              }

              <!-- Stats row -->
              <div class="card-stats">
                <div class="cstat">
                  <i class="fas fa-user-tie"></i>
                  <span>{{ academy.supervisorName || 'غير محدد' }}</span>
                </div>
                <div class="cstat-sep"></div>
                <div class="cstat">
                  <i class="fas fa-users"></i>
                  <span>{{ academy.memberCount }} عضو</span>
                </div>
                <div class="cstat-sep"></div>
                <div class="cstat">
                  <i class="fas fa-book-open"></i>
                  <span>{{ academy.courseCount }} مقرر</span>
                </div>
              </div>

              <div class="card-footer">
                <button class="view-btn" (click)="$event.stopPropagation(); goToProfile(academy)">
                  <i class="fas fa-eye"></i>
                  عرض التفاصيل
                </button>
                @if (isStudent()) {
                  <span class="join-hint">
                    <i class="fas fa-arrow-left"></i>
                    اضغط للانضمام
                  </span>
                }
              </div>

            </div>
          }
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1rem) 1.25rem 1.5rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:130px; height:130px; bottom:-50px; left:-25px; }
    .header-content {
      position:relative; z-index:1;
      display:flex; align-items:center; justify-content:space-between; gap:1rem;
    }
    .header-text h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-text p  { margin:.15rem 0 0; font-size:.75rem; color:rgba(255,255,255,.7); }
    .create-btn {
      display:flex; align-items:center; gap:.4rem;
      background:rgba(255,255,255,.2); border:1.5px solid rgba(255,255,255,.35);
      color:#fff; padding:.5rem .875rem; border-radius:12px;
      font-size:.82rem; font-weight:700; cursor:pointer; flex-shrink:0;
    }

    /* ── Search area ── */
    .search-area { padding:.875rem 1rem .25rem; display:flex; flex-direction:column; gap:.625rem; }
    .search-row  { display:flex; }
    .search-wrap { flex:1; position:relative; display:flex; align-items:center; }
    .si { position:absolute; right:.875rem; color:#9090aa; font-size:.82rem; pointer-events:none; }
    .search-input {
      width:100%; padding:.7rem 2.5rem .7rem .75rem;
      border:1.5px solid #e9ecef; border-radius:12px;
      background:#fff; font-size:.9rem; outline:none; min-height:44px;
      transition:border-color .15s;
    }
    .search-input:focus { border-color:#667eea; }

    /* Join by code */
    .code-join-wrap {
      background:#fff; border-radius:14px; border:1.5px solid #e9ecef;
      padding:.875rem; display:flex; flex-direction:column; gap:.5rem;
    }
    .code-join-label {
      display:flex; align-items:center; gap:.4rem;
      font-size:.78rem; font-weight:700; color:#555;
    }
    .code-join-label i { color:#667eea; }
    .code-join-row { display:flex; gap:.5rem; }
    .code-input {
      flex:1; padding:.65rem .875rem; border:1.5px solid #e9ecef; border-radius:10px;
      font-size:.9rem; background:#f9fafb; outline:none; min-height:44px;
      transition:border-color .15s; letter-spacing:.05em; font-weight:600;
    }
    .code-input:focus { border-color:#667eea; background:#fff; }
    .code-btn {
      display:flex; align-items:center; gap:.35rem;
      padding:.65rem 1rem; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.82rem; font-weight:700;
      cursor:pointer; min-height:44px; flex-shrink:0;
    }
    .code-btn:disabled { opacity:.6; cursor:not-allowed; }
    .code-msg {
      display:flex; align-items:center; gap:.4rem;
      font-size:.78rem; font-weight:600; padding:.35rem .5rem;
      border-radius:8px;
    }
    .code-error   { background:rgba(239,68,68,.08);  color:#dc2626; }
    .code-success { background:rgba(34,197,94,.08);  color:#16a34a; }

    /* ── Shimmer ── */
    .shimmer-area { padding:.75rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }
    .shimmer-card {
      height:150px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Empty ── */
    .empty-state {
      display:flex; flex-direction:column; align-items:center;
      padding:4rem 1.5rem; text-align:center;
    }
    .empty-icon {
      width:80px; height:80px; border-radius:50%;
      background:rgba(102,126,234,.1);
      display:flex; align-items:center; justify-content:center;
      font-size:2rem; color:#667eea; margin-bottom:1.25rem;
    }
    .empty-state h3 { font-size:1.1rem; font-weight:700; color:#1a1a2e; margin:0 0 .4rem; }
    .empty-state p   { font-size:.85rem; color:#9090aa; margin:0 0 1rem; }
    .empty-create-btn {
      display:inline-flex; align-items:center; gap:.4rem;
      padding:.75rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.88rem; font-weight:700; cursor:pointer;
    }

    /* ── Academy cards ── */
    .academies-list { padding:.75rem 1rem 0; display:flex; flex-direction:column; gap:.625rem; }
    .academy-card {
      background:#fff; border-radius:16px;
      border:1.5px solid #f0f0f0;
      box-shadow:0 2px 10px rgba(0,0,0,.05);
      overflow:hidden; cursor:pointer;
      transition:box-shadow .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .academy-card:active { box-shadow:0 1px 4px rgba(0,0,0,.05); }

    /* Card header band */
    .card-header-band {
      background:linear-gradient(135deg,#667eea,#764ba2);
      padding:.875rem 1rem;
      display:flex; align-items:center; gap:.75rem;
      position:relative;
    }
    .academy-avatar {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      background:rgba(255,255,255,.2); border:2px solid rgba(255,255,255,.4);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:1.1rem;
    }
    .academy-meta { flex:1; min-width:0; }
    .academy-meta h3 { margin:0 0 .15rem; font-size:.95rem; font-weight:800; color:#fff; }
    .name-en { margin:0 0 .25rem; font-size:.7rem; color:rgba(255,255,255,.7); }
    .code-chip {
      background:rgba(255,255,255,.2); color:rgba(255,255,255,.95);
      font-size:.68rem; font-weight:700; padding:.1rem .45rem; border-radius:8px;
      letter-spacing:.04em;
    }
    .active-dot {
      width:10px; height:10px; border-radius:50%;
      background:#4ade80; border:2px solid rgba(255,255,255,.8);
      position:absolute; top:.75rem; left:.875rem;
    }

    .card-desc {
      margin:0; padding:.625rem 1rem;
      font-size:.82rem; color:#555; line-height:1.5;
      border-bottom:1px solid #f0f0f0;
    }

    .card-stats {
      display:flex; align-items:center; padding:.625rem 1rem;
      border-bottom:1px solid #f0f0f0;
    }
    .cstat {
      display:flex; align-items:center; gap:.35rem;
      font-size:.75rem; color:#555; flex:1; justify-content:center;
    }
    .cstat i { color:#764ba2; font-size:.78rem; }
    .cstat-sep { width:1px; height:16px; background:#f0f0f0; }

    .card-footer {
      display:flex; align-items:center; justify-content:space-between;
      padding:.625rem 1rem;
    }
    .view-btn {
      display:flex; align-items:center; gap:.35rem;
      padding:.45rem .875rem; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.78rem; font-weight:700; cursor:pointer;
    }
    .join-hint {
      font-size:.7rem; color:#9090aa;
      display:flex; align-items:center; gap:.25rem;
    }

    .spinner {
      width:14px; height:14px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class AcademiesListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly academySvc  = inject(AcademyService);
  private readonly userSvc     = inject(CurrentUserInfoService);

  loading     = signal(true);
  academies   = signal<AcademyDto[]>([]);
  searchQuery = signal('');

  isStudent        = signal(false);
  isTeacherOrAdmin = signal(false);

  // Join by code
  joinCode      = '';
  joiningByCode = signal(false);
  codeError     = signal<string | null>(null);
  codeSuccess   = signal<string | null>(null);

  filteredAcademies = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.academies();
    return this.academies().filter(a =>
      (a.nameAr || '').toLowerCase().includes(q) ||
      (a.nameEn || '').toLowerCase().includes(q) ||
      (a.code   || '').toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    try {
      const [userInfo, list] = await Promise.all([
        lastValueFrom(this.userSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.academySvc.getList()),
      ]);
      const roles = userInfo?.userRoles || [];
      this.isStudent.set(roles.includes('STUDENT'));
      this.isTeacherOrAdmin.set(roles.includes('TEACHER') || roles.includes('ADMIN'));
      this.academies.set(list || []);
    } catch (e) {
      console.error('Error loading academies', e);
    } finally {
      this.loading.set(false);
    }
  }

  canCreate(): boolean { return this.isTeacherOrAdmin(); }

  goToProfile(academy: AcademyDto): void {
    this.router.navigate(['/academies', academy.id, 'profile']);
  }

  async joinByCode(): Promise<void> {
    const code = this.joinCode.trim().toUpperCase();
    if (!code) return;

    this.codeError.set(null);
    this.codeSuccess.set(null);
    this.joiningByCode.set(true);

    // Find the academy by code in the loaded list
    const match = this.academies().find(a =>
      (a.code || '').toUpperCase() === code
    );

    if (!match) {
      this.codeError.set('لا توجد أكاديمية بهذا الكود · No academy found with this code');
      this.joiningByCode.set(false);
      return;
    }

    // Navigate to its profile — student can send join request there
    this.joiningByCode.set(false);
    this.router.navigate(['/academies', match.id, 'profile']);
  }

  trackById = (_: number, item: AcademyDto) => item.id;
}
