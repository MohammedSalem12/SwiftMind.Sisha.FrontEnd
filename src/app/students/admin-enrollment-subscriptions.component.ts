import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { StudentEnrollmentSubscriptionService } from '@proxy/students';
import type { StudentEnrollmentSubscriptionDto } from '@proxy/students/models';
import { EnrollmentSubscriptionPaymentMethod, EnrollmentSubscriptionPlan } from '@proxy/students';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-admin-enrollment-subscriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header
        [title]="'اشتراكات المقررات'"
        [titleEn]="'Course Subscriptions'"></app-page-header>

      @if (loading()) {
        <div class="center"><ion-spinner name="crescent"></ion-spinner></div>
      } @else if (items().length === 0) {
        <div class="empty">
          <i class="fas fa-inbox"></i>
          <p>لا توجد طلبات اشتراك قيد المراجعة</p>
          <span>No pending subscription requests</span>
        </div>
      } @else {
        <p class="count">{{ total() }} طلب قيد المراجعة</p>

        @for (s of items(); track s.id) {
          <div class="req-card">
            <div class="req-head">
              <div class="req-student">
                <span class="req-name">{{ s.studentName }}</span>
                <span class="req-code"><i class="fas fa-id-card"></i> {{ s.studentCode }}</span>
              </div>
              <span class="req-amount">{{ s.amountEGP }} ج.م</span>
            </div>

            <div class="req-meta">
              <span><i class="fas fa-calendar"></i> {{ s.plan === Plan.Yearly ? 'سنوي (12 شهر)' : 'شهري' }}</span>
              <span>
                <i class="fas" [class.fa-building-columns]="s.paymentMethod === Method.InstaPay"
                              [class.fa-mobile-screen]="s.paymentMethod === Method.VodafoneCash"></i>
                {{ s.paymentMethod === Method.InstaPay ? 'InstaPay' : 'فودافون كاش' }}
              </span>
            </div>

            <!-- The admin matches this against the incoming transfer note. -->
            <div class="ref-row">
              <span class="ref-label">مرجع التحويل</span>
              <code class="ref-value">{{ s.paymentReference }}</code>
            </div>

            @if (rejectingId() === s.id) {
              <div class="reject-box">
                <ion-input class="reject-input" [(ngModel)]="rejectReason"
                           placeholder="سبب الرفض (اختياري)"></ion-input>
                <div class="reject-actions">
                  <ion-button size="small" color="danger" (click)="confirmReject(s)"
                              [disabled]="busyId() === s.id">تأكيد الرفض</ion-button>
                  <ion-button size="small" fill="clear" (click)="rejectingId.set(null)">إلغاء</ion-button>
                </div>
              </div>
            } @else {
              <div class="req-actions">
                <ion-button class="btn-approve" expand="block" (click)="approve(s)"
                            [disabled]="busyId() === s.id">
                  @if (busyId() === s.id) {
                    <ion-spinner name="crescent"></ion-spinner>
                  } @else {
                    <i class="fas fa-check" style="margin-inline-end:.35rem"></i> تأكيد الدفع وتفعيل
                  }
                </ion-button>
                <ion-button class="btn-reject" fill="outline" (click)="startReject(s)"
                            [disabled]="busyId() === s.id">
                  <i class="fas fa-xmark"></i>
                </ion-button>
              </div>
            }
          </div>
        }
      }

      @if (message()) {
        <p class="msg" [class.msg--err]="isError()">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .page { padding:1rem; padding-bottom:6rem; background:#f6f7fb; min-height:100%; }
    .center { display:flex; justify-content:center; padding:3rem; }

    .empty { text-align:center; padding:3rem 1rem; color:#9ca3af; }
    .empty i { font-size:2.2rem; margin-bottom:.75rem; display:block; }
    .empty p { margin:0; font-weight:600; color:#6b7280; }
    .empty span { font-size:.75rem; }

    .count { font-size:.78rem; color:#6b7280; margin:0 0 .75rem; }

    .req-card {
      background:#fff; border:1px solid #eef0f6; border-radius:16px;
      padding:.9rem; margin-bottom:.7rem; box-shadow:0 2px 10px rgba(0,0,0,.04);
    }
    .req-head { display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem; }
    .req-student { display:flex; flex-direction:column; gap:.15rem; min-width:0; }
    .req-name { font-weight:700; color:#1a1a2e; font-size:.95rem; }
    .req-code { font-size:.72rem; color:#7c3aed; font-weight:600; }
    .req-amount { font-size:1.1rem; font-weight:800; color:#4c1d95; white-space:nowrap; }

    .req-meta {
      display:flex; gap:1rem; flex-wrap:wrap;
      font-size:.74rem; color:#6b7280; margin:.5rem 0 .6rem;
    }
    .req-meta i { margin-inline-end:.25rem; }

    .ref-row {
      display:flex; align-items:center; justify-content:space-between;
      background:#faf9ff; border:1px dashed #ddd6fe; border-radius:10px;
      padding:.45rem .6rem; margin-bottom:.7rem;
    }
    .ref-label { font-size:.7rem; color:#6b7280; }
    .ref-value { font-size:.9rem; font-weight:800; letter-spacing:.05em; color:#4c1d95; }

    .req-actions { display:flex; gap:.5rem; }
    ion-button.btn-approve {
      flex:1; --background:#059669; --color:#fff; --border-radius:12px;
      min-height:44px; font-weight:700; margin:0;
    }
    ion-button.btn-reject {
      --color:#b91c1c; --border-color:#fecaca; --border-radius:12px;
      min-height:44px; min-width:52px; margin:0;
    }

    .reject-box { display:flex; flex-direction:column; gap:.5rem; }
    .reject-input {
      --background:#fff; --padding-start:.6rem; --padding-end:.6rem;
      border:1px solid #e5e7eb; border-radius:10px; min-height:44px; font-size:.85rem;
    }
    .reject-actions { display:flex; gap:.4rem; justify-content:flex-end; }

    .msg { text-align:center; font-size:.8rem; color:#047857; margin-top:.75rem; }
    .msg--err { color:#b91c1c; }
  `],
})
export class AdminEnrollmentSubscriptionsComponent implements OnInit {
  private readonly svc = inject(StudentEnrollmentSubscriptionService);

  protected readonly Plan = EnrollmentSubscriptionPlan;
  protected readonly Method = EnrollmentSubscriptionPaymentMethod;

  loading = signal(true);
  busyId = signal<string | null>(null);
  rejectingId = signal<string | null>(null);
  rejectReason = '';

  items = signal<StudentEnrollmentSubscriptionDto[]>([]);
  total = signal(0);
  message = signal<string | null>(null);
  isError = signal(false);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(this.svc.getPending({ maxResultCount: 100, skipCount: 0 } as any));
      this.items.set(res?.items ?? []);
      this.total.set(res?.totalCount ?? 0);
    } catch (e) {
      console.error('Failed to load pending subscriptions', e);
      this.show('تعذر تحميل الطلبات', true);
    } finally {
      this.loading.set(false);
    }
  }

  async approve(s: StudentEnrollmentSubscriptionDto): Promise<void> {
    this.busyId.set(s.id);
    try {
      await lastValueFrom(this.svc.approve(s.id));
      this.show(`تم تفعيل اشتراك ${s.studentName}`, false);
      await this.load();
    } catch (e: any) {
      this.show(e?.error?.error?.message || 'فشل التفعيل', true);
    } finally {
      this.busyId.set(null);
    }
  }

  startReject(s: StudentEnrollmentSubscriptionDto): void {
    this.rejectReason = '';
    this.rejectingId.set(s.id);
  }

  async confirmReject(s: StudentEnrollmentSubscriptionDto): Promise<void> {
    this.busyId.set(s.id);
    try {
      await lastValueFrom(this.svc.reject(s.id, { reason: this.rejectReason || undefined } as any));
      this.rejectingId.set(null);
      this.show(`تم رفض طلب ${s.studentName}`, false);
      await this.load();
    } catch (e: any) {
      this.show(e?.error?.error?.message || 'فشل الرفض', true);
    } finally {
      this.busyId.set(null);
    }
  }

  private show(text: string, err: boolean): void {
    this.message.set(text);
    this.isError.set(err);
    setTimeout(() => this.message.set(null), 4000);
  }
}
