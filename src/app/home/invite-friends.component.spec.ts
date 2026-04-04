import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InviteFriendsComponent } from './invite-friends.component';
import { ContactsService } from '../shared/services/contacts.service';
import { RestService } from '@abp/ng.core';
import { Router } from '@angular/router';

describe('InviteFriendsComponent', () => {
  let component: InviteFriendsComponent;
  let fixture: ComponentFixture<InviteFriendsComponent>;
  let contactsSpy: jasmine.SpyObj<ContactsService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    contactsSpy = jasmine.createSpyObj('ContactsService', [
      'requestPermission',
      'getContacts',
      'checkRegistered',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const restSpy = jasmine.createSpyObj('RestService', ['request']);

    await TestBed.configureTestingModule({
      imports: [InviteFriendsComponent],
      providers: [
        { provide: ContactsService, useValue: contactsSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RestService, useValue: restSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteFriendsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show web-only message on non-native platform', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // On web, component.isNative is false, so empty-state is shown
    expect(el.querySelector('.empty-state')).toBeTruthy();
  });

  it('should filter contacts by search term', () => {
    component.permissionGranted.set(true);
    component.registeredContacts.set([
      { name: 'Ahmed', phone: '0100', actorType: 'Student' },
      { name: 'Mohamed', phone: '0200', actorType: 'Teacher' },
    ]);
    component.searchTerm.set('Ahmed');
    fixture.detectChanges();

    expect(component.filteredRegistered().length).toBe(1);
    expect(component.filteredRegistered()[0].name).toBe('Ahmed');
  });

  it('getInitial should return first character uppercase', () => {
    expect(component.getInitial('ahmed')).toBe('A');
    expect(component.getInitial('Mohamed')).toBe('M');
  });

  it('getRoleLabel should return Arabic labels', () => {
    expect(component.getRoleLabel('Student')).toBe('طالب');
    expect(component.getRoleLabel('Teacher')).toBe('معلم');
    expect(component.getRoleLabel('Parent')).toBe('ولي أمر');
  });
});
