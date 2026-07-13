import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface RateSubmitEvent {
  stars: number;
  comment: string;
}

/**
 * Interactive rating widget rendered as a bottom-sheet / centered modal overlay.
 * A parent (PARENT role) taps 1–5 stars and optionally writes a comment, then submits.
 *
 * Controlled by the host via the `open` input. Emits `submitted` with { stars, comment }
 * and `closed` when dismissed. Pre-fill via `initialStars` / `initialComment`.
 */
@Component({
  selector: 'app-rate-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open()) {
      <div class="rm-overlay" (click)="onCancel()" dir="rtl">
        <div class="rm-card" (click)="$event.stopPropagation()">

          <button class="rm-close" type="button" (click)="onCancel()" aria-label="إغلاق · Close">
            <i class="fas fa-times"></i>
          </button>

          <div class="rm-header">
            <div class="rm-icon"><i class="fas fa-star"></i></div>
            <h2 class="rm-title">{{ title() }}</h2>
            <p class="rm-sub">اختر عدد النجوم · Tap to rate</p>
          </div>

          <!-- Star picker -->
          <div class="rm-stars" dir="ltr">
            @for (i of [1,2,3,4,5]; track i) {
              <button type="button" class="rm-star-btn"
                      [attr.aria-label]="i + ' نجوم'"
                      (click)="setStars(i)">
                <i class="star" [class.fas]="i <= stars()" [class.fa-star]="true"
                   [class.far]="i > stars()" [class.active]="i <= stars()"></i>
              </button>
            }
          </div>
          <div class="rm-stars-label">
            {{ stars() > 0 ? starsLabel(stars()) : 'لم يتم الاختيار بعد · Not selected' }}
          </div>

          <!-- Comment -->
          <div class="rm-field">
            <label class="rm-label">تعليق (اختياري) · Comment (optional)</label>
            <textarea class="rm-textarea" rows="3" maxlength="500"
                      [ngModel]="comment()" (ngModelChange)="comment.set($event)"
                      placeholder="شاركنا رأيك… · Share your feedback…"></textarea>
            <span class="rm-counter">{{ comment().length }}/500</span>
          </div>

          @if (error()) {
            <div class="rm-error"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div>
          }

          <div class="rm-actions">
            <button type="button" class="rm-btn rm-btn-ghost" (click)="onCancel()" [disabled]="submitting()">
              إلغاء · Cancel
            </button>
            <button type="button" class="rm-btn rm-btn-primary"
                    [disabled]="stars() < 1 || submitting()" (click)="onSubmit()">
              @if (submitting()) { <span class="rm-spinner"></span> }
              @else { <i class="fas fa-paper-plane"></i> }
              {{ submitting() ? 'جاري الإرسال…' : 'إرسال · Submit' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .rm-overlay {
      position:fixed; inset:0; z-index:99999;
      background:rgba(0,0,0,.45); backdrop-filter:blur(4px);
      display:flex; align-items:flex-end; justify-content:center;
      padding:0; animation:rmFade .2s ease;
    }
    @media (min-width:600px) { .rm-overlay { align-items:center; padding:1rem; } }
    @keyframes rmFade { from{opacity:0} to{opacity:1} }

    .rm-card {
      background:#fff; width:100%; max-width:440px; position:relative;
      border-radius:22px 22px 0 0;
      padding:1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom,0px));
      box-shadow:0 -8px 40px rgba(0,0,0,.2);
      animation:rmSlide .28s ease;
    }
    @media (min-width:600px) { .rm-card { border-radius:22px; } }
    @keyframes rmSlide { from{transform:translateY(40px); opacity:0} to{transform:translateY(0); opacity:1} }

    .rm-close {
      position:absolute; top:.9rem; left:.9rem;
      width:36px; height:36px; border-radius:50%;
      background:rgba(0,0,0,.06); border:none; color:#666;
      display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:.9rem;
    }
    .rm-close:active { background:rgba(0,0,0,.12); }

    .rm-header { text-align:center; margin-bottom:1rem; }
    .rm-icon {
      width:56px; height:56px; border-radius:50%; margin:0 auto .6rem;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.4rem;
    }
    .rm-title { margin:0; font-size:1.15rem; font-weight:800; color:#1a1a2e; }
    .rm-sub { margin:.25rem 0 0; font-size:.78rem; color:#9090aa; }

    .rm-stars {
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      margin:.25rem 0 .35rem;
    }
    .rm-star-btn {
      background:none; border:none; cursor:pointer; padding:.3rem;
      min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;
      -webkit-tap-highlight-color:transparent;
    }
    .rm-star-btn .star { font-size:2rem; color:#d8d8e2; transition:transform .1s, color .1s; }
    .rm-star-btn .star.active { color:#f59e0b; }
    .rm-star-btn:active .star { transform:scale(1.15); }
    .rm-stars-label {
      text-align:center; font-size:.8rem; font-weight:700; color:#667eea; margin-bottom:1rem;
      min-height:1.1rem;
    }

    .rm-field { margin-bottom:1rem; position:relative; }
    .rm-label { display:block; font-size:.78rem; font-weight:700; color:#555; margin-bottom:.4rem; }
    .rm-textarea {
      width:100%; box-sizing:border-box; resize:none;
      border:1.5px solid #e0e0f0; border-radius:14px; padding:.75rem;
      font-size:16px; font-family:inherit; color:#1a1a2e; background:#fafafe; outline:none;
    }
    .rm-textarea:focus { border-color:#667eea; background:#fff; box-shadow:0 0 0 3px rgba(102,126,234,.1); }
    .rm-counter {
      position:absolute; bottom:.5rem; left:.75rem; font-size:.66rem; color:#b0b0c0;
    }

    .rm-error {
      display:flex; align-items:center; gap:.4rem; margin-bottom:.9rem;
      font-size:.78rem; font-weight:600; color:#dc2626;
      background:rgba(239,68,68,.08); padding:.5rem .7rem; border-radius:10px;
    }

    .rm-actions { display:flex; gap:.6rem; }
    .rm-btn {
      flex:1; min-height:48px; border-radius:14px; border:none; cursor:pointer;
      font-size:.9rem; font-weight:700; font-family:inherit;
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      -webkit-tap-highlight-color:transparent; transition:opacity .15s, transform .15s;
    }
    .rm-btn:active { transform:scale(.97); }
    .rm-btn:disabled { opacity:.55; cursor:not-allowed; }
    .rm-btn-ghost { background:#f2f2f7; color:#555; flex:0 0 38%; }
    .rm-btn-primary { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; }

    .rm-spinner {
      width:16px; height:16px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%; animation:rmSpin .7s linear infinite; display:inline-block;
    }
    @keyframes rmSpin { to { transform:rotate(360deg); } }
  `],
})
export class RateModalComponent {
  /** Whether the modal is visible. Controlled by the host. */
  open = input<boolean>(false);
  /** Modal title (e.g. "قيّم المعلم · Rate teacher"). */
  title = input<string>('قيّم · Rate');
  /** Pre-selected stars (e.g. the parent's existing rating). */
  initialStars = input<number>(0);
  /** Pre-filled comment. */
  initialComment = input<string>('');
  /** Whether a submit request is in flight. */
  submitting = input<boolean>(false);
  /** Optional error message to show inside the modal. */
  error = input<string | null>(null);

  /** Emitted when the parent submits a rating. */
  submitted = output<RateSubmitEvent>();
  /** Emitted when the modal is dismissed without submitting. */
  closed = output<void>();

  stars = signal(0);
  comment = signal('');

  constructor() {
    // Reset internal state from the pre-fill inputs each time the modal opens.
    effect(() => {
      if (this.open()) {
        this.stars.set(this.initialStars() ?? 0);
        this.comment.set(this.initialComment() ?? '');
      }
    });
  }

  setStars(n: number): void {
    this.stars.set(n);
  }

  starsLabel(n: number): string {
    const labels: Record<number, string> = {
      1: 'سيئ · Poor',
      2: 'مقبول · Fair',
      3: 'جيد · Good',
      4: 'جيد جداً · Very good',
      5: 'ممتاز · Excellent',
    };
    return labels[n] ?? '';
  }

  onSubmit(): void {
    if (this.stars() < 1 || this.submitting()) return;
    this.submitted.emit({ stars: this.stars(), comment: this.comment().trim() });
  }

  onCancel(): void {
    if (this.submitting()) return;
    this.closed.emit();
  }
}
