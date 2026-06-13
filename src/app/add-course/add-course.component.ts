import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import { CreateUpdateCourseDto } from '@proxy/courses/dtos/models';
import { GradeService } from '@proxy/grades';
import { GradeDto } from '@proxy/grades/dtos/models';
import { AcademyService } from '@proxy/academies';
import { AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-add-course',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-content">
          <div class="header-text">
            @if (academy()) {
              <div class="academy-badge">
                <i class="fas fa-university"></i>
                {{ academy()!.nameAr || academy()!.nameEn }}
              </div>
            }
            <h1>إضافة مقرر</h1>
            <p>{{ academy() ? 'إضافة مقرر جديد للأكاديمية' : 'إنشاء مقرر دراسي جديد' }}</p>
            <p class="sub-en">{{ academy() ? 'Add a new course to the academy' : 'Create a new course' }}</p>
          </div>
          <div class="header-icon">
            <i class="fas fa-book-open"></i>
          </div>
        </div>
      </div>

      <!-- ── Loading / checking access ── -->
      @if (checkingAccess()) {
        <div class="checking-state">
          <div class="spinner-lg"></div>
          <p>جاري التحقق من الصلاحيات…</p>
        </div>
      }

      <!-- ── Access denied ── -->
      @if (!checkingAccess() && accessDenied()) {
        <div class="denied-state">
          <div class="denied-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3>غير مصرح لك</h3>
          <p>فقط المشرف على الأكاديمية يمكنه إضافة مقررات لها</p>
          <span>Only the academy supervisor can add courses</span>
          <button class="back-btn-large" (click)="cancel()">
            <i class="fas fa-arrow-right"></i>
            العودة
          </button>
        </div>
      }

      <!-- ── Form ── -->
      @if (!checkingAccess() && !accessDenied()) {
        <div class="form-wrap">

          <!-- Success banner -->
          @if (successMsg()) {
            <div class="banner banner-success">
              <i class="fas fa-check-circle"></i>
              <span>{{ successMsg() }}</span>
            </div>
          }

          <!-- Error banner -->
          @if (errorMsg()) {
            <div class="banner banner-error">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <form #f="ngForm" (ngSubmit)="submit(f)">

            <!-- Arabic name -->
            <div class="field">
              <label class="field-label">
                <i class="fas fa-font"></i>
                اسم المقرر بالعربية <span class="req">*</span>
              </label>
              <input class="field-input" dir="rtl"
                     type="text" name="nameAr"
                     placeholder="مثال: رياضيات — الصف الأول"
                     [ngModel]="model().nameAr"
                     (ngModelChange)="setField('nameAr', $event)"
                     #nameAr="ngModel" required />
              @if (nameAr.invalid && (nameAr.dirty || nameAr.touched)) {
                <span class="field-error">الاسم العربي مطلوب</span>
              }
            </div>

            <!-- English name -->
            <div class="field">
              <label class="field-label">
                <i class="fas fa-font"></i>
                Course Name (English) <span class="req">*</span>
              </label>
              <input class="field-input" dir="ltr"
                     type="text" name="nameEn"
                     placeholder="e.g. Mathematics — Grade 1"
                     [ngModel]="model().nameEn"
                     (ngModelChange)="setField('nameEn', $event)"
                     #nameEn="ngModel" required />
              @if (nameEn.invalid && (nameEn.dirty || nameEn.touched)) {
                <span class="field-error">English name is required</span>
              }
            </div>

            <!-- Grade (optional) -->
            <div class="field">
              <label class="field-label">
                <i class="fas fa-graduation-cap"></i>
                الصف الدراسي · Grade
                <span class="opt-label">(اختياري · optional)</span>
              </label>
              @if (loadingGrades()) {
                <div class="select-shimmer"></div>
              } @else {
                <select class="field-input field-select" name="gradeId"
                        [ngModel]="model().gradeId"
                        (ngModelChange)="setField('gradeId', $event || null)">
                  <option value="">— بدون صف محدد —</option>
                  @for (g of grades(); track g.id) {
                    <option [value]="g.id">{{ g.name }}</option>
                  }
                </select>
              }
            </div>

            <!-- Academy info note -->
            @if (academy()) {
              <div class="academy-note">
                <i class="fas fa-info-circle"></i>
                <span>سيتم إضافة هذا المقرر تلقائياً إلى أكاديمية
                  <strong>{{ academy()!.nameAr || academy()!.nameEn }}</strong>
                </span>
              </div>
            }

            <!-- Actions -->
            <div class="actions">
              <button class="submit-btn" type="submit"
                      [disabled]="saving() || f.invalid || loadingGrades()">
                @if (saving()) { <span class="spinner"></span> }
                @else { <i class="fas fa-plus-circle"></i> }
                {{ saving() ? 'جاري الحفظ…' : 'إضافة المقرر' }}
              </button>
              <button class="cancel-btn" type="button" (click)="cancel()">
                <i class="fas fa-times"></i>
                إلغاء
              </button>
            </div>

          </form>
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
      padding:calc(env(safe-area-inset-top,0px) + 1.1rem) 1.25rem 1.75rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:130px; height:130px; bottom:-50px; left:-25px; }
    .header-content {
      position:relative; z-index:1;
      display:flex; align-items:flex-start; justify-content:space-between; gap:1rem;
    }
    .header-text { flex:1; }
    .academy-badge {
      display:inline-flex; align-items:center; gap:.4rem;
      background:rgba(255,255,255,.18); color:rgba(255,255,255,.95);
      padding:.3rem .75rem; border-radius:20px;
      font-size:.72rem; font-weight:700;
      border:1px solid rgba(255,255,255,.25);
      margin-bottom:.5rem;
    }
    .header-text h1 { margin:0; font-size:1.35rem; font-weight:800; color:#fff; }
    .header-text p   { margin:.15rem 0 0; font-size:.82rem; color:rgba(255,255,255,.8); }
    .header-text .sub-en { font-size:.7rem; color:rgba(255,255,255,.55); margin-top:.05rem; }
    .header-icon {
      width:52px; height:52px; border-radius:50%; flex-shrink:0;
      background:rgba(255,255,255,.18); border:2px solid rgba(255,255,255,.3);
      display:flex; align-items:center; justify-content:center;
      font-size:1.3rem; color:#fff;
    }

    /* ── Checking access ── */
    .checking-state {
      display:flex; flex-direction:column; align-items:center;
      padding:4rem 1.5rem; gap:1rem; color:#667eea;
    }
    .spinner-lg {
      width:40px; height:40px; border:3px solid rgba(102,126,234,.2);
      border-top-color:#667eea; border-radius:50%;
      animation:spin .8s linear infinite;
    }
    .checking-state p { font-size:.9rem; color:#555; margin:0; }

    /* ── Access denied ── */
    .denied-state {
      display:flex; flex-direction:column; align-items:center;
      padding:3.5rem 1.5rem; text-align:center; gap:.6rem;
    }
    .denied-icon {
      width:80px; height:80px; border-radius:50%;
      background:rgba(239,68,68,.1);
      display:flex; align-items:center; justify-content:center;
      font-size:2.2rem; color:#dc2626; margin-bottom:.5rem;
    }
    .denied-state h3 { font-size:1.15rem; font-weight:800; color:#1a1a2e; margin:0; }
    .denied-state p   { font-size:.88rem; color:#555; margin:0; }
    .denied-state span{ font-size:.78rem; color:#9090aa; }
    .back-btn-large {
      display:flex; align-items:center; gap:.5rem; margin-top:.75rem;
      padding:.75rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.9rem; font-weight:700; cursor:pointer;
    }

    /* ── Form ── */
    .form-wrap {
      padding:1.25rem 1rem 0;
      display:flex; flex-direction:column; gap:.875rem;
    }

    /* Banners */
    .banner {
      display:flex; align-items:center; gap:.75rem;
      padding:.875rem 1rem; border-radius:14px;
      font-size:.88rem; font-weight:600;
    }
    .banner i { font-size:1rem; flex-shrink:0; }
    .banner-success { background:rgba(34,197,94,.1); color:#16a34a; border:1.5px solid rgba(34,197,94,.2); }
    .banner-error   { background:rgba(239,68,68,.08); color:#dc2626; border:1.5px solid rgba(239,68,68,.15); }

    /* Fields */
    .field { display:flex; flex-direction:column; gap:.4rem; }
    .field-label {
      display:flex; align-items:center; gap:.4rem;
      font-size:.8rem; font-weight:700; color:#555;
      text-transform:uppercase; letter-spacing:.04em;
    }
    .field-label i { color:#667eea; font-size:.82rem; }
    .req { color:#ef4444; }
    .opt-label { font-size:.72rem; color:#9090aa; font-weight:400; text-transform:none; letter-spacing:0; margin-right:.25rem; }

    .field-input {
      width:100%; padding:.8rem 1rem;
      border:1.5px solid #e9ecef; border-radius:12px;
      background:#fff; font-size:.95rem;
      min-height:48px; outline:none; box-sizing:border-box;
      transition:border-color .15s, box-shadow .15s;
    }
    .field-input:focus {
      border-color:#667eea;
      box-shadow:0 0 0 3px rgba(102,126,234,.12);
    }
    .field-select { cursor:pointer; }

    .select-shimmer {
      height:48px; border-radius:12px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }

    .field-error { font-size:.75rem; color:#dc2626; font-weight:600; }

    /* Academy note */
    .academy-note {
      display:flex; align-items:flex-start; gap:.6rem;
      padding:.875rem 1rem; border-radius:12px;
      background:rgba(102,126,234,.07);
      border:1.5px solid rgba(102,126,234,.15);
      font-size:.82rem; color:#555; line-height:1.4;
    }
    .academy-note i { color:#667eea; font-size:.9rem; flex-shrink:0; margin-top:.1rem; }
    .academy-note strong { color:#1a1a2e; }

    /* Actions */
    .actions { display:flex; flex-direction:column; gap:.625rem; padding-top:.25rem; }

    .submit-btn {
      width:100%; padding:.9rem; border-radius:14px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.95rem; font-weight:800;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
      min-height:52px; box-shadow:0 4px 16px rgba(102,126,234,.35);
      transition:opacity .15s;
    }
    .submit-btn:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }

    .cancel-btn {
      width:100%; padding:.8rem; border-radius:14px;
      background:#fff; border:1.5px solid #e9ecef;
      color:#555; font-size:.9rem; font-weight:600; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      min-height:48px; transition:background .15s;
    }
    .cancel-btn:hover { background:#f9fafb; }

    /* Spinner */
    .spinner {
      width:16px; height:16px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `],
})
export class AddCourseComponent implements OnInit {
  private readonly courseSvc      = inject(CourseService);
  private readonly gradeSvc       = inject(GradeService);
  private readonly academySvc     = inject(AcademyService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);

  model = signal<Partial<CreateUpdateCourseDto>>({ nameAr: '', nameEn: '', gradeId: undefined });
  grades       = signal<GradeDto[]>([]);
  loadingGrades = signal(true);
  saving        = signal(false);
  errorMsg      = signal<string | null>(null);
  successMsg    = signal<string | null>(null);

  // Academy context
  academyId      = signal<string | null>(null);
  academy        = signal<AcademyDto | null>(null);
  checkingAccess = signal(false);
  accessDenied   = signal(false);

  async ngOnInit(): Promise<void> {
    const qAcademyId = this.route.snapshot.queryParamMap.get('academyId');
    this.academyId.set(qAcademyId);

    // Load grades in parallel with access check
    const gradeLoad = lastValueFrom(this.gradeSvc.getList()).then(res => {
      this.grades.set(res?.items ?? []);
    }).catch(e => console.error('Failed to load grades', e))
      .finally(() => this.loadingGrades.set(false));

    if (qAcademyId) {
      this.checkingAccess.set(true);
      try {
        // Load academy info and current user actor in parallel
        const [academyInfo, userInfo] = await Promise.all([
          lastValueFrom(this.academySvc.get(qAcademyId)),
          lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()).catch(() => null),
        ]);
        this.academy.set(academyInfo);

        // Access check: compare academy's supervisorTeacherId with current actor ID
        const isSupervisor = !!(userInfo?.actorId &&
          academyInfo?.supervisorTeacherId === userInfo.actorId);
        if (!isSupervisor) {
          this.accessDenied.set(true);
        }
      } catch (e) {
        console.error('Access check failed', e);
        this.accessDenied.set(true);
      } finally {
        this.checkingAccess.set(false);
      }
    }

    await gradeLoad;
  }

  setField<K extends keyof CreateUpdateCourseDto>(k: K, v: CreateUpdateCourseDto[K]): void {
    this.model.update(m => ({ ...m, [k]: v }));
  }

  async submit(form?: NgForm): Promise<void> {
    if (!this.model().nameAr?.trim() || !this.model().nameEn?.trim()) {
      this.errorMsg.set('يرجى إدخال اسم المقرر بالعربية والإنجليزية');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    try {
      const newCourse = await lastValueFrom(
        this.courseSvc.create(this.model() as CreateUpdateCourseDto)
      );

      // If in academy context, link the new course to the academy
      if (this.academyId() && newCourse?.id) {
        await lastValueFrom(
          this.academySvc.addCourseToAcademy(this.academyId()!, newCourse.id)
        );
        this.successMsg.set('تم إضافة المقرر إلى الأكاديمية بنجاح!');
        setTimeout(() => this.cancel(), 1500);
      } else {
        await this.router.navigate(['/courses']);
      }
    } catch (e: any) {
      console.error('Failed to create course', e);
      this.errorMsg.set(
        e?.error?.error?.message || 'حدث خطأ أثناء إضافة المقرر. حاول مجدداً.'
      );
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    const aId = this.academyId();
    if (aId) {
      this.router.navigate(['/teacher/academies', aId, 'courses']);
    } else {
      this.router.navigate(['/courses']);
    }
  }
}
