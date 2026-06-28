import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageProfileComponent } from '@abp/ng.account';
import { PageHeaderComponent } from '../shared/components/page-header.component';

/**
 * Thin wrapper that puts the app's unified header above ABP's standalone
 * Manage-Profile UI (change password / personal settings). It shadows the
 * library's `account/manage` route so the page gets a back button + title
 * consistent with the rest of the app (the global top-bar was retired).
 */
@Component({
  selector: 'app-account-manage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent, ManageProfileComponent],
  template: `
    <div class="acct-page" dir="rtl">
      <app-page-header [title]="'إدارة الحساب'" [titleEn]="'My Account'"></app-page-header>
      <div class="acct-body">
        <abp-manage-profile></abp-manage-profile>
      </div>
    </div>
  `,
  styles: [`
    .acct-page { min-height: 100vh; background: #f4f5fb; }
    .acct-body {
      padding: 1rem;
      max-width: 900px;
      margin: 0 auto;
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }
  `],
})
export class AccountManageComponent {}
