import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly authService = inject(AuthService);

  loading = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);

  readonly roleConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    STUDENT:   { label: 'طالب',     color: '#22c55e', bg: '#f0fdf4', icon: 'fa-graduation-cap' },
    TEACHER:   { label: 'معلم',     color: '#667eea', bg: '#f5f3ff', icon: 'fa-chalkboard-teacher' },
    PARENT:    { label: 'ولي أمر', color: '#f59e0b', bg: '#fffbeb', icon: 'fa-user-friends' },
    SECRETARY: { label: 'سكرتير',  color: '#0ea5e9', bg: '#f0f9ff', icon: 'fa-user-tie' },
    ADMIN:     { label: 'مدير',    color: '#8b5cf6', bg: '#faf5ff', icon: 'fa-shield-alt' },
  };

  readonly gradeNames: Record<number, string> = {
    1: 'الأول الابتدائي', 2: 'الثاني الابتدائي', 3: 'الثالث الابتدائي',
    4: 'الرابع الابتدائي', 5: 'الخامس الابتدائي', 6: 'السادس الابتدائي',
    7: 'الأول الإعدادي', 8: 'الثاني الإعدادي', 9: 'الثالث الإعدادي',
    10: 'الأول الثانوي', 11: 'الثاني الثانوي', 12: 'الثالث الثانوي',
  };

  async ngOnInit(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.userInfo.set(info);
    } catch {
      // silent
    } finally {
      this.loading.set(false);
    }
  }

  getInitials(): string {
    const name = this.userInfo()?.actorName || this.userInfo()?.userName || '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getPrimaryRole(): string {
    const roles = this.userInfo()?.userRoles ?? [];
    const priority = ['ADMIN', 'SECRETARY', 'TEACHER', 'PARENT', 'STUDENT'];
    return priority.find(r => roles.includes(r)) ?? roles[0] ?? 'STUDENT';
  }

  getRoleConfig() {
    return this.roleConfig[this.getPrimaryRole()] ?? this.roleConfig['STUDENT'];
  }

  getGradeName(grade?: number): string {
    if (!grade) return '';
    return this.gradeNames[grade] ?? `الصف ${grade}`;
  }

  logout(): void {
    this.authService.logout();
  }
}
