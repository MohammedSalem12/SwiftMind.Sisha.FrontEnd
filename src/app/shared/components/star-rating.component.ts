import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Read-only star rating display.
 * Renders 5 stars (full / half / empty) for a 0–5 value, with an optional "(count)" label.
 * Small, inline and RTL-friendly. Uses FontAwesome (fa-star / fa-star-half-alt / far fa-star).
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span class="stars-wrap" [class.stars-sm]="size() === 'sm'"
          dir="ltr"
          [attr.aria-label]="'التقييم ' + display() + ' من 5 · Rating ' + display() + ' out of 5'">
      @for (s of icons(); track $index) {
        <i class="star" [class]="s"></i>
      }
      @if (count() !== null && count() !== undefined) {
        <span class="count">({{ count() }})</span>
      }
    </span>
  `,
  styles: [`
    .stars-wrap {
      display:inline-flex; align-items:center; gap:.12rem;
      white-space:nowrap; line-height:1;
    }
    .star { font-size:.9rem; color:#f59e0b; }
    .star.empty { color:#d8d8e2; }
    .stars-sm .star { font-size:.72rem; }
    .count {
      margin-left:.3rem; font-size:.72rem; font-weight:700; color:#9090aa;
    }
    .stars-sm .count { font-size:.66rem; }
  `],
})
export class StarRatingComponent {
  /** Rating value 0–5 (may be fractional, e.g. 3.5). */
  value = input<number | null | undefined>(0);
  /** Optional number of ratings shown as "(count)". Pass null/undefined to hide. */
  count = input<number | null | undefined>(undefined);
  /** Visual size: 'md' (default) or 'sm' for compact card usage. */
  size = input<'md' | 'sm'>('md');

  /** Clamped, rounded-to-nearest-half value used for rendering. */
  private readonly rounded = computed(() => {
    const raw = Number(this.value() ?? 0);
    const clamped = Math.max(0, Math.min(5, isNaN(raw) ? 0 : raw));
    return Math.round(clamped * 2) / 2;
  });

  /** Value shown in the aria/label text (one decimal). */
  display = computed(() => this.rounded().toFixed(1));

  /** FontAwesome class per star position. */
  icons = computed<string[]>(() => {
    const v = this.rounded();
    const out: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (v >= i) out.push('fas fa-star');
      else if (v >= i - 0.5) out.push('fas fa-star-half-alt');
      else out.push('far fa-star empty');
    }
    return out;
  });
}
