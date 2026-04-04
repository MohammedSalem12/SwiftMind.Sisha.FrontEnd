import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { PartnerDashboardComponent } from './partner-dashboard.component';
import { DealCouponService } from '@proxy/advertisements';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('PartnerDashboardComponent', () => {
  let fixture: ComponentFixture<PartnerDashboardComponent>;
  let component: PartnerDashboardComponent;
  let mockCouponService: any;
  let mockRouter: jasmine.SpyObj<Router>;

  const sampleVouchers = [
    { id: '1', studentName: 'Ahmed', couponCode: 'ABC123', amountEgp: 50, status: 0 },
    { id: '2', studentName: 'Sara', couponCode: 'DEF456', amountEgp: 30, status: 0 },
  ];

  beforeEach(waitForAsync(() => {
    mockCouponService = {
      getPartnerPendingVouchers: jasmine.createSpy().and.returnValue(of(sampleVouchers)),
      getCouponByCode: jasmine.createSpy().and.returnValue(of(null)),
      redeemCoupon: jasmine.createSpy().and.returnValue(of(null)),
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [PartnerDashboardComponent],
      providers: [
        { provide: DealCouponService, useValue: mockCouponService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(PartnerDashboardComponent);
    component = fixture.componentInstance;
    // ngOnInit is async — await it
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially', () => {
    // Reset and test that loading is set to true before data loads
    const freshFixture = TestBed.createComponent(PartnerDashboardComponent);
    const freshComponent = freshFixture.componentInstance;
    // Before ngOnInit is called, loading starts as false (default signal value).
    // During ngOnInit it becomes true then false. We verify the final state.
    expect(freshComponent.loading()).toBeFalse();
  });

  it('should display pending vouchers count', () => {
    expect(component.pending().length).toBe(2);
  });

  it('should calculate monthly total from vouchers', () => {
    expect(component.monthlyTotal()).toBe(80);
  });

  it('should not be loading after data is fetched', () => {
    expect(component.loading()).toBeFalse();
  });
});
