import { Injectable, inject, signal } from '@angular/core';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { CurrentUserInfoService } from '../proxy/common/current-user-info.service';
import { UserRegistrationType } from '../proxy/domain/shared/enums/user-registration-type.enum';
import type { CurrentUserActorDto } from '../proxy/common/models';
import { lastValueFrom } from 'rxjs';

export interface UserRoleInfo {
  userType: UserRegistrationType | null;
  roles: string[];
  actorId?: string;
  actorType?: string;
  actorName?: string;
  actorCode?: string;
  userId?: string;
  userName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleBasedUIService {
  private readonly authService = inject(AuthService);
  private readonly configStateService = inject(ConfigStateService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  private currentUserInfo = signal<UserRoleInfo | null>(null);
  private loading = signal(false);

  constructor() {
    this.loadCurrentUser();
  }

  get userInfo() {
    return this.currentUserInfo;
  }

  get isLoading() {
    return this.loading;
  }

  private async loadCurrentUser(): Promise<void> {
    if (!this.authService.isAuthenticated) {
      this.currentUserInfo.set(null);
      return;
    }

    this.loading.set(true);
    try {
      // Get user info from ABP config state
      const currentUser = this.configStateService.getOne('currentUser') as any;
      
      // Get additional actor info from API
      const actorInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());

      // Combine information
      const userRoleInfo: UserRoleInfo = {
        userType: this.determineUserType(currentUser, actorInfo),
        roles: this.extractRoles(currentUser),
        actorId: actorInfo.actorId,
        actorType: actorInfo.actorType,
        actorName: actorInfo.actorName,
        actorCode: actorInfo.actorCode,
        userId: actorInfo.userId || currentUser?.id,
        userName: actorInfo.userName || currentUser?.userName,
        email: actorInfo.email || currentUser?.email
      };

      this.currentUserInfo.set(userRoleInfo);
    } catch (error) {
      console.error('Failed to load current user info:', error);
      this.currentUserInfo.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private determineUserType(currentUser: any, actorInfo: CurrentUserActorDto): UserRegistrationType | null {
    // Try to get from actor info first
    if (actorInfo.actorType) {
      switch (actorInfo.actorType.toLowerCase()) {
        case 'teacher': return UserRegistrationType.Teacher;
        case 'student': return UserRegistrationType.Student;
        case 'parent': return UserRegistrationType.Parent;
        case 'secretary': return UserRegistrationType.Secretary;
      }
    }

    // Fallback to user type from current user
    const userType = currentUser?.userType || currentUser?.type;
    if (typeof userType === 'number') {
      return userType as UserRegistrationType;
    }
    if (typeof userType === 'string') {
      switch (userType.toLowerCase()) {
        case 'teacher': return UserRegistrationType.Teacher;
        case 'student': return UserRegistrationType.Student;
        case 'parent': return UserRegistrationType.Parent;
        case 'secretary': return UserRegistrationType.Secretary;
      }
    }

    return null;
  }

  private extractRoles(currentUser: any): string[] {
    const roles = currentUser?.roles || 
                 currentUser?.roleNames || 
                 currentUser?.userRoles || 
                 [];
    return Array.isArray(roles) ? roles.map((role: any) => 
      typeof role === 'string' ? role : role.name || role.roleName || ''
    ).filter(Boolean) : [];
  }

  // Helper methods for role checking
  isTeacher(): boolean {
    const info = this.currentUserInfo();
    if (!info) return false;
    return info.userType === UserRegistrationType.Teacher || 
           info.roles.some(role => role.toLowerCase() === 'teacher');
  }

  isStudent(): boolean {
    const info = this.currentUserInfo();
    if (!info) return false;
    return info.userType === UserRegistrationType.Student || 
           info.roles.some(role => role.toLowerCase() === 'student');
  }

  isParent(): boolean {
    const info = this.currentUserInfo();
    if (!info) return false;
    return info.userType === UserRegistrationType.Parent || 
           info.roles.some(role => role.toLowerCase() === 'parent');
  }

  isSecretary(): boolean {
    const info = this.currentUserInfo();
    if (!info) return false;
    return info.userType === UserRegistrationType.Secretary || 
           info.roles.some(role => role.toLowerCase() === 'secretary');
  }

  // Get current user's actor ID for auto-selection
  getCurrentActorId(): string | undefined {
    return this.currentUserInfo()?.actorId;
  }

  getCurrentActorCode(): string | undefined {
    return this.currentUserInfo()?.actorCode;
  }

  getCurrentActorName(): string | undefined {
    return this.currentUserInfo()?.actorName;
  }

  // Method to refresh user info (call after login/logout)
  async refreshUserInfo(): Promise<void> {
    await this.loadCurrentUser();
  }
}