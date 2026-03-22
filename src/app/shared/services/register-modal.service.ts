import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RegisterModalService {
  readonly isOpen = signal(false);

  show(): void { this.isOpen.set(true); }
  dismiss(): void { this.isOpen.set(false); }
}
