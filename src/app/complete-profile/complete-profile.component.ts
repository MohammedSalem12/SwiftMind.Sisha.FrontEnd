import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { OAuthService } from 'angular-oauth2-oidc';
import { GradeService } from '@proxy/grades';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';

type UserType = 'STUDENT' | 'TEACHER' | 'PARENT';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss'],
})
export class CompleteProfileComponent implements OnInit {
  private readonly router        = inject(Router);
  private readonly http          = inject(HttpClient);
  private readonly auth          = inject(AuthService);
  private readonly oauthService  = inject(OAuthService);
  private readonly configState   = inject(ConfigStateService);
  private readonly gradeSvc      = inject(GradeService);

  step     = signal<'role' | 'form' | 'success'>('role');
  userType = signal<UserType | null>(null);
  loading  = signal(false);
  error    = signal<string | null>(null);

  // Pre-filled from social login
  socialEmail    = signal('');

  // Form model
  form = {
    fullName: '',
    grade: '',
  };

  gradeOptions = signal<{ value: string; label: string }[]>([]);

  readonly roles: { type: UserType; labelAr: string; labelEn: string; descAr: string; descEn: string; icon: string }[] = [
    {
      type: 'STUDENT',
      labelAr: 'طالب',
      labelEn: 'Student',
      descAr: 'سجّل كطالب للوصول إلى مقرراتك ودرجاتك',
      descEn: 'Access your courses, grades & attendance',
      icon: 'fa-graduation-cap',
    },
    {
      type: 'TEACHER',
      labelAr: 'معلم',
      labelEn: 'Teacher',
      descAr: 'سجّل كمعلم لإدارة طلابك وفصولك',
      descEn: 'Manage your classes, students & grades',
      icon: 'fa-chalkboard-teacher',
    },
    {
      type: 'PARENT',
      labelAr: 'ولي أمر',
      labelEn: 'Parent',
      descAr: 'تابع مسيرة أبنائك الدراسية',
      descEn: 'Follow your children\'s academic progress',
      icon: 'fa-user-friends',
    },
  ];

  async ngOnInit(): Promise<void> {
    this.prefillFromSocialLogin();
    await this.loadGrades();
  }

  private prefillFromSocialLogin(): void {
    const claims = this.oauthService.getIdentityClaims() as any;
    if (claims) {
      const name = claims['name'] || [claims['given_name'], claims['family_name']].filter(Boolean).join(' ') || '';
      if (name) this.form.fullName = name;
      this.socialEmail.set(claims['email'] || '');
    }

    if (!this.form.fullName || !this.socialEmail()) {
      const cu = this.configState.getOne('currentUser') as any;
      if (cu) {
        if (!this.form.fullName) {
          const full = [cu.name, cu.surName].filter(Boolean).join(' ') || cu.userName || '';
          if (full) this.form.fullName = full;
        }
        if (!this.socialEmail()) this.socialEmail.set(cu.email || '');
      }
    }
  }

  private async loadGrades(): Promise<void> {
    try {
      const res = await lastValueFrom(this.gradeSvc.getList());
      this.gradeOptions.set(
        (res?.items || []).map(g => ({ value: String(g.order), label: g.name || `الصف ${g.order}` }))
      );
    } catch {
      this.gradeOptions.set([
        { value: '-1', label: 'رياض أطفال 1 · KG1' },
        { value: '0',  label: 'رياض أطفال 2 · KG2' },
        { value: '1',  label: 'الصف الأول الابتدائي' },
        { value: '2',  label: 'الصف الثاني الابتدائي' },
        { value: '3',  label: 'الصف الثالث الابتدائي' },
        { value: '4',  label: 'الصف الرابع الابتدائي' },
        { value: '5',  label: 'الصف الخامس الابتدائي' },
        { value: '6',  label: 'الصف السادس الابتدائي' },
        { value: '7',  label: 'الصف الأول الإعدادي' },
        { value: '8',  label: 'الصف الثاني الإعدادي' },
        { value: '9',  label: 'الصف الثالث الإعدادي' },
        { value: '10', label: 'الصف الأول الثانوي' },
        { value: '11', label: 'الصف الثاني الثانوي' },
        { value: '12', label: 'الصف الثالث الثانوي' },
      ]);
    }
  }

  selectType(type: UserType): void {
    this.userType.set(type);
    this.step.set('form');
    this.error.set(null);
  }

  back(): void {
    this.step.set('role');
    this.userType.set(null);
    this.error.set(null);
  }

  getSelectedRole() {
    return this.roles.find(r => r.type === this.userType());
  }

  async submit(): Promise<void> {
    this.error.set(null);
    const type = this.userType();
    if (!type) return;

    if (!this.form.fullName.trim()) {
      this.error.set('يرجى إدخال الاسم الكامل · Please enter your full name');
      return;
    }
    if (type === 'STUDENT' && !this.form.grade) {
      this.error.set('يرجى اختيار الصف الدراسي · Please select your grade');
      return;
    }

    const parts     = this.form.fullName.trim().split(/\s+/);
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
    const lastName  = parts.length > 1 ? parts[parts.length - 1] : '-';

    this.loading.set(true);
    try {
      const base = (environment as any).apis?.default?.url ?? environment.oAuthConfig?.issuer ?? 'https://localhost:44367';
      const body = {
        userType:     type,
        firstName,
        lastName,
        currentGrade: type === 'STUDENT' ? Number(this.form.grade) : null,
      };

      await lastValueFrom(
        this.http.post(`${base}/api/sesha/social-registration/complete`, body)
      );

      // Show success step briefly before redirecting
      this.step.set('success');

      // Refresh the OAuth token to pick up the newly assigned role claims
      try {
        await this.oauthService.refreshToken();
      } catch {
        // If refresh fails, a full re-login will be needed
      }

      // Small delay for the success animation, then navigate
      await new Promise(r => setTimeout(r, 1200));

      const dashMap: Record<UserType, string> = {
        STUDENT: '/student',
        TEACHER: '/teacher',
        PARENT:  '/parent',
      };

      if (!Capacitor.isNativePlatform()) {
        // Full reload ensures ABP config state picks up new role from fresh token
        window.location.href = dashMap[type];
      } else {
        await this.router.navigateByUrl(dashMap[type]);
      }
    } catch (err: any) {
      const msg = err?.error?.error?.message || err?.error?.message || 'حدث خطأ أثناء حفظ البيانات. حاول مجدداً. · An error occurred. Please try again.';
      this.error.set(msg);
      this.step.set('form');
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
