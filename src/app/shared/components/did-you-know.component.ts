import { ChangeDetectionStrategy, Component, input, signal, OnInit, OnDestroy, inject, computed, HostListener, ElementRef, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface KnowledgeCard {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  topic: string;
  cardType: string;
}

const TOPIC_ICONS: Record<string, string> = {
  science: 'fa-flask',
  geography: 'fa-globe-africa',
  islam: 'fa-mosque',
  technology: 'fa-microchip',
  cybersecurity: 'fa-shield-alt',
  data_protection: 'fa-lock',
  internet_safety: 'fa-user-shield',
  digital_literacy: 'fa-laptop-code',
  cyber_ethics: 'fa-balance-scale',
  social_media_safety: 'fa-users-cog',
  device_security: 'fa-mobile-alt',
  online_privacy: 'fa-eye-slash',
};

const TOPIC_COLORS: Record<string, string> = {
  science: '#059669',
  geography: '#d97706',
  islam: '#667eea',
  technology: '#dc2626',
  cybersecurity: '#0891b2',
  data_protection: '#7c3aed',
  internet_safety: '#ea580c',
  digital_literacy: '#2563eb',
  cyber_ethics: '#b45309',
  social_media_safety: '#e11d48',
  device_security: '#0d9488',
  online_privacy: '#6d28d9',
};

// Fallback tips if API fails
const FALLBACK: Record<string, { ar: string; en: string }[]> = {
  STUDENT: [
    { ar: 'يمكنك متابعة درجاتك وحضورك مباشرة من التطبيق', en: 'Track your grades and attendance directly from the app' },
    { ar: 'استخدم رمز QR الخاص بك لربط حساب ولي أمرك', en: 'Use your QR code to link your parent account' },
  ],
  TEACHER: [
    { ar: 'يمكنك إنشاء مجموعات وجداول حصص لكل مقرر', en: 'Create groups and class schedules for each course' },
    { ar: 'استخدم رموز QR لتسهيل تسجيل حضور الطلاب', en: 'Use QR codes to simplify student attendance' },
  ],
  PARENT: [
    { ar: 'يمكنك متابعة حضور وغياب أبنائك ودرجاتهم', en: 'Track your children attendance and grades' },
    { ar: 'اربط حساب طفلك باستخدام كود الطالب أو رمز QR', en: 'Link your child account using student code or QR' },
  ],
  SECRETARY: [
    { ar: 'يمكنك ربط حسابك بمعلمين لإدارة مقرراتهم', en: 'Link your account with teachers to manage their courses' },
  ],
};

@Component({
  selector: 'app-did-you-know',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <!-- Floating "i" information icon — always on top of page content -->
    <button #fab class="info-fab" type="button" [class.has-badge]="hasNewBadge()"
      (click)="openOverlay()"
      aria-label="هل تعلم؟ · Did you know" aria-haspopup="dialog" [attr.aria-expanded]="open()">
      <i class="fas fa-info"></i>
      @if (hasNewBadge()) { <span class="fab-badge" aria-hidden="true"></span> }
    </button>

    <!-- Overlay: bottom-sheet on mobile, centered modal on desktop.
         Teleported to <body> on open so it escapes the home page's stacking context. -->
    @if (open()) {
      <div #backdrop class="kc-backdrop" (click)="closeOverlay()">
        <div #dialog class="kc-sheet" dir="rtl" role="dialog" aria-modal="true"
          [attr.aria-label]="dialogLabel()" tabindex="-1"
          (click)="$event.stopPropagation()" (keydown)="onDialogKeydown($event)">

          <div class="kc-handle" aria-hidden="true"></div>
          <button class="kc-close" (click)="closeOverlay()" aria-label="إغلاق · Close" type="button">
            <i class="fas fa-times"></i>
          </button>

          <div class="kc-body">
            <div class="tip-icon" [style.background]="iconBg()">
              <i class="fas" [class]="iconClass()"></i>
            </div>
            <div class="kc-text">
              @if (card()) {
                <div class="tip-header">
                  <span class="tip-label">{{ card()!.cardType === 'did_you_know' ? 'هل تعلم؟' : 'معلومة' }}</span>
                  <span class="tip-topic">{{ getTopicLabel(card()!.topic) }}</span>
                </div>
                <span class="tip-title">{{ card()!.titleAr }}</span>
                <span class="tip-text">{{ card()!.contentAr }}</span>
                <span class="tip-text-en">{{ card()!.contentEn }}</span>
              } @else {
                <span class="tip-label">هل تعلم؟ · Did you know?</span>
                <span class="tip-text">{{ fallbackTip().ar }}</span>
                <span class="tip-text-en">{{ fallbackTip().en }}</span>
              }
            </div>
          </div>

          <div class="kc-footer">
            <button class="tip-next" [disabled]="loading()" (click)="onNext()" type="button">
              @if (loading()) {
                <i class="fas fa-spinner fa-spin"></i>
              } @else {
                <i class="fas fa-arrow-left"></i>
              }
              التالي · Next
            </button>
            <button class="kc-pause" (click)="togglePause()" type="button"
              [attr.aria-label]="paused() ? 'تشغيل التبديل التلقائي · Resume autoplay' : 'إيقاف التبديل التلقائي · Pause autoplay'">
              <i class="fas" [class.fa-pause]="!paused()" [class.fa-play]="paused()"></i>
            </button>
            <div class="countdown-ring" aria-hidden="true" (click)="onNext()">
              <svg viewBox="0 0 36 36" class="ring-svg">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(102,126,234,.15)" stroke-width="2.5"/>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#667eea" stroke-width="2.5"
                  stroke-dasharray="97.4" [attr.stroke-dashoffset]="ringOffset()"
                  stroke-linecap="round" class="ring-progress"/>
              </svg>
              <span class="ring-text">{{ countdown() }}</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ─── Floating "i" FAB ─────────────────────────────────────────── */
    .info-fab {
      position: fixed;
      /* Bottom-RIGHT, aligned to the same baseline as the student-home action
         cluster (which sits bottom-LEFT) so the two never intersect and read as
         a balanced pair. The 80px offset clears the per-page bottom action bar
         (register / link-child) and the bottom nav on every home screen. */
      right: 14px;
      bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 12px);
      width: 52px; height: 52px; border-radius: 50%;
      border: none; cursor: pointer;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 20px rgba(102,126,234,.42);
      z-index: 9000;
      -webkit-tap-highlight-color: transparent;
      transition: transform .15s, box-shadow .2s;
      i { font-size: 1.15rem; }
    }
    .info-fab:active { transform: scale(.92); }
    .info-fab.has-badge::before {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      pointer-events: none;
      animation: fab-pulse 2.4s ease-out infinite;
    }
    @keyframes fab-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(102,126,234,.45); }
      70%  { box-shadow: 0 0 0 15px rgba(102,126,234,0); }
      100% { box-shadow: 0 0 0 0 rgba(102,126,234,0); }
    }
    .fab-badge {
      position: absolute; top: 2px; right: 2px;
      width: 13px; height: 13px; border-radius: 50%;
      background: #e11d48; border: 2px solid #fff;
    }
    /* Desktop: keep it bottom-right; offset still clears any bottom action bar */
    @media (min-width: 768px) {
      .info-fab { right: 24px; bottom: calc(88px + env(safe-area-inset-bottom, 0px)); width: 56px; height: 56px; }
    }

    /* ─── Overlay backdrop ─────────────────────────────────────────── */
    .kc-backdrop {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(15,15,35,.5);
      -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
      display: flex; align-items: flex-end; justify-content: center;
      animation: kc-fade .25s ease;
    }
    @keyframes kc-fade { from { opacity: 0; } to { opacity: 1; } }
    @media (min-width: 768px) {
      .kc-backdrop { align-items: center; padding: 1rem; }
    }

    /* ─── Sheet / modal ────────────────────────────────────────────── */
    .kc-sheet {
      position: relative; width: 100%;
      background: #fff;
      border-radius: 24px 24px 0 0;
      padding: 1rem 1.15rem calc(1.15rem + env(safe-area-inset-bottom, 0px));
      box-shadow: 0 -8px 40px rgba(0,0,0,.25);
      max-height: 85vh; overflow-y: auto;
      animation: kc-slide-up .3s cubic-bezier(.32,.72,0,1);
    }
    @keyframes kc-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @media (min-width: 768px) {
      .kc-sheet {
        max-width: 420px; border-radius: 24px;
        padding: 1.5rem 1.5rem 1.25rem;
        box-shadow: 0 24px 70px rgba(0,0,0,.3);
        animation: kc-pop .2s ease-out;
      }
      @keyframes kc-pop { from { transform: scale(.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    }
    .kc-handle {
      width: 40px; height: 4px; background: #e0e0ee; border-radius: 2px;
      margin: 0 auto .9rem;
    }
    @media (min-width: 768px) { .kc-handle { display: none; } }
    .kc-close {
      position: absolute; top: .6rem; left: .6rem;
      width: 44px; height: 44px; border-radius: 50%;
      border: none; background: transparent; cursor: pointer;
      color: #9090aa; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
      &:active { background: rgba(0,0,0,.05); }
    }

    /* ─── Card content (reused look) ───────────────────────────────── */
    .kc-body { display: flex; align-items: flex-start; gap: .75rem; }
    .tip-icon {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { font-size: 1rem; color: white; }
    }
    .kc-text { flex: 1; display: flex; flex-direction: column; gap: .2rem; min-width: 0; }
    .tip-header { display: flex; align-items: center; gap: .4rem; margin-bottom: .1rem; }
    .tip-label { font-size: .72rem; font-weight: 700; color: #667eea; }
    .tip-topic {
      font-size: .62rem; font-weight: 600;
      background: rgba(102,126,234,.1); color: #764ba2;
      padding: .08rem .4rem; border-radius: 6px;
    }
    .tip-title { font-size: 1rem; font-weight: 800; color: #1a1a2e; line-height: 1.35; }
    .tip-text { font-size: .85rem; font-weight: 500; color: #44445e; line-height: 1.6; margin-top: .15rem; }
    .tip-text-en { font-size: .72rem; color: #6b6b85; line-height: 1.5; margin-top: .15rem; }

    .kc-footer { display: flex; align-items: center; gap: .5rem; margin-top: 1rem; }
    .tip-next {
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      flex: 1; padding: .55rem .75rem;
      border-radius: 12px; border: 1.5px solid rgba(102,126,234,.2);
      background: rgba(102,126,234,.06); color: #667eea;
      font-size: .82rem; font-weight: 700; cursor: pointer;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
      &:active { background: rgba(102,126,234,.15); }
      &:disabled { opacity: .5; cursor: default; }
      i { font-size: .7rem; }
    }
    .kc-pause {
      width: 44px; height: 44px; border-radius: 12px;
      border: 1.5px solid rgba(102,126,234,.2);
      background: rgba(102,126,234,.06); color: #667eea;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
      &:active { background: rgba(102,126,234,.15); }
      i { font-size: .8rem; }
    }
    .countdown-ring {
      position: relative; width: 44px; height: 44px;
      flex-shrink: 0; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .ring-svg { width: 44px; height: 44px; transform: rotate(-90deg); }
    .ring-progress { transition: stroke-dashoffset 1s linear; }
    .ring-text {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 800; color: #667eea;
    }

    @media (prefers-reduced-motion: reduce) {
      .kc-backdrop, .kc-sheet { animation: none; }
      .info-fab.has-badge::before { animation: none; }
      .ring-progress { transition: none; }
    }
  `],
})
export class DidYouKnowComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  role = input<string>('STUDENT');
  grade = input<number | null>(null);

  cards = signal<KnowledgeCard[]>([]);
  currentIndex = signal(0);
  card = computed(() => this.cards().length > 0 ? this.cards()[this.currentIndex()] : null);
  fallbackTip = signal<{ ar: string; en: string }>({ ar: '', en: '' });

  // Overlay state
  open = signal(false);
  paused = signal(false);
  hasNewBadge = signal(false);
  dialogLabel = computed(() => this.card()?.titleAr || 'هل تعلم؟ · Did you know');

  private readonly fabRef = viewChild<ElementRef<HTMLButtonElement>>('fab');
  private readonly dialogRef = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly backdropRef = viewChild<ElementRef<HTMLElement>>('backdrop');

  private static readonly DURATION = 10;
  countdown = signal(DidYouKnowComponent.DURATION);
  ringOffset = computed(() => {
    const pct = this.countdown() / DidYouKnowComponent.DURATION;
    return 97.4 * pct; // circumference = 2*PI*15.5 ≈ 97.4
  });
  private timerInterval: any = null;

  iconClass = computed(() => {
    const c = this.card();
    if (!c) return 'fas fa-lightbulb';
    return 'fas ' + (TOPIC_ICONS[c.topic] || 'fa-lightbulb');
  });
  iconBg = computed(() => {
    const c = this.card();
    if (!c) return 'linear-gradient(135deg, #667eea, #764ba2)';
    const color = TOPIC_COLORS[c.topic] || '#667eea';
    return `linear-gradient(135deg, ${color}, ${color}dd)`;
  });

  private readonly apiBase = (environment as any).apis?.default?.url || '';

  async ngOnInit(): Promise<void> {
    // Show the pulsing "new tip" hint until the user opens the overlay once.
    try { this.hasNewBadge.set(!localStorage.getItem('kc_info_seen')); } catch { this.hasNewBadge.set(true); }

    // Pause/resume auto-advance when the app is backgrounded.
    document.addEventListener('visibilitychange', this.onVisibility);

    // Set fallback first
    const tips = FALLBACK[this.role().toUpperCase()] || FALLBACK['STUDENT'];
    this.fallbackTip.set(tips[new Date().getDate() % tips.length]);

    // Try to fetch batch from API (timer only starts when the overlay opens).
    try {
      const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
      const result = await lastValueFrom(
        this.http.get<KnowledgeCard[]>(`${this.apiBase}/api/knowledge-cards/random-batch?count=5${gradeParam}`)
      );
      if (result?.length) {
        this.cards.set(result);
        this.currentIndex.set(0);
      }
    } catch {
      // Try single card fallback
      try {
        const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
        const single = await lastValueFrom(
          this.http.get<KnowledgeCard>(`${this.apiBase}/api/knowledge-cards/random?${gradeParam}`)
        );
        if (single) {
          this.cards.set([single]);
        }
      } catch {
        // Use fallback — already set
      }
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  // ─── Overlay open / close ───────────────────────────────────────────
  openOverlay(): void {
    if (this.open()) return;
    this.open.set(true);
    if (this.hasNewBadge()) {
      this.hasNewBadge.set(false);
      try { localStorage.setItem('kc_info_seen', '1'); } catch { /* ignore */ }
    }
    if (!this.paused()) this.startTimer();
    // After the @if renders, teleport the backdrop to <body> so it sits above all
    // page content regardless of any transformed/stacking-context ancestor on the
    // host page, then move focus into the dialog.
    setTimeout(() => {
      const backdrop = this.backdropRef()?.nativeElement;
      if (backdrop && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
      }
      this.dialogRef()?.nativeElement?.focus();
    }, 0);
  }

  closeOverlay(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.clearTimer();
    // Return focus to the launching FAB.
    setTimeout(() => this.fabRef()?.nativeElement?.focus(), 0);
  }

  togglePause(): void {
    this.paused.update(p => !p);
    if (this.paused()) this.clearTimer();
    else if (this.open()) this.startTimer();
  }

  async onNext(): Promise<void> {
    await this.showNext();
    if (this.open() && !this.paused()) this.resetTimer();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closeOverlay();
  }

  onDialogKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const el = this.dialogRef()?.nativeElement;
    if (!el) return;
    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    ).filter(n => n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  private readonly onVisibility = (): void => {
    if (document.hidden) this.clearTimer();
    else if (this.open() && !this.paused()) this.startTimer();
  };

  private startTimer(): void {
    this.clearTimer();
    this.countdown.set(DidYouKnowComponent.DURATION);
    this.timerInterval = setInterval(() => {
      const val = this.countdown() - 1;
      if (val <= 0) {
        this.countdown.set(0);
        this.clearTimer();
        this.showNext().then(() => this.startTimer());
      } else {
        this.countdown.set(val);
      }
    }, 1000);
  }

  resetTimer(): void {
    this.startTimer();
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  loading = signal(false);

  async showNext(): Promise<void> {
    const total = this.cards().length;
    const nextIdx = this.currentIndex() + 1;

    // If there are more pre-fetched cards, cycle to next
    if (nextIdx < total) {
      this.currentIndex.set(nextIdx);
      return;
    }

    // If we've seen all pre-fetched cards (max 5), loop back
    if (total >= 5) {
      this.currentIndex.set(0);
      return;
    }

    // Otherwise fetch a fresh one
    this.loading.set(true);
    try {
      const gradeParam = this.grade() ? `&grade=${this.grade()}` : '';
      const result = await lastValueFrom(
        this.http.get<KnowledgeCard>(`${this.apiBase}/api/knowledge-cards/random?${gradeParam}`)
      );
      if (result) {
        this.cards.update(arr => [...arr, result]);
        this.currentIndex.set(this.cards().length - 1);
      }
    } catch {
      // Loop back to start if fetch fails
      if (total > 0) this.currentIndex.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  getTopicLabel(topic: string): string {
    const labels: Record<string, string> = {
      science: 'علوم',
      geography: 'جغرافيا',
      islam: 'إسلام',
      technology: 'تقنية',
      cybersecurity: 'أمن سيبراني',
      data_protection: 'حماية البيانات',
      internet_safety: 'أمان الإنترنت',
      digital_literacy: 'محو أمية رقمية',
      cyber_ethics: 'أخلاقيات رقمية',
      social_media_safety: 'أمان التواصل',
      device_security: 'أمان الأجهزة',
      online_privacy: 'الخصوصية الرقمية',
    };
    return labels[topic] || topic;
  }
}
