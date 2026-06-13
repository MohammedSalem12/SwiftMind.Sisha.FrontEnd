import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-server-offline-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="overlay" dir="rtl" (click)="dismiss()">
        <div class="card" (click)="$event.stopPropagation()">
          <div class="icon-ring">
            <div class="pulse-ring"></div>
            <i class="fas fa-server"></i>
          </div>
          <h2>الخادم غير متاح حالياً</h2>
          <p class="sub-en">Server is currently unavailable</p>
          <p class="desc">يتعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقاً.</p>
          <p class="desc-en">Unable to reach the server. Please check your connection or try again later.</p>
          <button class="retry-btn" (click)="retry()">
            <i class="fas fa-redo-alt"></i>
            إعادة المحاولة · Retry
          </button>
          <button class="dismiss-btn" (click)="dismiss()">
            تجاهل · Dismiss
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
      animation: fadeIn .3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .card {
      background: white; border-radius: 24px;
      padding: 2rem 1.5rem 1.5rem;
      text-align: center; max-width: 340px; width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
      animation: slideUp .35s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .icon-ring {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem; position: relative;
      i { font-size: 2rem; color: #dc2626; z-index: 1; }
    }
    .pulse-ring {
      position: absolute; inset: -6px; border-radius: 50%;
      border: 3px solid rgba(220,38,38,.2);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: .7; }
      50% { transform: scale(1.15); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }

    h2 { font-size: 1.2rem; font-weight: 800; color: #1a1a2e; margin: 0 0 .2rem; }
    .sub-en { font-size: .78rem; color: #9ca3af; margin: 0 0 .75rem; }
    .desc { font-size: .85rem; color: #4a4a6a; margin: 0 0 .2rem; line-height: 1.5; }
    .desc-en { font-size: .75rem; color: #9ca3af; margin: 0 0 1.25rem; }

    .retry-btn {
      width: 100%; padding: .85rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 14px;
      font-size: .95rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      min-height: 50px; box-shadow: 0 4px 14px rgba(102,126,234,.3);
      transition: transform .15s;
      &:active { transform: scale(.98); }
    }
    .dismiss-btn {
      width: 100%; padding: .6rem; margin-top: .5rem;
      background: transparent; border: none;
      color: #9ca3af; font-size: .8rem; cursor: pointer;
      min-height: 44px;
    }
  `],
})
export class ServerOfflineOverlayComponent {
  visible = signal(false);

  show(): void { this.visible.set(true); }
  dismiss(): void { this.visible.set(false); }
  retry(): void {
    this.visible.set(false);
    window.location.reload();
  }
}
