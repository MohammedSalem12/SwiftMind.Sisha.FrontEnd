import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-toasts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let m of messages" class="toast" [ngClass]="m.type">
        {{ m.text }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; right: 20px; top: 20px; z-index: 1200; display:flex; flex-direction:column; gap:8px }
    .toast { padding:10px 14px; border-radius:6px; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.12) }
    .toast.info { background:#0d6efd }
    .toast.success { background:#198754 }
    .toast.error { background:#dc3545 }
  `]
})
export class ToastContainerComponent implements OnInit {
  private svc = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  messages: ToastMessage[] = [];

  ngOnInit(): void {
    this.svc.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(m => {
      this.messages = [m, ...this.messages];
      if (m.timeout && m.timeout > 0) {
        timer(m.timeout).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.messages = this.messages.filter(x => x.id !== m.id);
        });
      }
    });
  }
}
