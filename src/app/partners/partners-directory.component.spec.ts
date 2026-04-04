import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PartnersDirectoryComponent } from './partners-directory.component';
import { AdvertiserService } from '@proxy/advertisements';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('PartnersDirectoryComponent', () => {
  let fixture: ComponentFixture<PartnersDirectoryComponent>;
  let component: PartnersDirectoryComponent;
  let mockAdvertiserService: any;
  let mockRouter: jasmine.SpyObj<Router>;

  const samplePartners = [
    { id: '1', name: 'مكتبة النور', nameEn: 'Al Nour Library', type: 1, contactPhone: '0100000', isApproved: true, address: 'Cairo' },
    { id: '2', name: 'مطعم السعادة', nameEn: 'Happiness Restaurant', type: 7, contactPhone: '0200000', isApproved: true, address: 'Giza' },
    { id: '3', name: 'Unapproved Shop', type: 5, contactPhone: '0300000', isApproved: false },
  ];

  beforeEach(waitForAsync(() => {
    mockAdvertiserService = {
      getList: jasmine.createSpy().and.returnValue(of({ items: samplePartners, totalCount: 3 })),
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [PartnersDirectoryComponent],
      providers: [
        { provide: AdvertiserService, useValue: mockAdvertiserService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(PartnersDirectoryComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no partners', async () => {
    // Override service to return empty list
    mockAdvertiserService.getList.and.returnValue(of({ items: [], totalCount: 0 }));
    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.partners().length).toBe(0);
    expect(component.filtered().length).toBe(0);
  });

  it('should only include approved partners', () => {
    // samplePartners has 3 items but only 2 are approved
    expect(component.partners().length).toBe(2);
  });

  it('should filter by search term', () => {
    component.searchTerm.set('نور');
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].name).toBe('مكتبة النور');
  });

  it('should filter by English name', () => {
    component.searchTerm.set('happiness');
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].nameEn).toBe('Happiness Restaurant');
  });

  it('should show all partners when search term is empty', () => {
    component.searchTerm.set('');
    expect(component.filtered().length).toBe(2);
  });

  it('should not be loading after data is fetched', () => {
    expect(component.loading()).toBeFalse();
  });
});
