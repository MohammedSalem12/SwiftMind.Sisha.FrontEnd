import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Moves the host element to <body> on init so a `position: fixed` layout is anchored to
 * the viewport, not to a transformed / containing-block ancestor.
 *
 * Some ancestors (an ABP/LeptonX layout wrapper, a `transform`, `filter`, `backdrop-filter`,
 * `will-change`, or `contain`) turn `position: fixed` descendants into "absolute relative to
 * that ancestor" — which makes floating FABs scroll with the page and become unclickable
 * until you scroll to where they were anchored. Teleporting to <body> sidesteps all of that.
 *
 * The element keeps its Angular bindings and event handlers after the move (Angular tracks the
 * node by reference). On destroy it is removed from the DOM.
 */
@Directive({
  selector: '[appFixedToBody]',
  standalone: true,
})
export class FixedToBodyDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    const node = this.el.nativeElement;
    if (node.parentElement !== document.body) {
      document.body.appendChild(node);
    }
  }

  ngOnDestroy(): void {
    this.el.nativeElement.remove();
  }
}
