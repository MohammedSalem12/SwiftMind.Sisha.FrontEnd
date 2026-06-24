import { Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2 } from '@angular/core';

/**
 * Lightweight pull-to-refresh that works with the app's document-level scroll
 * (no ion-content required). Apply to a page root:
 *
 *   <div class="page" appPullToRefresh (appPullToRefresh)="doRefresh($event)">
 *
 * In the handler, reload data then call $event.complete():
 *   async doRefresh(e:{complete:()=>void}) { await this.load(); e.complete(); }
 */
@Directive({
  selector: '[appPullToRefresh]',
  standalone: true,
})
export class PullToRefreshDirective implements OnInit {
  @Output('appPullToRefresh') refresh = new EventEmitter<{ complete: () => void }>();
  @Input() ptrDisabled = false;
  @Input() ptrThreshold = 70;

  private startY = 0;
  private pulling = false;
  private pull = 0;
  private refreshing = false;
  private indicator!: HTMLElement;
  private readonly maxPull = 110;

  constructor(private el: ElementRef<HTMLElement>, private r: Renderer2) {}

  ngOnInit(): void {
    const host = this.el.nativeElement;
    if (getComputedStyle(host).position === 'static') {
      this.r.setStyle(host, 'position', 'relative');
    }
    // NOTE: do NOT set transform/will-change at rest — a transform on the host
    // makes position:fixed descendants (FABs, modals) anchor to it. Transform is
    // applied only during an active pull and fully removed afterwards.

    this.indicator = this.r.createElement('div');
    this.r.setStyle(this.indicator, 'position', 'absolute');
    this.r.setStyle(this.indicator, 'top', '-54px');
    this.r.setStyle(this.indicator, 'inset-inline', '0');
    this.r.setStyle(this.indicator, 'height', '54px');
    this.r.setStyle(this.indicator, 'display', 'flex');
    this.r.setStyle(this.indicator, 'align-items', 'center');
    this.r.setStyle(this.indicator, 'justify-content', 'center');
    this.r.setStyle(this.indicator, 'pointer-events', 'none');
    this.r.setStyle(this.indicator, 'opacity', '0');
    this.r.setStyle(this.indicator, 'transition', 'opacity .15s');
    this.r.setStyle(this.indicator, 'z-index', '5');
    this.indicator.innerHTML =
      '<ion-spinner name="crescent" style="color:#667eea;width:28px;height:28px"></ion-spinner>';
    this.r.appendChild(host, this.indicator);
  }

  private atTop(): boolean {
    const se = document.scrollingElement || document.documentElement;
    return (se?.scrollTop || window.scrollY || 0) <= 0;
  }

  @HostListener('touchstart', ['$event'])
  onStart(e: TouchEvent): void {
    if (this.ptrDisabled || this.refreshing || !this.atTop()) { this.pulling = false; return; }
    this.startY = e.touches[0].clientY;
    this.pulling = true;
    this.pull = 0;
    this.r.setStyle(this.el.nativeElement, 'will-change', 'transform');
  }

  @HostListener('touchmove', ['$event'])
  onMove(e: TouchEvent): void {
    if (!this.pulling || this.refreshing) return;
    if (!this.atTop()) { this.reset(); return; }
    const dy = e.touches[0].clientY - this.startY;
    if (dy <= 0) { this.reset(); return; }
    this.pull = Math.min(dy * 0.5, this.maxPull); // resistance
    e.preventDefault();
    this.apply(this.pull);
  }

  @HostListener('touchend')
  onEnd(): void {
    if (!this.pulling || this.refreshing) return;
    this.pulling = false;
    if (this.pull >= this.ptrThreshold) {
      this.refreshing = true;
      this.apply(54);
      this.refresh.emit({ complete: () => this.done() });
    } else {
      this.animateBack();
    }
  }

  private apply(px: number): void {
    this.r.setStyle(this.el.nativeElement, 'transform', `translateY(${px}px)`);
    this.r.setStyle(this.indicator, 'opacity', px > 8 ? '1' : '0');
  }

  private animateBack(): void {
    const host = this.el.nativeElement;
    this.r.setStyle(host, 'transition', 'transform .25s ease');
    this.apply(0);
    setTimeout(() => {
      // Remove transform entirely at rest so position:fixed descendants stay viewport-anchored.
      this.r.removeStyle(host, 'transition');
      this.r.removeStyle(host, 'transform');
      this.r.removeStyle(host, 'will-change');
      this.pull = 0;
    }, 260);
  }

  private done(): void {
    this.refreshing = false;
    this.animateBack();
  }

  private reset(): void {
    if (this.pull > 0) this.apply(0);
    this.pulling = false;
    this.pull = 0;
  }
}
