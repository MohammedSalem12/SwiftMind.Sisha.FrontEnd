import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@abp/ng.core';
import { CurrentUserInfoService } from '@proxy/common';
import { CurrentUserActorDto } from '@proxy/common/models';
import { lastValueFrom } from 'rxjs';
import { BiometricService } from '../shared/services/biometric.service';
import { ImageCropService } from '../shared/services/image-crop.service';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly authService = inject(AuthService);
  private readonly biometricSvc = inject(BiometricService);
  private readonly imageCrop = inject(ImageCropService);

  loading = signal(true);
  userInfo = signal<CurrentUserActorDto | null>(null);

  biometricSupported = signal(false);
  biometricEnabled = signal(false);
  biometricToggling = signal(false);
  showPasswordPrompt = signal(false);
  passwordInput = '';
  biometricError = signal<string | null>(null);

  // Photo editing (stored on the Identity user)
  editingPhoto    = signal(false);
  editPhoto       = signal('');
  photoProcessing = signal(false);
  photoSaving     = signal(false);
  photoError      = signal<string | null>(null);

  togglePhotoEdit(): void {
    if (!this.editingPhoto()) {
      this.editPhoto.set(this.userInfo()?.photoUrl || '');
      this.photoError.set(null);
    }
    this.editingPhoto.set(!this.editingPhoto());
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.photoProcessing.set(true);
    try {
      const cropped = await this.imageCrop.crop(file, { size: 320, quality: 0.8 });
      if (cropped) this.editPhoto.set(cropped);
    }
    catch { this.photoError.set('تعذّر معالجة الصورة · Could not process image'); }
    finally { this.photoProcessing.set(false); input.value = ''; }
  }

  async savePhoto(): Promise<void> {
    this.photoSaving.set(true);
    this.photoError.set(null);
    try {
      await lastValueFrom(this.currentUserSvc.updateMyPhoto({ photoUrl: this.editPhoto() || undefined }));
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.userInfo.set(info);
      this.editingPhoto.set(false);
    } catch (err: any) {
      this.photoError.set(err?.error?.error?.message || 'حدث خطأ أثناء الحفظ · Error saving');
    } finally {
      this.photoSaving.set(false);
    }
  }

  readonly roleConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    STUDENT:    { label: 'طالب',     color: '#22c55e', bg: '#f0fdf4', icon: 'fa-graduation-cap' },
    TEACHER:    { label: 'معلم',     color: '#3366ff', bg: '#f5f3ff', icon: 'fa-chalkboard-teacher' },
    PARENT:     { label: 'ولي أمر', color: '#f59e0b', bg: '#fffbeb', icon: 'fa-user-friends' },
    SECRETARY:  { label: 'سكرتير',  color: '#0ea5e9', bg: '#f0f9ff', icon: 'fa-user-tie' },
    ADMIN:      { label: 'مدير',    color: '#8b5cf6', bg: '#faf5ff', icon: 'fa-shield-alt' },
    ADVERTISER: { label: 'معلن',    color: '#d97706', bg: '#fffbeb', icon: 'fa-bullhorn' },
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

    const [supported, hasStored] = await Promise.all([
      this.biometricSvc.isAvailable(),
      this.biometricSvc.hasStoredCredentials(),
    ]);
    this.biometricSupported.set(supported);
    this.biometricEnabled.set(supported && hasStored);
  }

  onBiometricToggle(): void {
    this.biometricError.set(null);
    if (this.biometricEnabled()) {
      this.disableBiometric();
    } else {
      this.showPasswordPrompt.set(true);
    }
  }

  private async disableBiometric(): Promise<void> {
    this.biometricToggling.set(true);
    try {
      await this.biometricSvc.clearCredentials();
      this.biometricEnabled.set(false);
      this.showPasswordPrompt.set(false);
    } finally {
      this.biometricToggling.set(false);
    }
  }

  async confirmEnableBiometric(): Promise<void> {
    if (!this.passwordInput.trim()) {
      this.biometricError.set('يرجى إدخال كلمة المرور');
      return;
    }
    this.biometricError.set(null);
    this.biometricToggling.set(true);
    try {
      // Verify biometric first
      const authed = await this.biometricSvc.authenticate();
      if (!authed) {
        this.biometricError.set('فشل التحقق البيومتري. حاول مجدداً.');
        return;
      }
      // Save credentials
      const username = this.userInfo()?.userName ?? '';
      await this.biometricSvc.saveCredentials(username, this.passwordInput);
      this.biometricEnabled.set(true);
      this.showPasswordPrompt.set(false);
      this.passwordInput = '';
    } catch {
      this.biometricError.set('حدث خطأ. تأكد من كلمة المرور وحاول مجدداً.');
    } finally {
      this.biometricToggling.set(false);
    }
  }

  cancelPasswordPrompt(): void {
    this.showPasswordPrompt.set(false);
    this.passwordInput = '';
    this.biometricError.set(null);
  }

  getInitials(): string {
    const name = this.userInfo()?.actorName || this.userInfo()?.userName || '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getPrimaryRole(): string {
    const roles = this.userInfo()?.userRoles ?? [];
    const priority = ['ADMIN', 'SECRETARY', 'TEACHER', 'PARENT', 'STUDENT', 'ADVERTISER'];
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
