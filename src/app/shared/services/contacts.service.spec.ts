import { TestBed } from '@angular/core/testing';
import { ContactsService } from './contacts.service';
import { RestService } from '@abp/ng.core';
import { of } from 'rxjs';

describe('ContactsService', () => {
  let service: ContactsService;
  let restSpy: jasmine.SpyObj<RestService>;

  beforeEach(() => {
    restSpy = jasmine.createSpyObj('RestService', ['request']);

    TestBed.configureTestingModule({
      providers: [
        ContactsService,
        { provide: RestService, useValue: restSpy },
      ],
    });

    service = TestBed.inject(ContactsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty contacts on web platform', async () => {
    // On web (non-native), getContacts returns empty
    const contacts = await service.getContacts();
    expect(contacts).toEqual([]);
  });

  it('should return false for permission on web', async () => {
    const granted = await service.requestPermission();
    expect(granted).toBeFalse();
  });

  it('should call backend check endpoint', async () => {
    const mockResult = {
      registered: [{ phoneNumber: '0100', name: 'Test', actorType: 'Student' }],
      unregistered: ['0200'],
    };
    restSpy.request.and.returnValue(of(mockResult));

    const result = await service.checkRegistered(['0100', '0200']);

    expect(restSpy.request).toHaveBeenCalledWith(
      jasmine.objectContaining({
        method: 'POST',
        url: '/api/app/contact/check',
      })
    );
    expect(result.registered.length).toBe(1);
    expect(result.unregistered.length).toBe(1);
  });
});
