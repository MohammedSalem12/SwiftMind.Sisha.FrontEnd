import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient } from '@angular/common/http';
import { UserProfileService } from '@volo/ngx-lepton-x.core';
import { StudentService } from '@proxy/students';
import { TeacherService, TeacherPromotionService } from '@proxy/teachers';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { RegisterModalService } from '../shared/services/register-modal.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, BehaviorSubject } from 'rxjs';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockConfigStateService: any;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let mockUserProfileService: any;
  let mockStudentService: any;
  let mockTeacherService: any;
  let mockPromotionService: any;
  let mockEnrollmentService: any;
  let mockCacheService: any;
  let mockRegisterModalService: any;

  const currentUser$ = new BehaviorSubject<any>({ isAuthenticated: false, roles: [] });

  function createMocks(isAuthenticated: boolean) {
    mockAuthService = jasmine.createSpyObj('AuthService', ['navigateToLogin'], {
      isAuthenticated,
    });

    mockConfigStateService = {
      getOne$: jasmine.createSpy('getOne$').and.returnValue(currentUser$.asObservable()),
    };

    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    mockHttpClient.get.and.returnValue(of([]));

    mockUserProfileService = { user$: of(null) };

    mockStudentService = { getList: jasmine.createSpy().and.returnValue(of({ totalCount: 0, items: [] })) };
    mockTeacherService = { getList: jasmine.createSpy().and.returnValue(of({ totalCount: 0, items: [] })) };
    mockPromotionService = { getPendingCount: jasmine.createSpy().and.returnValue(of(0)) };
    mockEnrollmentService = { getList: jasmine.createSpy().and.returnValue(of({ totalCount: 0, items: [] })) };

    mockCacheService = {
      get: jasmine.createSpy().and.returnValue(null),
      set: jasmine.createSpy(),
      getLastUpdatedLabel: jasmine.createSpy().and.returnValue(''),
    };

    mockRegisterModalService = {
      isOpen: jasmine.createSpy().and.returnValue(false),
      show: jasmine.createSpy(),
      dismiss: jasmine.createSpy(),
    };
  }

  function configureTestBed() {
    return TestBed.configureTestingModule({
      imports: [RouterTestingModule, HomeComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigStateService, useValue: mockConfigStateService },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: UserProfileService, useValue: mockUserProfileService },
        { provide: StudentService, useValue: mockStudentService },
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: TeacherPromotionService, useValue: mockPromotionService },
        { provide: StudentEnrollmentService, useValue: mockEnrollmentService },
        { provide: OfflineCacheService, useValue: mockCacheService },
        { provide: RegisterModalService, useValue: mockRegisterModalService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(HomeComponent, {
      set: {
        imports: [CommonModule, RouterTestingModule],
      },
    })
    .compileComponents();
  }

  describe('when login state is false', () => {
    beforeEach(waitForAsync(() => {
      createMocks(false);
      spyOn(localStorage, 'getItem').and.returnValue(null);
      configureTestBed();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('hasLoggedIn should be false', () => {
      expect(component.hasLoggedIn).toBeFalse();
    });

    it('navigateToLogin have been called when login() is invoked', () => {
      component.login();
      expect(mockAuthService.navigateToLogin).toHaveBeenCalled();
    });
  });

  describe('when login state is true', () => {
    beforeEach(waitForAsync(() => {
      createMocks(true);
      spyOn(localStorage, 'getItem').and.returnValue('some-token');
      currentUser$.next({ isAuthenticated: true, roles: ['admin'] });
      configureTestBed();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('hasLoggedIn should be true', () => {
      expect(component.hasLoggedIn).toBeTrue();
    });
  });

  describe('general', () => {
    beforeEach(waitForAsync(() => {
      createMocks(false);
      spyOn(localStorage, 'getItem').and.returnValue(null);
      configureTestBed();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should be initiated', () => {
      expect(component).toBeTruthy();
    });
  });
});
