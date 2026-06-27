import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

/**
 * Reusable flat-minimal page header (top bar) used across all feature pages.
 *
 * Design language: flat white bar, sticky to top, dark title, thin bottom
 * border, circular transparent back button (RTL: fa-arrow-right points "back").
 *
 * Usage:
 *   <app-page-header [title]="'الإشعارات'" [titleEn]="'Notifications'" [count]="unread()">
 *     <button ph-actions class="ph-action" (click)="doThing()" aria-label="...">
 *       <i class="fas fa-check-double"></i>
 *     </button>
 *   </app-page-header>
 *
 * Back behavior precedence:
 *   1. [backTo] provided  → router navigation
 *   2. (back) has a bound consumer → emit
 *   3. otherwise → Location.back()
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ph-topbar" data-page-header dir="rtl">
      <button
        *ngIf="showBack"
        class="ph-back"
        type="button"
        (click)="onBack()"
        aria-label="رجوع · Back"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
      <span class="ph-spacer" *ngIf="!showBack" aria-hidden="true"></span>

      <div class="ph-title">
        <h1>
          {{ title }}
          <span class="ph-count" *ngIf="count && count > 0">{{ count }}</span>
        </h1>
        <span class="ph-title-en" *ngIf="titleEn">{{ titleEn }}</span>
      </div>

      <div class="ph-actions">
        <ng-content select="[ph-actions]"></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      /* Host sticks to the top so the bar stays pinned while the page scrolls
         (more robust than sticking the inner element). */
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .ph-topbar {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: #fff;
        padding: 0.55rem 0.6rem;
        padding-top: calc(0.55rem + env(safe-area-inset-top, 0px));
        border-bottom: 1px solid #ececf2;
      }

      .ph-back {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: #1a202c;
        font-size: 1.05rem;
        cursor: pointer;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.15s;
      }

      .ph-back:active {
        background: #f0f0f5;
      }

      /* Keeps the title centred when there is no back button. */
      .ph-spacer {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      /* Centered title; back (start) and actions (end) are equal-width side
         zones so the title stays optically centred — like a native nav bar. */
      .ph-title {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .ph-title h1 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 800;
        color: #1a202c;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        line-height: 1.2;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }

      .ph-title-en {
        font-size: 0.68rem;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        line-height: 1.2;
      }

      .ph-count {
        background: #667eea;
        color: #fff;
        font-size: 0.6rem;
        font-weight: 800;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        padding: 0 0.3rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .ph-actions {
        min-width: 40px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.25rem;
      }

      /* Styling for projected trailing action buttons. ::ng-deep is required
         because the buttons live in the consumer's (projected) DOM. */
      :host ::ng-deep .ph-action {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
        font-size: 0.95rem;
        cursor: pointer;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.15s;
      }

      :host ::ng-deep .ph-action:active {
        background: rgba(102, 126, 234, 0.2);
      }
    `,
  ],
})
export class PageHeaderComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Arabic title (required). */
  @Input({ required: true }) title!: string;

  /** Optional small English subline rendered under the title. */
  @Input() titleEn?: string;

  /** Optional count badge — rendered only when > 0. */
  @Input() count?: number | null;

  /** Optional router target for the back button (string or commands array). */
  @Input() backTo?: string | any[];

  /** Set false on top-level / bottom-nav pages to hide the back button. */
  @Input() showBack = true;

  /** Emitted when back is pressed and no [backTo] is provided and a consumer binds it. */
  @Output() back = new EventEmitter<void>();

  onBack(): void {
    if (this.backTo != null) {
      if (Array.isArray(this.backTo)) {
        this.router.navigate(this.backTo);
      } else {
        this.router.navigateByUrl(this.backTo);
      }
      return;
    }

    if (this.back.observed) {
      this.back.emit();
      return;
    }

    this.location.back();
  }
}
