import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { ParentService } from '@proxy/parents';
import { ParentStudentDto, ParentDto } from '@proxy/parents/models';
import { ParentStudentLinkStatus } from '@proxy/enums/parent-student-link-status.enum';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-parent-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'ملفي الشخصي'" [titleEn]="'My Profile'" [backTo]="'/parent'">
        <button ph-actions class="ph-action" (click)="logout()" aria-label="تسجيل الخروج">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </app-page-header>

      <!-- Identity card -->
      <div class="section">
        <div class="id-card">
          <div class="id-avatar">
            @if (parent()?.photoUrl) { <img [src]="parent()!.photoUrl" alt="" /> }
            @else { <span>{{ initials() }}</span> }
            <button class="avatar-edit" (click)="toggleProfileEdit()" aria-label="تعديل الصورة">
              <i class="fas fa-camera"></i>
            </button>
          </div>
          <div class="id-info">
            <h1 class="id-name">{{ userInfo()?.actorName || 'ولي الأمر' }}</h1>
            <div class="id-role"><i class="fas fa-user-shield"></i> ولي أمر · Parent</div>
            <div class="id-chips">
              @if (userInfo()?.actorCode) {
                <span class="id-chip id-chip--code">{{ userInfo()?.actorCode }}</span>
              }
              @if (userInfo()?.email) {
                <span class="id-chip id-chip--email">{{ userInfo()?.email }}</span>
              }
              @if (userInfo()?.userName) {
                <span class="id-chip id-chip--email">&#64;{{ userInfo()?.userName }}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      @if (!loading()) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="stat-value">{{ children().length }}</div>
            <div class="stat-label">أبناء مرتبطون</div>
            <div class="stat-label-en">Linked Children</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#d97706">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-value">{{ pendingChildren() }}</div>
            <div class="stat-label">بانتظار التأكيد</div>
            <div class="stat-label-en">Pending</div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="shimmer-area">
          <div class="shimmer-stats">
            @for (i of [1,2]; track i) { <div class="shimmer-stat"></div> }
          </div>
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {

        <!-- Photo editor -->
        @if (editingProfile()) {
          <div class="section">
            <div class="section-title">
              <i class="fas fa-id-badge"></i> صورتي · My Photo
              <button class="edit-prof-btn" (click)="toggleProfileEdit()">
                <i class="fas fa-times"></i> إلغاء · Cancel
              </button>
            </div>
            <div class="prof-edit-card">
              <div class="photo-row">
                <div class="photo-preview">
                  @if (editPhoto()) { <img [src]="editPhoto()" alt="" /> }
                  @else { <i class="fas fa-user"></i> }
                </div>
                <label class="photo-btn">
                  @if (photoProcessing()) { <span class="spinner-xs"></span> }
                  @else { <i class="fas fa-image"></i> }
                  {{ editPhoto() ? 'تغيير · Change' : 'إضافة صورة · Add' }}
                  <input type="file" accept="image/*" hidden (change)="onPhotoSelected($event)" />
                </label>
                @if (editPhoto()) {
                  <button type="button" class="photo-remove" (click)="editPhoto.set('')">
                    <i class="fas fa-trash"></i> إزالة
                  </button>
                }
              </div>
              @if (profileSaveError()) { <p class="prof-error">{{ profileSaveError() }}</p> }
              <button class="prof-save-btn" [disabled]="profileSaving()" (click)="saveProfile()">
                @if (profileSaving()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-check-circle"></i> }
                حفظ · Save
              </button>
            </div>
          </div>
        }

        <!-- Quick actions -->
        <div class="section">
          <div class="section-title"><i class="fas fa-bolt"></i> إجراءات سريعة · Quick Actions</div>
          <div class="actions-grid">
            <a class="action-btn" routerLink="/parent/link-child">
              <div class="action-icon" style="background:rgba(102,126,234,.12);color:#667eea"><i class="fas fa-user-plus"></i></div>
              <span class="al">ربط طالب</span><span class="ae">Link Child</span>
            </a>
            <a class="action-btn" routerLink="/parent/requests">
              <div class="action-icon" style="background:rgba(16,185,129,.12);color:#059669"><i class="fas fa-clipboard-check"></i></div>
              <span class="al">طلبات التسجيل</span><span class="ae">Enrollment</span>
            </a>
            <a class="action-btn" routerLink="/parent/requests">
              <div class="action-icon" style="background:rgba(245,158,11,.12);color:#d97706"><i class="fas fa-link"></i></div>
              <span class="al">طلبات الربط</span><span class="ae">Link Requests</span>
            </a>
            <a class="action-btn" routerLink="/feeds">
              <div class="action-icon" style="background:rgba(118,75,162,.12);color:#764ba2"><i class="fas fa-rss"></i></div>
              <span class="al">النشرات</span><span class="ae">Feeds</span>
            </a>
          </div>
        </div>

        <!-- Children list -->
        <div class="section">
          <div class="section-title">
            <i class="fas fa-user-graduate"></i> أبنائي · My Children
            @if (children().length > 0) { <span class="count-pill">{{ children().length }}</span> }
          </div>
          @if (children().length === 0) {
            <div class="empty-box">
              <i class="fas fa-child"></i>
              <p>لا يوجد أبناء مرتبطون</p>
              <span>No linked children yet</span>
            </div>
          }
          @if (children().length > 0) {
            <div class="list">
              @for (c of children(); track c.studentId) {
                <div class="list-row">
                  <div class="list-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2)">
                    <i class="fas fa-user-graduate"></i>
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ c.studentName || 'طالب' }}</span>
                    <span class="list-sub">
                      {{ c.studentCode }}
                      @if (c.gradeName) { · {{ c.gradeName }} }
                    </span>
                  </div>
                  <span class="status-chip" [class]="linkStatusClass(c.linkStatus)">
                    {{ linkStatusLabel(c.linkStatus) }}
                  </span>
                </div>
              }
            </div>
          }
        </div>


      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    /* Identity card */
    .id-card {
      display:flex; align-items:center; gap:1rem;
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1rem; box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .id-avatar {
      position:relative; flex-shrink:0;
      width:72px; height:72px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; font-weight:800; color:#fff; overflow:visible;
    }
    .id-avatar img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
    .id-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:.3rem; }
    .id-name { margin:0; font-size:1.15rem; font-weight:800; color:#1a1a2e; }
    .id-role {
      display:inline-flex; align-items:center; gap:.3rem; align-self:flex-start;
      background:rgba(102,126,234,.1); color:#667eea;
      padding:.2rem .6rem; border-radius:12px; font-size:.72rem; font-weight:700;
    }
    .id-chips { display:flex; flex-wrap:wrap; gap:.35rem; margin-top:.1rem; }
    .id-chip {
      font-size:.72rem; font-weight:600; color:#555;
      background:#f4f5fb; border:1px solid #e8e8f0;
      padding:.15rem .55rem; border-radius:10px;
    }
    .id-chip--code { color:#667eea; background:rgba(102,126,234,.08); border-color:rgba(102,126,234,.18); }
    .id-chip--email { color:#9090aa; font-weight:500; }

    .avatar-edit {
      position:absolute; bottom:-2px; left:-2px;
      width:26px; height:26px; border-radius:50%;
      background:#fff; color:#667eea; border:2px solid #764ba2;
      display:flex; align-items:center; justify-content:center;
      font-size:.65rem; cursor:pointer; padding:0;
      -webkit-tap-highlight-color:transparent;
    }
    .avatar-edit:active { transform:scale(.92); }
    .edit-prof-btn {
      margin-right:auto; background:rgba(102,126,234,.08); border:1.5px solid rgba(102,126,234,.2);
      color:#667eea; border-radius:20px; padding:.3rem .75rem;
      font-size:.72rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:.3rem;
    }
    .prof-edit-card {
      background:#fff; border-radius:16px; border:1.5px solid #e0e0f0;
      padding:1.125rem; display:flex; flex-direction:column; gap:.75rem;
      box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .photo-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .photo-preview {
      width:64px; height:64px; border-radius:50%; flex-shrink:0; overflow:hidden;
      background:#f0f0f5; border:1.5px solid #e0e0f0;
      display:flex; align-items:center; justify-content:center; color:#9090aa; font-size:1.3rem;
    }
    .photo-preview img { width:100%; height:100%; object-fit:cover; }
    .photo-btn {
      display:inline-flex; align-items:center; gap:.4rem; cursor:pointer;
      background:rgba(102,126,234,.1); border:1.5px solid rgba(102,126,234,.25);
      color:#667eea; border-radius:12px; padding:.5rem .85rem;
      font-size:.8rem; font-weight:700; min-height:44px;
    }
    .photo-remove {
      display:inline-flex; align-items:center; gap:.35rem; cursor:pointer;
      background:rgba(239,68,68,.08); border:1.5px solid rgba(239,68,68,.2);
      color:#dc2626; border-radius:12px; padding:.5rem .75rem;
      font-size:.78rem; font-weight:700; min-height:44px;
    }
    .prof-error { color:#dc2626; font-size:.75rem; margin:0; }
    .prof-save-btn {
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      padding:.75rem; border:none; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:white;
      font-size:.88rem; font-weight:700; cursor:pointer; min-height:48px;
      box-shadow:0 4px 14px rgba(102,126,234,.3);
    }
    .prof-save-btn:active { transform:scale(.97); }
    .prof-save-btn:disabled { opacity:.6; cursor:not-allowed; }
    .spinner-xs {
      width:14px; height:14px; border:2px solid currentColor;
      border-top-color:transparent; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    .stats-row { display:flex; gap:.75rem; padding:1rem 1rem 0; }
    .stat-card {
      flex:1; background:#fff; border-radius:16px; padding:1rem .75rem;
      text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06);
      display:flex; flex-direction:column; align-items:center; gap:.35rem;
    }
    .stat-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1rem; }
    .stat-value { font-size:1.5rem; font-weight:800; color:#1a1a2e; line-height:1; }
    .stat-label { font-size:.72rem; font-weight:600; color:#555; }
    .stat-label-en { font-size:.62rem; color:#9090aa; }
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-stats { display:flex; gap:.75rem; }
    .shimmer-stat {
      flex:1; height:96px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    .shimmer-card {
      height:72px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }
    .count-pill { background:rgba(102,126,234,.12); color:#667eea; font-size:.72rem; font-weight:700; padding:.15rem .5rem; border-radius:20px; }
    .actions-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.625rem; }
    .action-btn {
      display:flex; flex-direction:column; align-items:center; gap:.4rem;
      padding:.875rem .5rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f0; text-decoration:none; color:#374151;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .action-btn:active { transform:scale(.95); }
    .action-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1rem; }
    .al { font-size:.68rem; font-weight:700; text-align:center; color:#1a1a2e; }
    .ae { font-size:.58rem; color:#9090aa; text-align:center; }
    .list { display:flex; flex-direction:column; gap:.5rem; }
    .list-row {
      display:flex; align-items:center; gap:.875rem; background:#fff;
      border-radius:14px; border:1.5px solid #f0f0f0; padding:.875rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .list-avatar { width:44px; height:44px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1rem; }
    .list-info { flex:1; min-width:0; }
    .list-name { display:block; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .list-sub { display:block; font-size:.75rem; color:#9090aa; margin-top:.1rem; }
    .status-chip { font-size:.68rem; font-weight:700; padding:.15rem .5rem; border-radius:10px; flex-shrink:0; }
    .chip-confirmed { background:rgba(16,185,129,.1); color:#059669; }
    .chip-pending   { background:rgba(245,158,11,.1);  color:#d97706; }
    .chip-rejected  { background:rgba(239,68,68,.1);   color:#dc2626; }
    .empty-box {
      text-align:center; padding:2rem 1rem; background:#fff;
      border-radius:16px; border:1.5px solid #f0f0f0;
    }
    .empty-box i { font-size:2rem; color:#c4c4d4; display:block; margin-bottom:.5rem; }
    .empty-box p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-box span { font-size:.75rem; color:#9090aa; }

  `],
})
export class ParentProfileComponent implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly parentSvc      = inject(ParentService);
  loading  = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);
  children = signal<ParentStudentDto[]>([]);
  parent   = signal<ParentDto | null>(null);

  // Photo editing
  editingProfile = signal(false);
  editPhoto = signal('');
  photoProcessing = signal(false);
  profileSaving = signal(false);
  profileSaveError = signal<string | null>(null);

  pendingChildren = () => this.children().filter(
    c => c.linkStatus === ParentStudentLinkStatus.Pending
  ).length;

  initials(): string {
    const name = this.userInfo()?.actorName || '?';
    return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.userInfo.set(info);
      if (info?.actorId) {
        const children = await lastValueFrom(
          this.parentSvc.getLinkedStudentsByParentId(info.actorId)
        );
        this.children.set(children ?? []);
      }
      if (info?.userId) {
        try {
          const parent = await lastValueFrom(this.parentSvc.getByUserId(info.userId));
          this.parent.set(parent);
        } catch { /* ignore */ }
      }
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  linkStatusClass(status?: ParentStudentLinkStatus): string {
    if (status === ParentStudentLinkStatus.Confirmed) return 'status-chip chip-confirmed';
    if (status === ParentStudentLinkStatus.Rejected)  return 'status-chip chip-rejected';
    return 'status-chip chip-pending';
  }

  linkStatusLabel(status?: ParentStudentLinkStatus): string {
    if (status === ParentStudentLinkStatus.Confirmed) return 'مؤكد';
    if (status === ParentStudentLinkStatus.Rejected)  return 'مرفوض';
    return 'بانتظار التأكيد';
  }

  toggleProfileEdit(): void {
    if (!this.editingProfile()) {
      this.editPhoto.set(this.parent()?.photoUrl || '');
      this.profileSaveError.set(null);
    }
    this.editingProfile.set(!this.editingProfile());
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.photoProcessing.set(true);
    try {
      this.editPhoto.set(await this.resizeImageToDataUrl(file, 320, 0.8));
    } catch { this.profileSaveError.set('تعذّر معالجة الصورة · Could not process image'); }
    finally { this.photoProcessing.set(false); input.value = ''; }
  }

  private resizeImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('image load failed'));
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
          else if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('no canvas ctx')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async saveProfile(): Promise<void> {
    this.profileSaving.set(true);
    this.profileSaveError.set(null);
    try {
      const updated = await lastValueFrom(this.parentSvc.updateMyProfile({
        photoUrl: this.editPhoto() || undefined,
      }));
      if (updated) this.parent.set(updated);
      this.editingProfile.set(false);
    } catch (err: any) {
      this.profileSaveError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ · Error saving');
    } finally {
      this.profileSaving.set(false);
    }
  }

  logout(): void { this.authService.logout(); }
}
