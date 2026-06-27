import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AdminUsersService } from '@proxy/admin-users';
import type { AdminUserDto } from '@proxy/admin-users/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page" dir="rtl">
      <!-- Header -->
      <div class="page-header" data-page-header>
        <button class="back-btn" (click)="goBack()" aria-label="رجوع"><i class="fas fa-arrow-right"></i></button>
        <div>
          <h1>المستخدمون</h1>
          <p class="sub">All Users · {{ totalCount() }}</p>
        </div>
      </div>

      <!-- Search + role filter -->
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" [(ngModel)]="search" (keyup.enter)="applySearch()"
                 placeholder="بحث بالاسم أو الكود أو اسم المستخدم..." />
          <button *ngIf="search" class="clear" (click)="search=''; applySearch()"><i class="fas fa-times"></i></button>
        </div>
        <div class="role-chips">
          <button *ngFor="let r of roleFilters" class="chip" [class.active]="role() === r.value"
                  (click)="setRole(r.value)">{{ r.label }}</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading"><div class="spinner"></div><p>جاري التحميل...</p></div>

      <!-- Empty -->
      <div *ngIf="!loading() && users().length === 0" class="empty">
        <i class="fas fa-users-slash"></i>
        <h3>لا يوجد مستخدمون</h3>
      </div>

      <!-- List -->
      <div class="list" *ngIf="!loading()">
        <div class="user-card" *ngFor="let u of users()">
          <div class="card-main" (click)="toggle(u.userId!)">
            <div class="avatar" [class]="actorClass(u.actorType)">{{ initials(u.name) }}</div>
            <div class="info">
              <div class="name-row">
                <span class="name">{{ u.name || u.userName }}</span>
                <span class="code" *ngIf="u.code">{{ u.code }}</span>
              </div>
              <div class="meta">
                <span class="username"><i class="fas fa-user"></i> {{ u.userName }}</span>
                <span class="role-badge" *ngFor="let r of u.roles">{{ r }}</span>
                <span class="grade" *ngIf="u.grade != null">صف {{ u.grade }}</span>
              </div>
            </div>
            <i class="fas chevron" [class.fa-chevron-up]="expanded() === u.userId" [class.fa-chevron-down]="expanded() !== u.userId"></i>
          </div>

          <!-- Expanded -->
          <div class="card-detail" *ngIf="expanded() === u.userId">
            <!-- Relationships -->
            <div class="rel-block" *ngIf="u.parents?.length">
              <span class="rel-title"><i class="fas fa-user-shield"></i> أولياء الأمور</span>
              <span class="rel-item" *ngFor="let p of u.parents">{{ p.name }} <em *ngIf="p.code">({{ p.code }})</em></span>
            </div>
            <div class="rel-block" *ngIf="u.children?.length">
              <span class="rel-title"><i class="fas fa-child"></i> الأبناء</span>
              <span class="rel-item" *ngFor="let c of u.children">{{ c.name }} <em *ngIf="c.code">({{ c.code }})</em></span>
            </div>
            <div class="rel-block" *ngIf="u.secretaries?.length">
              <span class="rel-title"><i class="fas fa-user-tie"></i> السكرتارية</span>
              <span class="rel-item" *ngFor="let s of u.secretaries">{{ s.name }} <em *ngIf="s.code">({{ s.code }})</em></span>
            </div>
            <div class="rel-block" *ngIf="u.teachersManaged?.length">
              <span class="rel-title"><i class="fas fa-chalkboard-teacher"></i> معلمون يديرهم</span>
              <span class="rel-item" *ngFor="let t of u.teachersManaged">{{ t.name }} <em *ngIf="t.code">({{ t.code }})</em></span>
            </div>
            <div class="rel-block" *ngIf="u.courses?.length">
              <span class="rel-title"><i class="fas fa-book"></i> المقررات</span>
              <span class="rel-item course" *ngFor="let c of u.courses">{{ c.courseName }} — <em>{{ c.teacherName }}</em></span>
            </div>
            <div class="rel-none" *ngIf="!u.parents?.length && !u.children?.length && !u.secretaries?.length && !u.teachersManaged?.length && !u.courses?.length">
              لا توجد علاقات أو مقررات
            </div>

            <!-- Set password -->
            <div class="pwd-row">
              <ng-container *ngIf="pwdFor() !== u.userId">
                <button class="pwd-btn" (click)="openPwd(u.userId!)"><i class="fas fa-key"></i> تعيين كلمة مرور</button>
              </ng-container>
              <ng-container *ngIf="pwdFor() === u.userId">
                <input class="pwd-input" type="text" [(ngModel)]="newPassword"
                       placeholder="كلمة مرور جديدة (6+ أحرف)" minlength="6" />
                <button class="pwd-save" (click)="savePwd(u)" [disabled]="newPassword.length < 6 || savingPwd()">
                  <span *ngIf="savingPwd()" class="spinner sm"></span>
                  <span *ngIf="!savingPwd()">حفظ</span>
                </button>
                <button class="pwd-cancel" (click)="closePwd()"><i class="fas fa-times"></i></button>
              </ng-container>
            </div>
          </div>
        </div>

        <button class="load-more" *ngIf="users().length < totalCount()" (click)="loadMore()" [disabled]="loadingMore()">
          <span *ngIf="loadingMore()" class="spinner sm"></span>
          <span *ngIf="!loadingMore()">عرض المزيد ({{ users().length }} / {{ totalCount() }})</span>
        </button>
      </div>

      <!-- Toast -->
      <div class="toast" *ngIf="toast()" [class.ok]="toastOk()" [class.err]="!toastOk()">
        <i [class]="toastOk() ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>{{ toast() }}
      </div>
    </div>
  `,
  styles: [`
    .users-page { min-height:100vh; background:#f5f7fa; padding-bottom:100px; }
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1rem) 1rem 1rem;
      display:flex; align-items:center; gap:1rem; color:#fff; position:sticky; top:0; z-index:100;
    }
    .back-btn { width:40px; height:40px; min-width:40px; background:rgba(255,255,255,.2); border:none; border-radius:12px; color:#fff; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .page-header h1 { margin:0; font-size:1.25rem; font-weight:800; }
    .page-header .sub { margin:.1rem 0 0; font-size:.75rem; opacity:.75; }

    .toolbar { background:#fff; padding:.85rem 1rem; box-shadow:0 2px 8px rgba(0,0,0,.05); position:sticky; top:calc(env(safe-area-inset-top,0px) + 4rem); z-index:50; }
    .search-box { display:flex; align-items:center; gap:.5rem; background:#f1f5f9; border-radius:12px; padding:0 .75rem; }
    .search-box i { color:#94a3b8; }
    .search-box input { flex:1; border:none; background:transparent; padding:.7rem 0; font-size:16px; outline:none; }
    .search-box .clear { background:none; border:none; color:#94a3b8; cursor:pointer; }
    .role-chips { display:flex; gap:.4rem; overflow-x:auto; margin-top:.6rem; padding-bottom:.2rem; }
    .chip { flex-shrink:0; min-height:34px; padding:0 .8rem; border:1.5px solid #e2e8f0; background:#fff; border-radius:999px; font-size:.8rem; font-weight:600; color:#475569; cursor:pointer; }
    .chip.active { background:#f0f4ff; border-color:#667eea; color:#667eea; }

    .loading, .empty { display:flex; flex-direction:column; align-items:center; padding:3rem 1rem; color:#6b7280; gap:.75rem; }
    .empty i { font-size:2.5rem; color:#cbd5e1; }
    .spinner { width:36px; height:36px; border:3px solid #e5e7eb; border-top-color:#764ba2; border-radius:50%; animation:spin .8s linear infinite; }
    .spinner.sm { width:16px; height:16px; border-width:2px; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .list { padding:1rem; display:flex; flex-direction:column; gap:.6rem; }
    .user-card { background:#fff; border-radius:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); overflow:hidden; }
    .card-main { display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; cursor:pointer; }
    .avatar { width:44px; height:44px; min-width:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:.9rem; background:#94a3b8; }
    .avatar.student { background:linear-gradient(135deg,#22c55e,#16a34a); }
    .avatar.teacher { background:linear-gradient(135deg,#3b82f6,#2563eb); }
    .avatar.parent  { background:linear-gradient(135deg,#f59e0b,#d97706); }
    .avatar.secretary { background:linear-gradient(135deg,#8b5cf6,#7c3aed); }
    .info { flex:1; min-width:0; }
    .name-row { display:flex; align-items:center; gap:.5rem; }
    .name { font-weight:700; color:#1a202c; font-size:.95rem; }
    .code { font-size:.72rem; color:#6b7280; font-family:monospace; }
    .meta { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.25rem; align-items:center; }
    .username { font-size:.74rem; color:#6b7280; }
    .username i { font-size:.65rem; }
    .role-badge { font-size:.64rem; font-weight:700; padding:.12rem .4rem; border-radius:6px; background:#eef2ff; color:#4338ca; }
    .grade { font-size:.7rem; color:#475569; }
    .chevron { color:#cbd5e1; }

    .card-detail { border-top:1px solid #f1f5f9; padding:.85rem 1rem; display:flex; flex-direction:column; gap:.6rem; background:#fafbff; }
    .rel-block { display:flex; flex-direction:column; gap:.25rem; }
    .rel-title { font-size:.72rem; font-weight:700; color:#667eea; display:flex; align-items:center; gap:.35rem; }
    .rel-item { font-size:.82rem; color:#334155; padding-inline-start:1.2rem; }
    .rel-item em { color:#6b7280; font-style:normal; }
    .rel-item.course { font-weight:600; }
    .rel-none { font-size:.8rem; color:#9ca3af; }

    .pwd-row { display:flex; align-items:center; gap:.5rem; margin-top:.4rem; flex-wrap:wrap; }
    .pwd-btn { display:inline-flex; align-items:center; gap:.4rem; min-height:40px; padding:0 .9rem; background:#fff7ed; border:1.5px solid #fed7aa; color:#c2410c; border-radius:10px; font-size:.82rem; font-weight:600; cursor:pointer; }
    .pwd-input { flex:1; min-width:140px; min-height:40px; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 .75rem; font-size:16px; }
    .pwd-save { min-height:40px; padding:0 1rem; background:#10b981; border:none; color:#fff; border-radius:10px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:.4rem; }
    .pwd-save:disabled { opacity:.6; }
    .pwd-cancel { min-height:40px; min-width:40px; background:#f1f5f9; border:none; color:#6b7280; border-radius:10px; cursor:pointer; }

    .load-more { margin-top:.5rem; min-height:46px; background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; color:#475569; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; }

    .toast { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:.5rem; padding:.8rem 1.1rem; border-radius:12px; color:#fff; font-size:.88rem; font-weight:600; box-shadow:0 4px 16px rgba(0,0,0,.18); z-index:1000; }
    .toast.ok { background:#10b981; } .toast.err { background:#ef4444; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(AdminUsersService);

  private readonly pageSize = 50;

  users = signal<AdminUserDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  loadingMore = signal(false);
  expanded = signal<string | null>(null);
  pwdFor = signal<string | null>(null);
  savingPwd = signal(false);
  toast = signal('');
  toastOk = signal(true);

  search = '';
  newPassword = '';
  role = signal<string>('');

  roleFilters = [
    { value: '', label: 'الكل' },
    { value: 'STUDENT', label: 'طلاب' },
    { value: 'TEACHER', label: 'معلمون' },
    { value: 'PARENT', label: 'أولياء أمور' },
    { value: 'SECRETARY', label: 'سكرتارية' },
    { value: 'ADMIN', label: 'مشرفون' },
  ];

  async ngOnInit(): Promise<void> {
    await this.load(true);
  }

  private async load(reset: boolean): Promise<void> {
    if (reset) { this.loading.set(true); } else { this.loadingMore.set(true); }
    try {
      const skip = reset ? 0 : this.users().length;
      const res = await lastValueFrom(this.api.getUsers({
        filter: this.search.trim() || undefined,
        role: this.role() || undefined,
        skipCount: skip,
        maxResultCount: this.pageSize,
      } as any));
      this.totalCount.set(res?.totalCount ?? 0);
      const items = res?.items ?? [];
      this.users.set(reset ? items : [...this.users(), ...items]);
    } catch {
      this.showToast('تعذّر تحميل المستخدمين', false);
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  applySearch(): void { this.expanded.set(null); void this.load(true); }
  setRole(r: string): void { this.role.set(r); this.expanded.set(null); void this.load(true); }
  loadMore(): void { void this.load(false); }

  toggle(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
    this.closePwd();
  }

  openPwd(id: string): void { this.pwdFor.set(id); this.newPassword = ''; }
  closePwd(): void { this.pwdFor.set(null); this.newPassword = ''; }

  async savePwd(u: AdminUserDto): Promise<void> {
    if (this.newPassword.length < 6) return;
    this.savingPwd.set(true);
    try {
      await lastValueFrom(this.api.setPassword(u.userId!, { newPassword: this.newPassword }));
      this.showToast(`تم تعيين كلمة مرور ${u.name || u.userName}`, true);
      this.closePwd();
    } catch (e: any) {
      this.showToast(e?.error?.error?.message || 'تعذّر تعيين كلمة المرور', false);
    } finally {
      this.savingPwd.set(false);
    }
  }

  actorClass(t?: string | null): string { return (t || '').toLowerCase(); }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]);
    return parts[0]?.[0] || '?';
  }

  private showToast(msg: string, ok: boolean): void {
    this.toast.set(msg); this.toastOk.set(ok);
    setTimeout(() => this.toast.set(''), 3000);
  }

  goBack(): void { this.router.navigate(['/']); }
}
