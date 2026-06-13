import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import { AdvertiserService } from '@proxy/advertisements';

@Component({
  selector: 'app-ads-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-text">
            <h1>إنشاء إعلان جديد</h1>
            <p>Create New Ad</p>
          </div>
          <div class="header-icon"><i class="fas fa-plus-circle"></i></div>
        </div>
      </div>

      <div class="form-area">
        <!-- Ad Type -->
        <div class="field-group">
          <label class="field-label">نوع الإعلان · Ad Type</label>
          <div class="type-selector">
            @if (!isTeacherRole()) {
              <button class="type-btn" [class.type-btn--active]="model.adType === 0" (click)="model.adType = 0">
                <i class="fas fa-store"></i>
                <span>خدمات</span>
                <small>Services</small>
              </button>
              <button class="type-btn" [class.type-btn--active]="model.adType === 1" (click)="model.adType = 1">
                <i class="fas fa-box-open"></i>
                <span>منتجات</span>
                <small>Products</small>
              </button>
            }
            <button class="type-btn" [class.type-btn--active]="model.adType === 2" (click)="model.adType = 2">
              <i class="fas fa-handshake"></i>
              <span>عرض مشترك</span>
              <small>Deal</small>
            </button>
          </div>

          <!-- Type description -->
          <div class="type-info">
            @if (model.adType === 0) {
              <div class="type-info-card type-info--service">
                <div class="type-info-icon"><i class="fas fa-store"></i></div>
                <div class="type-info-text">
                  <strong>خدمات · Services</strong>
                  <p>للمعلنين الذين يقدمون خدمات متنوعة مثل الكافيهات والأزياء ومراكز الدورات والمطاعم وغيرها. اعرض خدماتك مع السعر ومعلومات التواصل. متاح للمعلنين فقط.</p>
                  <p class="type-info-en">For advertisers offering various services like cafes, fashion, training centers, restaurants, etc. Display your services with price and contact info. Advertisers only.</p>
                </div>
              </div>
            }
            @if (model.adType === 1) {
              <div class="type-info-card type-info--product">
                <div class="type-info-icon"><i class="fas fa-box-open"></i></div>
                <div class="type-info-text">
                  <strong>منتجات · Products</strong>
                  <p>للمعلنين الذين يبيعون منتجات مثل الكتب والأدوات المدرسية والأجهزة الإلكترونية والمستلزمات التعليمية. اعرض منتجاتك مع السعر والوصف. متاح للمعلنين فقط.</p>
                  <p class="type-info-en">For advertisers selling products like books, school supplies, electronics, and educational materials. Display your products with price and description. Advertisers only.</p>
                </div>
              </div>
            }
            @if (model.adType === 2) {
              <div class="type-info-card type-info--deal">
                <div class="type-info-icon"><i class="fas fa-handshake"></i></div>
                <div class="type-info-text">
                  <strong>عرض مشترك · Partnership Deal</strong>
                  <p>شراكة بين معلم ومعلن (مكتبة / مركز). يحصل طلاب المعلم على كوبون خصم تلقائيا عند التسجيل. عند استخدام الكوبون يحصل المعلم على عمولة والمنصة على رسوم.</p>
                  <p class="type-info-en">A partnership between teacher and advertiser (library/center). Teacher students automatically receive a discount coupon on enrollment. When redeemed, the teacher earns commission and the platform earns a fee.</p>
                  <div class="type-info-flow">
                    <span class="flow-step"><i class="fas fa-plus-circle"></i> المعلم ينشئ العرض</span>
                    <i class="fas fa-arrow-left flow-arrow"></i>
                    <span class="flow-step"><i class="fas fa-check-circle"></i> المدير يوافق</span>
                    <i class="fas fa-arrow-left flow-arrow"></i>
                    <span class="flow-step"><i class="fas fa-ticket-alt"></i> كوبونات للطلاب</span>
                    <i class="fas fa-arrow-left flow-arrow"></i>
                    <span class="flow-step"><i class="fas fa-store"></i> الاستبدال عند الشريك</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Title -->
        <div class="field-group">
          <label class="field-label">العنوان · Title</label>
          <input class="field-input" [(ngModel)]="model.title" placeholder="عنوان الإعلان بالعربية" maxlength="200" />
          <input class="field-input field-input--en" [(ngModel)]="model.titleEn" placeholder="Ad title in English (optional)" maxlength="200" dir="ltr" />
        </div>

        <!-- Description -->
        <div class="field-group">
          <label class="field-label">الوصف · Description</label>
          <textarea class="field-textarea" [(ngModel)]="model.description" placeholder="وصف تفصيلي للإعلان" rows="4"></textarea>
          <textarea class="field-textarea field-input--en" [(ngModel)]="model.descriptionEn" placeholder="Description in English (optional)" rows="3" dir="ltr"></textarea>
        </div>

        <!-- Target Audience -->
        <div class="field-group">
          <label class="field-label">الجمهور المستهدف · Target Audience</label>
          <select class="field-select" [(ngModel)]="model.targetAudience">
            <option [ngValue]="0">الكل · All</option>
            <option [ngValue]="1">الطلاب · Students</option>
            <option [ngValue]="2">أولياء الأمور · Parents</option>
            <option [ngValue]="3">المعلمون · Teachers</option>
          </select>
        </div>

        <!-- Price -->
        <div class="field-group">
          <label class="field-label">السعر (اختياري) · Price</label>
          <div class="price-row">
            <input class="field-input price-input" type="number" [(ngModel)]="model.price" placeholder="0.00" dir="ltr" />
            <select class="field-select currency-select" [(ngModel)]="model.currency">
              <option value="SAR">ر.س</option>
              <option value="EGP">ج.م</option>
              <option value="USD">$</option>
            </select>
          </div>
        </div>

        <!-- Deal fields (only for Deal type) -->
        @if (model.adType === 2) {
          <!-- Teacher search (for advertisers creating deals) -->
          @if (!isTeacherRole()) {
            <div class="field-group">
              <label class="field-label"><i class="fas fa-chalkboard-teacher" style="color:#667eea;margin-left:.3rem"></i> البحث عن معلم · Search Teacher</label>
              <div class="search-row">
                <input class="field-input" [(ngModel)]="teacherCodeSearch" placeholder="أدخل كود المعلم · Enter teacher code (T-XXXXXXX)" dir="ltr" />
                <button class="search-btn" (click)="searchTeacher()" [disabled]="searchingTeacher()">
                  @if (searchingTeacher()) { <i class="fas fa-spinner fa-spin"></i> }
                  @else { <i class="fas fa-search"></i> }
                </button>
              </div>
              @if (foundTeacher()) {
                <div class="found-teacher">
                  <i class="fas fa-check-circle" style="color:#059669"></i>
                  <span>{{ foundTeacher()!.displayName }}</span>
                  <span class="found-code">{{ foundTeacher()!.teacherCode }}</span>
                </div>
              }
              @if (teacherSearchError()) {
                <div class="search-error"><i class="fas fa-times-circle"></i> {{ teacherSearchError() }}</div>
              }
            </div>
          }

          <!-- Linked Course -->
          <div class="field-group">
            <label class="field-label"><i class="fas fa-book" style="color:#667eea;margin-left:.3rem"></i> ربط بمقرر · Link to Course</label>
            <select class="field-select" [(ngModel)]="model.linkedCourseId">
              <option [ngValue]="null">جميع المقررات · All Courses</option>
              @for (c of teacherCourses(); track c.id) {
                <option [ngValue]="c.id">{{ c.nameAr || c.nameEn }} ({{ c.code }})</option>
              }
            </select>
            @if (teacherCourses().length === 0 && !isTeacherRole()) {
              <span class="field-hint">ابحث عن المعلم أولاً لعرض مقرراته · Search for a teacher first to see their courses</span>
            }
          </div>

          <!-- Deal Partner (Advertiser) — for teachers -->
          @if (isTeacherRole()) {
            <div class="field-group">
              <label class="field-label"><i class="fas fa-store" style="color:#d97706;margin-left:.3rem"></i> شريك العرض · Deal Partner</label>
              @if (advertisers().length > 0) {
                <select class="field-select" [(ngModel)]="model.dealPartnerId" (ngModelChange)="onAdvertiserChange($event)">
                  <option [ngValue]="null">-- اختر المعلن · Select Advertiser --</option>
                  @for (a of advertisers(); track a.id) {
                    <option [ngValue]="a.id">{{ a.name }} {{ a.nameEn ? '(' + a.nameEn + ')' : '' }}</option>
                  }
                </select>
              }
              <input class="field-input" [(ngModel)]="model.dealPartnerName" placeholder="أو اكتب اسم الشريك يدويا · Or type partner name" style="margin-top:.35rem" />
            </div>
          }

          <!-- Commission -->
          <div class="field-group">
            <label class="field-label"><i class="fas fa-percentage" style="color:#059669;margin-left:.3rem"></i> نسب العرض · Deal Percentages</label>
            <div class="commission-row">
              <div class="commission-field">
                <label class="date-label">خصم الطالب %</label>
                <input class="field-input" type="number" [(ngModel)]="model.discountPercent" placeholder="20" min="0" max="100" dir="ltr" />
              </div>
              <div class="commission-field">
                <label class="date-label">عمولة المعلم %</label>
                <input class="field-input" type="number" [(ngModel)]="model.teacherCommissionPercent" placeholder="5" min="0" max="50" dir="ltr" />
              </div>
              <div class="commission-field">
                <label class="date-label">رسوم المنصة %</label>
                <input class="field-input" type="number" [(ngModel)]="model.platformFeePercent" placeholder="3" min="0" max="20" dir="ltr" />
              </div>
            </div>
          </div>
        }

        <!-- Contact Info -->
        <div class="field-group">
          <label class="field-label">معلومات التواصل · Contact Info</label>
          <input class="field-input" [(ngModel)]="model.contactInfo" placeholder="رقم هاتف أو بريد إلكتروني" dir="ltr" />
        </div>

        <!-- External URL -->
        <div class="field-group">
          <label class="field-label">رابط خارجي (اختياري) · External URL</label>
          <input class="field-input" [(ngModel)]="model.externalUrl" placeholder="https://..." dir="ltr" />
        </div>

        <!-- Image URL -->
        <div class="field-group">
          <label class="field-label">رابط الصورة (اختياري) · Image URL</label>
          <input class="field-input" [(ngModel)]="model.imageUrl" placeholder="https://..." dir="ltr" />
        </div>

        <!-- Schedule -->
        <div class="field-group">
          <label class="field-label">فترة العرض · Schedule</label>
          <div class="date-row">
            <div class="date-field">
              <label class="date-label">من · From</label>
              <input class="field-input" type="date" [(ngModel)]="model.startDate" dir="ltr" />
            </div>
            <div class="date-field">
              <label class="date-label">إلى · To</label>
              <input class="field-input" type="date" [(ngModel)]="model.endDate" dir="ltr" />
            </div>
          </div>
        </div>

        <!-- Error/Success -->
        @if (error()) {
          <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div>
        }
        @if (success()) {
          <div class="msg msg--success"><i class="fas fa-check-circle"></i> {{ success() }}</div>
        }

        <!-- Actions -->
        <div class="actions">
          <button class="btn-draft" (click)="save(false)" [disabled]="saving()">
            <i class="fas fa-save"></i> حفظ كمسودة · Save Draft
          </button>
          <button class="btn-submit" (click)="save(true)" [disabled]="saving() || !model.title || !model.description">
            @if (saving()) { <i class="fas fa-spinner fa-spin"></i> }
            @else { <i class="fas fa-paper-plane"></i> }
            إرسال للمراجعة · Submit
          </button>
        </div>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-row {
      position:relative; z-index:1; display:flex; align-items:center; gap:1rem;
    }
    .btn-back {
      width:40px; height:40px; border-radius:12px;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-text p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:48px; height:48px; border-radius:14px;
      background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center;
      color:rgba(255,255,255,.9); font-size:1.3rem; flex-shrink:0;
    }

    .form-area { padding:1rem; display:flex; flex-direction:column; gap:1rem; }

    .field-group { display:flex; flex-direction:column; gap:.4rem; }
    .field-label { font-size:.8rem; font-weight:700; color:#555; }

    .type-selector { display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; }
    .type-btn {
      display:flex; flex-direction:column; align-items:center; gap:.25rem;
      padding:.75rem .5rem; border-radius:14px; border:1.5px solid #e0e0ee;
      background:#fff; cursor:pointer; transition:all .2s;
      -webkit-tap-highlight-color:transparent;
    }
    .type-btn i { font-size:1.2rem; color:#9090aa; }
    .type-btn span { font-size:.72rem; font-weight:700; color:#1a1a2e; }
    .type-btn small { font-size:.6rem; color:#9090aa; }
    .type-info { margin-top:.5rem; }
    .type-info-card {
      display:flex; gap:.65rem; padding:.75rem .85rem;
      border-radius:12px; border:1.5px solid; animation:fadeIn .25s ease;
    }
    @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
    .type-info--service { background:rgba(102,126,234,.05); border-color:rgba(102,126,234,.2); }
    .type-info--product { background:rgba(245,158,11,.05); border-color:rgba(245,158,11,.2); }
    .type-info--deal { background:rgba(16,185,129,.05); border-color:rgba(16,185,129,.2); }
    .type-info-icon {
      width:32px; height:32px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:.85rem;
    }
    .type-info--service .type-info-icon { background:rgba(102,126,234,.15); color:#667eea; }
    .type-info--product .type-info-icon { background:rgba(245,158,11,.15); color:#d97706; }
    .type-info--deal .type-info-icon { background:rgba(16,185,129,.15); color:#059669; }
    .type-info-text { flex:1; min-width:0; }
    .type-info-text strong { font-size:.78rem; color:#1a1a2e; display:block; margin-bottom:.25rem; }
    .type-info-text p { font-size:.72rem; color:#4a4a6a; line-height:1.5; margin:0 0 .15rem; }
    .type-info-en { font-size:.65rem !important; color:#9090aa !important; }
    .type-info-flow {
      display:flex; align-items:center; flex-wrap:wrap; gap:.3rem;
      margin-top:.5rem; padding-top:.5rem; border-top:1px solid rgba(16,185,129,.15);
    }
    .flow-step {
      font-size:.6rem; font-weight:600; color:#059669;
      background:rgba(16,185,129,.1); padding:.2rem .45rem; border-radius:6px;
      display:flex; align-items:center; gap:.2rem; white-space:nowrap;
    }
    .flow-step i { font-size:.55rem; }
    .flow-arrow { font-size:.5rem; color:#10b981; }

    .type-btn--active {
      border-color:#667eea; background:rgba(102,126,234,.06);
    }
    .type-btn--active i { color:#667eea; }

    .field-input, .field-textarea, .field-select {
      width:100%; padding:.7rem .875rem; border-radius:12px;
      border:1.5px solid #e5e7eb; font-size:.88rem; color:#1a1a2e;
      background:#fff; box-sizing:border-box; outline:none;
      transition:border-color .2s;
    }
    .field-input:focus, .field-textarea:focus, .field-select:focus { border-color:#667eea; }
    .field-input--en { margin-top:.35rem; font-size:.82rem; color:#555; }
    .field-textarea { resize:vertical; min-height:80px; line-height:1.5; }
    .field-select { appearance:auto; }

    .price-row { display:flex; gap:.5rem; }
    .price-input { flex:1; }
    .currency-select { width:80px; flex-shrink:0; }

    .search-row { display:flex; gap:.4rem; }
    .search-row .field-input { flex:1; }
    .search-btn {
      width:44px; height:44px; border-radius:12px; border:none; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
      &:disabled { opacity:.5; }
    }
    .found-teacher {
      display:flex; align-items:center; gap:.4rem; margin-top:.35rem;
      font-size:.82rem; font-weight:600; color:#059669;
    }
    .found-code { font-size:.7rem; color:#9090aa; font-family:monospace; }
    .search-error { font-size:.78rem; color:#dc2626; margin-top:.25rem; display:flex; align-items:center; gap:.3rem; }
    .field-hint { font-size:.68rem; color:#9090aa; margin-top:.2rem; }

    .commission-row { display:flex; gap:.5rem; }
    .commission-field { flex:1; display:flex; flex-direction:column; gap:.25rem; }
    .date-row { display:flex; gap:.5rem; }
    .date-field { flex:1; display:flex; flex-direction:column; gap:.25rem; }
    .date-label { font-size:.7rem; color:#9090aa; }

    .msg {
      padding:.65rem .875rem; border-radius:10px; font-size:.82rem; font-weight:600;
      display:flex; align-items:center; gap:.35rem;
    }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }
    .msg--success { background:rgba(16,185,129,.08); color:#059669; }

    .actions { display:flex; gap:.5rem; padding-top:.5rem; }
    .btn-draft {
      flex:1; padding:.7rem; border-radius:12px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.8rem; font-weight:600;
      cursor:pointer; min-height:48px; display:flex; align-items:center;
      justify-content:center; gap:.35rem;
    }
    .btn-submit {
      flex:1.5; padding:.7rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.82rem; font-weight:700; cursor:pointer;
      min-height:48px; display:flex; align-items:center;
      justify-content:center; gap:.35rem;
    }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class AdsCreateComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly advertiserSvc = inject(AdvertiserService);
  private readonly apiBase = environment.apis?.default?.url || '';

  saving = signal(false);
  error = signal('');
  success = signal('');
  teacherCourses = signal<any[]>([]);
  advertisers = signal<any[]>([]);
  searchingTeacher = signal(false);
  foundTeacher = signal<any>(null);
  teacherSearchError = signal('');
  teacherCodeSearch = '';
  private userRole = '';

  model: any = {
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    imageUrl: '',
    adType: 0,
    targetAudience: 0,
    targetGrades: [],
    price: null,
    currency: 'EGP',
    contactInfo: '',
    externalUrl: '',
    dealPartnerName: '',
    dealPartnerId: null,
    linkedCourseId: null,
    discountPercent: null,
    teacherCommissionPercent: null,
    platformFeePercent: null,
    startDate: '',
    endDate: '',
    submitForReview: false,
  };

  async ngOnInit(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.userRole = (userInfo?.userRoles?.[0] || '').toUpperCase();

      // Teachers can only create Deals — set default
      if (this.isTeacherRole()) {
        this.model.adType = 2;
      }

      // Teachers: load their own courses
      if (this.isTeacherRole() && userInfo?.actorId) {
        const courses = await lastValueFrom(
          this.teacherSvc.getTeacherCourses(userInfo.actorId, { skipHandleError: true })
        );
        this.teacherCourses.set(courses || []);
      }

      // Load advertisers (for teachers to pick partner)
      const advList = await lastValueFrom(
        this.advertiserSvc.getList({ skipHandleError: true } as any)
      ).catch(() => ({ items: [] }));
      this.advertisers.set((advList as any)?.items || advList || []);
    } catch { /* silent */ }
  }

  isTeacherRole(): boolean {
    return this.userRole === 'TEACHER';
  }

  async searchTeacher(): Promise<void> {
    const code = this.teacherCodeSearch.trim();
    if (!code) return;
    this.searchingTeacher.set(true);
    this.teacherSearchError.set('');
    this.foundTeacher.set(null);
    this.teacherCourses.set([]);
    try {
      // Search by code
      const results = await lastValueFrom(
        this.teacherSvc.getTeachersBySearch(code, 1, { skipHandleError: true })
      );
      if (results?.length > 0) {
        const teacher = results[0];
        this.foundTeacher.set(teacher);
        // Load this teacher courses
        const courses = await lastValueFrom(
          this.teacherSvc.getTeacherCourses(teacher.id!, { skipHandleError: true })
        );
        this.teacherCourses.set(courses || []);
      } else {
        this.teacherSearchError.set('لم يتم العثور على معلم بهذا الكود · Teacher not found');
      }
    } catch {
      this.teacherSearchError.set('حدث خطأ في البحث · Search error');
    } finally {
      this.searchingTeacher.set(false);
    }
  }

  onAdvertiserChange(id: string): void {
    const adv = this.advertisers().find((a: any) => a.id === id);
    if (adv) {
      this.model.dealPartnerName = adv.name || adv.nameEn || '';
    }
  }

  async save(submit: boolean): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const payload: any = {
        title: this.model.title,
        titleEn: this.model.titleEn || undefined,
        description: this.model.description,
        descriptionEn: this.model.descriptionEn || undefined,
        imageUrl: this.model.imageUrl || undefined,
        adType: this.model.adType,
        targetAudience: this.model.targetAudience,
        targetGrades: this.model.targetGrades?.length ? this.model.targetGrades : undefined,
        price: this.model.price || undefined,
        currency: this.model.currency || 'SAR',
        contactInfo: this.model.contactInfo || undefined,
        externalUrl: this.model.externalUrl || undefined,
        dealPartnerName: this.model.dealPartnerName || undefined,
        dealPartnerId: this.model.dealPartnerId || undefined,
        linkedCourseId: this.model.linkedCourseId || undefined,
        discountPercent: this.model.discountPercent || undefined,
        teacherCommissionPercent: this.model.teacherCommissionPercent || undefined,
        platformFeePercent: this.model.platformFeePercent || undefined,
        startDate: this.model.startDate || undefined,
        endDate: this.model.endDate || undefined,
        submitForReview: submit,
      };
      await this.http.post(`${this.apiBase}/api/app/advertisement`, payload).toPromise();
      this.success.set(submit ? 'تم إرسال الإعلان للمراجعة · Ad submitted for review' : 'تم حفظ المسودة · Draft saved');
      if (submit) {
        setTimeout(() => this.location.back(), 1500);
      }
    } catch (e: any) {
      console.error('[AdsCreate] save error:', e);
      const msg = e?.error?.error?.message
        || e?.error?.error_description
        || e?.message
        || 'حدث خطأ · Something went wrong';
      this.error.set(msg);
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void { this.location.back(); }
}
