import { Directive, inject, AfterViewInit, Renderer2, ElementRef, OnDestroy, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { RealtimeNotificationService } from './services/realtime-notification.service';

@Directive({
  selector: '[appSidebarNotification]',
  standalone: true
})
export class SidebarNotificationDirective implements AfterViewInit, OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly realtimeService = inject(RealtimeNotificationService);
  
  private destroy$ = new Subject<void>();
  private badgeElement: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    // Listen to route changes to update badge
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateBadge();
      });

    // Listen to unread count changes using effect
    effect(() => {
      this.updateBadge();
    });
  }

  ngAfterViewInit() {
    // Wait for the sidebar to be rendered
    this.waitForSidebarAndAddBadge();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.badgeElement) {
      this.badgeElement.remove();
    }
  }

  private waitForSidebarAndAddBadge() {
    const checkForSidebar = () => {
      const sidebar = document.querySelector('[data-abp-sidebar]') || 
                       document.querySelector('.sidebar') ||
                       document.querySelector('.abp-sidebar') ||
                       document.querySelector('[class*="sidebar"]') ||
                       document.querySelector('[class*="menu"]');

      if (sidebar) {
        this.addNotificationBadge(sidebar);
      } else {
        // Try again after a short delay
        setTimeout(checkForSidebar, 100);
      }
    };

    checkForSidebar();
  }

  private addNotificationBadge(sidebar: Element) {
    // Find the notifications menu item
    const notificationsItem = this.findNotificationsMenuItem(sidebar);
    
    if (notificationsItem) {
      // Create badge container
      const badgeContainer = this.renderer.createElement('span');
      this.renderer.setStyle(badgeContainer, 'position', 'relative');
      
      // Create badge element
      this.badgeElement = this.renderer.createElement('span');
      this.renderer.addClass(this.badgeElement, 'sidebar-notification-badge');
      this.updateBadgeContent();
      
      // Add badge styles
      this.renderer.setStyle(this.badgeElement, 'position', 'absolute');
      this.renderer.setStyle(this.badgeElement, 'top', '-8px');
      this.renderer.setStyle(this.badgeElement, 'left', '-8px');
      this.renderer.setStyle(this.badgeElement, 'background', '#ef4444');
      this.renderer.setStyle(this.badgeElement, 'color', 'white');
      this.renderer.setStyle(this.badgeElement, 'font-size', '0.625rem');
      this.renderer.setStyle(this.badgeElement, 'font-weight', '700');
      this.renderer.setStyle(this.badgeElement, 'min-width', '18px');
      this.renderer.setStyle(this.badgeElement, 'height', '18px');
      this.renderer.setStyle(this.badgeElement, 'border-radius', '9px');
      this.renderer.setStyle(this.badgeElement, 'display', 'flex');
      this.renderer.setStyle(this.badgeElement, 'align-items', 'center');
      this.renderer.setStyle(this.badgeElement, 'justify-content', 'center');
      this.renderer.setStyle(this.badgeElement, 'padding', '0 4px');
      this.renderer.setStyle(this.badgeElement, 'z-index', '10');
      this.renderer.setStyle(this.badgeElement, 'box-shadow', '0 2px 4px rgba(239, 68, 68, 0.3)');
      this.renderer.setStyle(this.badgeElement, 'animation', 'badgeIn 0.3s ease');
      
      // Add pulse animation if there are unread notifications
      if (this.realtimeService.unreadCount() > 0) {
        this.renderer.setStyle(this.badgeElement, 'animation', 'pulse 2s infinite');
      }

      // Append badge to container
      this.renderer.appendChild(badgeContainer, this.badgeElement);
      
      // Find the icon element and append badge
      const iconElement = notificationsItem.querySelector('i') || notificationsItem.querySelector('[class*="icon"]');
      if (iconElement) {
        this.renderer.appendChild(iconElement, badgeContainer);
      } else {
        // If no icon found, append to the menu item itself
        this.renderer.setStyle(notificationsItem, 'position', 'relative');
        this.renderer.appendChild(notificationsItem, badgeContainer);
      }

      // Add CSS animations
      this.addAnimationStyles();
    }
  }

  private findNotificationsMenuItem(sidebar: Element): Element | null {
    // Try multiple selectors to find the notifications menu item
    const selectors = [
      '[title*="الإشعارات"]',
      '[title*="إشعارات"]',
      'a[href*="notifications"]',
      '[class*="notifications"]',
      'i.fa-bell',
      '[class*="bell"]',
      'span:contains("الإشعارات")',
      'span:contains("إشعارات")'
    ];

    for (const selector of selectors) {
      const element = sidebar.querySelector(selector);
      if (element) {
        // If it's an icon, get its parent menu item
        if (element.tagName === 'I' || element.tagName === 'i') {
          return element.closest('a, li, [role="menuitem"], .menu-item') || element.parentElement;
        }
        return element;
      }
    }

    // Try to find by text content
    const allLinks = Array.from(sidebar.querySelectorAll('a, li, [role="menuitem"], .menu-item'));
    for (const link of allLinks) {
      const text = link.textContent?.trim().toLowerCase();
      if (text?.includes('إشعارات') || text?.includes('notifications')) {
        return link;
      }
    }

    return null;
  }

  private updateBadge() {
    if (this.badgeElement) {
      this.updateBadgeContent();
      
      // Update visibility
      const isDesktop = window.innerWidth >= 992;
      const isNotificationsPage = this.router.url === '/notifications' || this.router.url.includes('/notifications');
      const hasUnread = this.realtimeService.unreadCount() > 0;
      
      const shouldShow = isDesktop && !isNotificationsPage && hasUnread;
      this.renderer.setStyle(this.badgeElement, 'display', shouldShow ? 'flex' : 'none');
      
      // Update animation
      if (hasUnread) {
        this.renderer.setStyle(this.badgeElement, 'animation', 'pulse 2s infinite');
      } else {
        this.renderer.setStyle(this.badgeElement, 'animation', 'none');
      }
    }
  }

  private updateBadgeContent() {
    if (this.badgeElement) {
      const count = this.realtimeService.unreadCount();
      this.badgeElement.textContent = count > 9 ? '9+' : count.toString();
    }
  }

  private addAnimationStyles() {
    if (document.getElementById('sidebar-badge-styles')) return;

    const style = this.renderer.createElement('style');
    style.id = 'sidebar-badge-styles';
    style.textContent = `
      @keyframes badgeIn {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
      
      @media (max-width: 991px) {
        .sidebar-notification-badge {
          display: none !important;
        }
      }
    `;
    
    this.renderer.appendChild(document.head, style);
  }
}
