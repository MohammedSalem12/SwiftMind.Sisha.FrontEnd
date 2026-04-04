import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-teacher-academies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-info">
          <h1>الأكاديميات · Academies</h1>
        </div>
        <button class="add-btn" (click)="goToCreate()">
          <i class="fas fa-plus"></i>
          <span>جديد</span>
        </button>
      </div>

      <!-- Search bar -->
      <div class="search-area">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            class="search-input"
            placeholder="بحث بالاسم أو الكود أو المشرف · Search by name, code or supervisor"
            [ngModel]="searchText()"
            (ngModelChange)="searchText.set($event)" />
          @if (searchText()) {
            <button class="search-clear" (click)="searchText.set('')">
              <i class="fas fa-times"></i>
            </button>
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.tab--active]="activeTab() === 'mine'" (click)="activeTab.set('mine')">
          <i class="fas fa-star"></i>
          <span>أكاديمياتي · Mine</span>
          @if (myAcademies().length > 0) {
            <span class="tab-count">{{ myAcademies().length }}</span>
          }
        </button>
        <button class="tab" [class.tab--active]="activeTab() === 'browse'" (click)="activeTab.set('browse')">
          <i class="fas fa-globe"></i>
          <span>استعراض · Browse</span>
          @if (otherAcademies().length > 0) {
            <span class="tab-count">{{ otherAcademies().length }}</span>
          }
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- ═══ MY ACADEMIES TAB ═══ -->
      @if (!loading() && activeTab() === 'mine') {
        @if (filteredMine().length === 0) {
          <div class="empty-state">
            @if (searchText()) {
              <div class="empty-icon"><i class="fas fa-search"></i></div>
              <h4>لا توجد نتائج</h4>
              <p>No results matching "{{ searchText() }}"</p>
            } @else {
              <div class="empty-icon"><i class="fas fa-university"></i></div>
              <h4>لا توجد أكاديميات خاصة بك</h4>
              <p>أنشئ أكاديمية أو انضم لواحدة من تبويب الاستعراض</p>
              <p class="empty-en">Create an academy or join one from Browse tab</p>
              <button class="btn-create-lg" (click)="goToCreate()">
                <i class="fas fa-plus"></i> إنشاء أكاديمية
              </button>
            }
          </div>
        }

        @if (filteredMine().length > 0) {
          <div class="academy-list">
            @for (a of filteredMine(); track a.id) {
              <div class="academy-card" [class.inactive-card]="!a.isActive">

                <!-- Main row: supervisor → manage, member → courses, pending → nothing -->
                <div class="card-main" [class.card-main--disabled]="isPending(a)" (click)="isPending(a) ? null : (isSupervisor(a) ? goToManage(a) : goToCourses(a))">
                  <div class="academy-avatar" [class.avatar-inactive]="!a.isActive">
                    <i class="fas fa-university"></i>
                  </div>
                  <div class="academy-info">
                    <div class="name-row">
                      <h4>{{ a.nameAr || a.nameEn }}</h4>
                      @if (isSupervisor(a)) {
                        <span class="supervisor-badge">مشرف · Supervisor</span>
                      } @else if (isPending(a)) {
                        <span class="pending-badge">طلب معلق · Pending</span>
                      } @else {
                        <span class="member-badge">عضو · Member</span>
                      }
                      @if (!a.isActive) {
                        <span class="inactive-badge">غير نشط</span>
                      }
                    </div>
                    @if (a.nameAr && a.nameEn) { <p class="name-en">{{ a.nameEn }}</p> }
                    @if (a.supervisorName && !isSupervisor(a)) {
                      <p class="supervisor-name"><i class="fas fa-user-shield"></i> {{ a.supervisorName }}</p>
                    }
                    @if (a.code) { <span class="code-badge">{{ a.code }}</span> }
                    <div class="stats">
                      <span><i class="fas fa-book-open"></i>{{ a.courseCount || 0 }} مقرر</span>
                      <span><i class="fas fa-users"></i>{{ a.memberCount || 0 }} عضو</span>
                    </div>
                  </div>
                  <i class="fas fa-chevron-left nav-arrow"></i>
                </div>

                <!-- Supervisor actions -->
                @if (isSupervisor(a)) {
                  <div class="action-strip" (click)="$event.stopPropagation()">
                    <button class="action-btn edit-btn" (click)="goToEdit(a)">
                      <i class="fas fa-pen"></i> تعديل
                    </button>
                    <button class="action-btn"
                            [class.deactivate-btn]="a.isActive"
                            [class.activate-btn]="!a.isActive"
                            [disabled]="togglingId() === a.id"
                            (click)="toggleActive(a)">
                      @if (togglingId() === a.id) { <span class="spinner-sm"></span> }
                      @else { <i [class]="a.isActive ? 'fas fa-eye-slash' : 'fas fa-eye'"></i> }
                      {{ a.isActive ? 'إخفاء' : 'تفعيل' }}
                    </button>
                    <button class="action-btn manage-btn" (click)="goToCourses(a)">
                      <i class="fas fa-book-open"></i> المقررات
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ═══ BROWSE TAB ═══ -->
      @if (!loading() && activeTab() === 'browse') {
        @if (filteredOthers().length === 0) {
          <div class="empty-state">
            @if (searchText()) {
              <div class="empty-icon"><i class="fas fa-search"></i></div>
              <h4>لا توجد نتائج</h4>
              <p>No results matching "{{ searchText() }}"</p>
            } @else {
              <div class="empty-icon"><i class="fas fa-globe"></i></div>
              <h4>لا توجد أكاديميات أخرى</h4>
              <p>No other academies available</p>
            }
          </div>
        }

        @if (filteredOthers().length > 0) {
          <div class="academy-list">
            @for (a of filteredOthers(); track a.id) {
              <div class="academy-card">

                <!-- Main row (not clickable unless member) -->
                <div class="card-main"
                     [class.card-main--disabled]="!isMember(a)"
                     (click)="isMember(a) && goToCourses(a)">
                  <div class="academy-avatar">
                    <i class="fas fa-university"></i>
                  </div>
                  <div class="academy-info">
                    <div class="name-row">
                      <h4>{{ a.nameAr || a.nameEn }}</h4>
                      @if (isMember(a)) {
                        <span class="member-badge">عضو · Member</span>
                      } @else if (isPending(a)) {
                        <span class="pending-badge">طلب معلق · Pending</span>
                      }
                    </div>
                    @if (a.nameAr && a.nameEn) { <p class="name-en">{{ a.nameEn }}</p> }
                    @if (a.supervisorName) {
                      <p class="supervisor-name"><i class="fas fa-user-shield"></i> {{ a.supervisorName }}</p>
                    }
                    @if (a.code) { <span class="code-badge">{{ a.code }}</span> }
                    <div class="stats">
                      <span><i class="fas fa-book-open"></i>{{ a.courseCount || 0 }} مقرر</span>
                      <span><i class="fas fa-users"></i>{{ a.memberCount || 0 }} عضو</span>
                    </div>
                  </div>
                  @if (isMember(a)) {
                    <i class="fas fa-chevron-left nav-arrow"></i>
                  }
                </div>

                <!-- Join / Pending strip -->
                @if (!isMember(a) && !isPending(a)) {
                  <div class="action-strip" (click)="$event.stopPropagation()">
                    <button class="action-btn join-btn"
                            [disabled]="joiningId() === a.id"
                            (click)="requestJoin(a)">
                      @if (joiningId() === a.id) { <span class="spinner-sm"></span> }
                      @else { <i class="fas fa-user-plus"></i> }
                      طلب الانضمام · Join
                    </button>
                  </div>
                }
                @if (isPending(a)) {
                  <div class="action-strip" (click)="$event.stopPropagation()">
                    <div class="action-btn pending-info">
                      <i class="fas fa-hourglass-half"></i>
                      تم إرسال الطلب · Request Sent
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      color:white; padding:calc(.75rem + env(safe-area-inset-top)) 1rem .75rem;
      display:flex; align-items:center; gap:.75rem;
      position:sticky; top:0; z-index:50;
    }
    .back-btn {
      width:40px; height:40px; border-radius:50%;
      background:rgba(255,255,255,.2); border:none; color:white;
      font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .header-info { flex:1; min-width:0; }
    .header-info h1 { font-size:1.1rem; font-weight:700; margin:0; }
    .add-btn {
      display:inline-flex; align-items:center; gap:.35rem;
      background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.35);
      color:white; border-radius:20px; padding:.45rem .9rem;
      font-size:.82rem; font-weight:600; cursor:pointer; min-height:40px;
    }

    /* Search */
    .search-area { padding:.75rem 1rem 0; }
    .search-box {
      display:flex; align-items:center; gap:.5rem;
      background:white; border-radius:14px;
      border:1.5px solid #e5e7eb; padding:0 .85rem;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
      transition:border-color .2s;
    }
    .search-box:focus-within { border-color:#667eea; }
    .search-icon { color:#9090aa; font-size:.85rem; flex-shrink:0; }
    .search-input {
      flex:1; border:none; outline:none; background:transparent;
      font-size:16px; padding:.7rem 0; font-family:inherit;
      color:#1a1a2e; min-width:0;
    }
    .search-input::placeholder { color:#b0b0c0; font-size:.82rem; }
    .search-clear {
      border:none; background:none; color:#9090aa; cursor:pointer;
      padding:4px; font-size:.8rem; display:flex; align-items:center;
      min-width:44px; min-height:44px; justify-content:center;
    }

    /* Tabs */
    .tabs {
      display:flex; gap:0; padding:.75rem 1rem 0;
    }
    .tab {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.65rem .5rem; border:none;
      background:white; color:#6c757d;
      font-size:.82rem; font-weight:600; cursor:pointer;
      border-bottom:2.5px solid transparent;
      border-radius:12px 12px 0 0;
      transition:all .15s; min-height:44px;
      -webkit-tap-highlight-color:transparent;
    }
    .tab i { font-size:.8rem; }
    .tab--active {
      color:#667eea;
      border-bottom-color:#667eea;
      background:white;
      box-shadow:0 -1px 4px rgba(0,0,0,.04);
    }
    .tab-count {
      background:rgba(102,126,234,.12); color:#667eea;
      font-size:.68rem; font-weight:700;
      padding:.1rem .4rem; border-radius:10px; min-width:18px; text-align:center;
    }

    /* Shimmer */
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:130px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty-state { text-align:center; padding:3rem 1.5rem; }
    .empty-icon { font-size:2.5rem; color:#c4c4d4; margin-bottom:.75rem; }
    .empty-state h4 { color:#343a40; margin:0 0 .25rem; font-size:1rem; }
    .empty-state p  { color:#6c757d; margin:0 0 .25rem; font-size:.85rem; }
    .empty-en { font-size:.78rem; color:#9090aa; margin-bottom:1rem !important; }
    .btn-create-lg {
      display:inline-flex; align-items:center; gap:.4rem;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; border:none; border-radius:24px;
      padding:.875rem 1.75rem; font-size:1rem; font-weight:600;
      cursor:pointer; min-height:52px; margin-top:.5rem;
    }

    /* Academy list */
    .academy-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .academy-card {
      background:white; border-radius:16px;
      border:1.5px solid #e9ecef;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
      overflow:hidden; position:relative;
    }
    .academy-card.inactive-card { opacity:.75; border-color:#fde8e8; }

    /* Main row */
    .card-main {
      display:flex; align-items:center; gap:.875rem;
      padding:1rem; cursor:pointer;
      border-bottom:1px solid #f4f5fb;
      -webkit-tap-highlight-color:transparent;
    }
    .card-main:active { background:#f9fafb; }
    .card-main--disabled { cursor:default; }
    .card-main--disabled:active { background:transparent; }

    .academy-avatar {
      width:48px; height:48px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:white; font-size:1.3rem;
    }
    .academy-avatar.avatar-inactive { background:linear-gradient(135deg,#9090a0,#7a7a8a); }

    .academy-info { flex:1; min-width:0; }
    .name-row { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; margin-bottom:.15rem; }
    .academy-info h4 { margin:0; font-size:.95rem; font-weight:600; color:#1a1a2e; }

    .supervisor-badge {
      font-size:.58rem; font-weight:700; padding:.1rem .4rem; border-radius:20px;
      background:linear-gradient(135deg,rgba(102,126,234,.15),rgba(118,75,162,.15));
      color:#764ba2; flex-shrink:0;
    }
    .member-badge {
      font-size:.58rem; font-weight:700; padding:.1rem .4rem; border-radius:20px;
      background:rgba(16,185,129,.12); color:#059669; flex-shrink:0;
    }
    .pending-badge {
      font-size:.58rem; font-weight:700; padding:.1rem .4rem; border-radius:20px;
      background:rgba(245,158,11,.12); color:#d97706; flex-shrink:0;
    }
    .inactive-badge {
      font-size:.58rem; font-weight:700; padding:.1rem .4rem; border-radius:20px;
      background:rgba(239,68,68,.1); color:#dc2626; flex-shrink:0;
    }
    .name-en { font-size:.75rem; color:#6c757d; margin:.1rem 0 .2rem; }
    .supervisor-name {
      font-size:.72rem; color:#764ba2; margin:.1rem 0 .2rem;
      display:flex; align-items:center; gap:.3rem;
    }
    .supervisor-name i { font-size:.65rem; }
    .code-badge {
      display:inline-block; background:rgba(102,126,234,.1); color:#667eea;
      font-size:.68rem; font-weight:600; padding:.1rem .4rem; border-radius:10px; margin-bottom:.25rem;
    }
    .stats { display:flex; gap:.75rem; font-size:.75rem; color:#6c757d; }
    .stats i { color:#764ba2; margin-left:.2rem; }
    .nav-arrow { color:#adb5bd; font-size:.85rem; flex-shrink:0; }

    /* Action strip */
    .action-strip { display:flex; border-top:1px solid #f4f5fb; }
    .action-btn {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.3rem;
      padding:.6rem .5rem; border:none; background:transparent;
      font-size:.75rem; font-weight:600; cursor:pointer; min-height:44px;
      border-left:1px solid #f4f5fb; transition:background .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .action-btn:first-child { border-left:none; }
    .action-btn:active { background:#f4f5fb; }
    .action-btn:disabled { opacity:.5; cursor:not-allowed; }
    .action-btn i { font-size:.85rem; }

    .edit-btn       { color:#667eea; }
    .deactivate-btn { color:#d97706; }
    .activate-btn   { color:#059669; }
    .manage-btn     { color:#764ba2; }
    .join-btn       { color:#10b981; }
    .pending-info   { color:#d97706; cursor:default; }

    .spinner-sm {
      width:13px; height:13px; border:2px solid currentColor;
      border-top-color:transparent; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class TeacherAcademiesComponent implements OnInit {
  private readonly router          = inject(Router);
  private readonly academyService  = inject(AcademyService);
  private readonly currentUserSvc  = inject(CurrentUserInfoService);

  loading    = signal(true);
  academies  = signal<AcademyDto[]>([]);
  togglingId = signal<string | null>(null);
  joiningId  = signal<string | null>(null);
  teacherId  = signal<string | null>(null);
  membershipMap = signal<Record<string, 'approved' | 'pending'>>({});
  activeTab  = signal<'mine' | 'browse'>('mine');
  searchText = signal('');

  // Computed: my academies (supervisor, approved member, or pending)
  myAcademies = computed(() =>
    this.academies().filter(a => this.isSupervisor(a) || this.isMember(a) || this.isPending(a))
  );

  // Computed: other academies (not supervisor, not member, not pending)
  otherAcademies = computed(() =>
    this.academies().filter(a => !this.isSupervisor(a) && !this.isMember(a) && !this.isPending(a))
  );

  // Filtered by search
  filteredMine = computed(() => this.applySearch(this.myAcademies()));
  filteredOthers = computed(() => this.applySearch(this.otherAcademies()));

  private applySearch(list: AcademyDto[]): AcademyDto[] {
    const q = this.searchText().trim().toLowerCase();
    if (!q) return list;
    return list.filter(a =>
      (a.nameAr || '').toLowerCase().includes(q) ||
      (a.nameEn || '').toLowerCase().includes(q) ||
      (a.code || '').toLowerCase().includes(q) ||
      (a.supervisorName || '').toLowerCase().includes(q)
    );
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.teacherId.set(userInfo?.actorId ?? null);

      const allAcademies = await lastValueFrom(
        this.academyService.getList({ skipHandleError: true })
      ).catch(() => [] as AcademyDto[]);
      this.academies.set(allAcademies || []);

      const tId = this.teacherId();
      if (tId && allAcademies?.length) {
        const map: Record<string, 'approved' | 'pending'> = {};
        for (const a of allAcademies) {
          if (a.supervisorTeacherId === tId) continue;
          try {
            const membership = await lastValueFrom(
              this.academyService.getMyMembership(a.id, { skipHandleError: true })
            );
            if (membership?.teacherId) {
              map[a.id!] = membership.status === 1 ? 'approved' : (membership.status === 0 ? 'pending' : 'approved');
            }
          } catch { /* not a member */ }
        }
        this.membershipMap.set(map);
      }

      // Auto-switch to browse if no "mine" academies
      if (this.myAcademies().length === 0 && this.otherAcademies().length > 0) {
        this.activeTab.set('browse');
      }
    } catch {
      this.academies.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  isSupervisor(a: AcademyDto): boolean {
    return !!this.teacherId() && a.supervisorTeacherId === this.teacherId();
  }

  isMember(a: AcademyDto): boolean {
    return this.membershipMap()[a.id!] === 'approved';
  }

  isPending(a: AcademyDto): boolean {
    return this.membershipMap()[a.id!] === 'pending';
  }

  async requestJoin(a: AcademyDto): Promise<void> {
    this.joiningId.set(a.id);
    try {
      await lastValueFrom(this.academyService.requestToJoin(a.id!));
      this.membershipMap.update(m => ({ ...m, [a.id!]: 'pending' }));
    } catch (err: any) {
      console.error('Error requesting to join:', err);
    } finally {
      this.joiningId.set(null);
    }
  }

  goToEdit(a: AcademyDto): void {
    this.router.navigate(['/academies', a.id, 'edit']);
  }

  async toggleActive(a: AcademyDto): Promise<void> {
    this.togglingId.set(a.id);
    try {
      await lastValueFrom(this.academyService.setActive(a.id!, !a.isActive));
      this.academies.update(list => list.map(x => x.id === a.id ? { ...x, isActive: !a.isActive } : x));
    } catch { /* silent */ }
    finally { this.togglingId.set(null); }
  }

  goToCourses(a: AcademyDto): void {
    this.router.navigate(['/teacher/academies', a.id, 'courses']);
  }

  goToManage(a: AcademyDto): void {
    this.router.navigate(['/academies', a.id, 'manage']);
  }

  goToCreate(): void {
    this.router.navigate(['/academies/create']);
  }

  goBack(): void {
    this.router.navigate(['/teacher']);
  }
}
