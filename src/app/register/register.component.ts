import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserRegistrationService } from '@proxy/controllers';
import { UserRegistrationType } from '@proxy/domain/shared/enums/user-registration-type.enum';
import type { UserRegStudentDto, UserRegTeacherDto, UserRegParentDto, UserRegSecretaryDto } from '@proxy/common/models';
import { GradeService } from '@proxy/grades';
import { AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { AuthRedirectService } from '../shared/services/auth-redirect.service';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private readonly userRegSvc = inject(UserRegistrationService);
  private readonly gradeSvc = inject(GradeService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  UserRegistrationType = UserRegistrationType;

  step = signal<'role' | 'form' | 'success'>('role');
  registering = signal(false);
  error = signal<string | null>(null);
  successCode = signal<string | null>(null);
  successUserName = signal<string | null>(null);
  successPassword = signal<string | null>(null);
  successFullName = signal<string | null>(null);
  showSuccessPassword = signal(false);

  readonly roles = [
    {
      type: UserRegistrationType.Student,
      label: 'طالب',
      description: 'سجّل كطالب للوصول إلى مقرراتك',
      icon: 'fa-graduation-cap',
      color: '#22c55e',
      bg: '#f0fdf4',
      border: '#86efac',
    },
    {
      type: UserRegistrationType.Teacher,
      label: 'معلم',
      description: 'سجّل كمعلم لإدارة طلابك وفصولك',
      icon: 'fa-chalkboard-teacher',
      color: '#3366ff',
      bg: '#f5f3ff',
      border: '#c4b5fd',
    },
    {
      type: UserRegistrationType.Parent,
      label: 'ولي أمر',
      description: 'تابع مسيرة أبنائك الدراسية',
      icon: 'fa-user-friends',
      color: '#f59e0b',
      bg: '#fffbeb',
      border: '#fcd34d',
    },
    {
      type: UserRegistrationType.Secretary,
      label: 'سكرتير',
      description: 'إدارة السجلات والبيانات المدرسية',
      icon: 'fa-user-tie',
      color: '#0ea5e9',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
  ];

  gradeOptions = signal<{ value: string; label: string }[]>([]);

  form = {
    userType: null as UserRegistrationType | null,
    fullName: '',
    userName: '',
    password: '',
    confirmPassword: '',
    grade: '',
    referralCode: '',
    government: '',
    town: '',
  };

  readonly governorates = EGYPT_GOVERNORATES_LIST;
  private readonly govSignal = signal('');
  readonly districts = computed(() => getDistricts(this.govSignal()));

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  async ngOnInit(): Promise<void> {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
      return;
    }
    await this.loadGrades();
  }

  private async loadGrades(): Promise<void> {
    try {
      const res = await lastValueFrom(this.gradeSvc.getList());
      this.gradeOptions.set(
        (res?.items || []).map(g => ({
          value: String(g.order),
          label: g.name || `الصف ${g.order}`,
        }))
      );
    } catch {
      // Fallback to Arabic grade names if API fails
      this.gradeOptions.set([
        { value: '-1', label: 'رياض أطفال 1 · KG1' },
        { value: '0', label: 'رياض أطفال 2 · KG2' },
        { value: '1', label: 'الصف الأول الابتدائي' },
        { value: '2', label: 'الصف الثاني الابتدائي' },
        { value: '3', label: 'الصف الثالث الابتدائي' },
        { value: '4', label: 'الصف الرابع الابتدائي' },
        { value: '5', label: 'الصف الخامس الابتدائي' },
        { value: '6', label: 'الصف السادس الابتدائي' },
        { value: '7', label: 'الصف الأول الإعدادي' },
        { value: '8', label: 'الصف الثاني الإعدادي' },
        { value: '9', label: 'الصف الثالث الإعدادي' },
        { value: '10', label: 'الصف الأول الثانوي' },
        { value: '11', label: 'الصف الثاني الثانوي' },
        { value: '12', label: 'الصف الثالث الثانوي' },
      ]);
    }
  }

  onGovernorateChange(gov: string): void {
    this.form.government = gov;
    this.form.town = '';
    this.govSignal.set(gov);
  }

  selectRole(type: UserRegistrationType): void {
    this.form.userType = type;
    this.error.set(null);
    this.step.set('form');
  }

  back(): void {
    this.step.set('role');
    this.error.set(null);
  }

  getSelectedRole() {
    return this.roles.find(r => r.type === this.form.userType);
  }

  async onSubmit(): Promise<void> {
    this.error.set(null);

    if (!this.form.fullName.trim()) {
      this.error.set('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!this.form.userName.trim()) {
      this.error.set('يرجى إدخال رقم الموبايل أو اسم المستخدم');
      return;
    }
    if (!this.form.password) {
      this.error.set('يرجى إدخال كلمة المرور');
      return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.error.set('كلمة المرور وتأكيدها غير متطابقتان');
      return;
    }
    if (this.form.userType === UserRegistrationType.Student && !this.form.grade) {
      this.error.set('يرجى اختيار الصف الدراسي');
      return;
    }

    // Split full name: last word → lastName, rest → firstName
    const parts = this.form.fullName.trim().split(/\s+/);
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '-';

    this.registering.set(true);
    try {
      const userName = this.form.userName.trim();
      const base = { userName, firstName, lastName, password: this.form.password };
      let result;

      switch (this.form.userType!) {
        case UserRegistrationType.Student:
          result = await lastValueFrom(this.userRegSvc.registerStudent(
            { ...base, grade: Number(this.form.grade), referralCode: this.form.referralCode.trim() || undefined, government: this.form.government || undefined, town: this.form.town || undefined } as UserRegStudentDto,
            { skipHandleError: true }
          ));
          break;
        case UserRegistrationType.Teacher:
          result = await lastValueFrom(this.userRegSvc.registerTeacher(
            base as UserRegTeacherDto,
            { skipHandleError: true }
          ));
          break;
        case UserRegistrationType.Parent:
          result = await lastValueFrom(this.userRegSvc.registerParent(
            base as UserRegParentDto,
            { skipHandleError: true }
          ));
          break;
        case UserRegistrationType.Secretary:
          result = await lastValueFrom(this.userRegSvc.registerSecretary(
            base as UserRegSecretaryDto,
            { skipHandleError: true }
          ));
          break;
        default:
          throw new Error('نوع المستخدم غير معروف');
      }
      this.successCode.set(result?.userCode ?? null);
      this.successUserName.set(this.form.userName.trim());
      this.successPassword.set(this.form.password);
      this.successFullName.set(this.form.fullName.trim());
      this.step.set('success');
    } catch (e: any) {
      console.error('Registration error:', e);
      const body = e?.error;
      const fieldErrors = body?.errors
        ? ([] as string[]).concat(...Object.values(body.errors) as string[][]).join(', ')
        : null;
      const msg =
        body?.error?.message ||
        fieldErrors ||
        body?.title ||
        e?.message ||
        'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى';
      this.error.set(msg);
    } finally {
      this.registering.set(false);
    }
  }
}
