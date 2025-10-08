import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new Subject<ToastMessage>();
  messages$ = this.subject.asObservable();

  show(text: string, type: ToastMessage['type'] = 'info', timeout = 5000) {
    const msg: ToastMessage = { id: Math.random().toString(36).slice(2), type, text, timeout };
    this.subject.next(msg);
    return msg.id;
  }
}
