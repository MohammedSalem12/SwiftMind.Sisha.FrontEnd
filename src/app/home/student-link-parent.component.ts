import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { StudentService } from '@proxy/students';
import type { ParentStudentDto } from '@proxy/parents/models';

@Component({
  selector: 'app-student-link-parent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="link-parent-page">
      <!-- Header (page owns its header) -->
      <div class="page-header" data-page-header>
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1>ربط ولي أمر · Link a parent</h1>
      </div>

      <div *ngIf="successMessage()" class="alert success">
        <i class="fas fa-check-circle"></i>
        <span>{{ successMessage() }}</span>
      </div>
      <div *ngIf="errorMessage()" class="alert error">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ errorMessage() }}</span>
      </div>

      <!-- Method tabs -->
      <div class="search-tabs">
        <button class="tab" [class.active]="method() === 'code'" (click)="setMethod('code')">
          <i class="fas fa-keyboard"></i><span>كود ولي الأمر</span>
        </button>
        <button class="tab" [class.active]="method() === 'qr'" (click)="setMethod('qr')">
          <i class="fas fa-qrcode"></i><span>مسح QR</span>
        </button>
      </div>

      <!-- By code -->
      <div class="search-section" *ngIf="method() === 'code'">
        <div class="search-card">
          <div class="search-icon"><i class="fas fa-user-shield"></i></div>
          <h3>أدخل كود ولي الأمر</h3>
          <p>أدخل كود ولي أمرك لإرسال طلب ربط · Enter your parent's code to send a link request</p>

          <div class="input-group">
            <input type="text" [(ngModel)]="parentCode" name="parentCode"
                   placeholder="مثال: P-XXXXXXXX" dir="ltr"
                   [disabled]="sending()" (keyup.enter)="sendRequest()" />
          </div>

          <div class="form-section">
            <label class="form-label">صلة القرابة · Relationship</label>
            <div class="rel-grid">
              <button *ngFor="let rel of relationshipTypes" class="rel-btn"
                      [class.selected]="relationshipType === rel.value"
                      (click)="relationshipType = rel.value">
                <i [class]="rel.icon"></i><span>{{ rel.label }}</span>
              </button>
            </div>
          </div>

          <button class="submit-btn" (click)="sendRequest()" [disabled]="!parentCode.trim() || sending()">
            <span *ngIf="sending()" class="spinner white"></span>
            <i *ngIf="!sending()" class="fas fa-paper-plane"></i>
            <span>{{ sending() ? 'جاري الإرسال...' : 'إرسال طلب الربط · Send request' }}</span>
          </button>

          <p class="hint">
            <i class="fas fa-info-circle"></i>
            سيتم ربط الحساب بعد موافقة ولي الأمر · The link is confirmed once your parent approves
          </p>
        </div>
      </div>

      <!-- QR -->
      <div class="search-section" *ngIf="method() === 'qr'">
        <div class="qr-card">
          <div class="qr-scanner-area" [class.scanning]="isScanning()">
            <video #videoElement [hidden]="!isScanning()" autoplay playsinline></video>
            <div *ngIf="!isScanning()" class="qr-placeholder">
              <i class="fas fa-qrcode"></i><p>اضغط للبدء</p>
            </div>
            <div class="scan-overlay" *ngIf="isScanning()"><div class="scan-frame"></div></div>
          </div>
          <button *ngIf="!isScanning()" class="start-scan-btn" (click)="startQrScan()">
            <i class="fas fa-camera"></i><span>فتح الكاميرا</span>
          </button>
          <button *ngIf="isScanning()" class="stop-scan-btn" (click)="stopQrScan()">
            <i class="fas fa-times"></i><span>إيقاف</span>
          </button>
          <p class="hint"><i class="fas fa-info-circle"></i> وجّه الكاميرا نحو كود QR الخاص بولي الأمر</p>
        </div>
        <div class="manual-entry">
          <p>لا يمكنك مسح الكود؟</p>
          <button (click)="setMethod('code')">أدخل الكود يدوياً</button>
        </div>
      </div>

      <!-- Sent requests -->
      <div class="sent-section" *ngIf="sentRequests().length">
        <h3 class="sent-title">طلباتي · My requests</h3>
        <div class="sent-card" *ngFor="let r of sentRequests()">
          <div class="sent-avatar"><i class="fas fa-user-shield"></i></div>
          <div class="sent-info">
            <span class="sent-name">{{ r.parentName || 'ولي أمر' }}</span>
            <span class="sent-code">{{ r.parentCode }}</span>
          </div>
          <span class="status-badge" [class]="statusClass(r.linkStatus)">{{ statusLabel(r.linkStatus) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .link-parent-page { min-height: 100vh; background: #f5f7fa; padding-bottom: 100px; }
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1rem;
      display: flex; align-items: center; gap: 1rem; color: white;
      position: sticky; top: 0; z-index: 100;
    }
    .back-btn {
      width: 40px; height: 40px; min-width: 40px; background: rgba(255,255,255,0.2);
      border: none; border-radius: 12px; color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .page-header h1 { font-size: 1.15rem; font-weight: 700; margin: 0; }

    .alert { display: flex; align-items: center; gap: 0.75rem; margin: 1rem; padding: 1rem; border-radius: 12px; font-size: 0.9rem; }
    .alert.success { background: #d1fae5; color: #065f46; }
    .alert.error { background: #fee2e2; color: #991b1b; }
    .alert i { font-size: 1.25rem; flex-shrink: 0; }

    .search-tabs { display: flex; gap: 0.5rem; padding: 1rem; background: white; margin: 1rem; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-height: 44px; padding: 1rem; background: #f5f7fa; border: 2px solid transparent; border-radius: 12px; cursor: pointer; }
    .tab i { font-size: 1.5rem; color: #6b7280; }
    .tab span { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .tab.active { background: #f0f4ff; border-color: #667eea; }
    .tab.active i, .tab.active span { color: #667eea; }

    .search-section { padding: 0 1rem; }
    .search-card, .qr-card { background: white; border-radius: 16px; padding: 1.75rem 1.5rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .search-icon { width: 70px; height: 70px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .search-icon i { font-size: 2rem; color: white; }
    .search-card h3 { font-size: 1.2rem; font-weight: 700; color: #1a202c; margin: 0 0 0.5rem; }
    .search-card > p { font-size: 0.85rem; color: #6b7280; margin: 0 0 1.25rem; }
    .input-group { margin-bottom: 1rem; }
    .input-group input { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; text-align: center; letter-spacing: 0.08em; font-family: monospace; }
    .input-group input:focus { outline: none; border-color: #667eea; }

    .form-section { margin-bottom: 1.25rem; text-align: start; }
    .form-label { display: block; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .rel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .rel-btn { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; min-height: 44px; padding: 0.6rem 0.4rem; background: #f5f7fa; border: 2px solid transparent; border-radius: 12px; cursor: pointer; }
    .rel-btn i { font-size: 1.05rem; color: #6b7280; }
    .rel-btn span { font-size: 0.72rem; font-weight: 600; color: #374151; }
    .rel-btn.selected { background: #f0f4ff; border-color: #667eea; }
    .rel-btn.selected i, .rel-btn.selected span { color: #667eea; }

    .submit-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem; min-height: 48px; padding: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 14px; color: white; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .hint { font-size: 0.78rem; color: #9ca3af; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0 0; }

    .qr-scanner-area { width: 100%; aspect-ratio: 1; max-width: 300px; margin: 0 auto 1rem; background: #1a202c; border-radius: 16px; overflow: hidden; position: relative; }
    .qr-scanner-area video { width: 100%; height: 100%; object-fit: cover; }
    .qr-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6b7280; }
    .qr-placeholder i { font-size: 4rem; margin-bottom: 1rem; color: #4b5563; }
    .scan-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .scan-frame { width: 200px; height: 200px; border: 3px solid #667eea; border-radius: 16px; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .start-scan-btn, .stop-scan-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 44px; padding: 0.875rem 2rem; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; border: none; color: white; }
    .start-scan-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stop-scan-btn { background: #ef4444; }
    .manual-entry { margin: 1.25rem 1rem 0; text-align: center; }
    .manual-entry p { font-size: 0.85rem; color: #6b7280; margin: 0 0 0.25rem; }
    .manual-entry button { background: none; border: none; color: #667eea; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: underline; }

    .sent-section { padding: 0.5rem 1rem; }
    .sent-title { font-size: 0.95rem; font-weight: 700; color: #374151; margin: 1rem 0 0.5rem; }
    .sent-card { display: flex; align-items: center; gap: 0.75rem; background: white; border-radius: 14px; padding: 0.85rem 1rem; margin-bottom: 0.6rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .sent-avatar { width: 42px; height: 42px; border-radius: 12px; background: #f0f4ff; color: #667eea; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sent-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .sent-name { font-size: 0.9rem; font-weight: 600; color: #1a202c; }
    .sent-code { font-size: 0.78rem; color: #6b7280; font-family: monospace; }
    .status-badge { font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: 999px; white-space: nowrap; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.confirmed { background: #d1fae5; color: #065f46; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; }

    .spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .spinner.white { border-color: rgba(255,255,255,0.3); border-top-color: white; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (min-width: 768px) { .rel-grid { grid-template-columns: repeat(4, 1fr); } }
  `]
})
export class StudentLinkParentComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly studentService = inject(StudentService);

  private mediaStream: MediaStream | null = null;

  parentCode = '';
  relationshipType = 'Guardian';

  method = signal<'code' | 'qr'>('code');
  sending = signal(false);
  isScanning = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  sentRequests = signal<ParentStudentDto[]>([]);

  relationshipTypes = [
    { value: 'Father', label: 'أب', icon: 'fas fa-male' },
    { value: 'Mother', label: 'أم', icon: 'fas fa-female' },
    { value: 'Guardian', label: 'وصي', icon: 'fas fa-user-shield' },
    { value: 'Other', label: 'أخرى', icon: 'fas fa-ellipsis-h' },
  ];

  async ngOnInit(): Promise<void> {
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.parentCode = codeParam;
    }
    await this.loadSent();
  }

  ngOnDestroy(): void {
    this.stopQrScan();
  }

  setMethod(m: 'code' | 'qr'): void {
    this.method.set(m);
    this.errorMessage.set('');
    if (m === 'code') this.stopQrScan();
  }

  private async loadSent(): Promise<void> {
    try {
      const list = await lastValueFrom(this.studentService.getSentParentLinkRequestsForCurrentStudent());
      this.sentRequests.set(list ?? []);
    } catch {
      // non-fatal
    }
  }

  async sendRequest(): Promise<void> {
    const code = this.parentCode.trim();
    if (!code) return;
    this.sending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      await lastValueFrom(this.studentService.requestParentLink({
        parentCode: code,
        relationshipType: this.relationshipType,
      }));
      this.successMessage.set('تم إرسال طلب الربط. سيتم تأكيده بعد موافقة ولي الأمر · Request sent; awaiting your parent\'s approval.');
      this.parentCode = '';
      await this.loadSent();
    } catch (error: any) {
      const msg = error?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب';
      this.errorMessage.set(msg);
    } finally {
      this.sending.set(false);
    }
  }

  async startQrScan(): Promise<void> {
    try {
      this.errorMessage.set('');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.isScanning.set(true);
      setTimeout(() => {
        if (this.videoRef?.nativeElement && this.mediaStream) {
          this.videoRef.nativeElement.srcObject = this.mediaStream;
          this.videoRef.nativeElement.play();
          this.scanQrCode();
        }
      }, 100);
    } catch {
      this.errorMessage.set('لا يمكن الوصول للكاميرا. تأكد من منح الإذن.');
      this.isScanning.set(false);
    }
  }

  stopQrScan(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.isScanning.set(false);
  }

  private scanQrCode(): void {
    if (!this.isScanning() || !this.videoRef?.nativeElement) return;
    const video = this.videoRef.nativeElement;
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const detect = async () => {
        if (!this.isScanning()) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) {
            this.handleQrResult(codes[0].rawValue);
            return;
          }
        } catch {
          // keep scanning
        }
        if (this.isScanning()) requestAnimationFrame(detect);
      };
      detect();
    } else {
      this.errorMessage.set('مسح QR غير مدعوم في هذا المتصفح. استخدم الإدخال اليدوي.');
      this.stopQrScan();
      this.setMethod('code');
    }
  }

  private handleQrResult(raw: string): void {
    this.stopQrScan();
    try {
      const url = new URL(raw);
      const code = url.searchParams.get('code');
      this.parentCode = code || raw;
    } catch {
      this.parentCode = raw;
    }
    this.setMethod('code');
    this.sendRequest();
  }

  statusClass(s: number): string {
    return s === 1 ? 'confirmed' : s === 2 ? 'rejected' : 'pending';
  }

  statusLabel(s: number): string {
    return s === 1 ? 'مؤكد · Linked' : s === 2 ? 'مرفوض · Rejected' : 'معلّق · Pending';
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }
}
