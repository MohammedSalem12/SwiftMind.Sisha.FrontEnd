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
        class="ph-back"
        type="button"
        (click)="onBack()"
        aria-label="رجوع · Back"
      >
        <i class="fas fa-arrow-right"></i>
      </button>

      <div class="ph-title">
        <div class="ph-title-text">
          <h1>{{ title }}</h1>
          <span class="ph-title-en" *ngIf="titleEn">{{ titleEn }}</span>
        </div>
        <span class="ph-count" *ngIf="count && count > 0">{{ count }}</span>
      </div>

      <ng-content select="[ph-actions]"></ng-content>
    </header>
  `,
  styles: [
    `
      .ph-topbar {
        position: sticky;
        top: 0;
        z-index: 10;
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

      .ph-title {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
      }

      .ph-title-text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .ph-title-text h1 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 800;
        color: #1a202c;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .ph-title-en {
        font-size: 0.7rem;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .ph-count {
        background: #667eea;
        color: #fff;
        font-size: 0.66rem;
        font-weight: 800;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        padding: 0 0.35rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
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
