import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { AcademyDto, AcademyMemberDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

interface EditForm {
  nameAr: string;
  nameEn: string;
  description: string;
}

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

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && academies().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-university"></i></div>
          <h4>لا توجد أكاديميات</h4>
          <p>لم تنشئ أي أكاديمية بعد</p>
          <button class="btn-create-lg" (click)="goToCreate()">
            <i class="fas fa-plus"></i> إنشاء أكاديمية
          </button>
        </div>
      }

      <!-- Academies list -->
      @if (!loading() && academies().length > 0) {
        <div class="academy-list">
          @for (a of academies(); track a.id) {
            <div class="academy-card" [class.inactive-card]="!a.isActive">

              <!-- Edit overlay -->
              @if (editingId() === a.id) {
                <div class="edit-overlay" (click)="$event.stopPropagation()">
                  <div class="edit-form">
                    <h5>تعديل الأكاديمية · Edit Academy</h5>
                    <label>الاسم بالعربية</label>
                    <input [(ngModel)]="editForm.nameAr" placeholder="الاسم بالعربية" />
                    <label>الاسم بالإنجليزية</label>
                    <input [(ngModel)]="editForm.nameEn" placeholder="English Name" />
                    <label>الوصف (اختياري)</label>
                    <textarea [(ngModel)]="editForm.description" rows="2" placeholder="وصف قصير..."></textarea>
                    @if (editError()) {
                      <p class="edit-error">{{ editError() }}</p>
                    }
                    <div class="edit-actions">
                      <button class="btn-save" [disabled]="saving()" (click)="saveEdit(a)">
                        @if (saving()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-check"></i> }
                        حفظ
                      </button>
                      <button class="btn-cancel" (click)="cancelEdit()">إلغاء</button>
                    </div>
                  </div>
                </div>
              }

              <!-- Main row -->
              <div class="card-main" (click)="goToCourses(a)">
                <div class="academy-avatar" [class.avatar-inactive]="!a.isActive">
                  <i class="fas fa-university"></i>
                </div>
                <div class="academy-info">
                  <div class="name-row">
                    <h4>{{ a.nameAr || a.nameEn }}</h4>
                    @if (isSupervisor(a)) {
                      <span class="supervisor-badge">مشرف · Supervisor</span>
                    } @else if (isMember(a)) {
                      <span class="member-badge">عضو · Member</span>
                    } @else if (isPending(a)) {
                      <span class="pending-badge">طلب معلق · Pending</span>
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

              <!-- Action strip: supervisor actions -->
              @if (isSupervisor(a)) {
                <div class="action-strip" (click)="$event.stopPropagation()">
                  <button class="action-btn edit-btn" (click)="startEdit(a)">
                    <i class="fas fa-pen"></i> تعديل · Edit
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
                  <button class="action-btn manage-btn" (click)="goToManage(a)">
                    <i class="fas fa-cog"></i> إدارة · Manage
                  </button>
                </div>
              }

              <!-- Action strip: not a member yet — show Join button -->
              @if (!isSupervisor(a) && !isMember(a) && !isPending(a)) {
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

              <!-- Action strip: pending request -->
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

    /* Shimmer */
    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:130px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty-state { text-align:center; padding:4rem 1.5rem; }
    .empty-icon { font-size:3rem; color:#c4c4d4; margin-bottom:1rem; }
    .empty-state h4 { color:#343a40; margin:0 0 .25rem; }
    .empty-state p  { color:#6c757d; margin:0 0 1.25rem; font-size:.9rem; }
    .btn-create-lg {
      display:inline-flex; align-items:center; gap:.4rem;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:white; border:none; border-radius:24px;
      padding:.875rem 1.75rem; font-size:1rem; font-weight:600;
      cursor:pointer; min-height:52px;
    }

    /* Academy list */
    .academy-list { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }

    .academy-card {
      background:white; border-radius:16px;
      border:1.5px solid #e9ecef;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
      overflow:hidden; position:relative;
    }
    .academy-card.inactive-card { opacity:.75; border-color:#fde8e8; }

    /* Edit overlay */
    .edit-overlay {
      position:absolute; inset:0; z-index:20;
      background:rgba(255,255,255,.97);
      border-radius:16px; padding:1rem;
    }
    .edit-form h5 { margin:0 0 .75rem; font-size:.9rem; font-weight:700; color:#1a1a2e; }
    .edit-form label { display:block; font-size:.72rem; font-weight:600; color:#667eea; margin:.5rem 0 .2rem; }
    .edit-form input, .edit-form textarea {
      width:100%; padding:.55rem .75rem; border:1.5px solid #e0e0f0;
      border-radius:10px; font-size:.88rem; box-sizing:border-box;
      font-family:inherit; transition:border-color .15s;
    }
    .edit-form input:focus, .edit-form textarea:focus { outline:none; border-color:#667eea; }
    .edit-form textarea { resize:none; }
    .edit-error { color:#dc2626; font-size:.78rem; margin:.4rem 0 0; }
    .edit-actions { display:flex; gap:.5rem; margin-top:.75rem; }
    .btn-save {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.35rem;
      padding:.65rem; border:none; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:white;
      font-size:.85rem; font-weight:700; cursor:pointer; min-height:44px;
    }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }
    .btn-cancel {
      padding:.65rem 1rem; border:1.5px solid #e0e0f0; border-radius:10px;
      background:white; color:#555; font-size:.85rem; cursor:pointer; min-height:44px;
    }

    /* Main row */
    .card-main {
      display:flex; align-items:center; gap:.875rem;
      padding:1rem; cursor:pointer;
      border-bottom:1px solid #f4f5fb;
      -webkit-tap-highlight-color:transparent;
    }
    .card-main:active { background:#f9fafb; }

    .academy-avatar {
      width:52px; height:52px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center;
      color:white; font-size:1.4rem;
    }
    .academy-avatar.avatar-inactive { background:linear-gradient(135deg,#9090a0,#7a7a8a); }

    .academy-info { flex:1; min-width:0; }
    .name-row { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; margin-bottom:.15rem; }
    .academy-info h4 { margin:0; font-size:1rem; font-weight:600; color:#1a1a2e; }

    .supervisor-badge {
      font-size:.6rem; font-weight:700; padding:.12rem .45rem; border-radius:20px;
      background:linear-gradient(135deg,rgba(102,126,234,.15),rgba(118,75,162,.15));
      color:#764ba2; flex-shrink:0;
    }
    .member-badge {
      font-size:.6rem; font-weight:700; padding:.12rem .45rem; border-radius:20px;
      background:rgba(16,185,129,.12); color:#059669; flex-shrink:0;
    }
    .pending-badge {
      font-size:.6rem; font-weight:700; padding:.12rem .45rem; border-radius:20px;
      background:rgba(245,158,11,.12); color:#d97706; flex-shrink:0;
    }
    .active-badge {
      font-size:.62rem; font-weight:700; padding:.1rem .45rem; border-radius:20px;
      background:rgba(16,185,129,.12); color:#059669; flex-shrink:0;
    }
    .inactive-badge {
      font-size:.62rem; font-weight:700; padding:.1rem .45rem; border-radius:20px;
      background:rgba(239,68,68,.1); color:#dc2626; flex-shrink:0;
    }
    .name-en { font-size:.78rem; color:#6c757d; margin:.1rem 0 .2rem; }
    .supervisor-name {
      font-size:.72rem; color:#764ba2; margin:.1rem 0 .2rem;
      display:flex; align-items:center; gap:.3rem;
    }
    .supervisor-name i { font-size:.65rem; }
    .code-badge {
      display:inline-block; background:rgba(102,126,234,.1); color:#667eea;
      font-size:.7rem; font-weight:600; padding:.1rem .45rem; border-radius:10px; margin-bottom:.3rem;
    }
    .stats { display:flex; gap:.75rem; font-size:.78rem; color:#6c757d; }
    .stats i { color:#764ba2; margin-left:.25rem; }
    .nav-arrow { color:#adb5bd; font-size:.85rem; flex-shrink:0; }

    /* Action strip */
    .action-strip {
      display:flex; border-top:1px solid #f4f5fb;
    }
    .action-btn {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.3rem;
      padding:.65rem .5rem; border:none; background:transparent;
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
  editingId  = signal<string | null>(null);
  saving     = signal(false);
  editError  = signal<string | null>(null);
  togglingId = signal<string | null>(null);
  joiningId  = signal<string | null>(null);
  teacherId  = signal<string | null>(null);
  membershipMap = signal<Record<string, 'approved' | 'pending'>>({});

  editForm: EditForm = { nameAr: '', nameEn: '', description: '' };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Get current teacher's actorId
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.teacherId.set(userInfo?.actorId ?? null);

      // Load all academies
      const allAcademies = await lastValueFrom(
        this.academyService.getList({ skipHandleError: true })
      ).catch(() => [] as AcademyDto[]);
      this.academies.set(allAcademies || []);

      // For non-supervised academies, check membership status
      const tId = this.teacherId();
      if (tId && allAcademies?.length) {
        const map: Record<string, 'approved' | 'pending'> = {};
        for (const a of allAcademies) {
          if (a.supervisorTeacherId === tId) continue; // supervisor, no need to check
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

  startEdit(a: AcademyDto): void {
    this.editForm = { nameAr: a.nameAr, nameEn: a.nameEn, description: a.description ?? '' };
    this.editError.set(null);
    this.editingId.set(a.id);
  }

  cancelEdit(): void { this.editingId.set(null); }

  async saveEdit(a: AcademyDto): Promise<void> {
    if (!this.editForm.nameAr.trim() || !this.editForm.nameEn.trim()) {
      this.editError.set('الاسم العربي والإنجليزي مطلوبان');
      return;
    }
    this.saving.set(true);
    this.editError.set(null);
    try {
      const updated = await lastValueFrom(
        this.academyService.update(a.id!, {
          nameAr: this.editForm.nameAr,
          nameEn: this.editForm.nameEn,
          description: this.editForm.description || undefined,
        } as any)
      );
      this.academies.update(list => list.map(x => x.id === a.id ? { ...x, ...updated } : x));
      this.editingId.set(null);
    } catch (err: any) {
      this.editError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      this.saving.set(false);
    }
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
