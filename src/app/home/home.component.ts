import {AuthService} from '@abp/ng.core';
import { Component, inject } from '@angular/core';
import {CommonModule} from "@angular/common";
import { Router } from '@angular/router';
import { UserProfileService } from '@volo/ngx-lepton-x.core';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule,  AsyncPipe]
})
export class HomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);

  // Observable for current user info
  readonly user$ = this.userProfileService.user$;

  get hasLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  login() {
    this.authService.navigateToLogin();
  }

  goToAddTeacher() {
    this.router.navigate(['/add-teacher']);
  }

  manageProfile() {
    this.router.navigate(['/account/manage-profile']);
  }
}
