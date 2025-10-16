import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserRegistrationService } from '@proxy/common';
import { UserRegistrationType } from '@proxy/domain/shared/enums/user-registration-type.enum';
import { AuthService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private readonly userRegSvc = inject(UserRegistrationService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  userTypes = signal<any[]>([]);
  loading = signal(false);
  registering = signal(false);

  // Form model
  registerForm = {
    userType: null as UserRegistrationType | null,
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    address: '',
    occupation: '',
    emergencyContact: '',
    dateOfBirth: '',
    grade: '',
    parentContact: '',
    department: '',
    qualification: '',
    employeeId: '',
    hireDate: '',
    position: '',
    responsibilities: ''
  };

  UserRegistrationType = UserRegistrationType;

  ngOnInit(): void {
    // If user is already authenticated, redirect to home
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
      return;
    }
    void this.loadUserTypes();
  }

  async loadUserTypes() {
    this.loading.set(true);
    try {
      const types: any = await lastValueFrom(this.userRegSvc.getAvailableUserTypes());
      this.userTypes.set(types || []);
    } catch (e) {
      console.error('Failed to load user types', e);
    } finally {
      this.loading.set(false);
    }
  }

  getSelectedUserType() {
    return this.userTypes().find(t => t.type === this.registerForm.userType);
  }

  isFieldRequired(fieldName: string): boolean {
    const selectedType = this.getSelectedUserType();
    return selectedType?.requiredFields?.includes(fieldName) || false;
  }

  isFieldVisible(fieldName: string): boolean {
    const userType = this.registerForm.userType;
    switch (fieldName) {
      case 'grade':
      case 'parentContact':
        return userType === UserRegistrationType.Student;
      case 'department':
      case 'qualification':
      case 'employeeId':
      case 'hireDate':
      case 'position':
      case 'responsibilities':
        return userType === UserRegistrationType.Teacher;
      case 'occupation':
      case 'emergencyContact':
        return userType === UserRegistrationType.Parent;
      default:
        return true;
    }
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.registering.set(true);
    try {
      const result = await lastValueFrom(this.userRegSvc.registerUser({
        userType: this.registerForm.userType!,
        userName: this.registerForm.userName,
        email: this.registerForm.email,
        phoneNumber: this.registerForm.phoneNumber,
        password: this.registerForm.password,
        firstName: this.registerForm.firstName,
        middleName: this.registerForm.middleName || undefined,
        lastName: this.registerForm.lastName,
        address: this.registerForm.address || undefined,
        occupation: this.registerForm.occupation || undefined,
        emergencyContact: this.registerForm.emergencyContact || undefined,
        dateOfBirth: this.registerForm.dateOfBirth || undefined,
        grade: this.registerForm.grade || undefined,
        parentContact: this.registerForm.parentContact || undefined,
        department: this.registerForm.department || undefined,
        qualification: this.registerForm.qualification || undefined,
        employeeId: this.registerForm.employeeId || undefined,
        hireDate: this.registerForm.hireDate || undefined,
        position: this.registerForm.position || undefined,
        responsibilities: this.registerForm.responsibilities || undefined
      }));

      alert(`Registration successful! User code: ${result.userCode}`);
      this.router.navigate(['/login']);
    } catch (e: any) {
      console.error('Registration failed', e);
      alert(`Registration failed: ${e.error?.message || 'Unknown error'}`);
    } finally {
      this.registering.set(false);
    }
  }

  private isFormValid(): boolean {
    const required = ['userType', 'userName', 'email', 'password', 'firstName', 'lastName'];
    return required.every(field => this.registerForm[field as keyof typeof this.registerForm]);
  }
}