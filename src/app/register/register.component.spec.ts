import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { UserRegistrationService } from '@proxy/controllers';
import { GradeService } from '@proxy/grades';
import { RouterModule } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let regSvcSpy: jasmine.SpyObj<UserRegistrationService>;

  beforeEach(async () => {
    regSvcSpy = jasmine.createSpyObj('UserRegistrationService', [
      'registerStudent',
      'registerTeacher',
      'registerParent',
      'registerSecretary',
      'getAvailableUserTypes',
    ]);
    const gradeSpy = jasmine.createSpyObj('GradeService', ['getList']);
    gradeSpy.getList.and.returnValue(of({ items: [] }));
    const authSpy = jasmine.createSpyObj('AuthService', [], { isAuthenticated: false });

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterModule.forRoot([])],
      providers: [
        { provide: UserRegistrationService, useValue: regSvcSpy },
        { provide: GradeService, useValue: gradeSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on role selection step', () => {
    expect(component.step()).toBe('role');
  });

  it('should have 4 role options', () => {
    expect(component.roles.length).toBe(4);
  });

  it('should navigate to form step on role select', () => {
    component.selectRole(component.UserRegistrationType.Student);
    expect(component.step()).toBe('form');
    expect(component.form.userType).toBe(component.UserRegistrationType.Student);
  });

  it('should go back to role step', () => {
    component.selectRole(component.UserRegistrationType.Student);
    component.back();
    expect(component.step()).toBe('role');
  });

  it('should have empty form initially', () => {
    expect(component.form.fullName).toBe('');
    expect(component.form.userName).toBe('');
    expect(component.form.password).toBe('');
    expect(component.form.confirmPassword).toBe('');
  });

  it('should clear error on role select', () => {
    component.error.set('some error');
    component.selectRole(component.UserRegistrationType.Parent);
    expect(component.error()).toBeNull();
  });

  it('should clear error on back', () => {
    component.error.set('some error');
    component.back();
    expect(component.error()).toBeNull();
  });

  it('should show error for empty form submission', async () => {
    component.selectRole(component.UserRegistrationType.Student);
    component.form.fullName = '';
    component.form.userName = '';
    component.form.password = '';
    await component.onSubmit();
    expect(component.error()).toBeTruthy();
  });

  it('should show error for password mismatch', async () => {
    component.selectRole(component.UserRegistrationType.Student);
    component.form.fullName = 'Test User';
    component.form.userName = 'testuser';
    component.form.password = 'Test@1234';
    component.form.confirmPassword = 'DifferentPass';
    component.form.grade = '10';
    await component.onSubmit();
    expect(component.error()).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.showPassword.set(true);
    expect(component.showPassword()).toBeTrue();
  });

  it('getSelectedRole should return correct role', () => {
    component.form.userType = component.UserRegistrationType.Teacher;
    const role = component.getSelectedRole();
    expect(role).toBeTruthy();
    expect(role!.label).toBe('معلم');
  });

  it('should update governorate and reset town', () => {
    component.form.town = 'Old Town';
    component.onGovernorateChange('القاهرة');
    expect(component.form.government).toBe('القاهرة');
    expect(component.form.town).toBe('');
  });

  it('should register student successfully', async () => {
    regSvcSpy.registerStudent.and.returnValue(of({
      userId: 'test-id',
      userName: 'teststudent',
      email: '',
      emailConfirmed: false,
      userType: component.UserRegistrationType.Student,
      userCode: 'S-TEST001',
      userProfile: {},
      fullName: 'Test Student',
      assignedRoles: ['STUDENT'],
      isPendingApproval: false,
    } as any));

    component.selectRole(component.UserRegistrationType.Student);
    component.form.fullName = 'Test Student';
    component.form.userName = 'teststudent';
    component.form.password = 'Test@1234';
    component.form.confirmPassword = 'Test@1234';
    component.form.grade = '10';

    await component.onSubmit();

    expect(regSvcSpy.registerStudent).toHaveBeenCalled();
    expect(component.step()).toBe('success');
    expect(component.successCode()).toBe('S-TEST001');
  });
});
